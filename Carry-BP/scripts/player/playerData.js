import { world, system, InputPermissionCategory, GameMode } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { abilitiesData } from "./ability";
import { riderData } from "../utils/ride";

export function playerSettings(player, Cdata = null) {
    if (Cdata) carryData.delete(player.id)
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

export function clearPlayer_data(player, pl = null) {
    if (pl) {
        carryData.delete(player.id);
        abilitiesData.delete(player.id);
        riderData.delete(player.id) 
    }

    else {
        const Cdata = true;
        playerSettings(player, Cdata)
    }
}

export function playerAnimation() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.enderman.carrying", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}