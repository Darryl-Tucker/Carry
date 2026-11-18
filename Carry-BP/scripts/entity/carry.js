import { world, system, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";
import { UnlockAbilityManager, UseAbilityManager } from "../player/ability";
import { playerDataManage } from "../player/data";
import { allowEntities, excludeBlocks } from "../utils/config";
import { addEntityRide, clearEntityRide, riderData } from "../utils/ride";

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
        const distance = 0.50;

        const blockLocs = [
            { x: this.entity.location.x + distance, y: this.entity.location.y, z: this.entity.location.z },
            { x: this.entity.location.x - distance, y: this.entity.location.y, z: this.entity.location.z },

            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z + distance },
            { x: this.entity.location.x, y: this.entity.location.y, z: this.entity.location.z - distance }
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
        const mobData = allowEntities.find(mob => mob.typeId === this.entity.typeId);

        if (mobData.climbing) {
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

                if (this.rot.x <= -45) this.player.addEffect("levitation", 20, { amplifier: mobData.amplifier, showParticles: false });
            }
        }

        if (mobData.effect) {
            if (mobData.effect === "levitation") {
                if (this.rot.x >= -45) return

                this.player.addEffect(mobData.effect, 3, { amplifier: mobData.amplifier, showParticles: false });
                this.player.addEffect("slow_falling", 40, { amplifier: 1, showParticles: false })
                return
            }

            if (mobData.effect === "slowness") {
                if (!this.entity.getComponent("minecraft:is_baby")) // Bebek hali değilse efektleri uygula
                    this.player.addEffect(mobData.effect, 3, { amplifier: mobData.amplifier, showParticles: false })

                return
            }
            this.player.addEffect(mobData.effect, 50, { amplifier: mobData.amplifier, showParticles: false })
        }
    }
}

export function entityCarrying() {
    for (const player of world.getAllPlayers().filter(p => carryEntityData.has(p.id))) {
        player.addEffect("weakness", 7, { amplifier: 255, showParticles: false });

        const selectedSlot = player.selectedSlotIndex;
        const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
        const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
        const gamemode = player.getGameMode();
        const cd = carryEntityData.get(player.id);

        const entity = player.dimension.getEntities({ location: player.location }).find(e => cd?.id === e.id);

        if (player.isSprinting || player.isJumping || player.isEmoting || mainHand || offHand || gamemode === "Spectator" || !entity || !entity?.isValid) {
            if (entity && entity.typeId !== "minecraft:player") addEntityRide({ Player: player, Target: entity })
            // Bindirme işlemi sadece oyuncu olmayanlar için geçerli

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
    }
}

export function powerCount({ Player, Target, EventCancel } = {}) {
    if (EventCancel) { // Switch mantığı
        if (Player.isSneaking) return
        EventCancel.cancel = true; // Non-mob entity'nin üstüne veya container'ı açmamak için event'i iptal ediyorum

        const data = carryEntityData.get(Player.id);

        if (data?.powerCount) data.powerCount = null
        else data.powerCount = true
        return
    }

    for (const player of world.getAllPlayers().filter(p => carryEntityData.has(p.id))) {
        const data = carryEntityData.get(player.id) ?? {};
        data.power = data.power ?? 0;

        if (data.powerCount && data.power < 10) {
            system.run(() => player.playSound(sounds.powerCount, { pitch: 2 }));
            data.power = data.power + 1
        }

        if (data.power === 0) return

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
    if (
        carryEntityData.get(target.id)?.id === player.id || // Eğer target zaten oyuncuyu taşıyorsa
        world.getAllPlayers().find(p => carryEntityData.get(p.id)?.id === target.id) ||  // Bir oyuncu taşıyor veya
        !allowEntities.find(m => target.typeId === m.typeId) || // Geçerli listesinden değil veya
        player.isGliding || player.isJumping || player.isEmoting || !player.isSneaking || // Gliding yapıyor, emoji kullanıyor, zıplıyorsa veya eğilmiyorsa
        riderData.has(target.id) && target.typeId === "minecraft:player" // riderData'ya sahip ve oyuncu ise
    ) return // Bunlardan biri sağlanıyorsa geri dön

    e.cancel = true;

    const selectedSlot = player.selectedSlotIndex;
    const mainHand = player.getComponent("minecraft:inventory").container.getItem(selectedSlot);
    const offHand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);

    if (!mainHand && !offHand) {
        const targetHealth = target.getComponent("minecraft:health")?.currentValue.toFixed(1); // Küsarıtlı can çıkabileceği için toFixed ile düzeltiyorum

        carryEntityData.set(player.id, { id: target.id, typeId: target.typeId, carry: true, health: targetHealth });

        const manager = new UnlockAbilityManager(player);
        manager.enderman();

        clearEntityRide({ Entity: target });
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
            }, 1.50) // milisaniye bekletiyorum çünkü teleport çakışması oluyor

        player.playSound(sounds.mobPush)
    }

    else if (target?.typeId !== "minecraft:player") addEntityRide({ Player: player, Target: target })
}