import { ActionFormData } from "@minecraft/server-ui";
import { world, system } from "@minecraft/server";
import { abilitiesData } from "../player/ability";
import { riderData } from "./ride";

export const allowEntities = [
    // -------------------------------------------------------------- No property

    { typeId: "minecraft:cod" },
    { typeId: "minecraft:cat" },
    { typeId: "minecraft:strider" },
    { typeId: "minecraft:squid" },
    { typeId: "minecraft:glow_squid" },
    { typeId: "minecraft:tadpole" },
    { typeId: "minecraft:ocelot" },
    { typeId: "minecraft:sulfur_cube" },
    { typeId: "minecraft:rabbit" },
    { typeId: "minecraft:fox" },
    { typeId: "minecraft:frog" },
    { typeId: "minecraft:minecart" },
    { typeId: "minecraft:chest_minecart" },
    { typeId: "minecraft:hopper_minecart" },
    { typeId: "minecraft:tnt_minecart" },
    { typeId: "minecraft:command_block_minecart" },
    { typeId: "minecraft:boat" },
    { typeId: "minecraft:chest_boat" },
    { typeId: "minecraft:armor_stand" },

    // -------------------------------------------------------------- No property

    // -------------------------------------------------------------- Slow falling
    { typeId: "minecraft:chicken", effect: "slow_falling", amplifier: 2 },
    // -------------------------------------------------------------- Slow falling

    // -------------------------------------------------------------- Oozing
    { typeId: "minecraft:slime", effect: "oozing", amplifier: 2 },
    // -------------------------------------------------------------- Oozing

    // -------------------------------------------------------------- Levitation
    { typeId: "minecraft:bat", effect: "levitation", amplifier: 1 },
    { typeId: "minecraft:allay", effect: "levitation", amplifier: 1 },
    { typeId: "minecraft:parrot", effect: "levitation", amplifier: 1 },
    // -------------------------------------------------------------- Levitation

    // -------------------------------------------------------------- Levitation

    // -------------------------------------------------------------- Regeneration

    { typeId: "minecraft:axolotl", effect: "regeneration", amplifier: 0 },

    // -------------------------------------------------------------- Regeneration

    // -------------------------------------------------------------- Slowness
    { typeId: "minecraft:cow", effect: "slowness", amplifier: 1 },
    { typeId: "minecraft:sheep", effect: "slowness", amplifier: 1 },
    { typeId: "minecraft:villager_v2", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:copper_golem", effect: "slowness", amplifier: 4 },
    { typeId: "minecraft:pig", effect: "slowness", amplifier: 1 },
    { typeId: "minecraft:horse", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:armadillo" },
    { typeId: "minecraft:camel", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:wandering_trader", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:camel_husk", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:goat", effect: "slowness", amplifier: 1 },
    { typeId: "minecraft:sniffer", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:snow_golem", effect: "freezing", amplifier: 2 },
    { typeId: "minecraft:donkey", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:mooshroom", effect: "slowness", amplifier: 1 },
    { typeId: "minecraft:mule", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:turtle", effect: "slowness", amplifier: 4 },
    { typeId: "minecraft:player", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:nautilus", effect: "slowness", amplifier: 3 },
    { typeId: "minecraft:llama", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:polar_bear", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:panda", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:enderman", effect: "slowness", amplifier: 3 },
    { typeId: "minecraft:piglin", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:zombie_pigman", effect: "slowness", amplifier: 2 },
    { typeId: "minecraft:bee", effect: "levitation", amplifier: 1 },
    { typeId: "minecraft:iron_golem", effect: "slowness", amplifier: 5 },
    { typeId: "minecraft:wolf" },
    { typeId: "minecraft:dolphin" },
    { typeId: "minecraft:trader_llama", effect: "slowness", amplifier: 2 },
    // -------------------------------------------------------------- Slowness

    // -------------------------------------------------------------- Climbing

    { typeId: "minecraft:spider", effect: "slowness", amplifier: 3, climbing: true },

    // -------------------------------------------------------------- Climbing

    // -------------------------------------------------------------- Monsters
    { typeId: "minecraft:creeper" },
    // -------------------------------------------------------------- Monsters
];

export const excludeEntities = [
    "minecraft:player",
    "minecraft:item",
    "minecraft:arrow",
    "minecraft:xp_orb",
    "minecraft:minecart",
    "minecraft:command_block_minecart",
    "minecraft:hopper_minecart",
    "minecraft:tnt_minecart",
    "minecraft:chest_minecart",
    "minecraft:boat",
    "minecraft:chest_boat",
    "wind_charge_projectile"
];

export const excludeBlocks = new Set([
    "minecraft:air",
    "minecraft:structure_void",
    "minecraft:light_block",
    "minecraft:water",
    "minecraft:flowing_water",
    "minecraft:lava",
    "minecraft:flowing_lava",
    "minecraft:bubble_column",
    "minecraft:short_grass",
    "minecraft:tall_grass",
    "minecraft:fern",
    "minecraft:large_fern",
    "minecraft:deadbush",
    "minecraft:firefly_bush",
    "minecraft:leaf_litter",
    "minecraft:reeds",
    "minecraft:short_dry_grass",
    "minecraft:tall_dry_grass",
    "minecraft:dandelion",
    "minecraft:poppy",
    "minecraft:blue_orchid",
    "minecraft:allium",
    "minecraft:azure_bluet",
    "minecraft:red_tulip",
    "minecraft:orange_tulip",
    "minecraft:white_tulip",
    "minecraft:pink_tulip",
    "minecraft:oxeye_daisy",
    "minecraft:cornflower",
    "minecraft:lily_of_the_valley",
    "minecraft:wither_rose",
    "minecraft:wildflowers",
    "minecraft:sunflower",
    "minecraft:lilac",
    "minecraft:rose_bush",
    "minecraft:peony",
    "minecraft:wheat",
    "minecraft:potatoes",
    "minecraft:carrots",
    "minecraft:melon_stem",
    "minecraft:pumpkin_stem",
    "minecraft:torchflower",
    "minecraft:torchflower_crop",
    "minecraft:pitcher_plant",
    "minecraft:pitcher_crop",
    "minecraft:sweet_berry_bush",
    "minecraft:cocoa",
    "minecraft:oak_sapling",
    "minecraft:spruce_sapling",
    "minecraft:birch_sapling",
    "minecraft:jungle_sapling",
    "minecraft:acacia_sapling",
    "minecraft:dark_oak_sapling",
    "minecraft:mangrove_propagule",
    "minecraft:cherry_sapling",
    "minecraft:pale_oak_sapling",
    "minecraft:brown_mushroom",
    "minecraft:red_mushroom",
    "minecraft:crimson_fungus",
    "minecraft:warped_fungus",
    "minecraft:vine",
    "minecraft:weeping_vines",
    "minecraft:twisting_vines",
    "minecraft:cave_vines",
    "minecraft:cave_vines_body_with_berries",
    "minecraft:hanging_roots",
    "minecraft:glow_lichen",
    "minecraft:nether_wart",
    "minecraft:crimson_roots",
    "minecraft:warped_roots",
    "minecraft:nether_sprouts",
    "minecraft:seagrass",
    "minecraft:tube_coral",
    "minecraft:brain_coral",
    "minecraft:bubble_coral",
    "minecraft:fire_coral",
    "minecraft:horn_coral",
    "minecraft:dead_tube_coral",
    "minecraft:dead_brain_coral",
    "minecraft:dead_bubble_coral",
    "minecraft:dead_fire_coral",
    "minecraft:dead_horn_coral",
    "minecraft:tube_coral_fan",
    "minecraft:brain_coral_fan",
    "minecraft:bubble_coral_fan",
    "minecraft:fire_coral_fan",
    "minecraft:horn_coral_fan",
    "minecraft:dead_tube_coral_fan",
    "minecraft:dead_brain_coral_fan",
    "minecraft:dead_bubble_coral_fan",
    "minecraft:dead_fire_coral_fan",
    "minecraft:dead_horn_coral_fan",
    "minecraft:redstone_wire",
    "minecraft:redstone_torch",
    "minecraft:unlit_redstone_torch",
    "minecraft:lever",
    "minecraft:tripwire_hook",
    "minecraft:trip_wire",
    "minecraft:sculk_sensor",
    "minecraft:stone_button",
    "minecraft:wooden_button",
    "minecraft:spruce_button",
    "minecraft:birch_button",
    "minecraft:jungle_button",
    "minecraft:acacia_button",
    "minecraft:dark_oak_button",
    "minecraft:mangrove_button",
    "minecraft:cherry_button",
    "minecraft:pale_oak_button",
    "minecraft:bamboo_button",
    "minecraft:crimson_button",
    "minecraft:warped_button",
    "minecraft:stone_pressure_plate",
    "minecraft:wooden_pressure_plate",
    "minecraft:spruce_pressure_plate",
    "minecraft:birch_pressure_plate",
    "minecraft:jungle_pressure_plate",
    "minecraft:acacia_pressure_plate",
    "minecraft:dark_oak_pressure_plate",
    "minecraft:mangrove_pressure_plate",
    "minecraft:cherry_pressure_plate",
    "minecraft:pale_oak_pressure_plate",
    "minecraft:bamboo_pressure_plate",
    "minecraft:crimson_pressure_plate",
    "minecraft:warped_pressure_plate",
    "minecraft:polished_blackstone_pressure_plate",
    "minecraft:light_weighted_pressure_plate",
    "minecraft:torch",
    "minecraft:soul_torch",
    "minecraft:fire",
    "minecraft:soul_fire",
    "minecraft:sea_pickle",
    "minecraft:spore_blossom",
    "minecraft:carpet",
    "minecraft:white_carpet",
    "minecraft:light_gray_carpet",
    "minecraft:gray_carpet",
    "minecraft:black_carpet",
    "minecraft:brown_carpet",
    "minecraft:red_carpet",
    "minecraft:orange_carpet",
    "minecraft:yellow_carpet",
    "minecraft:lime_carpet",
    "minecraft:green_carpet",
    "minecraft:cyan_carpet",
    "minecraft:light_blue_carpet",
    "minecraft:blue_carpet",
    "minecraft:purple_carpet",
    "minecraft:magenta_carpet",
    "minecraft:pink_carpet",
    "minecraft:moss_carpet",
    "minecraft:standing_sign",
    "minecraft:spruce_wall_sign",
    "minecraft:spruce_standing_sign",
    "minecraft:oak_hanging_sign",
    "minecraft:spruce_hanging_sign",
    "minecraft:birch_hanging_sign",
    "minecraft:jungle_hanging_sign",
    "minecraft:acacia_hanging_sign",
    "minecraft:dark_oak_hanging_sign",
    "minecraft:mangrove_hanging_sign",
    "minecraft:cherry_hanging_sign",
    "minecraft:pale_oak_hanging_sign",
    "minecraft:bamboo_hanging_sign",
    "minecraft:crimson_hanging_sign",
    "minecraft:standing_banner",
    "minecraft:wall_banner",
    "minecraft:portal",
    "minecraft:end_portal",
    "minecraft:web",
    "minecraft:snow_layer",
    "minecraft:powder_snow",
    "minecraft:wooden_door",
    "minecraft:iron_door",
    "minecraft:spruce_door",
    "minecraft:birch_door",
    "minecraft:jungle_door",
    "minecraft:acacia_door",
    "minecraft:dark_oak_door",
    "minecraft:mangrove_door",
    "minecraft:cherry_door",
    "minecraft:pale_oak_door",
    "minecraft:bamboo_door",
    "minecraft:crimson_door",
    "minecraft:warped_door",
    "minecraft:copper_door",
    "minecraft:exposed_copper_door",
    "minecraft:weathered_copper_door",
    "minecraft:oxidized_copper_door",
    "minecraft:waxed_copper_door",
    "minecraft:waxed_exposed_copper_door",
    "minecraft:waxed_weathered_copper_door",
    "minecraft:trapdoor",
    "minecraft:iron_trapdoor",
    "minecraft:spruce_trapdoor",
    "minecraft:birch_trapdoor",
    "minecraft:jungle_trapdoor",
    "minecraft:acacia_trapdoor",
    "minecraft:dark_oak_trapdoor",
    "minecraft:mangrove_trapdoor",
    "minecraft:cherry_trapdoor",
    "minecraft:pale_oak_trapdoor",
    "minecraft:bamboo_trapdoor",
    "minecraft:crimson_trapdoor",
    "minecraft:warped_trapdoor",
    "minecraft:copper_trapdoor",
    "minecraft:exposed_copper_trapdoor",
    "minecraft:weathered_copper_trapdoor",
    "minecraft:oxidized_copper_trapdoor",
    "minecraft:waxed_copper_trapdoor",
    "minecraft:waxed_exposed_copper_trapdoor",
    "minecraft:fence_gate",
    "minecraft:spruce_fence_gate",
    "minecraft:birch_fence_gate",
    "minecraft:jungle_fence_gate",
    "minecraft:acacia_fence_gate",
    "minecraft:dark_oak_fence_gate",
    "minecraft:mangrove_fence_gate",
    "minecraft:cherry_fence_gate",
    "minecraft:pale_oak_fence_gate",
    "minecraft:bamboo_fence_gate",
    "minecraft:crimson_fence_gate",
    "minecraft:red_shrub",
    "minecraft:calibrated_sculk_sensor",
    "minecraft:bush"
]);

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