import { world } from "@minecraft/server";

import { pushMob, carryData, takeMob, clearMob_data, powerCount } from "../mob/carry";
import { playerSettings, clearPlayer_data } from "../player/playerData";
import { addPlayer_ride, clearRide_data, clearCarrier_data } from "./ride";
import { mobHandcuffs, dropHandcuffs } from "../mob/handcuffs";
import { addonTutorial, DiskToRAM } from "./config";
import { abilityBar } from "../player/ability";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    clearPlayer_data({ Player: player, PlayerLeave: true })
});
world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        addonTutorial(player)
    }

    else playerSettings({ Player: player })
});

world.beforeEvents.entityHurt.subscribe(e => {
    const damagingEntity = e.damageSource.damagingEntity;
    const hEntity = e.hurtEntity.typeId !== "minecraft:player";
    const hurtEntity = e.hurtEntity;

    if (!hEntity && carryData.has(hurtEntity.id)) clearPlayer_data({Player: hurtEntity})

    if (hEntity) {
        if (carryData.has(damagingEntity?.id)) return pushMob(damagingEntity, hurtEntity, e)

        clearCarrier_data(hurtEntity);
        clearRide_data(hurtEntity);
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const player = e.player;
    const target = e.target;

    if (carryData.has(player.id)) {
        abilityBar(player);
        powerCount({ Player: player, Target: target, EventCancel: e });
    }
    else takeMob(player, target, e);

    mobHandcuffs({ Player: player, Target: target, EventCancel: e });
    addPlayer_ride(player, target)
});

world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });

world.beforeEvents.entityItemPickup.subscribe(e => { if (carryData.has(e.entity.id)) e.cancel = true });

//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const dEntity = e.deadEntity.typeId !== "minecraft:player";
    const deadEntity = e.deadEntity;

    if (dEntity) {
        dropHandcuffs(deadEntity);
        clearMob_data(deadEntity)
    }

    else if (!dEntity && carryData.has(deadEntity.id)) clearPlayer_data({Player: deadEntity})
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        playerSettings({ Player: player });
        DiskToRAM({ Player: player, WorldLoadEvent: true })
    }

    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})