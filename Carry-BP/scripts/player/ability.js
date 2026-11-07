import { system, EntityDamageCause } from "@minecraft/server";

export const abilitiesData = new Map();

const texts = {
    unlockedboomerang: "unlocked.boomerang",
    unlockedSkySpinner: "unlocked.skySpinner",

    howTounlock_boomerang: "howTounlock.boomerang",
    howTounlock_skySpinner: "howTounlock.skySpinner"
};

const sounds = {
    unlockedAbility: "random.levelup",
};

export class abilityManager {
    constructor(player, abilitiesData) {
        this.player = player;
        this.abilitiesData = abilitiesData;
        this.data = this.abilitiesData.get(this.player.id) ?? {}
    }

    save() { this.abilitiesData.set(this.player.id, this.data) }

    progressBoomerang() {
        if (this.data?.boomerang) return;

        this.data.AUS_boomerang = (this.data.AUS_boomerang ?? 0) + 1;
        this.save();

        if (this.data.AUS_boomerang === 15) {
            this.data.boomerang = true;
            this.data.AUS_boomerang = undefined;
            this.save();

            this.player.setDynamicProperty("boomerang", true);
            this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.unlockedboomerang }] });
            system.run(() => this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 }))
        }
    }

    progressSkySpinner() {
        if (this.data?.skySpinner) return;

        const rot = this.player.getRotation();
        if (rot.x <= -45) {
            this.data.AUS_skySpinner = (this.data.AUS_skySpinner ?? 0) + 1;
            this.save();

            if (this.data.AUS_skySpinner === 3) {
                this.data.skySpinner = true;
                this.data.AUS_skySpinner = undefined;
                this.save();

                this.player.setDynamicProperty("skySpinner", true);
                this.player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.unlockedSkySpinner }] });
                system.run(() => this.player.playSound(sounds.unlockedAbility, { volume: 1, pitch: 0.5 }))
            }
        }
    }
}

export function abilityBar(player) {
    let ab = abilitiesData.get(player.id);
    const maxAbility = 1;

    abilitiesData.set(player.id, { ...ab, abilityPage: (ab?.abilityPage ?? -1) + 1 });

    ab = abilitiesData.get(player.id);

    system.run(() => {
        switch (ab?.abilityPage) {
            default: player.onScreenDisplay.setActionBar("[ Normal ]"); break

            case 0:
                player.onScreenDisplay.setActionBar({ rawtext: [{ text: "[ " }, { translate: "boomerang" }, { text: " ]" }] });
                if (!ab?.boomerang) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howTounlock_boomerang }] });
                break

            case 1:
                player.onScreenDisplay.setActionBar({ rawtext: [{ text: "[ " }, { translate: "skySpinner" }, { text: " ]" }] });
                if (!ab?.skySpinner) player.sendMessage({ rawtext: [{ text: ">>§a " }, { translate: texts.howTounlock_skySpinner }] });
                break
        }
    });

    if (ab?.abilityPage > maxAbility) abilitiesData.set(player.id, { ...ab, abilityPage: undefined });
}

export function useAbility({ player, target, targetLoc, back, viewDirection, power }) {
    const ab = abilitiesData.get(player.id);

    switch (ab?.abilityPage) {
        case 0: // boomerang
            if (ab?.boomerang) {
                if (back) return target.applyKnockback({ x: -targetLoc.x, z: -targetLoc.z }, 0.50);

                const mobs = target.dimension.getEntities({
                    location: target.location,
                    maxDistance: 1.70,

                }).filter(m => m.id !== target.id && m.id !== player.id);

                for (const mob of mobs) {
                    mob.applyDamage(4, {
                        cause: EntityDamageCause.entityAttack,
                        damagingEntity: player
                    })
                }
                break 
            }
        case 1: // Sky Spinner
            if (!viewDirection) return

            if (ab?.skySpinner) {
                const oMobs = target.dimension.getEntities({
                    location: target.location,
                    maxDistance: 1.20,
                }).find(o => o.id !== player.id && o.id !== target.id);

                if (oMobs) {
                    system.run(() => oMobs.applyImpulse({ x: viewDirection.x, y: power - 7, z: viewDirection.z + 2 })); // Oyuncuyu fırlat
                }
            }
    }
}