import { world, system, ItemStack } from "@minecraft/server";

import { allowMobs } from "../utils/config";

export const handcuffsData = new Map();

export function mobHandcuffs(eventData = null) {
    if (eventData === null) {
        for (const player of world.getAllPlayers()) {
            const entities = player.dimension.getEntities();
            for (const entity of entities) {
                if (!handcuffsData.has(entity.id) && (entity.getDynamicProperty("key") !== undefined || entity.getDynamicProperty("handcuffs") === true)) {
                    const data = entity.getDynamicProperty("key");
                    handcuffsData.set(entity.id, { status: true, key: data })
                    continue
                }

                if (handcuffsData.get(entity.id)?.key) entity.addEffect("slowness", 3, { amplifier: 255, showParticles: false })
            }
        }
    }

    else {
        const target = eventData.target;

        if (allowMobs.indexOf(target.typeId) !== -1) {
            const player = eventData.player;

            if (player.isSneaking) return

            const container = player.getComponent("minecraft:inventory").container;
            const selectedSlot = player.selectedSlotIndex;
            const hand = container.getItem(selectedSlot);

            if (hand) {
                eventData.cancel = true

                if (hand.typeId === "carry:handcuffs" && !handcuffsData.has(target.id)) {
                    handcuffsData.set(target.id, { status: true });
                    target.setDynamicProperty("handcuffs", true);

                    system.run(() => {
                        container.setItem(selectedSlot, undefined);
                        player.dimension.playSound("dig.chain", player.location, { volume: 1, pitch: 1.4 })
                    })
                    return
                }


                if (!handcuffsData.has(target.id)) return

                if (hand.typeId === "carry:key" && handcuffsData.get(target.id)?.key === undefined) {
                    handcuffsData.set(target.id, { status: true, key: player.id });
                    target.setDynamicProperty("key", player.id);

                    const key = new ItemStack("carry:key", 1);

                    system.run(() => {
                        key.setLore([player.id]);
                        container.setItem(selectedSlot, key);
                        player.dimension.playSound("vault.insert_item", player.location, { volume: 1, pitch: 0.9 })
                    })
                    return
                }

                if (hand.typeId === "carry:key" && handcuffsData.get(target.id)?.key === player.id) {
                    target.setDynamicProperty("key", undefined);
                    target.setDynamicProperty("handcuffs", undefined);
                    handcuffsData.delete(target.id);

                    const key = new ItemStack("carry:key", 1);
                    const handcuffs = new ItemStack("carry:handcuffs", 1);

                    system.run(() => {
                        target.dimension.spawnItem(handcuffs, target.location);
                        container.setItem(selectedSlot, key);
                        player.dimension.playSound("vault.insert_item", player.location, { volume: 1, pitch: 0.9 })
                    })
                }
            }
        }
    }
}

export function dropHandcuffs(entity) {
    if (handcuffsData.has(entity.id)) {
        const handcuffs = new ItemStack("carry:handcuffs", 1);
        system.run(() => entity.dimension.spawnItem(handcuffs, entity.location))
    }
}