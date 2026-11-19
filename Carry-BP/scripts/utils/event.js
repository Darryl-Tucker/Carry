import { system, world } from "@minecraft/server";
import { pushEntity, carryEntityData, takeEntity, powerCount } from "../entity/carry";
import { playerDataManage } from "../player/data";
import { abilityBar, UnlockAbilityManager } from "../player/ability";
import { addonTutorial, DiskToRAM } from "./config";
import { addEntityRide, clearEntityCarrier, clearEntityRide } from "./ride";
import { placeBlock, saveBlock } from "../block/data";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    if (carryEntityData.has(player.id)) {
        const entity = world.getEntity(carryEntityData.get(player.id).id);
        if (entity && entity.isValid) placeBlock(player, entity)
    }

    clearEntityRide(player);
    playerDataManage({ Player: player, PlayerLeave: true });
});

world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        addonTutorial(player);
        return // Oyuncu ilk kez dünyaya girdiğinde işlemleri yap
    }

    playerDataManage({ Player: player })
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
            playerDataManage({ Player: hurtEntity, Target: rider, carryDelete: true });
        }
        return
    }

    const rider = world.getAllPlayers().find(r => carryEntityData.get(r.id)?.id === hurtEntity.id); // rider'ın veri id === Hasar yiyen canlı id
    if (rider)
        system.runTimeout(() => playerDataManage({ Player: rider, Target: hurtEntity, carryDelete: true }), 2) // Eğer bulduysa sil

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

        playerDataManage({ Player: player, carryDelete: true }) // Creeper elde patlarsa Carry datasını sil
    }
});


world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const { player, block } = e;

    saveBlock(player, block, e);

    if (carryEntityData.has(player.id)) e.cancel = true
});
world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryEntityData.has(e.player.id)) e.cancel = true });
world.beforeEvents.entityItemPickup.subscribe(e => { if (carryEntityData.has(e.entity.id)) e.cancel = true });
//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const deadEntity = e.deadEntity;

    if (deadEntity.typeId === "carry_throw:block") { // Eğer blok ölürse structure'den veriyi sil
        const carriedBlock = world.getAllPlayers().find(p => carryEntityData.get(p.id)?.id === deadEntity.id);
        if (carriedBlock) world.structureManager.delete("block:" + carriedBlock.id)
    }
})

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        DiskToRAM({ Player: player, WorldLoadEvent: true });
        playerDataManage({ Player: player })

        for (const block of player.dimension.getEntities().filter(e => e.typeId === "carry_throw:block")) placeBlock(player, block)

        if (player.name === "steve") player.sendMessage(player.id)
    }
    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})

world.afterEvents.playerSwingStart.subscribe(e => {
    const player = e.player;

    const target = player.getEntitiesFromViewDirection({ maxDistance: 1 }).find(t => carryEntityData.get(player.id)?.id === t.entity.id);
    if (!target) return // undefined dönme önlemi alıyorum
    pushEntity(player, target.entity, e)
})