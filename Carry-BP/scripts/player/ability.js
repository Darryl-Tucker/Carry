import { system, EntityDamageCause } from "@minecraft/server";
import { carryEntityData } from "../entity/carry";
import { addEntityRide } from "../utils/ride";

export const abilitiesData = new Map();

const texts = {
    unlockedBoomerang: "unlocked.boomerang",
    unlockedSkySpinner: "unlocked.skySpinner",
    unlockedEnderman: "unlocked.enderman",
    unlockedCreeper: "unlocked.creeper",

    howToUnlockBoomerang: "howTounlock.boomerang",
    howToUnlockSkyspinner: "howTounlock.skySpinner",
    howToUnlockEnderman: "howTounlock.enderman",
    howToUnlockCreeper: "howTounlock.creeper"
};

const sounds = {
    unlockedAbility: "random.levelup",
};

export class UnlockAbilityManager {
    constructor(player) {
        this.player = player;
        this.carryEntityData = carryEntityData.get(this.player.id);
        this.data = abilitiesData.get(this.player.id) ?? {};

        this.unlockedParticleLoc = {
            x: this.player.location.x,
            y: this.player.location.y + 1,
            z: this.player.location.z,
        }
    }

    unlockedAbilityMessage(unlockedAbilityText) {
        this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: unlockedAbilityText }] });
        this.player.dimension.spawnParticle("minecraft:totem_particle", this.unlockedParticleLoc);
        this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 })
    }

    boomerang(damageSource, hurtEntity) {
        if (this.data?.boomerang || hurtEntity.typeId !== "minecraft:player") return

        if (
            damageSource.cause !== "projectile" && // Projectile değil ise
            damageSource.damagingProjectile?.typeId !== "minecraft:arrow" && // Ok değil ise
            damageSource.damagingEntity?.id !== hurtEntity.id // Hasar veren ile hasar yiyen id'leri eşit değil ise
        ) return

        this.data.boomerang = true;
        abilitiesData.set(this.player.id, this.data);

        this.player.setDynamicProperty("boomerang", true);
        system.run(() => this.unlockedAbilityMessage(texts.unlockedBoomerang))
    }

    skySpinner() {
        if (this.data?.skySpinner) return

        const rot = this.player.getRotation();
        if (rot.x <= -45) {
            this.data.AUS_skySpinner = (this.data.AUS_skySpinner ?? 0) + 1;
            abilitiesData.set(this.player.id, this.data);
        }

        if (this.data.AUS_skySpinner !== 3) return

        this.data.skySpinner = true;
        this.data.AUS_skySpinner = undefined;

        system.run(() => this.unlockedAbilityMessage(texts.unlockedSkySpinner))
    }

    enderman() {
        if (this.data?.enderman) return

        if (this.carryEntityData.typeId !== "minecraft:enderman") return
        this.data.enderman = true;
        abilitiesData.set(this.player.id, this.data);

        this.player.setDynamicProperty("enderman", true);

        system.run(() => this.unlockedAbilityMessage(texts.unlockedEnderman))
    }

    creeper(e) {
        if (this.data?.creeper) return
        e.cancel = true;

        this.data.creeper = true;
        abilitiesData.set(this.player.id, this.data);

        this.player.setDynamicProperty("creeper", true);

        system.run(() => this.unlockedAbilityMessage(texts.unlockedCreeper))
    }
}


export class UseAbilityManager {
    constructor(player, viewDirection, target, targetLoc) {
        this.player = player;
        this.target = target;
        this.power = carryEntityData.get(this.player.id)?.power;
        this.ab = abilitiesData.get(this.player.id);
        this.viewDirection = viewDirection;
        this.targetLoc = targetLoc
    }

    loop() {
        const runIntervalId = system.runInterval(() => {
            if (!this.target || !this.target.isValid) {
                system.clearRun(runIntervalId);
                system.clearRun(runTimeOutId);
                return
            }

            switch (this.ab?.abilityPage) {
                default: // normal
                    this.normal(runIntervalId, runTimeOutId)
                    break
                case 0: // Boomerang
                    if (this.ab?.boomerang) this.boomerang()
                    break
                case 1: // Sky Spinner
                    if (this.ab?.skySpinner) this.skySpinner()
                    break
                case 2: // Enderman
                    if (this.ab?.enderman) system.clearRun(runIntervalId)
                    break
                case 3: // Boom
                    if (this.ab?.creeper) system.clearRun(runIntervalId)
                    break
            }
        });

        const runTimeOutId = system.runTimeout(async () => {
            switch (this.ab?.abilityPage) {
                case 0:
                    if (this.ab?.boomerang) {
                        this.boomerang({ returnBom: true });
                        await system.waitTicks(this.power)
                    } // Boomerang 
                    break

                case 2:
                    if (this.ab?.enderman) this.enderman()
                    break // Enderman
                case 3:
                    if (this.ab?.creeper) this.creeper()
                    break // Creeper
            }
            system.clearRun(runIntervalId);
        }, this.power)
    }

    normal(startRun, endRun) {
        if (this.target.typeId !== "minecraft:player")
            addEntityRide({ Player: this.player, Target: this.target, StartRun: startRun, EndRun: endRun })
    }

    boomerang({ returnBom } = {}) {
        if (returnBom) {
            this.target.applyKnockback({ x: -this.targetLoc.x, z: -this.targetLoc.z }, 0.50);
            return
        }

        const mobs = this.target.dimension.getEntities({
            location: this.target.location,
            maxDistance: 1.70,
            excludeTypes: ["minecraft:item"]
        }).filter(m => m.id !== this.target.id && m.id !== this.player.id);

        for (const mob of mobs) {
            mob.applyDamage(4, {
                cause: EntityDamageCause.entityAttack,
                damagingEntity: this.player
            })
        }
    }

    skySpinner() {
        const oMobs = this.target.dimension.getEntities({
            location: this.target.location,
            maxDistance: 1.20,
        }).find(o => o.id !== this.player.id && o.id !== this.target.id);

        if (oMobs) system.run(() => oMobs.applyImpulse({ x: this.viewDirection.x, y: this.power - 7, z: this.viewDirection.z + 2 }))
    }

    async enderman() {
        this.player.teleport(this.target.location);
        await system.waitTicks(3);
        this.player.playSound("mob.endermen.portal", { pitch: 1.2 })
    }

    creeper() {
        const explodeLoc = this.target.location;
        system.runTimeout(() =>
            this.player.dimension.createExplosion(explodeLoc, 3, {
                causesFire: true,
                breaksBlocks: false,
            }), 2);

        this.target.teleport(this.player.location)
    }
}

export function abilityBar(player, e) {
    if (!player.isSneaking) return
    e.cancel = true;

    const ab = abilitiesData.get(player.id) ?? {};
    const maxAbility = 3;

    ab.abilityPage = (ab?.abilityPage ?? -1) + 1;
    abilitiesData.set(player.id, ab);

    system.run(() => {
        switch (ab?.abilityPage) {
            default: player.sendMessage(">> Normal"); break

            case 0:
                player.sendMessage({ rawtext: [{ text: ">> " }, { translate: "name.boomerang" }] });
                if (!ab?.boomerang) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howToUnlockBoomerang }] });
                break

            case 1:
                player.sendMessage({ rawtext: [{ text: ">> " }, { translate: "name.skySpinner" }] });
                if (!ab?.skySpinner) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howToUnlockSkyspinner }] });
                break
            case 2:
                player.sendMessage(">> Enderman");
                if (!ab?.enderman) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howToUnlockEnderman }] });
                break
            case 3:
                player.sendMessage(">> Creeper");
                if (!ab?.creeper) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howToUnlockCreeper }] });
                break
        }
    });

    if (ab?.abilityPage > maxAbility) abilitiesData.set(player.id, { ...ab, abilityPage: undefined });
}