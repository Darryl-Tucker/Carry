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
        if (this.data?.boomerang) return

        this.data.AUS_boomerang = (this.data.AUS_boomerang ?? -1) + 1;
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
        }

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

export function abilityBar(player) {
    if (!player.isSneaking) return
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

export function useAbility({ Player, Target, TargetLoc, BomBack, ViewDirection, Power }) {
    const ab = abilitiesData.get(Player.id);

    switch (ab?.abilityPage) {
        case 0: // boomerang
            if (ab?.boomerang) {
                if (BomBack) return Target.applyKnockback({ x: -TargetLoc.x, z: -TargetLoc.z }, 0.50);

                const mobs = Target.dimension.getEntities({
                    location: Target.location,
                    maxDistance: 1.70,
                    excludeTypes: ["minecraft:item"]
                }).filter(m => m.id !== Target.id && m.id !== Player.id);

                for (const mob of mobs) {
                    mob.applyDamage(4, {
                        cause: EntityDamageCause.entityAttack,
                        damagingEntity: Player
                    })
                }
                break
            }
        case 1: // Sky Spinner
            if (!ViewDirection) return

            if (ab?.skySpinner) {
                const oMobs = Target.dimension.getEntities({
                    location: Target.location,
                    maxDistance: 1.20,
                }).find(o => o.id !== Player.id && o.id !== Target.id);

                if (oMobs) {
                    system.run(() => oMobs.applyImpulse({ x: ViewDirection.x, y: Power - 7, z: ViewDirection.z + 2 })); // Oyuncuyu fırlat
                }
            }
    }
}