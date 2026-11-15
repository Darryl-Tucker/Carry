import { world, system } from "@minecraft/server";
import { carryData } from "../mob/carry";
import { abilitiesData } from "./ability";

export function clearPlayerData({ Player, Target, PlayerLeave, carryDelete }) {
    if (PlayerLeave) { // Eğer oyuncu çıkıyorsa verileri temizle
        carryData.delete(Player.id);
        abilitiesData.delete(Player.id);
        return
    }
    if (!Player) return

    if (carryDelete) carryData.delete(Player.id) // Değilse 

    system.run(() => {
        if (carryData.has(Player.id)) {
            Player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" });
            Target?.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
        }

        else {
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "block_hold" });
            Target?.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
        }
    })
}

export function playerAnimation() { // Her 5 saniye animasyonu kontrol et
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}