import { world, system, InputPermissionCategory } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { riderData } from "../mob/ride";

import { abilitiesData } from "./ability";
import { clearPlayerRide } from "./ride";

export function playerSettings({ Player, Target, DataDelete }) {
    if (DataDelete) carryData.delete(Player.id)

    system.run(() => { // Taşınan oyuncu için
        if (carryData.has(Player.id)) {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false);
            Player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
        }

        else {
            Player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "block_hold" })
        }

        const carriedPlayer = world.getAllPlayers().find(c => carryData.get(Player.id)?.id === c.id)
        if (carriedPlayer) return carriedPlayer.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
        if (Target) Target.playAnimation("animation.player.bob.stationary", { blendOutTime: 0, stopExpression: "query.is_moving", controller: "player_sit" })

        if (!riderData.has(Player.id)) Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
    })
}

export function clearPlayerData({ Player, Target, PlayerLeave }) {
    clearPlayerRide({ Player: Player, PlayerLeave: PlayerLeave });
    if (PlayerLeave) {
        carryData.delete(Player.id);
        return abilitiesData.delete(Player.id)
    }
    playerSettings({ Player: Player, Target: Target, DataDelete: true })
}

export function playerAnimation() { // Her 5 saniye animasyonu kontrol et
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}