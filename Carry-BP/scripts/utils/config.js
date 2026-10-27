import { ActionFormData } from "@minecraft/server-ui";
import { world, system } from "@minecraft/server";

export const allowMobs = [
    "minecraft:iron_golem", // 0
    "minecraft:cow", // 1
    "minecraft:sheep", // 2
    "minecraft:chicken", // 3
    "minecraft:villager_v2", // 4
    "minecraft:cod", // 5
    "minecraft:cat", // 6
    "minecraft:wolf", // 7
    "minecraft:copper_golem", // 8
    "minecraft:pig", // 9
    "minecraft:horse", // 10
    "minecraft:axolotl", // 11
    "minecraft:llama", // 12
    "minecraft:armadillo", // 13
    "minecraft:camel", // 14
    "minecraft:trader_llama", // 15
    "minecraft:wandering_trader", // 16
    "minecraft:camel_husk", // 17
    "minecraft:bee", // 18
    "minecraft:sulfur_cube", // 19
    "minecraft:rabbit", // 20
    "minecraft:fox", // 21
    "minecraft:frog", // 22
    "minecraft:goat", // 23
    "minecraft:sniffer", // 24
    "minecraft:panda", // 25
    "minecraft:snow_golem", // 26
    "minecraft:ocelot", // 27
    "minecraft:donkey", // 28
    "minecraft:mooshroom", // 29
    "minecraft:mule", // 30
    "minecraft:parrot", // 31
    "minecraft:polar_bear", // 32
    "minecraft:turtle", // 33
];

export const neutralMobs = []

for (const mob of allowMobs) {
    const index = allowMobs.indexOf(mob);

    switch (index) {
        case 0:
        case 7:
        case 12:
        case 15:
        case 25:
        case 32:
            neutralMobs.push(mob);
    }
}

export const excludeMobs = [
    "minecraft:player",
    "minecraft:item",
    "minecraft:arrow",
]

export function addonTutorial(player) {
    system.run(() => {
        system.runTimeout(() => {
            const form = new ActionFormData();

            form.title({ rawtext: [{ text: "§l§a" }, { translate: "tutorial.form.title" }] })

            const playerPlatform = player.clientSystemInfo.platformType;

            switch (playerPlatform) {
                case "Desktop":
                    form.body({ rawtext: [{ text: "§l" }, { translate: "tutorial.form.body.desktop" }] });
                    form.label({ rawtext: [{ translate: "tutorial.form.label.desktop" }] });
                    break
                case "Mobile":
                    form.body({ rawtext: [{ text: "§l" }, { translate: "tutorial.form.body.mobile" }] });
                    form.label({ rawtext: [{ translate: "tutorial.form.label.mobile" }] });
                    break
                case "Console":
                    form.body({ rawtext: [{ text: "§l" }, { translate: "tutorial.form.body.console" }] });
                    form.label({ rawtext: [{ translate: "tutorial.form.label.console" }] });
                    break
            }
            form.button({ rawtext: [{ text: "§e" }, { translate: "tutorial.form.button" }] })

            form.show(player).then((reponse) => {
                if (reponse.canceled) return

                if (reponse.selection === 0) player.setDynamicProperty("dontShow_again", true)
            })
        }, 100)
    })
}