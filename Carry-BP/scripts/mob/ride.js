import { world, system } from "@minecraft/server";

import { abilitiesData, UnlockAbilityManager } from "../player/ability";

export const riderData = new Map();
export const carrierData = new Map();

export function mobRiding() {
    const dimensions = [
        world.getDimension("overworld"),
        world.getDimension("nether"),
        world.getDimension("the_end")
    ];

    for (const dimension of dimensions) {
        for (const rider of dimension.getEntities().filter(r => riderData.has(r.id))) {
            const carrier = rider.dimension.getEntities().find(c => riderData.get(rider.id).id === c.id)
            if (carrier) {
                const carrierLoc = {
                    x: carrier.location.x,
                    y: carrier.location.y + riderData.get(rider.id).level,
                    z: carrier.location.z
                };
                rider.teleport(carrierLoc)
            }
        }
    }
}

export function addMobRide({ Player, Target, StartRun, EndRun }) {
    if (Target.typeId === "minecraft:player") return // Oyuncu ise dön

    const carrier = Target.dimension.getEntities({
        location: Target.location,
        maxDistance: 1.75,
        excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:arrow", "minecraft:xp_orb"]
    }).find(c => c.id !== Target.id && !riderData.has(c.id)); // Taşıyıcıyı bul

    if (carrier && !carrierData.has(Target.id)) { // Eğer taşıyıcı varsa
        const data = carrierData.get(carrier.id) ?? {};
        data.carriedLevel = (data.carriedLevel ?? 0) + 1;
        carrierData.set(carrier.id, data);

        for (const rider of Target.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id))
            riderData.get(rider.id).level++; // Yeni bir mob bineceği için bütün binen mob'ları bir tık yukarı kaydır

        riderData.set(Target.id, { id: carrier.id, level: 1 }); // Hedefi taşıyıcıya bindir

        const manager = new UnlockAbilityManager(Player, abilitiesData.get(Player.id) ?? {});
        manager.boomerang();

        if (!StartRun && !EndRun) return
        system.clearRun(StartRun); // Run'ları temizleyebiliriz gerek kalmadı
        system.clearRun(EndRun)
    }
}

export function clearRideData(entity) {
    if (!riderData.get(entity.id)?.id) return

    for (const carrier of entity.dimension.getEntities().filter(c => carrierData.has(c.id) && riderData.get(entity.id)?.id === c.id)) {
        const data = carrierData.get(carrier.id) ?? {};

        const currentCarriedLevel = data?.carriedLevel - 1;

        if (!data.carriedLevel && data.carriedLevel === riderData.get(entity.id).level) {
            data.carriedLevel--;
            if (carriedLevel.carriedLevel < 1) carrierData.delete(carrier.id)
            break
        }

        for (const rider of carrier.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id && entity.id !== r.id)) {
            if (data.carriedLevel < 0) return
            data.carriedLevel--;

            riderData.get(rider.id).level = data.carriedLevel
        }
        data.carriedLevel = currentCarriedLevel
    }
    riderData.delete(entity.id);
}

export function clearCarrierData(entity) {
    if (!carrierData.has(entity.id)) return
    carrierData.delete(entity.id);

    for (const rider of entity.dimension.getEntities().filter(r => riderData.get(r.id)?.id === entity.id))
        riderData.delete(rider.id)
}