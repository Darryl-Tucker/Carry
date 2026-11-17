import { world } from "@minecraft/server";
import { pushEntity, carryEntityData, takeEntity, powerCount } from "../entity/carry";
import { playerDataManage } from "../player/data";
import { abilityBar, UnlockAbilityManager } from "../player/ability";
import { addonTutorial, DiskToRAM } from "./config";
import { addEntityRide, clearCarrierData, clearEntityRide } from "./ride";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    clearEntityRide({ Entity: player });
    playerDataManage({ Player: player, PlayerLeave: true })
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
    }

    if (carryEntityData.get(damageSource.damagingEntity?.id)?.id === hurtEntity.id) { // Hasar veren oyuncunun verisindeki id ile hasar yiyen canlı id eşit mi?
        pushEntity(damageSource.damagingEntity, hurtEntity, e);
        return
    }

    if (carryEntityData.has(hurtEntity.id)) { // Hasar yiyen oyuncu ve carryEntityData varsa
        const rider = world.getAllPlayers().find(r => carryEntityData.get(hurtEntity.id)?.id === r.id); //  Hasar yiyen canlının veri id === rider id
        playerDataManage({ Player: hurtEntity, Target: rider, carryDelete: true });
        return
    }

    const rider = world.getAllPlayers().find(r => carryEntityData.get(r.id)?.id === hurtEntity.id); // rider'ın veri id === Hasar yiyen canlı id
    if (rider) playerDataManage({ Player: rider, Target: hurtEntity, carryDelete: true }) // Eğer bulduysa sil

    clearEntityRide({ Entity: hurtEntity }); // Ride verisini temizle
    clearCarrierData(hurtEntity);
});

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const { player, target } = e;

    if (carryEntityData.get(player.id)?.id === target.id) { // carryEntityData verisindeki id ile target id mi?
        abilityBar(player, e);
        powerCount({ Player: player, Target: target, EventCancel: e });
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
})

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryEntityData.has(e.player.id)) e.cancel = true });
world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryEntityData.has(e.player.id)) e.cancel = true });
world.beforeEvents.entityItemPickup.subscribe(e => { if (carryEntityData.has(e.entity.id)) e.cancel = true });
//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const deadEntity = e.deadEntity;

    if (e.deadEntity.typeId !== "minecraft:player") { // Eğer oyuncu değil ise
        const player = world.getAllPlayers().find(p => carryEntityData.get(p.id)?.id === deadEntity?.id);
        if (player) playerDataManage({ Player: player, carryDelete: true })

        clearEntityRide({ Entity: deadEntity });
        return
    }

    clearEntityRide({ Entity: deadEntity });
    clearCarrierData(deadEntity);

    playerDataManage({ Player: deadEntity, carryDelete: true }) // Oyuncu için
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        DiskToRAM({ Player: player, WorldLoadEvent: true });
        playerDataManage({ Player: player })
    }
    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})