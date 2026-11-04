import { world } from "@minecraft/server";

import { pushMob, carryData, takeMob, clearMob_data, powerCount } from "../mob/carry";
import { playerSettings, clearPlayer_data, clearCarry_data } from "../player/playerData";
import { addPlayer_ride, clearRide_data, clearCarrier_data } from "./ride";
import { mobHandcuffs, dropHandcuffs, handcuffsData } from "../mob/handcuffs";
import { addonTutorial } from "./config";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    clearPlayer_data(player)
});
world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    playerSettings(player);

    if (e.initialSpawn && player.getDynamicProperty("ver0") !== true) addonTutorial(player)
});

world.beforeEvents.entityHurt.subscribe(e => {
    const damagingEntity = e.damageSource.damagingEntity;
    const hEntity = e.hurtEntity.typeId !== "minecraft:player";
    const hurtEntity = e.hurtEntity;

    if (hEntity) {
        if (carryData.has(damagingEntity?.id)) return pushMob(damagingEntity, hurtEntity, e)

        clearCarrier_data(hurtEntity);
        clearRide_data(hurtEntity);
    }

    if (!hEntity && carryData.has(hurtEntity.id)) return clearCarry_data(hurtEntity)
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });
    
world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const player = e.player;
    const target = e.target;

    if (carryData.has(player.id)) powerCount(player, target, e);
    else takeMob(player, target, e);

    mobHandcuffs(player, target);
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

    else if (!dEntity && carryData.has(deadEntity.id)) clearCarry_data(deadEntity)
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        playerSettings(player)
        const entities = player.dimension.getEntities().filter(e => !handcuffsData.has(e.id) && (e.getDynamicProperty("key") !== undefined || e.getDynamicProperty("handcuffs") === true));

        for (const entity of entities) {
            const data = entity.getDynamicProperty("key");
            handcuffsData.set(entity.id, { status: true, key: data })
        }
    }
    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})