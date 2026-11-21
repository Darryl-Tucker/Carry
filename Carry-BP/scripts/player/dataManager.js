import { world, system } from "@minecraft/server";
import { carryEntityData } from "../entity/carry";
import { abilityData } from "./ability";

export function managePlayerData({ Player, Target, PlayerLeave, carryDelete }) {
    if (PlayerLeave) { // Eğer oyuncu çıkıyorsa verileri temizle
        carryEntityData.delete(Player.id);
        abilityData.delete(Player.id);
        return
    }

    if (carryDelete) carryEntityData.delete(Player.id) // Değilse 

    system.run(() => {
        if (carryEntityData.has(Player.id)) {
            Player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" });
            
            if (Target && Target.typeId === "minecraft:player")
                Target.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
        }

        else {
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "block_hold" });
            Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" });

            if (Target && Target.typeId === "minecraft:player")
                Target.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
        }
    })
}

export function playerAnimation() { // Her 5 saniye animasyonu kontrol et
    for (const player of world.getAllPlayers().filter(p => carryEntityData.has(p.id))) player.playAnimation("animation.player.carry", { blendOutTime: 0, stopExpression: "0", controller: "block_hold" })
}