import { world, system, StructureSaveMode, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";

import { carryEntityData } from "../entity/carry";
import { playerDataManage } from "../player/data";
import { allowBlocks } from "../utils/config";

export function saveBlock(player, block, e) {
    if (!allowBlocks.has(block.typeId) ||
        carryEntityData.has(player.id) ||
        player.isGliding || player.isEmoting || !player.isSneaking // Gliding yapıyor, emoji kullanıyor veya eğilmiyorsa
    ) return

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    if (!mainHand && !offHand) {
        e.cancel = true;
        system.run(() => {
            if (world.structureManager.get("block:" + player.id)) return // zaten kayıtlı varsa geri dön

            const entityBlock = player.dimension.spawnEntity("carry_throw:block", player.location);
            try { entityBlock.triggerEvent(block.typeId.split(":")[1]); } catch (error) { console.warn(error) }

            carryEntityData.set(player.id, { id: entityBlock.id, typeId: entityBlock.typeId, carry: true });
            playerDataManage({ Player: player, Target: entityBlock });
            player.playSound("mob.chicken.plop");

            if (block.typeId === "minecraft:chest") saveDoubleBlock(player, block)

            if (!world.structureManager.get("block:" + player.id)) {
                world.structureManager.createFromWorld(
                    "block:" + player.id,
                    player.dimension, block.location, block.location,
                    { saveMode: StructureSaveMode.World, includeBlocks: true, includeEntities: false }
                )
            }

            const inventory = block.getComponent("minecraft:inventory");

            if (inventory && inventory.container) { 
                const container = inventory.container;
                for (let i = 0; i < container.size; i++) container.setItem(i, undefined)
            }

            block.setType("minecraft:air")
        })
    }

}

export function placeBlock(player, target) {
    if (target.typeId !== "carry_throw:block") return

    const runIntervalId = system.runInterval(() => {
        if (!target?.isValid) {
            system.clearRun(runIntervalId);
            return
        }

        const block = target.dimension.getBlock({ x: target.location.x, y: target.location.y - 1, z: target.location.z });
        if (!block || !block?.isValid || block.isAir || block.isLiquid || (block.y + 1) > 319 || (block.y + 1) < -63) return

        block.dimension.runCommand(`setblock ${block.x} ${block.y + 1} ${block.z} air destroy`); // Güvenli bir şekilde kırıyoruz

        if (world.structureManager.get("block:" + player.id)) { // Var ise devam et
            world.structureManager.place(
                "block:" + player.id,
                target.dimension, { x: block.location.x, y: block.location.y + 1, z: block.location.z }, { x: block.location.x, y: block.location.y + 1, z: block.location.z }
            )

            world.structureManager.delete("block:" + player.id);
        }
        target.remove();
        system.clearRun(runIntervalId)
    })
}

function saveDoubleBlock(player, block) {
    const blockLocs = [
        { x: block.location.x + 1, y: block.location.y, z: block.location.z },
        { x: block.location.x - 1, y: block.location.y, z: block.location.z },

        { x: block.location.x, y: block.location.y, z: block.location.z + 1 },
        { x: block.location.x, y: block.location.y, z: block.location.z - 1 }
    ];

    const blockDirection = player.dimension.getBlock(block.location).permutation.getState("minecraft:cardinal_direction");

    for (const blockLoc of blockLocs) {
        const side = player.dimension.getBlock(blockLoc);

        const sideDirection = side.permutation.getState("minecraft:cardinal_direction");

        if (side.typeId === "minecraft:chest" && sideDirection && sideDirection === blockDirection) {
            world.structureManager.createFromWorld(
                "block:" + player.id,
                player.dimension, block.location, blockLoc,
                { saveMode: StructureSaveMode.World, includeBlocks: true, includeEntities: false }
            );

            const inventory = side.getComponent("minecraft:inventory");

            if (inventory && inventory.container) {
                const container = inventory.container;
                for (let i = 0; i < container.size; i++) container.setItem(i, undefined)
            }

            side.setType("minecraft:air");
            break
        }
    }
}