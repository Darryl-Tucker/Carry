import { world, system, ItemStack } from "@minecraft/server";

import { allowMobs } from "../utils/config";

export const handcuffsData = new Map();

export function mobHandcuffs({ Player, Target, EventCancel } = {}) {
    if (!EventCancel || !Player || !Target) {
        const dimensions = [
            world.getDimension("overworld"),
            world.getDimension("nether"),
            world.getDimension("the_end")
        ];

        for (const dimension of dimensions) {
            const entities = dimension.getEntities().filter(e => handcuffsData.get(e.id)?.key);
            for (const entity of entities) entity.addEffect("slowness", 3, { amplifier: 255, showParticles: false })
        }
        return
    }
    
    if (Player.isSneaking || allowMobs.indexOf(Target.typeId) === -1) return
    const selectedSlot = Player.selectedSlotIndex;
    const container = Player.getComponent("minecraft:inventory").container;
    const mainHand = container.getItem(selectedSlot);
    if (!mainHand?.typeId) return

    const useItems = ["carry:handcuffs", "carry:key"];
    const useItem = useItems.find(u => mainHand.typeId === u);
    if (useItem !== mainHand.typeId) return

    EventCancel.cancel = true

    if (mainHand.typeId === "carry:handcuffs" && !handcuffsData.has(Target.id)) {
        handcuffsData.set(Target.id, { status: true });
        Target.setDynamicProperty("handcuffs", true);

        system.run(() => {
            container.setItem(selectedSlot, undefined);
            Player.dimension.playSound("dig.chain", Player.location, { volume: 1, pitch: 1.4 })
        })
        return
    }

    if (mainHand.typeId === "carry:key") {
        if (!handcuffsData.get(Target.id)?.key && handcuffsData.get(Target.id)?.status) {
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

        if (handcuffsData.get(Target.id)?.key === Player.id) {
            Target.setDynamicProperty("key", undefined);
            Target.setDynamicProperty("handcuffs", undefined);
            handcuffsData.delete(Target.id);

            const key = new ItemStack("carry:key", 1);
            const handcuffs = new ItemStack("carry:handcuffs", 1);

            system.run(() => {
                Target.dimension.spawnItem(handcuffs, Target.location);
                container.setItem(selectedSlot, key);
                Player.dimension.playSound("vault.insert_item", Player.location, { volume: 1, pitch: 0.9 })
            })
        }
    }
}

export function dropHandcuffs(entity) {
    if (handcuffsData.has(entity.id)) {
        const handcuffs = new ItemStack("carry:handcuffs", 1);
        system.run(() => entity.dimension.spawnItem(handcuffs, entity.location))
    }
}