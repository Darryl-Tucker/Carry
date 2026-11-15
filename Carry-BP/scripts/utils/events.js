import { world } from "@minecraft/server";
import { pushMob, carryData, takeMob, powerCount } from "../mob/carry";
import { clearPlayerData } from "../player/data";
import { abilityBar } from "../player/ability";
import { addonTutorial, DiskToRAM } from "./config";
import { addEntityRide, clearEntityRide } from "./ride";

world.beforeEvents.playerLeave.subscribe(e => {
    const player = e.player;

    clearPlayerData({ Player: player, PlayerLeave: true });
    clearEntityRide({ Entity: player })
});

world.afterEvents.playerSpawn.subscribe(e => {
    const player = e.player;

    if (e.initialSpawn) {
        DiskToRAM({ Player: player });
        addonTutorial(player);
        return // Oyuncu ilk kez dünyaya girdiğinde işlemleri yap
    }
    clearPlayerData({ Player: player })
});

world.beforeEvents.entityHurt.subscribe(e => {
    const damagingEntity = e.damageSource.damagingEntity;
    const hurtEntity = e.hurtEntity;

    if (hurtEntity.typeId === "minecraft:player" && carryData.has(hurtEntity.id)) {
        clearPlayerData({ Player: hurtEntity, carryDelete: true });
        return
    }

    if (carryData.get(damagingEntity?.id)?.id === hurtEntity.id) {
        pushMob(damagingEntity, hurtEntity, e);
        return
    }

    clearEntityRide({ Entity: hurtEntity });

    const player = world.getAllPlayers().find(p => carryData.get(p.id)?.id === hurtEntity?.id);
    if (player) clearPlayerData({ Player: player, carryDelete: true })
});

world.beforeEvents.playerInteractWithEntity.subscribe(e => {
    const player = e.player;
    const target = e.target;

    if (carryData.has(player.id)) {
        abilityBar(player);
        powerCount({ Player: player, EventCancel: e });
        return
    }
    addEntityRide({ Player: player, Target: target });
    takeMob(player, target, e)
});

world.beforeEvents.playerInteractWithBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });
world.beforeEvents.playerBreakBlock.subscribe(e => { if (carryData.has(e.player.id)) e.cancel = true });
world.beforeEvents.entityItemPickup.subscribe(e => { if (carryData.has(e.entity.id)) e.cancel = true });
//--------------------------------------------------

world.afterEvents.entityDie.subscribe(e => {
    const deadEntity = e.deadEntity;

    if (e.deadEntity.typeId !== "minecraft:player") { // Eğer oyuncu değil ise
        const player = world.getAllPlayers().find(p => carryData.get(p.id)?.id === deadEntity?.id);
        if (player) clearPlayerData({ Player: player, carryDelete: true })

        clearEntityRide({ Entity: deadEntity });
        return
    }

    clearEntityRide({ Entity: deadEntity });
    clearPlayerData({ Player: deadEntity, carryDelete: true }) // Oyuncu için
});

const worldLoad = world.afterEvents.worldLoad.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        DiskToRAM({ Player: player, WorldLoadEvent: true });
        clearPlayerData({ Player: player })
    }
    world.afterEvents.worldLoad.unsubscribe(worldLoad)
})