import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { abilitiesData } from "../player/ability";
import { riderData } from "../entity/ride";

export function addonTutorial(player) {
    system.runTimeout(() => {
        if (player.getDynamicProperty("ver1")) return

        const versions = ["dontShow_again", "ver0"];
        for (const ver of versions) player.setDynamicProperty(ver, undefined)

        const form = new ActionFormData();

        form.title({ rawtext: [{ text: "§l§a" }, { translate: "tutorial.form.title" }] })

        form.body({ rawtext: [{ text: "§l" }, { translate: "tutorial.form.body" }] });
        form.label({ rawtext: [{ translate: "tutorial.form.label" }] });

        form.button({ rawtext: [{ text: "§e" }, { translate: "tutorial.form.button" }] })

        form.show(player).then(reponse => {
            if (reponse.canceled) return

            if (reponse.selection === 0) player.setDynamicProperty("ver1", true)
        })
    }, 100)
}

export function DiskToRAM({ Player, WorldLoadEvent }) {
    if (WorldLoadEvent) {
        const findCarrier = world.getAllPlayers().find(p => Player.getDynamicProperty("ride") === p.id);
        if (findCarrier) riderData.set(Player.id, { id: findCarrier.id, level: 1 })
    }

    const ab = abilitiesData.get(Player.id) ?? {};

    const abilities = [
        "ghast",
        "breeze",
        "enderman",
        "creeper",
        "snowGolem",
        "blaze",
        "warden"
    ];

    for (const ability of abilities.filter(a => Player.getDynamicProperty(a))) ab[ability] = true
    abilitiesData.set(Player.id, ab)
}