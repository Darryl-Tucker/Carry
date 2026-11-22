/**
 * @license MIT
 * Copyright (c) 2026 DarrylTucker
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { world, system } from "@minecraft/server";
import { excludeEntities } from "../utils/db";

export const riderData = new Map();
export const carrierData = new Map();

export function entityRiding() {
    for (const [riderId, carrierId] of riderData.entries()) {
        const rider = world.getEntity(riderId);
        const carrier = world.getEntity(carrierId.id);

        const checkDimension = carrier.dimension.id === rider.dimension.id; // boyut değiştirirken hata almamak için
        if (!checkDimension ||
            (carrier.typeId === "minecraft:player" && carrier.isSneaking && carrier.isJumping) || // Taşıyıcı oyuncu, eğiliyorsa ve zıplıyorsa
            (rider.typeId === "minecraft:player" && rider.isSneaking || rider.isJumping) // Binici oyuncu, eğiliyorsa veya zıplıyorsa
        ) {
            clearEntityRide(rider);
            continue
        }

        const headPos = carrier.getHeadLocation();
        const viewDir = carrier.getViewDirection();

        const targetFacingLocation = {
            x: headPos.x + viewDir.x * 5,
            y: headPos.y + viewDir.y * 5,
            z: headPos.z + viewDir.z * 5
        };

        const carrierLoc = {
            x: carrier.location.x,
            y: carrier.location.y + riderData.get(rider.id)?.level,
            z: carrier.location.z
        };
        rider.teleport(carrierLoc, { facingLocation: targetFacingLocation })
    }
}

export function addEntityRide({ Player, Target, StartRun, EndRun }) {
    if (Target.typeId === "minecraft:player") { // Oyuncu
        if (Player.isSneaking || riderData.has(Target.id) || riderData.get(Player.id)?.id === Target.id) return
        riderData.set(Player.id, { id: Target.id, level: 1 });
        Player.setDynamicProperty("ride", Target.id);

        system.run(() => {
            Player.onScreenDisplay.setActionBar({ rawtext: [{ translate: "rode.player" }] });
            Target.onScreenDisplay.setActionBar({ rawtext: [{ translate: "carried.player" }] });
            Player.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
        })
        return
    }
    // ----------------------------------------------------------------

    if (Target.getComponent("minecraft:riding") || excludeEntities.includes(Target.typeId)) {
        if (StartRun && EndRun) {
            system.clearRun(StartRun); // Run'ları temizleyebiliriz gerek kalmadı
            system.clearRun(EndRun)
        }
        return
    } // Eğer target bir şeye biniyorsa geri dön

    const carrier = Target.dimension.getEntities({
        location: Target.location,
        maxDistance: 1.75,
        excludeTypes: excludeEntities
    }).find(c => c.id !== Target.id && !riderData.has(c.id)); // Taşıyıcıyı bul

    if (!carrier || carrierData.has(Target.id)) return // Eğer taşıyıcı varsa
    const data = carrierData.get(carrier.id) ?? {};
    data.carriedLevel = (data.carriedLevel ?? 0) + 1;
    carrierData.set(carrier.id, data);

    for (const rider of Target.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id))
        riderData.get(rider.id).level++; // Yeni bir mob bineceği için bütün binen mob'ları bir tık yukarı kaydır

    riderData.set(Target.id, { id: carrier.id, level: 1 }); // Hedefi taşıyıcıya bindir

    if (!StartRun && !EndRun) return
    system.clearRun(StartRun); // Run'ları temizleyebiliriz gerek kalmadı
    system.clearRun(EndRun)
}

export function clearEntityRide(entity) {
    if (entity.typeId === "minecraft:player") {
        system.run(() => {
            if (entity && entity.isValid)
                entity.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
        });

        const rodePlayer = world.getAllPlayers().find(r => r.id !== entity.id && riderData.get(r.id)?.id === entity.id);
        if (rodePlayer) {
            system.run(() => rodePlayer.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" }));
            riderData.delete(rodePlayer.id);
            rodePlayer.setDynamicProperty("ride", undefined);
            return
        }

        riderData.delete(entity.id);
        entity.setDynamicProperty("ride", undefined);
        return
    }
    // ----------------------------------------------------------------
    if (!riderData.get(entity.id)?.id) return

    const carrier = entity.dimension.getEntities().find(c => carrierData.has(c.id) && riderData.get(entity.id)?.id === c.id);
    if (!carrier) return
    const data = carrierData.get(carrier.id) ?? {};
    const currentCarriedLevel = data?.carriedLevel - 1;

    if (data.carriedLevel === riderData.get(entity.id).level) {
        data.carriedLevel--;
        riderData.delete(entity.id);

        if (data.carriedLevel < 1) carrierData.delete(carrier.id)
        return
    }

    for (const rider of carrier.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id && entity.id !== r.id)) {
        data.carriedLevel--;
        riderData.get(rider.id).level = data.carriedLevel
    }
    data.carriedLevel = currentCarriedLevel
    riderData.delete(entity.id);
}

export function clearEntityCarrier(entity) {
    if (!carrierData.has(entity.id)) return
    carrierData.delete(entity.id);

    for (const rider of entity.dimension.getEntities().filter(r => riderData.get(r.id)?.id === entity.id))
        riderData.delete(rider.id)
}