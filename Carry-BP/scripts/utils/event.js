/**
 * @license MIT
 * Copyright (c) 2026 DarrylTucker
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { world, system } from "@minecraft/server";
import { pushEntity, carryEntityData, takeEntity, powerCount } from "../entity/carry";
import { managePlayerData } from "../player/dataManager";
import { abilityBar, UnlockAbilityManager } from "../player/ability";
import { addEntityRide, clearEntityCarrier, clearEntityRide } from "../entity/ride";
import { blockData, placeBlock, saveBlock } from "../block/dataManager";
import { addonTutorial, DiskToRAM } from "./init";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    if (carryEntityData.has(player.id)) {
        const entity = world.getEntity(carryEntityData.get(player.id).id);
        if (entity) placeBlock(player, entity)
    }

    blockData.delete(player.id);
    clearEntityRide(player);
    managePlayerData({ Player: player, PlayerLeave: true });
});

world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        addonTutorial(player);

        for (const entity of player.dimension.getEntities().filter(e => e.typeId === "carry_throw:block"))
            placeBlock(player, entity)

        return // Oyuncu ilk kez dünyaya girdiğinde işlemleri yap
    }

    managePlayerData({ Player: player })
});

world.beforeEvents.entityHurt.subscribe(e => {
    const { damageSource, hurtEntity } = e;

    if (hurtEntity.typeId === "minecraft:player") { // Hasar yiyen tipi player mı?
        const manager = new UnlockAbilityManager(hurtEntity);
        manager.ghast(damageSource, hurtEntity);
        manager.snowGolem(damageSource, hurtEntity);
        manager.blaze(damageSource);
        manager.warden(damageSource);

        if (carryEntityData.has(hurtEntity.id)) { // carryEntityData varsa
            const target = world.getEntity(carryEntityData.get(hurtEntity.id)?.id);
            placeBlock(hurtEntity, target);

            const rider = world.getAllPlayers().find(r => carryEntityData.get(hurtEntity.id)?.id === r.id); //  Hasar yiyen canlının veri id === rider id
            managePlayerData({ Player: hurtEntity, Target: rider, carryDelete: true })
        }
        return
    }

    const rider = world.getAllPlayers().find(r => carryEntityData.get(r.id)?.id === hurtEntity.id); // rider'ın veri id === Hasar yiyen canlı id
    if (rider)
        managePlayerData({ Player: rider, Target: hurtEntity, carryDelete: true }) // Eğer bulduysa sil

    clearEntityRide(hurtEntity); // Ride verisini temizle
    clearEntityCarrier(hurtEntity);
});

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const { player, target } = e;

    if (carryEntityData.get(player.id)?.id === target.id) { // carryEntityData verisindeki id ile target id mi?
        abilityBar(player, e);
        powerCount({ Player: player, EventCancel: e });
        return
    }

    if (target.typeId === "minecraft:player") addEntityRide({ Player: player, Target: target }) // Oyuncu ise yap
    takeEntity(player, target, e)
});

world.beforeEvents.explosion.subscribe(e => {
    const source = e.source;

    if (source?.typeId === "minecraft:creeper") {
        const player = world.getAllPlayers().find(p => carryEntityData.get(p.id)?.id === source.id);

        if (!player) return
        const manager = new UnlockAbilityManager(player);
        manager.creeper(e)
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const { player, block } = e;

    saveBlock(player, block, e);
    if (carryEntityData.has(player.id)) e.cancel = true
});

world.beforeEvents.entityRemove.subscribe(e => {
    const removedEntity = e.removedEntity;
    

    if (removedEntity.typeId === "carry_throw:block") {
        const carriedBlock = world.getAllPlayers().find(p => blockData.get(p.id)?.id === removedEntity.id);
        system.run(() => { // Eğer blok kaldırılırsa structure'den veriyi sil
            if (!carriedBlock) return

            world.structureManager.delete("blockId:" + carriedBlock.id);
            blockData.delete(carriedBlock.id)
        })
    }
});

world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryEntityData.has(e.player.id)) e.cancel = true });
world.beforeEvents.entityItemPickup.subscribe(e => { if (carryEntityData.has(e.entity.id)) e.cancel = true });

//------------------------------------------------------------------------------------------

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        DiskToRAM({ Player: player, WorldLoadEvent: true });
        managePlayerData({ Player: player })

        for (const block of player.dimension.getEntities().filter(e => e.typeId === "carry_throw:block")) placeBlock(player, block)
    }
    world.afterEvents.worldLoad.unsubscribe(worldLoad)
});

world.afterEvents.playerSwingStart.subscribe(e => {
    const player = e.player;

    const target = player.getEntitiesFromViewDirection({ maxDistance: 1 }).find(t => carryEntityData.get(player.id)?.id === t.entity.id);
    if (!target) return // undefined dönme önlemi alıyorum
    pushEntity(player, target.entity, e)
})