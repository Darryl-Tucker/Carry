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

const mobCarry_height = 1.05;

function mobWeight(player) {
    for (const mob of allowMobs.filter(m => carryData.get(player.id)?.typeId === m)) {
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

export function mobCarry(eventData = null) {
    if (eventData === null) {
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
                const entities = player.dimension.getEntities({ location: player.location }).filter(e => get_carryData?.id === e.id);

                mobWeight(player);
                for (const entity of entities.filter(e => get_carryData?.id === e.id)) {
                    const playerLoc = player.location;

                    const viewDirection = player.getViewDirection();
                    const distance = 0.50;
                    const targetLoc = {
                        x: playerLoc.x + (viewDirection.x * distance),
                        y: playerLoc.y + mobCarry_height,
                        z: playerLoc.z + (viewDirection.z * distance)
                    };
                    entity.teleport(targetLoc)
                }
            }
        }
    }

    else { // Switch mantığı
        const player = eventData.player;
        if (carryData.has(player.id)) {
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
}


export function powerCount() {
    for (const player of world.getAllPlayers().filter(p => carryData.has(p.id))) {
        const get_carryData = carryData.get(player.id);
        const power = carryData.get(player.id)?.power ?? 0;

        if (power > 0 && player.isSneaking) {
            carryData.set(player.id, { ...get_carryData, power: 0, powerC: null });

            player.onScreenDisplay.setActionBar({ rawtext: [{ text: "§c" }, { translate: texts.powerCanceled }] });
            player.playSound(sounds.powerCanceled);
        }

        else if (get_carryData?.powerC === true && power < 16) {
            system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
            carryData.set(player.id, { ...get_carryData, power: power + 1 });

            const maxBar = 15;
            const greenBars = "§a▌".repeat(power);
            const whiteBars = "§f▌".repeat(Math.abs(maxBar - power));
            system.run(() => player.onScreenDisplay.setActionBar({ rawtext: [{ text: `${greenBars}${whiteBars} ${power} §l` }, { translate: texts.sneakTo_cancel }] }))
        }
    }
}

export function takeMob(eventData) {
    const player = eventData.player;
    if (carryData.has(player.id)) return

    const container = player.getComponent("minecraft:inventory").container;
    const selectedSlot = player.selectedSlotIndex;

    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
    const mainHand = container.getItem(selectedSlot);

    if (player.isSneaking && !player.isGliding) {
        if (!mainHand && !offHand) {
            const target = eventData.target;

            for (const mob of allowMobs.filter(m => target.typeId === m)) {
                let get_carryData = carryData.get(player.id);

                if (get_carryData?.id === undefined) carryData.set(player.id, { id: target.id, typeId: target.typeId })
                carryData.set(player.id, { ...carryData.get(player.id), carry: true });

                system.run(() => player.playSound(sounds.mobTake));

                playerSettings(player)
            }

            clearRide_data(target);
        }
        else {
            system.run(() => {
                player.sendMessage({ rawtext: [{ text: "§c" }, { translate: texts.mobDropped }] });
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
                for (let i = 0; i < power; i++) {
                    const getBlock = target.dimension.getBlock({ x: target.location.x + 1, y: target.location.y, z: target.location.z + 1 });
                    if (!getBlock?.isAir || riderData.has(target.id)) break

                    const playerLoc = player.location;
                    const viewDirection = player.getViewDirection();
                    const targetLoc = {
                        x: playerLoc.x + (viewDirection.x * i),
                        y: playerLoc.y + mobCarry_height,
                        z: playerLoc.z + (viewDirection.z * i)
                    };

                    target.dimension.spawnParticle("minecraft:shulker_bullet", target.location);
                    target.teleport(targetLoc);
                    addMob_ride(player, target)
                }
            });

            system.run(() => {
                player.playSound(sounds.mobPush)
                playerSettings(player)
                carryData.delete(player.id);
            })
        }

        else {
            addMob_ride(player, target);
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
        for (const player of world.getAllPlayers().filter(p => hurtEntity.id === carryData.get(p.id)?.id))
            if (damageSource.cause === "suffocation") eventData.cancel = true
}

export function clearMob_data(eventData) {
    const entity = eventData.deadEntity;

    for (const player of world.getAllPlayers().filter(p => carryData.get(p.id)?.id === entity.id)) {
        carryData.delete(player.id);
        playerSettings(player)
    }
    handcuffsData.delete(entity.id);
    clearRide_data(entity); clearCarrier_data(entity)
}