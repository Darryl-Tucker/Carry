/**
 * @license MIT
 * Copyright (c) 2026 DarrylTucker
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { system, EntityDamageCause } from "@minecraft/server";
import { carryEntityData } from "../entity/carry";
import { addEntityRide, clearEntityCarrier, clearEntityRide } from "../entity/ride";
import { excludeEntities, texts } from "../utils/db";

export const abilityData = new Map();

export class UnlockAbilityManager {
    constructor(player) {
        this.player = player;
        this.carryEntityData = carryEntityData.get(this.player.id);
        this.data = abilityData.get(this.player.id) ?? {};

        this.unlockedParticleLoc = {
            x: this.player.location.x,
            y: this.player.location.y + 1,
            z: this.player.location.z,
        }
    }

    unlockedAbilityMessage(unlockedAbilityText) {
        this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: unlockedAbilityText }] });
        this.player.dimension.spawnParticle("minecraft:totem_particle", this.unlockedParticleLoc);
        this.player.playSound("random.levelup", { volume: 1, pitch: 0.5 })
    }

    ghast(damageSource, hurtEntity) {
        if (this.data?.ghast || hurtEntity.typeId !== "minecraft:player") return

        if (
            damageSource.damagingProjectile?.typeId === "minecraft:arrow" && // Ok ise
            damageSource.damagingEntity.id === hurtEntity.id // Hasar veren ile hasar yiyen id'leri eşit ise
        ) {
            this.data.ghast = true;
            abilityData.set(this.player.id, this.data);

            this.player.setDynamicProperty("ghast", true);
            system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.ghast))
        }
    }

    breeze() {
        if (this.data?.breeze) return

        const rot = this.player.getRotation();
        if (rot.x <= -45) {
            this.data.AUS_breeze = (this.data.AUS_breeze ?? 0) + 1;
            abilityData.set(this.player.id, this.data);
        }

        if (this.data.AUS_breeze !== 3) return

        this.data.breeze = true;
        this.data.AUS_breeze = undefined;
        this.player.setDynamicProperty("breeze", true);


        system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.breeze))
    }

    enderman() {
        if (this.data?.enderman) return

        if (this.carryEntityData.typeId === "minecraft:enderman") {
            this.data.enderman = true;
            abilityData.set(this.player.id, this.data);

            this.player.setDynamicProperty("enderman", true);

            system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.enderman))
        }
    }

    creeper(e) {
        if (this.data?.creeper) return
        e.cancel = true;

        this.data.creeper = true;
        abilityData.set(this.player.id, this.data);

        this.player.setDynamicProperty("creeper", true);

        system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.creeper))
    }

    snowGolem(damageSource, hurtEntity) {
        if (this.data?.snowGolem) return

        if (damageSource.cause === "freezing" && carryEntityData.get(hurtEntity.id)?.typeId === "minecraft:snow_golem") {
            this.data.snowGolem = true;
            abilityData.set(this.player.id, this.data);

            this.player.setDynamicProperty("snowGolem", true);

            system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.snowGolem))
        }
    }

    blaze(damageSource) {
        if (this.data?.blaze) return

        if (damageSource.damagingEntity?.typeId === "minecraft:blaze" && damageSource.cause === "projectile") {
            this.data.blaze = true;
            abilityData.set(this.player.id, this.data);

            this.player.setDynamicProperty("blaze", true);

            system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.blaze))
        }
    }

    warden(damageSource) {
        if (this.data?.warden) return

        if (damageSource.cause === "drowning") {
            this.data.warden = true;
            abilityData.set(this.player.id, this.data);

            this.player.setDynamicProperty("warden", true);

            system.run(() => this.unlockedAbilityMessage(texts.unlockedAbilities.warden))
        }
    }
}


export class UseAbilityManager {
    constructor(player, viewDirection, power, target, pushEntityLoc) {
        this.target = target;
        this.targetData = new Map();

        this.player = player;
        this.ab = abilityData.get(this.player.id);
        this.viewDirection = viewDirection;
        this.power = power;

        this.pushEntityLoc = pushEntityLoc;
        this.entities = null;
        this.excludeTypes = excludeEntities.slice(1)
    }

    loop() {
        const runIntervalId = system.runInterval(() => {
            if (!this.target || !this.target?.isValid) {
                system.clearRun(runIntervalId);
                system.clearRun(runTimeOutId);
                return
            }

            if (this.ab?.abilityPage !== undefined || this.ab?.abilityPage !== 2 || this.ab?.abilityPage !== 3)
                this.entities = this.target.dimension.getEntities({
                    location: this.target.location, maxDistance: 1.70, excludeTypes: this.excludeTypes
                }).filter(m => m.id !== this.target.id && m.id !== this.player.id)

            switch (this.ab?.abilityPage) {
                default: // normal
                    this.normal(runIntervalId, runTimeOutId)
                    break

                case 0: // Boomerang
                    if (this.ab?.ghast) this.ghast()
                    break

                case 1: // Sky Spinner
                    if (this.ab?.breeze) this.breeze(runIntervalId, runTimeOutId)
                    break

                case 2: // Enderman
                    if (this.ab?.enderman) system.clearRun(runIntervalId)
                    break

                case 3: // Creeper
                    if (this.ab?.creeper) system.clearRun(runIntervalId)
                    break

                case 4: // Snow Golem
                    if (this.ab?.snowGolem) this.snowGolem()
                    break

                case 5: // Blaze
                    if (this.ab?.blaze) this.blaze()
                    break

                case 6: // Warden
                    if (this.ab?.warden) this.warden()
                    break
            }
        });

        //----------------------------------------------------------

        const runTimeOutId = system.runTimeout(async () => {
            if (!this.target || !this.target?.isValid) {
                system.clearRun(runTimeOutId);
                return
            }

            switch (this.ab?.abilityPage) {
                case 0: // Boomerang
                    if (this.ab?.ghast) {
                        this.ghast(true);
                        await system.waitTicks(this.power)
                    }
                    break

                case 2: // Enderman
                    if (this.ab?.enderman) this.enderman()
                    break

                case 3: // Creeper
                    if (this.ab?.creeper) this.creeper()
                    break

                case 6: // Warden
                    if (this.ab?.warden) this.warden(true)
                    break
            }

            system.clearRun(runIntervalId)
        }, this.power + 5);

    }

    normal(startRun, endRun) {
        if (this.target.typeId !== "minecraft:player")
            addEntityRide({ Player: this.player, Target: this.target, StartRun: startRun, EndRun: endRun })
    }

    ghast(returnBom = null) {
        if (returnBom) {
            this.target.applyImpulse({ x: -this.pushEntityLoc.x, y: 0.50, z: -this.pushEntityLoc.z })
            return
        }

        for (const entity of this.entities) {
            entity.applyDamage(4, {
                cause: EntityDamageCause.entityAttack,
                damagingEntity: this.player
            })
        }
    }

    breeze(startRun, endRun) {
        for (const mob of this.entities) {
            mob.applyImpulse({ x: this.viewDirection.x, y: this.power - 2, z: this.viewDirection.z + 2 });

            this.target.dimension.spawnParticle("minecraft:wind_explosion_emitter", this.target.location);
            this.target.dimension.playSound("wind_charge.burst", this.target.location);

            system.clearRun(startRun);
            system.clearRun(endRun)
            break
        }
    }

    async enderman() {
        this.player.teleport(this.target.location);
        await system.waitTicks(3);
        this.player.playSound("mob.endermen.portal", { pitch: 1.2 })
    }

    creeper() {
        const explodeLoc = this.target.location;
        this.player.addEffect("resistance", 20, { amplifier: 255, showParticles: false });

        if (this.target.typeId !== "minecraft:player") this.target.remove()

        try {
            this.player.dimension.createExplosion(explodeLoc, 1, {
                causesFire: false,
                breaksBlocks: true,
            })
        }
        catch { }
    }

    snowGolem() {
        this.target.dimension.spawnParticle("minecraft:cauldron_explosion_emitter", this.target.location);
        this.target.addEffect("fire_resistance", 20, { amplifier: 255, showParticles: false });

        const iceLocs = [
            { x: this.target.location.x, y: this.target.location.y, z: this.target.location.z },
            { x: this.target.location.x + 1, y: this.target.location.y, z: this.target.location.z },
            { x: this.target.location.x, y: this.target.location.y, z: this.target.location.z + 1 },

            { x: this.target.location.x, y: this.target.location.y + 1, z: this.target.location.z },
            { x: this.target.location.x + 1, y: this.target.location.y + 1, z: this.target.location.z },
            { x: this.target.location.x, y: this.target.location.y + 1, z: this.target.location.z + 1 },
        ];

        for (const iceLoc of iceLocs) {
            if (iceLocs.y > 319 || iceLocs.y < -63) return
            const block = this.target.dimension.getBlock(iceLoc);

            if (block?.typeId === "minecraft:fire") block.setType("minecraft:air")
        }

        for (const entity of this.entities) {
            entity.addEffect("freezing", 500, { amplifier: 1 });
            entity.addEffect("slowness", 30, { amplifier: 255, showParticles: true })
        }
    }

    blaze() {
        this.target.addEffect("fire_resistance", 500, { amplifier: 255, showParticles: false });

        const fireLocs = [
            { x: this.target.location.x, y: this.target.location.y, z: this.target.location.z },
            { x: this.target.location.x + 1, y: this.target.location.y + 1, z: this.target.location.z + 1 },
        ];

        for (const fireLoc of fireLocs) {
            if (fireLoc.y > 319 || fireLoc.y < -63) return
            const block = this.target.dimension.getBlock(fireLoc);

            if (block?.typeId === "minecraft:air") block.setType("minecraft:fire")
        }

        for (let i = 0; i < 3; i++)
            this.target.dimension.spawnParticle("minecraft:mobflame_single", this.target.location)

        for (const entity of this.entities) entity.setOnFire(5)
    }

    warden(destroyed = null) {
        if (destroyed) {
            const target = this.player.dimension.getEntities().find(t => this.targetData.get("destroying")?.id === t.id);
            if (!target) return

            if (target.typeId === "minecraft:player") {
                target.addEffect("invisibility", 100, { showParticles: false });
                target.kill()
            }
            else {
                clearEntityCarrier(target);
                clearEntityRide(target);
                target.remove()
            }
            return
        }

        if (!this.targetData.has("destroying")) {
            for (const doomed of this.entities) {
                doomed.dimension.spawnParticle("minecraft:warden_dig", { x: doomed.location.x, y: doomed.location.y + 0.50, z: doomed.location.z });
                this.targetData.set("destroying", { id: doomed.id });
                break
            }
        }

        else
            for (const entity of this.player.dimension.getEntities().filter(e => this.target.id !== e.id))
                entity.teleport(entity.location)
    }
}

export function abilityBar(player, e) {
    if (!player.isSneaking) return
    e.cancel = true;

    const ab = abilityData.get(player.id) ?? {};
    const maxAbility = 6;

    ab.abilityPage = (ab?.abilityPage ?? -1) + 1;
    abilityData.set(player.id, ab);

    system.run(() => {
        switch (ab?.abilityPage) {
            default: player.sendMessage(">> Normal"); break

            case 0:
                if (!ab?.ghast) player.sendMessage({ rawtext: [{ text: ">> Ghast -->§c " }, { translate: texts.howToUnlockAbilities.ghast }] })
                else player.sendMessage(">> Ghast")
                break

            case 1:
                if (!ab?.breeze) player.sendMessage({ rawtext: [{ text: ">> Breeze -->§c " }, { translate: texts.howToUnlockAbilities.breeze }] })
                else player.sendMessage(">> Breeze")
                break

            case 2:
                if (!ab?.enderman) player.sendMessage({ rawtext: [{ text: ">> §dEnderman §r-->§c " }, { translate: texts.howToUnlockAbilities.enderman }] })
                else player.sendMessage(">> §dEnderman")
                break

            case 3:
                if (!ab?.creeper) player.sendMessage({ rawtext: [{ text: ">> §2Creeper §r-->§c " }, { translate: texts.howToUnlockAbilities.creeper }] })
                else player.sendMessage(">> §2Creeper")
                break

            case 4:
                if (!ab?.snowGolem) player.sendMessage({ rawtext: [{ text: ">> Snow Golem -->§c " }, { translate: texts.howToUnlockAbilities.snowGolem }] })
                else player.sendMessage(">> Snow Golem")
                break

            case 5:
                if (!ab?.blaze) player.sendMessage({ rawtext: [{ text: ">> §6Blaze §r-->§c " }, { translate: texts.howToUnlockAbilities.blaze }] })
                else player.sendMessage(">> §6Blaze")
                break

            case 6:
                if (!ab?.warden) player.sendMessage({ rawtext: [{ text: ">> §0Warden §r-->§c " }, { translate: texts.howToUnlockAbilities.warden }] })
                else player.sendMessage(">> §0Warden")
                break
        }
    });

    if (ab?.abilityPage > maxAbility) ab.abilityPage = undefined
}