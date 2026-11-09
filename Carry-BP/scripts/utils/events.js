import { world } from "@minecraft/server";

import { pushMob, carryData, takeMob, clearMobData, powerCount } from "../mob/carry";
import { playerSettings, clearPlayerData } from "../player/playerData";
import { addPlayerRide, clearRideData, clearCarrierData } from "./ride";
import { mobHandcuffs, dropHandcuffs } from "../mob/handcuffs";
import { addonTutorial, DiskToRAM } from "./config";
import { abilityBar } from "../player/ability";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;
    clearPlayerData({ Player: player, PlayerLeave: true })
});

world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        return addonTutorial(player)
    }

    playerSettings({ Player: player })
});

world.beforeEvents.entityHurt.subscribe(e => {
    const damagingEntity = e.damageSource.damagingEntity;
    const hEntity = e.hurtEntity.typeId !== "minecraft:player";
    const hurtEntity = e.hurtEntity;

    if (!hEntity && carryData.has(hurtEntity.id)) clearPlayerData({ Player: hurtEntity })

    if (hEntity) {
        if (carryData.has(damagingEntity?.id)) return pushMob(damagingEntity, hurtEntity, e)

        const carryPlayer = world.getAllPlayers().find(c => carryData.get(c.id)?.id === hurtEntity.id)

        if (carryPlayer) return playerSettings({ Player: carryPlayer, DataDelete: true }) // Mob taşınırken hasar alırsa bırak

        clearCarrierData(hurtEntity);
        clearRideData(hurtEntity);
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const player = e.player;
    const target = e.target;

    if (carryData.has(player.id)) {
        abilityBar(player);
        return powerCount({ Player: player, Target: target, EventCancel: e });
    }

    takeMob(player, target, e);
    mobHandcuffs({ Player: player, Target: target, EventCancel: e });
    addPlayerRide(player, target)
});

world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.entityItemPickup.subscribe(e => { if (carryData.has(e.entity.id)) e.cancel = true });

//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const dEntity = e.deadEntity.typeId !== "minecraft:player";
    const deadEntity = e.deadEntity;

    if (dEntity) {
        dropHandcuffs(deadEntity);
        return clearMobData(deadEntity)
    }

    if (!dEntity && carryData.has(deadEntity.id)) clearPlayerData({ Player: deadEntity })
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        playerSettings({ Player: player });
        DiskToRAM({ Player: player, WorldLoadEvent: true })
    }

    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})