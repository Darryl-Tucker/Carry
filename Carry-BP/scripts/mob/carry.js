import { world, system, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

import { playerSettings } from "../player/playerData";
import { addMob_ride, riderData } from "../utils/ride";
import { clearRide_data, clearCarrier_data } from "../utils/ride";
import { handcuffsData } from "./handcuffs";
import { allowMobs, neutralMobs } from "../utils/config";

export const carryData = new Map();

const texts = {
    mobDropped: "mob.dropped",
    mobCarry_warn: "mob.carry.warn",
    powerCanceled: "power.canceled",
    sneakTo_cancel: "sneakTo.cancel"
};

const sounds = {
    mobTake: "mob.chicken.plop",
    powerCount: "random.orb",
    mobPush: "mob.shulker.shoot",
    mobDropped: "mob.horse.armor",
    powerCanceled: "mob.villager.no",
    mobCarry_warn: "mob.villager.no"
};

function mobWeight(player) {
    const mob = allowMobs.find(m => carryData.get(player.id)?.typeId === m)

    if (mob) {
        const index = allowMobs.indexOf(mob);
        switch (index) {
            case 0: // Iron golem
            case 14: // Camel
            case 17: // Camel husk
            case 24: // Sniffer
            case 25: // Panda
            case 32: // Polar bear
                player.addEffect("slowness", 10, { amplifier: 5, showParticles: false });
                break

            case 1: // Cow
            case 2: // Sheep
            case 9: // Pig
            case 23: // Goat
            case 29: // Mooshroom
                player.addEffect("slowness", 10, { amplifier: 1, showParticles: false });
                break

            case 4: // Villager v2
            case 16: // Wandering trader
            case 10: // Horse
            case 12: // Llama
            case 15: // Trader llama
            case 26: // Snow golem
            case 28: // Donkey
            case 30: // Mule
                player.addEffect("slowness", 10, { amplifier: 2, showParticles: false });
                break

            case 8: // Copper golem
            case 33: // Turtle
                player.addEffect("slowness", 10, { amplifier: 4, showParticles: false }); break
        }
    }
}

export function mobCarry() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
        let get_carryData = carryData.get(player.id);
        const container = player.getComponent("minecraft:inventory").container;
        const selectedSlot = player.selectedSlotIndex;

        const hand = container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);


        if (player.isSprinting || hand || offHand) {
            carryData.delete(player.id);

            player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.mobDropped }] });
            player.playSound(sounds.mobDropped, { volume: 20 });
            playerSettings(player)
        }

        else {
            mobWeight(player);

            const entity = player.dimension.getEntities({ location: player.location }).find(e => get_carryData?.id === e.id);
            if (entity) {
                const playerLoc = player.location;

                const viewDirection = player.getViewDirection();
                const distance = 0.80;
                const targetLoc = {
                    x: playerLoc.x + (viewDirection.x * distance),
                    y: (playerLoc.y + 1.20) + (viewDirection.y * distance),
                    z: playerLoc.z + (viewDirection.z * distance)
                };
                entity.teleport(targetLoc, { facingLocation: { x: 0, y: 1, z: 0 } })
            }
        }
    }
}

export function powerCount(eventData = null) {
    if (eventData === null) {
        for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
            const get_carryData = carryData.get(player.id);
            const power = carryData.get(player.id)?.power ?? 0;

            if (power > 0 && player.isSneaking) {
                carryData.set(player.id, { ...get_carryData, power: 0, powerC: null });

                player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.powerCanceled }] });
                player.playSound(sounds.powerCanceled);
            }

            else if (get_carryData?.powerC === true) {
                if (power < 15) {
                    system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
                    carryData.set(player.id, { ...get_carryData, power: power + 1 });
                }

                const maxBar = 15;
                const greenBars = "§a▌".repeat(power);

                let whiteBars;

                if (power === 16) whiteBars = "§f▌".repeat(Math.abs(maxBar - (power - 1)))
                else whiteBars = "§f▌".repeat(Math.abs(maxBar - power))

                system.run(() => player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${greenBars}${whiteBars}§f ${power} §l` }, { translate: texts.sneakTo_cancel }] }))
            }
        }
    }

    else { // Switch mantığı
        const player = eventData.player;
        if (!carryData.has(player.id)) return

        const target = eventData.target;
        const get_carryData = carryData.get(player.id);

        const container = player.getComponent("minecraft:inventory").container;
        const selectedSlot = player.selectedSlotIndex;
        const hand = container.getItem(selectedSlot);

        if (!hand && target.id === get_carryData?.id) {
            if (get_carryData?.powerC !== true && !player.isSneaking) carryData.set(player.id, { ...get_carryData, powerC: true })
            else carryData.set(player.id, { ...get_carryData, powerC: null });
        }
        eventData.cancel = true
    }
}

export function takeMob(eventData) {
    const player = eventData.player;
    if (carryData.has(player.id)) return

    const target = eventData.target;
    if (world.getAllPlayers().find(p => carryData.get(p.id)?.id === target.id)) return // Eğer bir oyuncu zaten o mob'u taşıyorsa aldırma

    const container = player.getComponent("minecraft:inventory").container;
    const selectedSlot = player.selectedSlotIndex;

    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
    const mainHand = container.getItem(selectedSlot);

    if (player.isSneaking && !player.isGliding) {
        if (!mainHand && !offHand) {
            if (allowMobs.find(m => target.typeId === m)) {
                carryData.set(player.id, { id: target.id, typeId: target.typeId, carry: true });

                clearRide_data(target);

                playerSettings(player);
                system.run(() => player.playSound(sounds.mobTake))
            }
        }

        else {
            system.run(() => {
                player.sendMessage({ rawtext: [{ text: "§c" }, { translate: texts.mobCarry_warn }] });
                player.playSound(sounds.mobCarry_warn)
            })
        }
        eventData.cancel = true
    }
}

export function pushMob(eventData) {
    const player = eventData.damageSource?.damagingEntity;
    const target = eventData.hurtEntity;
    const power = carryData.get(player.id)?.power;

    if (target.id === carryData.get(player.id)?.id) {
        if (power > 0) {
            system.run(() => {
                const playerLoc = player.location;
                const viewDirection = player.getViewDirection();

                const targetLoc = {
                    x: viewDirection.x * power,
                    z: viewDirection.z * power
                };

                target.applyKnockback(targetLoc, viewDirection.y);

                const runId = system.runInterval(() => addMob_ride(target, runId));
                system.runTimeout(() => system.clearRun(runId), power);

                for (let i = 0; i < power; i++) {
                    const particlePos = {
                        x: playerLoc.x + (viewDirection.x * i),
                        y: (playerLoc.y + 1.30) + (viewDirection.y * i),
                        z: playerLoc.z + (viewDirection.z * i)
                    };
                    if (particlePos.y < -64 || particlePos.y > 319) break

                    target.dimension.spawnParticle("minecraft:shulker_bullet", particlePos);
                }

                player.playSound(sounds.mobPush);
                carryData.delete(player.id);
                playerSettings(player)
            })
        }

        else {
            addMob_ride(target);
            playerSettings(player);
            carryData.delete(player.id)
        }

        system.run(() => { // Canlının agresifleşmesini önlemek için oyun motorunu sabote etme
            if (neutralMobs.indexOf(target.typeId) === -1) return

            const playerGamemode = player.getGameMode();
            const difficulty = world.getDifficulty();

            if (playerGamemode !== "Creative" && difficulty !== "Peaceful") {
                player.setGameMode(GameMode.Spectator);
                system.runTimeout(() => player.setGameMode(playerGamemode), 1)
            }
        })
    }
}


export function protectMob(eventData) {
    const damageSource = eventData.damageSource;
    const hurtEntity = eventData.hurtEntity;

    const hPlayer = eventData.damageSource.damagingEntity?.typeId === "minecraft:player";
    const damagingEntity_id = eventData.damageSource.damagingEntity?.id;

    if (hPlayer && carryData.has(damagingEntity_id)) {
        if (hurtEntity.id === carryData.get(damagingEntity_id)?.id) return eventData.cancel = true
    }

    else
        if (world.getAllPlayers().find(p => hurtEntity.id === carryData.get(p.id)?.id) && damageSource.cause === "suffocation") eventData.cancel = true
}

export function clearMob_data(eventData) {
    const entity = eventData.deadEntity;

    const player = world.getAllPlayers().find(p => carryData.get(p.id)?.id === entity.id)
    if (player) {
        carryData.delete(player.id);
        playerSettings(player)
    }

    handcuffsData.delete(entity.id);
    clearRide_data(entity); clearCarrier_data(entity)
}