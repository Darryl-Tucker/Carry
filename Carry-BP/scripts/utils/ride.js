import { world, system } from "@minecraft/server";

export const riderData = new Map();
export const carrierData = new Map();

export function entityRiding() {
    const dimensions = [
        world.getDimension("overworld"),
        world.getDimension("nether"),
        world.getDimension("the_end")
    ];

    for (const dimension of dimensions) {
        for (const rider of dimension.getEntities().filter(r => riderData.has(r.id))) {
            const carrier = rider.dimension.getEntities().find(c => riderData.get(rider.id).id === c.id)
            if (!carrier) continue

            const checkDimension = carrier.dimension.id === rider.dimension.id; // boyut değiştirirken hata almamak için

            if (!checkDimension ||
                (carrier.typeId === "minecraft:player" && carrier.isSneaking && carrier.isJumping) || // Taşıyıcı oyuncu, eğiliyorsa ve zıplıyorsa
                (rider.typeId === "minecraft:player" && rider.isSneaking || rider.isJumping) // Binici oyuncu, eğiliyorsa veya zıplıyorsa
            ) {
                clearEntityRide({ Entity: rider });
                continue
            }

            const headPos = carrier.getHeadLocation();
            const viewDir = carrier.getViewDirection();

            const targetFacingLocation = {
                x: headPos.x + viewDir.x * 5,
                y: headPos.y + viewDir.y * 5,
                z: headPos.z + viewDir.z * 5
            };

            const carrierLoc = {
                x: carrier.location.x,
                y: carrier.location.y + riderData.get(rider.id)?.level,
                z: carrier.location.z
            };
            rider.teleport(carrierLoc, { facingLocation: targetFacingLocation })
        }
    }
}

export function addEntityRide({ Player, Target, StartRun, EndRun }) {
    if (Target.typeId === "minecraft:player") { // Oyuncu
        if (Player.isSneaking || riderData.has(Target.id) || riderData.get(Player.id)?.id === Target.id) return
        riderData.set(Player.id, { id: Target.id, level: 1 });
        Player.setDynamicProperty("ride", Target.id);

        system.run(() => {
            Player.onScreenDisplay.setActionBar({ rawtext: [{ translate: "rode.player" }] });
            Target.onScreenDisplay.setActionBar({ rawtext: [{ translate: "carried.player" }] });
            Player.playAnimation("animation.player.riding.legs", { blendOutTime: 0, stopExpression: "0", controller: "player_sit" })
        })
        return
    }
    // ----------------------------------------------------------------

    const excludeTypes = [
        "minecraft:player",
        "minecraft:item",
        "minecraft:arrow",
        "minecraft:xp_orb",
        "minecraft:minecart",
        "minecraft:command_block_minecart",
        "minecraft:hopper_minecart",
        "minecraft:tnt_minecart",
        "minecraft:chest_minecart",
        "minecraft:boat",
        "wind_charge_projectile"
    ];

    if (Target.getComponent("minecraft:riding") || excludeTypes.includes(Target.typeId)) {
        if (StartRun && EndRun) {
            system.clearRun(StartRun); // Run'ları temizleyebiliriz gerek kalmadı
            system.clearRun(EndRun)
        }
        return
    } // Eğer target bir şeye biniyorsa geri dön

    const carrier = Target.dimension.getEntities({
        location: Target.location,
        maxDistance: 1.75,
        excludeTypes: excludeTypes
    }).find(c => c.id !== Target.id && !riderData.has(c.id)); // Taşıyıcıyı bul

    if (!carrier || carrierData.has(Target.id)) return // Eğer taşıyıcı varsa
    const data = carrierData.get(carrier.id) ?? {};
    data.carriedLevel = (data.carriedLevel ?? 0) + 1;
    carrierData.set(carrier.id, data);

    for (const rider of Target.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id))
        riderData.get(rider.id).level++; // Yeni bir mob bineceği için bütün binen mob'ları bir tık yukarı kaydır

    riderData.set(Target.id, { id: carrier.id, level: 1 }); // Hedefi taşıyıcıya bindir

    if (!StartRun && !EndRun) return
    system.clearRun(StartRun); // Run'ları temizleyebiliriz gerek kalmadı
    system.clearRun(EndRun)
}

export function clearEntityRide({ Entity }) {
    if (Entity.typeId === "minecraft:player") {
        system.run(() => {
            if (Entity && Entity.isValid)
                Entity.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" })
        });

        const rodePlayer = world.getAllPlayers().find(r => r.id !== Entity.id && riderData.get(r.id)?.id === Entity.id);
        if (rodePlayer) {
            system.run(() => rodePlayer.playAnimation("animation.player.bob.stationary", { blendOutTime: 0.1, controller: "player_sit" }));
            riderData.delete(rodePlayer.id);
            rodePlayer.setDynamicProperty("ride", undefined);
            return
        }

        riderData.delete(Entity.id);
        Entity.setDynamicProperty("ride", undefined);
        return
    }
    // ----------------------------------------------------------------
    if (!riderData.get(Entity.id)?.id) return

    const carrier = Entity.dimension.getEntities().find(c => carrierData.has(c.id) && riderData.get(Entity.id)?.id === c.id);
    if (!carrier) return
    const data = carrierData.get(carrier.id) ?? {};
    const currentCarriedLevel = data?.carriedLevel - 1;

    if (data.carriedLevel === riderData.get(Entity.id).level) {
        data.carriedLevel--;
        riderData.delete(Entity.id);

        if (data.carriedLevel < 1) carrierData.delete(carrier.id)
        return
    }

    for (const rider of carrier.dimension.getEntities().filter(r => riderData.get(r.id)?.id === carrier.id && Entity.id !== r.id)) {
        data.carriedLevel--;
        riderData.get(rider.id).level = data.carriedLevel
    }
    data.carriedLevel = currentCarriedLevel
    riderData.delete(Entity.id);
}

export function clearCarrierData(entity) {
    if (!carrierData.has(entity.id)) return
    carrierData.delete(entity.id);

    for (const rider of entity.dimension.getEntities().filter(r => riderData.get(r.id)?.id === entity.id))
        riderData.delete(rider.id)
}