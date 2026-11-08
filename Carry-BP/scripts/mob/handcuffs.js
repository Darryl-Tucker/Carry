import { world, system, ItemStack } from "@minecraft/server";

import { allowMobs } from "../utils/config";

export const handcuffsData = new Map();

export function mobHandcuffs({Player, Target, EventCancel} = {}) {
    if (!EventCancel || !Player || !Target) {
        const dimensions = [
            world.getDimension("overworld"),
            world.getDimension("nether"),
            world.getDimension("the_end")
        ];

        dimensions.forEach(dimension => {
            const entities = dimension.getEntities().filter(e => handcuffsData.get(e.id)?.key);
            for (const entity of entities) entity.addEffect("slowness", 3, { amplifier: 255, showParticles: false })
        })
    }

    else {
        if (allowMobs.indexOf(Target.typeId) !== -1) {

            if (Player.isSneaking) return

            const container = Player.getComponent("minecraft:inventory").container;
            const selectedSlot = Player.selectedSlotIndex;
            const hand = container.getItem(selectedSlot);

            if (hand?.typeId === "carry:handcuffs" || hand?.typeId === "carry:key") {
                EventCancel.cancel = true

                if (!handcuffsData.has(Target.id)) {
                    if (hand.typeId === "carry:handcuffs") {
                        handcuffsData.set(Target.id, { status: true });
                        Target.setDynamicProperty("handcuffs", true);

                        system.run(() => {
                            container.setItem(selectedSlot, undefined);
                            Player.dimension.playSound("dig.chain", Player.location, { volume: 1, pitch: 1.4 })
                        })
                    }
                    return
                }

                if (hand.typeId === "carry:key" && handcuffsData.get(Target.id)?.key === undefined) {
                    handcuffsData.set(Target.id, { status: true, key: Player.id });
                    Target.setDynamicProperty("key", Player.id);

                    const key = new ItemStack("carry:key", 1);

                    system.run(() => {
                        key.setLore([Player.id]);
                        container.setItem(selectedSlot, key);
                        Player.dimension.playSound("vault.insert_item", Player.location, { volume: 1, pitch: 0.9 })
                    })
                    return
                }

                if (hand.typeId === "carry:key" && handcuffsData.get(Target.id)?.key === Player.id) {
                    Target.setDynamicProperty("key", undefined);
                    Target.setDynamicProperty("handcuffs", undefined);
                    handcuffsData.delete(Target.id);

                    const key = new ItemStack("carry:key", 1);
                    const handcuffs = new ItemStack("carry:handcuffs", 1);

                    system.run(() => {
                        Target.dimension.spawnItem(handcuffs, target.location);
                        container.setItem(selectedSlot, key);
                        Player.dimension.playSound("vault.insert_item", player.location, { volume: 1, pitch: 0.9 })
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