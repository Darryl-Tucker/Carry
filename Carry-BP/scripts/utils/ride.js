import { world, EntityComponentTypes } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { excludeMobs } from "./config";

export const riderData = new Map();
export const carrierData = new Map();

export function mobRide() {
    for (const rider of world.getDimension("overworld").getEntities().filter(r => riderData.has(r.id))) {
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

export function playerRide() {
    for (const rider of world.getAllPlayers().filter(p => p.getDynamicProperty("ride"))) {
        const carrier = world.getAllPlayers().find(p => rider.getDynamicProperty("ride") === p.id)
        if (carrier) {
            if (carrier.isSneaking && carrier.isJumping) rider.runCommand("ride @s stop_riding")
            carrier.addEffect("slowness", 10, { amplifier: 0.30, showParticles: false })
        }

        const riding = rider.getComponent(EntityComponentTypes.Riding);
        if (riding === undefined) rider.setDynamicProperty("ride", undefined)
    }
}

export function addMob_ride(player, target) {
    const get_carryData = carryData.get(player.id);

    for (const carrier of player.dimension.getEntities({ excludeTypes: excludeMobs }).filter(c => get_carryData?.id !== c.id && !riderData.has(c.id)))
        for (target of carrier.dimension.getEntities({ type: carrier, location: carrier.location, maxDistance: 1.50 }).filter(t => get_carryData?.id === t.id && !riderData.has(t.id) && !carrierData.has(t.id))) {
            let carriedLevel = carrierData.get(carrier.id)?.carriedLevel;
            carrierData.set(carrier.id, { carriedLevel: (carriedLevel ?? 0) + 1 })

            carriedLevel = carrierData.get(carrier.id).carriedLevel;

            for (const rider of carrier.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id))
                riderData.set(rider.id, { id: carrier.id, level: riderData.get(rider.id).level + 1 });

            riderData.set(target.id, { id: carrier.id, level: 1 });
        }
}


export function addPlayer_ride(eventData) {
    const player = eventData.player;
    const target = eventData.target;

    if (target.typeId === "minecraft:player" && !player.isSneaking) player.setDynamicProperty("ride", target.id)
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

    const rider = entity.dimension.getEntities().find(r => riderData.get(r.id)?.id === entity.id);
    if (rider) riderData.delete(rider.id)
}