import { world, system, InputPermissionCategory } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { riderData } from "../mob/ride";

import { abilitiesData } from "./ability";
import { clearPlayerRide } from "./ride";

export function playerSettings({ Player, Target }) {
    system.run(() => {
        if (carryData.has(Player.id)) {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false);
            Player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
        }

        else {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "block_hold" })
        }

        const carriedPlayer = world.getAllPlayers().find(c => carryData.get(Player.id)?.id === c.id);
        if (carriedPlayer) carriedPlayer.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })

        else if (Target) Target.playAnimation("animation.player.bob.stationary", { blendOutTime: 0, stopExpression: "query.is_moving", controller: "player_sit" })

        else if (!riderData.has(Player.id)) Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
    })
}

export function clearPlayerData({ Player, PlayerLeave }) {
    clearPlayerRide({ Player: Player, PlayerLeave: PlayerLeave });
    if (PlayerLeave) {
        carryData.delete(Player.id);
        abilitiesData.delete(Player.id);
        return
    }
    carryData.delete(Player.id)
}

export function playerAnimation() { // Her 5 saniye animasyonu kontrol et
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}