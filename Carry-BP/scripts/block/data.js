import { world, system, StructureSaveMode } from "@minecraft/server";

import { carryEntityData } from "../entity/carry";
import { playerDataManage } from "../player/data";

const allowBlocks = new Set([
    "minecraft:stone",
    "minecraft:dirt",
    "minecraft:diamond_block",
    "minecraft:crafting_table",
    "minecraft:chest"
]);

export function saveBlock(player, block, e) {
    if (!allowBlocks.has(block.typeId) || !player.isSneaking) return

    e.cancel = true;

    system.run(() => {
        if (world.structureManager.get("block:" + player.id)) return // zaten kayıtlı varsa geri dön

        world.structureManager.createFromWorld(
            "block:" + player.id,
            player.dimension, block.location, block.location,
            { saveMode: StructureSaveMode.World, includeBlocks: true, includeEntities: false }
        );

        const entityBlock = player.dimension.spawnEntity("carry_throw:block", player.location);
        entityBlock.triggerEvent(block.typeId.split(":")[1]);

        carryEntityData.set(player.id, { id: entityBlock.id, typeId: entityBlock.typeId, carry: true });
        playerDataManage({ Player: player, Target: entityBlock });

        const inventory = block.getComponent("minecraft:inventory");

        if (inventory && inventory.container) { // 
            const container = inventory.container;
            for (let i = 0; i < container.size; i++) container.setItem(i, undefined)
        }

        block.setType("minecraft:air")
    })
}

export function placeBlock(player, target) {
    if (target.typeId !== "carry_throw:block") return

    const runIntervalId = system.runInterval(() => {
        if (!target.isValid) {
            system.clearRun(runIntervalId);
            return
        }

        const block = target.dimension.getBlock({ x: target.location.x, y: target.location.y - 1, z: target.location.z });
        if (!block || !block?.isValid || block.isAir || block.isLiquid) return

        if (world.structureManager.get("block:" + player.id))
            world.structureManager.place(
                "block:" + player.id,
                target.dimension, { x: block.location.x, y: block.location.y + 1, z: block.location.z }, { x: block.location.x, y: block.location.y + 1, z: block.location.z }
            );

        world.structureManager.delete("block:" + player.id);

        target.remove();
        system.clearRun(runIntervalId)
    })
}