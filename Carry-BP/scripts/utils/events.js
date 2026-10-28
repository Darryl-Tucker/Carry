import { world } from "@minecraft/server";

import { pushMob, protectMob, carryData, takeMob, mobCarry, clearMob_data, powerCount } from "../mob/carry";
import { playerSettings, clearData } from "../player/playerData";
import { addPlayer_ride, clearRide_data, clearCarrier_data } from "./ride";
import { mobHandcuffs, dropHandcuffs } from "../mob/handcuffs";
import { addonTutorial } from "./config";

world.beforeEvents.playerLeave.subscribe((eventData) => clearData(eventData));
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const player = eventData.player;

    if (eventData.initialSpawn && player.getDynamicProperty("dontShow_again") !== true) addonTutorial(player)
    playerSettings(player);
});

world.beforeEvents.entityHurt.subscribe((eventData) => {
    const hEntity = eventData.hurtEntity.typeId !== "minecraft:player";
    const damagingEntity = eventData.damageSource.damagingEntity;

    protectMob(eventData);

    if (hEntity && damagingEntity) {
        const entity = eventData.hurtEntity;

        if (carryData.has(damagingEntity.id)) return pushMob(eventData)

        clearCarrier_data(entity);
        clearRide_data(entity)
    }

    else if (!hEntity && carryData.has(eventData.hurtEntity.id)) {
        carryData.delete(eventData.hurtEntity.id); // Oyuncu hasar aldığında canlıyı olduğu gibi bırakır
        playerSettings(eventData.hurtEntity)
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe((eventData) => {
    if (carryData.has(eventData.player.id)) eventData.cancel = true
});

world.beforeEvents.playerInteractWithEntity.subscribe((eventData) => {
    mobHandcuffs(eventData);
    powerCount(eventData);
    takeMob(eventData);
    addPlayer_ride(eventData)
});

world.beforeEvents.playerBreakBlock.subscribe((eventData) => { if (carryData.has(eventData.player.id)) eventData.cancel = true });

world.beforeEvents.entityItemPickup.subscribe((eventData) => {
    if (carryData.has(eventData.entity.id)) eventData.cancel = true
});

//--------------------------------------------------

world.afterEvents.entityDie.subscribe((eventData) => {
    const hPlayer = eventData.deadEntity.typeId === "minecraft:player";
    const entity = eventData.deadEntity;

    if (!hPlayer) {
        dropHandcuffs(entity);
        return clearMob_data(eventData)
    }

    if (hPlayer && carryData.has(entity.id)) {
        carryData.delete(entity.id);
        playerSettings(entity)
    }
});

world.afterEvents.worldLoad.subscribe(() => { for (const player of world.getAllPlayers()) playerSettings(player) })