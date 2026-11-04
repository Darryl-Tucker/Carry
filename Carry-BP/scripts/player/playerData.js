import { world, system, InputPermissionCategory } from "@minecraft/server";

import { carryData } from "../mob/carry";

export function playerSettings(player) {
    system.run(() => {
        if (carryData.has(player.id)) {
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false);
            player.playAnimation("animation.enderman.carrying", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
        }

        else {
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
            player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0, stopExpression: "query.is_moving", controller: "block_hold" })
        }
    })
}

export function clearPlayer_data(eventData) {
    const playerId = eventData.player.id;
    carryData.delete(playerId)
}

export function playerAnimation() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.enderman.carrying", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}

export function clearCarry_data(player) {
    carryData.delete(player.id); 
    playerSettings(player)
}