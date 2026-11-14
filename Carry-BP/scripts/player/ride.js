import { world, system } from "@minecraft/server";

import { riderData } from "../mob/ride";

export function playerRiding() {
    for (const rider of world.getAllPlayers().filter(p => riderData.has(p.id))) {
        const carrier = world.getAllPlayers().find(p => riderData.get(rider.id) === p.id);
        if (!carrier) return

        const checkDimension = carrier.dimension.id === rider.dimension.id; // boyut değiştirirken hata almamak için

        if (!checkDimension || (carrier.isSneaking && carrier.isJumping) || (rider.isSneaking || rider.isJumping))
            clearPlayerRide({ Player: rider })


        const headPos = carrier.getHeadLocation();
        const viewDir = carrier.getViewDirection();

        const targetLocation = {
            x: headPos.x + viewDir.x * 5,
            y: headPos.y + viewDir.y * 5,
            z: headPos.z + viewDir.z * 5
        };

        rider.teleport({ x: carrier.location.x, y: carrier.location.y + 0.80, z: carrier.location.z }, { facingLocation: targetLocation });
        carrier.addEffect("slowness", 10, { amplifier: 0.30, showParticles: false })
    }
}

export function addPlayerRide(player, target) {
    if (target.typeId !== "minecraft:player" || player.isSneaking || riderData.has(target.id)) return

    system.run(() => {
        target.onScreenDisplay.setActionBar({ rawtext: [{ translate: "carried.player" }] });

        player.onScreenDisplay.setActionBar({ rawtext: [{ translate: "rode.player" }] });
        player.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
    });
    riderData.set(player.id, target.id);
    player.setDynamicProperty("ride", target.id)
}

export function clearPlayerRide({ Player, PlayerLeave }) {
    const rodePlayer = world.getAllPlayers().find(r => riderData.get(r.id) === Player.id);
    if (rodePlayer) {
        system.run(() => rodePlayer.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" }));
        riderData.delete(rodePlayer.id);
        return rodePlayer.setDynamicProperty("ride", undefined)
    }

    if (!PlayerLeave) system.run(() => Player.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" }))

    riderData.delete(Player.id);
    Player.setDynamicProperty("ride", undefined)
}