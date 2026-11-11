import { world, system, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

import { clearPlayerData, playerSettings } from "../player/playerData";
import { addMobRide } from "../utils/ride";
import { clearRideData, clearCarrierData } from "../utils/ride";
import { handcuffsData } from "./handcuffs";
import { allowMobs, neutralMobs, excludeBlocks } from "../utils/config";
import { abilitiesData, UnlockAbilityManager, useAbility } from "../player/ability";

export const carryData = new Map();

const texts = {
    mobDropped: "mob.dropped",
    mobCarryWarn: "mob.carry.warn",
    powerCanceled: "power.canceled",
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

function mobWeight(player) {
    const mobIndex = allowMobs.findIndex(m => carryData.get(player.id)?.typeId === m);

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
                player.addEffect("slowness", 7, { amplifier: 2, showParticles: false });
                break

            case 8: // Copper golem
            case 33: // Turtle
                player.addEffect("slowness", 7, { amplifier: 4, showParticles: false });
                break
        }
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
            const block = entity.dimension.getBlock({ x: b.x, y: b.y, z: b.z });

            const excludeBlock = excludeBlocks.find(eb => eb === block.typeId);

            if (excludeBlock) return
            const direction = player.getViewDirection();
            system.run(() => player.applyKnockback({ x: -direction.x, z: -direction.z }, -50));
        })
    }
}

export function mobCarry() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
        const selectedSlot = player.selectedSlotIndex;
        const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
        const gamemode = player.getGameMode();

        const carryId = carryData.get(player.id)?.id;
        const entity = player.dimension.getEntities({ location: player.location }).find(e => carryId === e.id);

        if (player.isSprinting || mainHand || offHand || gamemode === "Spectator" || !entity) {
            player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.mobDropped }] });
            player.playSound(sounds.mobDropped, { volume: 20 });
            return clearPlayerData({ Player: player })
        }

        if (entity) {
            mobWeight(player);
            suffocationBlock(player, entity);

            const playerLoc = player.location;

            const viewDirection = player.getViewDirection();
            const distance = 0.70;
            const targetLoc = {
                x: playerLoc.x + (viewDirection.x * distance),
                y: (playerLoc.y + 1.30) + (viewDirection.y * distance),
                z: playerLoc.z + (viewDirection.z * distance)
            };
            entity.teleport(targetLoc)
        }

    }
}

export function powerCount({ Player, Target, EventCancel } = {}) {
    if (!EventCancel) {
        for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
            const data = carryData.get(player.id) ?? {};
            data.power = data.power ?? 0;

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

                return system.run(() => player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${greenBars}${whiteBars}§f ${data.power} §l` }, { translate: texts.sneakToCancel }] }))
            }

            if (data?.power > 0 && player.isSneaking) {
                data.power = null;
                data.powerCount = null;

                player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.powerCanceled }] });
                player.playSound(sounds.powerCanceled);
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
    if (world.getAllPlayers().find(p => carryData.get(p.id)?.id === target.id) || !allowMobs.find(m => target.typeId === m)) return
    // Eğer bir oyuncu zaten o mob'u taşıyorsa veya liste dışı bir mob ise aldırma

    if (player.isSneaking && !player.isGliding) {
        e.cancel = true;

        const selectedSlot = player.selectedSlotIndex;
        const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

        if (!mainHand && !offHand && allowMobs.find(m => target.typeId === m)) {
            carryData.set(player.id, { id: target.id, typeId: target.typeId, carry: true });

            clearRideData(target);

            playerSettings({ Player: player });
            return system.run(() => player.playSound(sounds.mobTake))
        }

        system.run(() => {
            player.sendMessage({ rawtext: [{ text: "§c" }, { translate: texts.mobCarryWarn }] });
            player.playSound(sounds.mobCarryWarn)
        })
    }
}

export function pushMob(player, target, e) {
    if (target.id !== carryData.get(player.id)?.id) return

    const power = carryData.get(player.id)?.power;
    const abilityH = abilitiesData.get(player.id)?.abilityPage;

    e.cancel = true;

    if (power > 0) {
        const viewDirection = player.getViewDirection();

        const manager = new UnlockAbilityManager(player, abilitiesData);

        manager.progressSkySpinner();

        const targetLoc = {
            x: viewDirection.x * power,
            z: viewDirection.z * power
        };

        system.run(() => target.applyKnockback(targetLoc, viewDirection.y));

        const startAbilityRun = system.runInterval(() => {
            if (!target || !target.isValid) {
                system.clearRun(startAbilityRun); // Çökme önlemek için (boyut değiştirirken çökmemesi için)
                system.clearRun(endAbilityRun)
            }
            useAbility({ Player: player, Target: target })
        });
        const endAbilityRun = system.runTimeout(() => system.clearRun(startAbilityRun), power * 2);

        const startRun = system.runInterval(() => {
            if (!target || !target.isValid) {
                system.clearRun(startRun); // Çökme önlemek için (boyut değiştirirken çökmemesi için)
                return system.clearRun(endRun)
            }

            if (abilityH === undefined) addMobRide({ Player: player, Target: target, StartRun: startRun, EndRun: endRun }); // Eğer yeteneği kullanıyorsa üst üste bindirme
            else useAbility({ Player: player, Target: target, ViewDirection: viewDirection, Power: power })
        });

        const endRun = system.runTimeout(() => {
            system.clearRun(startRun);
            useAbility({ Player: player, Target: target, TargetLoc: targetLoc, BomBack: true }) // Mıknatıs özelliği ile geri getiriyoruz
        }, power)

        system.run(() => player.playSound(sounds.mobPush));
        addMobRide({ Player: player, Target: target });
    }

    else addMobRide({ Player: player, Target: target });

    playerSettings({ Player: player, DataDelete: true });

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

    handcuffsData.delete(deadEntity.id);
    clearRideData(deadEntity); clearCarrierData(deadEntity)
}