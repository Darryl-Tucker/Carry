import { world, system, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";
import { UnlockAbilityManager, UseAbilityManager } from "../player/ability";
import { playerDataManage } from "../player/data";
import { entityProperties, excludeBlocks, excludeEntities } from "../utils/db";
import { addEntityRide, clearEntityRide, riderData } from "./ride";
import { placeBlock } from "../block/data";

export const carryEntityData = new Map();

const texts = {
    mobCarryWarn: "mob.carry.warn",
};

const sounds = {
    mobTake: "mob.chicken.plop",
    powerCount: "random.orb",
    mobPush: "mob.shulker.shoot",
    mobDropped: "mob.horse.armor",
    powerCanceled: "mob.villager.no",
    mobCarryWarn: "mob.villager.no"
};

class EntityComponentManager {
    constructor(player, entity) {
        this.player = player;
        this.rot = this.player.getRotation();
        this.entity = entity;
    }

    entityHealthShow() { if (!carryEntityData.get(this.player.id)?.power) this.player.onScreenDisplay.setActionBar("[ " + (carryEntityData.get(this.player.id).health ?? 0.50) + " ]") }

    suffocationBlock() {
        const distance = 0.10;

        const blockLocs = [
            { x: this.entity.location.x + distance, y: this.entity.location.y, z: this.entity.location.z },
            { x: this.entity.location.x - distance, y: this.entity.location.y, z: this.entity.location.z },

            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z + distance },
            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z - distance },
        ];

        for (const b of blockLocs) {
            if (b.y > 319 || b.y < -63) continue

            const block = this.entity.dimension.getBlock({ x: b.x, y: b.y, z: b.z });
            if (excludeBlocks.has(block?.typeId)) continue

            const direction = this.player.getViewDirection();
            this.player.applyKnockback({ x: -direction.x, z: -direction.z }, -50)
        }
    }

    useEntityProperties() {
        const entityProperty = entityProperties.find(mob => mob.typeId === this.entity.typeId);
        const effectDuration = 7;

        if (!this.entity.getComponent("minecraft:is_baby") && entityProperty?.weight)
            this.player.addEffect("slowness", effectDuration, { amplifier: entityProperty.weight, showParticles: false })

        if (entityProperty?.wallClimber) {
            const distance = 1.50;

            const blockLocs = [
                { x: this.player.location.x + distance, y: this.player.location.y, z: this.player.location.z },
                { x: this.player.location.x - distance, y: this.player.location.y, z: this.player.location.z },

                { x: this.player.location.x, y: this.player.location.y, z: this.player.location.z + distance },
                { x: this.player.location.x, y: this.player.location.y, z: this.player.location.z - distance }
            ];

            for (const b of blockLocs) {
                if (b.y > 319 || b.y < -63) continue

                const block = this.player.dimension.getBlock({ x: b.x, y: b.y, z: b.z });
                if (excludeBlocks.has(block?.typeId)) continue

                if (this.rot.x <= -45) this.player.addEffect("levitation", effectDuration, { amplifier: 2, showParticles: false });
            }
        }

        else if (entityProperty?.Freezer)
            this.player.addEffect("freezing", effectDuration, { amplifier: 1, showParticles: false })

        else if (this.player.isFalling && entityProperty?.glider)
            this.player.addEffect("slow_falling", effectDuration, { amplifier: 1, showParticles: false })

        else if (this.rot.x <= -45 && entityProperty?.levitator)
            this.player.addEffect("levitation", effectDuration, { amplifier: 2, showParticles: false })

        else if (entityProperty?.medic)
            this.player.addEffect("regeneration", effectDuration, { amplifier: 3, showParticles: false })

        else if (entityProperty?.oozing)
            this.player.addEffect("oozing", effectDuration, { amplifier: 3, showParticles: false })

    }

    blockDimensionCheck() {
        if (this.entity.location.y > 319 || this.entity.location.y < -63) return

        const entityBlockLocs = [
            { x: this.entity.location.x + 1, y: this.entity.location.y, z: this.entity.location.z },
            { x: this.entity.location.x - 1, y: this.entity.location.y, z: this.entity.location.z },

            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z + 1 },
            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z - 1 },

            { x: this.entity.location.x, y: this.entity.location.y + 1, z: this.entity.location.z },
            { x: this.entity.location.x, y: this.entity.location.y - 1, z: this.entity.location.z }
        ];

        for (const entityBlockLoc of entityBlockLocs) {
            const block = this.player.dimension.getBlock(entityBlockLoc);

            if (this.entity.typeId === "carry_throw:block" && (block.typeId === "minecraft:portal" || block.typeId === "minecraft:end_portal")) {
                playerDataManage({ Player: this.player, carryDelete: true });
                placeBlock(this.player, this.entity);
                continue
            }
        }
    }
}

export function entityCarrying() {
    for (const [playerId, entityId] of carryEntityData.entries()) {
        const player = world.getEntity(playerId);
        const entity = world.getEntity(entityId.id);

        player.addEffect("weakness", 7, { amplifier: 255, showParticles: false });

        const selectedSlot = player.selectedSlotIndex;
        const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
        const gamemode = player.getGameMode();

        if (player.isSprinting || player.isEmoting || mainHand || offHand || gamemode === "Spectator" || !entity || !entity?.isValid) {
            if (entity && entity.typeId === "carry_throw:block") placeBlock(player, entity)

            player.playSound(sounds.mobDropped, { volume: 1 });
            playerDataManage({ Player: player, Target: entity, carryDelete: true });
            return
        }

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

        entity.teleport(targetLoc, { facingLocation: targetFacingLocation });

        const manager = new EntityComponentManager(player, entity);

        manager.entityHealthShow();
        manager.suffocationBlock();
        manager.useEntityProperties();
        manager.blockDimensionCheck()
    }
}

export function powerCount({ Player, EventCancel } = {}) {
    if (EventCancel) { // Switch mantığı
        if (Player.isSneaking) return
        EventCancel.cancel = true;

        const data = carryEntityData.get(Player.id);

        if (data?.powerCount) data.powerCount = null
        else data.powerCount = true
        return
    }

    for (const [playerId] of carryEntityData.entries()) {
        const player = world.getEntity(playerId);

        const data = carryEntityData.get(player.id) ?? {};
        data.power = data.power ?? 0;

        if (data.powerCount && data.power < 10) {
            system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
            data.power = data.power + 1
        }

        if (data.power === 0) continue

        if (player.isSneaking) {
            data.power = null;
            data.powerCount = null;

            player.playSound(sounds.powerCanceled);
            continue
        }

        system.run(() => player.onScreenDisplay.setActionBar(`[ ${data.power}§f ]`))
    }
}

export function takeEntity(player, target, e) {
    const excludeTypes = excludeEntities.slice(1);

    if (
        carryEntityData.get(target.id)?.id === player.id || // Eğer target zaten oyuncuyu taşıyorsa
        world.getAllPlayers().find(p => carryEntityData.get(p.id)?.id === target.id) ||  // Bir oyuncu taşıyor veya
        excludeTypes.includes(target.typeId) || // Geçersiz listesinde veya
        player.isGliding || player.isEmoting || !player.isSneaking || // Gliding yapıyor, emoji kullanıyor veya eğilmiyorsa
        riderData.has(target.id) && target.typeId === "minecraft:player" // riderData'ya sahip ve oyuncu ise
    ) return // Bunlardan biri sağlanıyorsa geri dön

    e.cancel = true;

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    if (!mainHand && !offHand) {
        const targetHealth = target.getComponent("minecraft:health")?.currentValue.toFixed(1); // Küsarıtlı can çıkabileceği için toFixed ile düzeltiyorum

        carryEntityData.set(player.id, { id: target.id, typeId: target.typeId, health: targetHealth });

        const manager = new UnlockAbilityManager(player);
        manager.enderman();

        clearEntityRide(target);
        playerDataManage({ Player: player, Target: target });
        system.run(() => player.playSound(sounds.mobTake));
        return
    }

    system.run(() => {
        player.sendMessage({ rawtext: [{ text: "§c>> " }, { translate: texts.mobCarryWarn }] });
        player.playSound(sounds.mobCarryWarn)
    })
}

export function pushEntity(player, target, e) {
    const power = carryEntityData.get(player.id)?.power;
    e.cancel = true;

    playerDataManage({ Player: player, Target: target, carryDelete: true });
    placeBlock(player, target, e);

    if (power > 0) {
        const viewDirection = player.getViewDirection();
        const pushEntityLoc = { x: viewDirection.x * power, y: viewDirection.y * power, z: viewDirection.z * power };

        if (power > 2) pushEntityLoc.y = viewDirection.y * 2
        // Çok yukarı uçmasın diye kontrol   

        const Unlockmanager = new UnlockAbilityManager(player);
        const UseManager = new UseAbilityManager(player, viewDirection, power, target, pushEntityLoc);

        Unlockmanager.breeze();
        UseManager.loop();

        if (target.typeId !== "minecraft:player")
            target.applyImpulse(pushEntityLoc)

        else
            system.runTimeout(() => {
                if (target && target.isValid)
                    target.applyImpulse(pushEntityLoc)
            }, 3) // milisaniye bekletiyorum çünkü teleport çakışması oluyor

        player.playSound(sounds.mobPush);
        return
    }

    if (target.typeId !== "minecraft:player") addEntityRide({ Player: player, Target: target })
}