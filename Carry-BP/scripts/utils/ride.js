import { world, EntityComponentTypes, system } from "@minecraft/server";

import { excludeMobs } from "./config";
import { abilitiesData, abilityManager } from "../player/ability";

export const riderData = new Map();
export const carrierData = new Map();

export function mobRide() {
    const dimensions = [
        world.getDimension("overworld"),
        world.getDimension("nether"),
        world.getDimension("the_end")
    ];

    for (const dimension of dimensions) {
        for (const rider of dimension.getEntities().filter(r => riderData.has(r.id))) {
            const carrier = rider.dimension.getEntities().find(c => riderData.get(rider.id).id === c.id)
            if (carrier) {
                const get_riderData = riderData.get(rider.id);

                const carrierLoc = {
                    x: carrier.location.x,
                    y: carrier.location.y + get_riderData.level,
                    z: carrier.location.z
                };
                rider.teleport(carrierLoc)
            }
        }
    }
}

export function playerRide() {
    for (const rider of world.getAllPlayers().filter(p => riderData.has(p.id))) {
        const carrier = world.getAllPlayers().find(p => riderData.get(rider.id) === p.id)
        if (carrier) {
            if (carrier.isSneaking && carrier.isJumping) {
                const drop = carrier.getComponent(EntityComponentTypes.Rideable);
                drop.ejectRider(rider);
            }
            carrier.addEffect("slowness", 10, { amplifier: 0.30, showParticles: false })
        }

        const riding = rider.getComponent(EntityComponentTypes.Riding);
        if (riding === undefined) {
            rider.setDynamicProperty("ride", undefined);
            riderData.delete(rider.id)
        }
    }
}

export function addMob_ride(player, target, startRun = null, endRun = null) {
    const carrier = target.dimension.getEntities({
        location: target.location,
        maxDistance: 1.30,
        excludeTypes: excludeMobs
    }).find(c => c.id !== target.id && !riderData.has(c.id)); // Taşıyıcıyı bul

    if (carrier && !carrierData.has(target.id)) { // Eğer taşıyıcı varsa
        let carriedLevel = carrierData.get(carrier.id)?.carriedLevel;
        carrierData.set(carrier.id, { carriedLevel: (carriedLevel ?? 0) + 1 });

        carriedLevel = carrierData.get(carrier.id).carriedLevel;

        for (const rider of target.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id))
            riderData.set(rider.id, { id: carrier.id, level: riderData.get(rider.id).level + 1 }) // Yeni bir mob bineceği için bütün binen mob'ları bir tık yukarı kaydır

        riderData.set(target.id, { id: carrier.id, level: 1 }); // Hedefi taşıyıcıya bindir

        const manager = new abilityManager(player, abilitiesData);

        manager.progressBoomerang()

        if (startRun !== null && endRun !== null) {
            system.clearRun(startRun); // Eğer zaten bulduğuna göre Run'ı temizleyebiliriz
            system.clearRun(endRun)
        }
    }
}

export function addPlayer_ride(player, target) {
    if (target.typeId === "minecraft:player" && !player.isSneaking) {
        riderData.set(player.id, target.id);
        player.setDynamicProperty("ride", target.id)
    }
}

export function clearRide_data(entity) {
    if (!riderData.has(entity.id)) return

    for (const carrier of entity.dimension.getEntities().filter(c => carrierData.has(c.id) && riderData.get(entity.id)?.id === c.id)) {
        let get_carrierData = carrierData.get(carrier.id);
        let current_carriedLevel = carrierData.get(carrier.id)?.carriedLevel - 1;

        if (get_carrierData.carriedLevel === riderData.get(entity.id).level) {
            carrierData.set(carrier.id, { carriedLevel: get_carrierData.carriedLevel - 1 });
            get_carrierData = carrierData.get(carrier.id);

            if (get_carrierData.carriedLevel < 1) carrierData.delete(carrier.id)

            break
        }

        for (const rider of carrier.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id && entity.id !== r.id)) {
            if (get_carrierData?.carriedLevel > 0) {
                carrierData.set(carrier.id, { carriedLevel: get_carrierData.carriedLevel - 1 });
                get_carrierData = carrierData.get(carrier.id);

                riderData.set(rider.id, { ...riderData.get(rider.id), level: get_carrierData.carriedLevel })
            }
        }
        carrierData.set(carrier.id, { carriedLevel: current_carriedLevel });
    }
    riderData.delete(entity.id);
}

export function clearCarrier_data(entity) {
    if (!carrierData.has(entity.id)) return
    carrierData.delete(entity.id);

    for (const rider of entity.dimension.getEntities().filter(r => riderData.get(r.id)?.id === entity.id))
        riderData.delete(rider.id)
}