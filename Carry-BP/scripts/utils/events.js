import { world } from "@minecraft/server";

import { pushMob, carryData, takeMob, clearMobData, powerCount } from "../mob/carry";
import { clearRideData, clearCarrierData } from "../mob/ride";

import { playerSettings, clearPlayerData } from "../player/data";
import { addPlayerRide } from "../player/ride";
import { abilityBar } from "../player/ability";

import { addonTutorial, DiskToRAM } from "./config";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    clearPlayerData({ Player: player, PlayerLeave: true })
});

world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        addonTutorial(player);
        return
    }
    playerSettings({ Player: player })
});

world.beforeEvents.entityHurt.subscribe(e => {
    const damagingEntity = e.damageSource.damagingEntity;
    const hEntity = e.hurtEntity.typeId !== "minecraft:player";
    const hurtEntity = e.hurtEntity;

    if (!hEntity && carryData.has(hurtEntity.id)) {
        clearPlayerData({ Player: hurtEntity });
        playerSettings({ Player: hurtEntity });
        return
    }

    if (carryData.has(damagingEntity?.id)) {
        pushMob(damagingEntity, hurtEntity, e);
        return
    }

    const carryPlayer = world.getAllPlayers().find(c => carryData.get(c.id)?.id === hurtEntity.id)
    if (carryPlayer) {
        clearPlayerData({ Player: carryPlayer});
        playerSettings({ Player: carryPlayer, Target: hurtEntity });
        return
    }  // Mob taşınırken hasar alırsa bırak

    clearCarrierData(hurtEntity);
    clearRideData(hurtEntity)
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const player = e.player;
    const target = e.target;

    if (carryData.has(player.id)) {
        abilityBar(player);
        powerCount({ Player: player, EventCancel: e });
        return
    }
    addPlayerRide(player, target);
    takeMob(player, target, e)
});

world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.entityItemPickup.subscribe(e => { if (carryData.has(e.entity.id)) e.cancel = true });

//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const dEntity = e.deadEntity.typeId !== "minecraft:player";
    const deadEntity = e.deadEntity;

    if (dEntity) {
        clearMobData(deadEntity);
        return
    }

    clearPlayerData({ Player: deadEntity })
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        DiskToRAM({ Player: player, WorldLoadEvent: true });
        playerSettings({ Player: player })
    }

    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})