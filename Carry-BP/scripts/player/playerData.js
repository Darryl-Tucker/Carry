import { system, InputPermissionCategory } from "@minecraft/server";

import { carryData } from "../mob/carry";

export function playerSettings(player) {
    system.run(() => {
        if (carryData.has(player.id))
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false)
        else
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true)
    })
}

export function clearData(eventData) {
    const playerId = eventData.player.id;
    carryData.delete(playerId)
}