import { world, system, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

import { addMobRide, riderData } from "./ride";
import { clearRideData, clearCarrierData } from "./ride";

import { abilitiesData, UnlockAbilityManager, UseAbilityManager } from "../player/ability";
import { clearPlayerData, playerSettings } from "../player/data";

import { allowMobs, neutralMobs, excludeBlocks } from "../utils/config";

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

function mobComponents(player) {
    const mobIndex = allowMobs.findIndex(m => carryData.get(player.id)?.typeId === m);
    const cd = carryData.get(player.id);

    if (mobIndex !== -1)
        switch (mobIndex) {
            case 0: // Iron golem
            case 14: // Camel
            case 17: // Camel husk
            case 24: // Sniffer
            case 25: // Panda
            case 32: // Polar bear
                player.addEffect("slowness", 7, { amplifier: 5, showParticles: false });
                break

            case 1: // Cow
            case 2: // Sheep
            case 9: // Pig
            case 23: // Goat
            case 29: // Mooshroom
                player.addEffect("slowness", 7, { amplifier: 1, showParticles: false });
                break

            case 4: // Villager v2
            case 16: // Wandering trader
            case 10: // Horse
            case 12: // Llama
            case 15: // Trader llama
            case 26: // Snow golem
            case 28: // Donkey
            case 30: // Mule
            case 39: // Player
                player.addEffect("slowness", 7, { amplifier: 2, showParticles: false });
                break

            case 8: // Copper golem
            case 33: // Turtle
                player.addEffect("slowness", 7, { amplifier: 4, showParticles: false });
                break
        }

    if (!cd?.powerCount) player.onScreenDisplay.setActionBar("[ " + carryData.get(player.id)?.health + " ]")
}

function suffocationBlock(player, entity) {
    if (entity) {
        const distance = 0.50;

        const blockLocs = [
            { x: entity.location.x + distance, y: entity.location.y, z: entity.location.z },
            { x: entity.location.x - distance, y: entity.location.y, z: entity.location.z },

            { x: entity.location.x, y: entity.location.y, z: entity.location.z + distance },
            { x: entity.location.x, y: entity.location.y, z: entity.location.z - distance }
        ];

        blockLocs.forEach(b => {
            if (b.y > 319 || b.y < -63) return

            const block = entity.dimension.getBlock({ x: b.x, y: b.y, z: b.z });
            const excludeBlock = excludeBlocks.find(eb => eb === block.typeId);

            if (excludeBlock) return
            const direction = player.getViewDirection();
            system.run(() => player.applyKnockback({ x: -direction.x, z: -direction.z }, -50));
        })
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

        if (player.isSprinting || mainHand || offHand || gamemode === "Spectator" || !entity) {
            player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.mobDropped }] });
            player.playSound(sounds.mobDropped, { volume: 20 });
            return clearPlayerData({ Player: player, Target: entity })
        }

        if (!entity) return
        mobComponents(player);
        suffocationBlock(player, entity);

        const playerLoc = player.location;

        const viewDirection = player.getViewDirection();
        const distance = 0.70;
        const targetLoc = {
            x: playerLoc.x + (viewDirection.x * distance),
            y: (playerLoc.y + 1.27) + (viewDirection.y * distance),
            z: playerLoc.z + (viewDirection.z * distance)
        };
        entity.teleport(targetLoc)
    }
}

export function powerCount({ Player, Target, EventCancel } = {}) {
    if (!EventCancel) {
        for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
            const data = carryData.get(player.id) ?? {};
            data.power = data.power ?? 0;

            if (data?.power > 0 && player.isSneaking) {
                data.power = null;
                data.powerCount = null;

                return player.playSound(sounds.powerCanceled);
            }

            if (data?.powerCount) {
                if (data.power < 15) {
                    system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
                    data.power = data.power + 1
                }
                const maxBar = 15;
                const greenBars = "§a▌".repeat(data.power);

                let whiteBars;

                if (data.power === 16) whiteBars = "§f▌".repeat(Math.abs(maxBar - (data.power - 1)))
                else whiteBars = "§f▌".repeat(Math.abs(maxBar - data.power))

                system.run(() => player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${greenBars}${whiteBars}§f ${data.power} §l` }, { translate: texts.sneakToCancel }] }))
            }
        }
        return
    }

    EventCancel.cancel = true
    // Switch mantığı
    const data = carryData.get(Player.id);

    const selectedSlot = Player.selectedSlotIndex;
    const hand = Player.getComponent("minecraft:inventory").container.getItem(selectedSlot);

    if (!hand && Target.id === data?.id) {
        if (!data?.powerCount && !Player.isSneaking) return data.powerCount = true
        data.powerCount = null
    }
}

export function takeMob(player, target, e) {
    if (
        world.getAllPlayers().find(p => carryData.get(p.id)?.id === target.id) ||
        !allowMobs.find(m => target.typeId === m) ||
        player.isGliding || !player.isSneaking ||
        riderData.has(target.id) && target.typeId === "minecraft:player"
    ) return // Bunlardan biri sağlanıyorsa geri dön

    e.cancel = true;

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    const targetHealth = target.getComponent("minecraft:health").currentValue;

    if (!mainHand && !offHand && allowMobs.find(m => target.typeId === m)) {
        carryData.set(player.id, { id: target.id, typeId: target.typeId, carry: true, health: targetHealth });
        clearRideData(target);

        const manager = new UnlockAbilityManager(player, abilitiesData.get(player.id) ?? {});
        manager.enderman();

        playerSettings({ Player: player });
        return system.run(() => player.playSound(sounds.mobTake))
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
        });
    }

    else addMobRide({ Player: player, Target: target });

    playerSettings({ Player: player, Target: target, DataDelete: true });

    if (neutralMobs.indexOf(target.typeId) === -1) return

    const difficulty = world.getDifficulty();

    if (difficulty !== "Peaceful") {
        const playerGamemode = player.getGameMode();
        system.run(() => { // Canlının agresifleşmesini önlemek için oyun motorunu sabote etme
            player.setGameMode(GameMode.Spectator);
            system.runTimeout(() => player.setGameMode(playerGamemode), 1)
        })
    }
}

export function clearMobData(deadEntity) {
    const player = world.getAllPlayers().find(p => carryData.get(p.id)?.id === deadEntity.id);
    if (player) clearPlayerData({ Player: player })

    clearRideData(deadEntity); clearCarrierData(deadEntity)
}