import { world, system, InputPermissionCategory } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { abilitiesData } from "./ability";
import { riderData } from "../utils/ride";

export function playerSettings({ Player, DataDelete }) {
    if (DataDelete) carryData.delete(Player.id)
    system.run(() => {
        if (carryData.has(Player.id)) {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false);
            Player.playAnimation("animation.enderman.carrying", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
        }

        else {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0, stopExpression: "query.is_moving", controller: "block_hold" })
        }
    })
}

export function clearPlayerData({ Player, PlayerLeave}) {
    if (PlayerLeave) {
        carryData.delete(Player.id);
        abilitiesData.delete(Player.id);
        return riderData.delete(Player.id)
    }
    playerSettings({ Player: Player, DataDelete: true })
}

export function playerAnimation() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.enderman.carrying", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}