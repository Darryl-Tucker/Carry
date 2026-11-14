import { system, EntityDamageCause } from "@minecraft/server";

import { carryData } from "../mob/carry";
import { addMobRide } from "../utils/ride";

export const abilitiesData = new Map();

const texts = {
    unlockedBoomerang: "unlocked.boomerang",
    unlockedSkySpinner: "unlocked.skySpinner",
    unlockedEnderman: "unlocked.enderman",

    howToUnlockBoomerang: "howTounlock.boomerang",
    howToUnlockSkyspinner: "howTounlock.skySpinner",
    howToUnlockEnderman: "howTounlock.enderman"
};

const sounds = {
    unlockedAbility: "random.levelup",
};

export class UnlockAbilityManager {
    constructor(player, playerAbilitiesData) {
        this.player = player;
        this.carryData = carryData.get(this.player.id);
        this.abilitiesData = playerAbilitiesData
    }

    save() { abilitiesData.set(this.player, abilitiesData) }

    boomerang() {
        if (this.abilitiesData?.boomerang) return

        this.abilitiesData.AUS_boomerang = (this.abilitiesData.AUS_boomerang ?? -1) + 1;
        this.save();

        if (this.abilitiesData.AUS_boomerang === 15) {
            this.abilitiesData.boomerang = true;
            this.abilitiesData.AUS_boomerang = undefined;
            this.save();

            this.player.setDynamicProperty("boomerang", true);
            this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.unlockedBoomerang }] });
            system.run(() => this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 }))
        }
    }

    skySpinner() {
        if (this.abilitiesData?.skySpinner) return

        const rot = this.player.getRotation();
        if (rot.x <= -45) {
            this.abilitiesData.AUS_skySpinner = (this.abilitiesData.AUS_skySpinner ?? 0) + 1;
            this.save();
        }

        if (this.abilitiesData.AUS_skySpinner === 3) {
            this.abilitiesData.skySpinner = true;
            this.abilitiesData.AUS_skySpinner = undefined;
            this.save();

            this.player.setDynamicProperty("skySpinner", true);
            this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.unlockedSkySpinner }] });
            system.run(() => this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 }))
        }
    }

    enderman() {
        if (this.abilitiesData?.enderman) return

        if (this.carryData.typeId === "minecraft:enderman") {
            this.abilitiesData.enderman = true;
            this.save();
            this.player.setDynamicProperty("enderman", true);

            this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.unlockedEnderman }] });
            system.run(() => this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 }))
        }
    }
}


export class UseAbilityManager {
    constructor(player, viewDirection, target, targetLoc) {
        this.player = player;
        this.target = target;
        this.power = carryData.get(this.player.id)?.power;
        this.ab = abilitiesData.get(this.player.id);
        this.viewDirection = viewDirection;
        this.targetLoc = targetLoc
    }

    loop() {
        const runIntervalId = system.runInterval(() => {
            if (!this.target || !this.target.isValid) {
                system.clearRun(runIntervalId);
                return system.clearRun(runTimeOutId)
            }

            switch (this.ab?.abilityPage) {
                default: // normal
                    this.normal(runIntervalId, runTimeOutId)
                    break
                case 0: // boomerang
                    if (this.ab?.boomerang) this.boomerang()
                    break
                case 1: // Sky Spinner
                    if (this.ab?.skySpinner) this.skySpinner()
                    break
                case 2: // Enderman
                    if (this.ab?.enderman) system.clearRun(runIntervalId)
                    break
            }
        });

        const runTimeOutId = system.runTimeout(async () => {
            if (this.ab?.abilityPage === 0 && this.ab?.boomerang) {
                this.boomerang({ returnBom: true });
                await system.waitTicks(this.power)
            }

            else if (this.ab?.abilityPage === 2 && this.ab?.enderman) { this.enderman() }

            system.clearRun(runIntervalId);
        }, this.power)
    }

    normal(startRun, endRun) { addMobRide({ Player: this.player, Target: this.target, StartRun: startRun, EndRun: endRun }) }

    boomerang({ returnBom } = {}) {
        if (returnBom) return this.target.applyKnockback({ x: -this.targetLoc.x, z: -this.targetLoc.z }, 0.50)

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
}

export function abilityBar(player) {
    if (!player.isSneaking) return
    let ab = abilitiesData.get(player.id) ?? {};
    const maxAbility = 2;

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
        }
    });

    if (ab?.abilityPage > maxAbility) abilitiesData.set(player.id, { ...ab, abilityPage: undefined });
}