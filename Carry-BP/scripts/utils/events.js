import { world } from "@minecraft/server";

import { pushMob, carryData, takeMob, clearMob_data, powerCount } from "../mob/carry";
import { playerSettings, clearPlayer_data, clearCarry_data } from "../player/playerData";
import { addPlayer_ride, clearRide_data, clearCarrier_data } from "./ride";
import { mobHandcuffs, dropHandcuffs, handcuffsData } from "../mob/handcuffs";
import { addonTutorial } from "./config";

world.beforeEvents.playerLeave.subscribe(eventData => clearPlayer_data(eventData));
world.afterEvents.playerSpawn.subscribe(eventData => {
    const player = eventData.player;

    playerSettings(player);

    if (eventData.initialSpawn && player.getDynamicProperty("ver0") !== true) addonTutorial(player)
});

world.beforeEvents.entityHurt.subscribe(eventData => {
    const hEntity = eventData.hurtEntity.typeId !== "minecraft:player";
    const hurtEntity = eventData.hurtEntity;

    const damagingEntity = eventData.damageSource.damagingEntity;

    if (hEntity) {
        if (carryData.has(damagingEntity?.id)) return pushMob(eventData)

        clearCarrier_data(hurtEntity);
        clearRide_data(hurtEntity);
    }

    if (!hEntity && carryData.has(hurtEntity.id)) return clearCarry_data(hurtEntity)
});

world.beforeEvents.playerInteractWithBlock.subscribe(eventData => {
    if (carryData.has(eventData.player.id)) eventData.cancel = true
});

world.beforeEvents.playerInteractWithEntity.subscribe(eventData => {
    if (carryData.has(eventData.player.id)) powerCount(eventData);
    else takeMob(eventData);

    mobHandcuffs(eventData);
    addPlayer_ride(eventData)
});

world.beforeEvents.playerBreakBlock.subscribe(eventData => { if (carryData.has(eventData.player.id)) eventData.cancel = true });

world.beforeEvents.entityItemPickup.subscribe((eventData) => {
    if (carryData.has(eventData.entity.id)) eventData.cancel = true
});

//--------------------------------------------------

world.afterEvents.entityDie.subscribe(eventData => {
    const dEntity = eventData.deadEntity.typeId !== "minecraft:player";
    const deadEntity = eventData.deadEntity;

    if (dEntity) {
        dropHandcuffs(deadEntity);
        clearMob_data(eventData)
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
    world.afterEvents.worldLoad.unsubscribe(worldLoad) // Kullanmaya gerek kalmadı
})