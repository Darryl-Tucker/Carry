/**
 * @license MIT
 * Copyright (c) 2026 DarrylTucker
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { world, system, StructureSaveMode, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { carryEntityData } from "../entity/carry";
import { managePlayerData } from "../player/dataManager";
import { horizontalDoubleBlocks, verticalDoubleBlocks } from "../utils/db";

export const blockData = new Map();

export function saveBlock(player, block, e) {
    if (carryEntityData.has(player.id) ||
        player.isGliding || player.isEmoting || !player.isSneaking // Gliding yapıyor, emoji kullanıyor veya eğilmiyorsa
    ) return

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    if (!mainHand && !offHand) {
        const identifier = "blockId:" + player.id;
        e.cancel = true;
        system.run(() => {
            if (world.structureManager.get(identifier)) return // zaten kayıtlı varsa geri dön

            const entityBlock = player.dimension.spawnEntity("carry_throw:block", player.location);
            try { entityBlock.triggerEvent(block.typeId.split(":")[1]); } catch { }

            carryEntityData.set(player.id, { id: entityBlock.id, typeId: entityBlock.typeId });
            blockData.set(player.id, { id: entityBlock.id, typeId: block.typeId });

            managePlayerData({ Player: player, Target: entityBlock });
            player.playSound("mob.chicken.plop");

            if (horizontalDoubleBlocks.has(block.typeId))
                saveHorizontalBlock(player, block)
            else if (verticalDoubleBlocks.has(block.typeId))
                saveVerticalBlock(player, block)

            if (!world.structureManager.get(identifier)) {
                world.structureManager.createFromWorld(
                    identifier,
                    player.dimension, block.location, block.location,
                    { saveMode: StructureSaveMode.World, includeBlocks: true, includeEntities: false }
                )
            }

            const inventory = block.getComponent("minecraft:inventory");

            if (inventory && inventory.container) {
                const container = inventory.container;
                for (let i = 0; i < container.size; i++) container.setItem(i, undefined)
            }

            block.setType("minecraft:air");
            block.setType("minecraft:air") // iç içe geçmiş bir blok olabileceği için iki kere air yapıyorum
        });
    }
}

function saveHorizontalBlock(player, block) {
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

        if (side.typeId !== block.typeId || sideDirection !== blockDirection) continue

        world.structureManager.createFromWorld(
            "blockId:" + player.id,
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

function saveVerticalBlock(player, block) {
    const blockLocs = [
        { x: block.location.x, y: block.location.y + 1, z: block.location.z },
        { x: block.location.x, y: block.location.y - 1, z: block.location.z },
    ];

    for (const blockLoc of blockLocs) {
        const side = player.dimension.getBlock(blockLoc);

        if (side.typeId !== block.typeId) continue

        world.structureManager.createFromWorld(
            "blockId:" + player.id,
            player.dimension, block.location, blockLoc,
            { saveMode: StructureSaveMode.World, includeBlocks: true, includeEntities: false }
        );

        side.setType("minecraft:air");
        break
    }
}

export function placeBlock(player, target) {
    if (target.typeId !== "carry_throw:block") return

    const tolerance = 5;
    let entityBlockDuration = 0;
    system.run(() => target.triggerEvent("block:blockSize"));

    const runIntervalId = system.runInterval(() => {
        const identifier = "blockId:" + player.id;

        if (!target.isValid || !world.structureManager.get(identifier)) {
            system.clearRun(runIntervalId);
            return
        }

        if (target.location.y > 319 || target.location.y < -63) return

        const block = target.dimension.getBlock(target.location);
        if (!block || !block?.isValid) return

        if (!target.isOnGround) { // Bloğun hasar verebilmesi için
            for (const entity of target.dimension.getEntities({ location: target.location, maxDistance: 1 }))
                entity.applyDamage(1)
            return
        }

        block.dimension.runCommand(`setblock ${block.x} ${block.y} ${block.z} air destroy`) // Güvenli bir şekilde kırıyorum

        if (entityBlockDuration >= tolerance) {
            try {
                world.structureManager.place(
                    identifier,
                    target.dimension, block.location, block.location
                );

                world.structureManager.delete(identifier);
                target.remove()
            } catch { }
        }
        else entityBlockDuration++
    })
}