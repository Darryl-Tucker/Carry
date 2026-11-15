import { world, system, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";
import { abilitiesData, UnlockAbilityManager, UseAbilityManager } from "../player/ability";
import { clearPlayerData } from "../player/data";
import { allowMobs, excludeBlocks } from "../utils/config";
import { addEntityRide, clearEntityRide, riderData } from "../utils/ride";

export const carryData = new Map();

const texts = {
    mobDropped: "mob.dropped",
    mobCarryWarn: "mob.carry.warn",
    sneakToCancel: "sneakTo.cancel"
};

const sounds = {
    mobTake: "mob.chicken.plop",
    powerCount: "random.orb",
    mobPush: "mob.shulker.shoot",
    mobDropped: "mob.horse.armor",
    powerCanceled: "mob.villager.no",
    mobCarryWarn: "mob.villager.no"
};

function mobComponents(player, entity) {
    if (!carryData.get(player.id)?.power) player.onScreenDisplay.setActionBar("[ " + carryData.get(player.id)?.health + " ]")

    // ---------------------------------------------
    const mobData = allowMobs.find(mob => mob.typeId === entity.typeId);

    if (mobData.effect) {
        if (mobData.effect === "levitation") {
            const rot = player.getRotation();
            if (rot.x <= -45) {
                player.addEffect(mobData.effect, 7, { amplifier: mobData.amplifier, showParticles: false });
                player.addEffect("slow_falling", 40, { amplifier: 1, showParticles: false })
            }
        }
        else player.addEffect(mobData.effect, 7, { amplifier: mobData.amplifier, showParticles: false })
    }

    if (mobData.climbing) {
        const distance = 1.50;

        const blockLocs = [
            { x: player.location.x + distance, y: player.location.y, z: player.location.z },
            { x: player.location.x - distance, y: player.location.y, z: player.location.z },

            { x: player.location.x, y: player.location.y, z: player.location.z + distance },
            { x: player.location.x, y: player.location.y, z: player.location.z - distance }
        ];

        for (const b of blockLocs) {
            if (b.y > 319 || b.y < -63) continue

            const block = player.dimension.getBlock({ x: b.x, y: b.y, z: b.z });
            if (excludeBlocks.includes(block.typeId)) continue

            const rot = player.getRotation();
            if (rot.x <= -45) player.addEffect("levitation", 7, { amplifier: mobData.amplifier, showParticles: false });
        }
    }

    // ---------------------------------------------
    const distance = 0.50;

    const blockLocs = [
        { x: entity.location.x + distance, y: entity.location.y, z: entity.location.z },
        { x: entity.location.x - distance, y: entity.location.y, z: entity.location.z },

        { x: entity.location.x, y: entity.location.y, z: entity.location.z + distance },
        { x: entity.location.x, y: entity.location.y, z: entity.location.z - distance }
    ];

    for (const b of blockLocs) {
        if (b.y > 319 || b.y < -63) continue

        const block = entity.dimension.getBlock({ x: b.x, y: b.y, z: b.z });
        if (excludeBlocks.includes(block.typeId)) continue

        const direction = player.getViewDirection();
        player.applyKnockback({ x: -direction.x, z: -direction.z }, -50)
    }
}

export function mobCarrying() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
        const selectedSlot = player.selectedSlotIndex;
        const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

        const gamemode = player.getGameMode();

        const cd = carryData.get(player.id);
        const entity = player.dimension.getEntities({ location: player.location }).find(e => cd?.id === e.id);

        if (player.isSprinting || player.isJumping || player.isEmoting || mainHand || offHand || gamemode === "Spectator" || !entity) {
            player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.mobDropped }] });
            player.playSound(sounds.mobDropped, { volume: 20 });
            clearPlayerData({ Player: player, carryDelete: true });
            return
        }

        mobComponents(player, entity);

        const playerLoc = player.location;
        const distance = 0.70;

        const headPos = player.getHeadLocation();
        const viewDir = player.getViewDirection();

        const targetFacingLocation = {
            x: headPos.x + viewDir.x * 5,
            y: headPos.y + viewDir.y * 5,
            z: headPos.z + viewDir.z * 5
        };

        const targetLoc = {
            x: playerLoc.x + (viewDir.x * distance),
            y: (playerLoc.y + 1.27) + (viewDir.y * distance),
            z: playerLoc.z + (viewDir.z * distance)
        };

        entity.teleport(targetLoc, { facingLocation: targetFacingLocation })
    }
}

export function powerCount({ Player, EventCancel } = {}) {
    if (EventCancel) { // Switch mantığı
        EventCancel.cancel = true
        const data = carryData.get(Player.id);

        if (Player.isSneaking) return

        if (data?.powerCount) data.powerCount = null
        else data.powerCount = true
        return
    }

    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
        const data = carryData.get(player.id) ?? {};
        data.power = data.power ?? 0;

        if (data.powerCount && data.power < 15) {
            system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
            data.power = data.power + 1
        }

        if (data.power > 0) {
            const maxBar = 15;
            const greenBars = "§a▌".repeat(data.power);
            const whiteBars = "§f▌".repeat(Math.abs(maxBar - data.power));
            system.run(() => player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${greenBars}${whiteBars}§f ${data.power} §l` }, { translate: texts.sneakToCancel }] }))

            if (player.isSneaking) {
                data.power = null;
                data.powerCount = null;

                player.playSound(sounds.powerCanceled)
            }
        }
    }
}

export function takeMob(player, target, e) {
    if (
        world.getAllPlayers().find(p => carryData.get(p.id)?.id === target.id) ||
        !allowMobs.find(m => target.typeId === m.typeId) ||
        player.isGliding || !player.isSneaking ||
        riderData.has(target.id) && target.typeId === "minecraft:player"
    ) return // Bunlardan biri sağlanıyorsa geri dön

    e.cancel = true;

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    if (!mainHand && !offHand) {
        const targetHealth = target.getComponent("minecraft:health").currentValue;

        carryData.set(player.id, { id: target.id, typeId: target.typeId, carry: true, health: targetHealth });

        const manager = new UnlockAbilityManager(player, abilitiesData.get(player.id) ?? {});
        manager.enderman();

        clearEntityRide({ Entity: target });
        clearPlayerData({ Player: player, Target: target });
        system.run(() => player.playSound(sounds.mobTake));
        return
    }

    system.run(() => {
        player.sendMessage({ rawtext: [{ text: "§c>> " }, { translate: texts.mobCarryWarn }] });
        player.playSound(sounds.mobCarryWarn)
    })
}

export function pushMob(player, target, e) {
    if (target.id !== carryData.get(player.id)?.id) return

    const power = carryData.get(player.id)?.power;
    e.cancel = true;

    if (power > 0) {
        const viewDirection = player.getViewDirection();

        const targetLoc = {
            x: viewDirection.x * power,
            z: viewDirection.z * power
        };

        const Unlockmanager = new UnlockAbilityManager(player, abilitiesData.get(player.id) ?? {});
        const UseManager = new UseAbilityManager(player, viewDirection, target, targetLoc);

        Unlockmanager.skySpinner();
        UseManager.loop();

        system.run(() => {
            target.applyKnockback(targetLoc, viewDirection.y);
            player.playSound(sounds.mobPush)
        })
    }

    else if (target.typeId !== "minecraft:player") addEntityRide({ Player: player, Target: target })

    clearPlayerData({ Player: player, Target: target, carryDelete: true });

    if (allowMobs.find(a => !a.neutralMob && a.typeId === target.typeId)) return

    const difficulty = world.getDifficulty();

    if (difficulty !== "Peaceful") {
        const playerGamemode = player.getGameMode();
        system.run(() => { // Canlının agresifleşmesini önlemek için oyun motorunu sabote etme
            player.setGameMode(GameMode.Spectator);
            system.runTimeout(() => player.setGameMode(playerGamemode), 1)
        })
    }
}