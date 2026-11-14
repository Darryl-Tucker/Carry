# 🐄 Carry & Throw!

Pick up, carry, throw, and stack mobs in Minecraft Bedrock Edition, and handcuff them when they misbehave!

## 📦 Package Contents

Carry is a Bedrock add-on built with the `@minecraft/server` Script API. It consists of two packs:

- **Carry-BP (Behavior Pack)**: scripts for carrying, throwing, stacking, riding, and handcuffs, plus the handcuffs and key items, their recipes, and a player entity override for riding.
- **Carry-RP (Resource Pack)**: item textures for the handcuffs and key, with English (US) and Turkish language files.

```text
Carry/
├── Carry-BP/
│   ├── entities/      # Player override for riding
│   ├── items/         # Handcuffs and key
│   ├── recipes/       # Crafting recipes
│   └── scripts/       # Carrying, throwing, stacking, handcuffs
└── Carry-RP/
    ├── texts/         # en_US, tr_TR
    ├── animations.../    # animations
```

## 🎮 Gameplay

### Carrying and Throwing

| Action | Control |
|---|---|
| Pick up a mob | Sneak and interact with a supported mob, both hands empty |
| Start/stop charging | Interact with the carried mob (toggle, no need to hold) |
| Throw | Hit the carried mob while charging (up to 15 blocks) |
| Cancel charge | Sneak |
| Place | Hit the carried mob without charging |
| Drop | Sprint or hold an item |

While carrying, you cannot jump, break blocks, interact with blocks, or pick up items. Heavier mobs (Iron Golem, Camel, Panda, etc.) slow you down more.

### Stacking Mobs

Throw or place a carried mob within about 1.5 blocks of another mob to stack it on top. Hitting a mob in a stack removes it, and the rest rearrange automatically.

### Riding Players

Interact with another player without sneaking to ride them. The carrier gets Slowness and can dismount the rider with Sneak + Jump.

### Supported Mobs

Iron Golem, Cow, Sheep, Chicken, Villager, Cod, Cat, Wolf, Copper Golem, Pig, Horse, Axolotl, Llama, Armadillo, Camel, Trader Llama, Wandering Trader, Camel Husk, Bee, Sulfur Cube, Rabbit, Fox, Frog, Goat, Sniffer, Panda, Snow Golem, Ocelot, Donkey, Mooshroom, Mule, Parrot, Polar bear, Turtle, Enderman, Squid, Glow Squid, Tadpole, Allay, Player, Piglin, Strider.

## ⚙️ Requirements & Compatibility

- **No Experimental Settings Required!** This add-on is fully optimized using the stable Bedrock Script API. You **do not** need to enable "Beta APIs" or any other experimental toggles in your world settings.
- **Multiplayer Ready:** Perfectly optimized for multiplayer servers and co-op worlds with local cache and memory management.


## 📅 Development Timeline

- **October 15, 2026**: Core mechanics. Mob carrying and dropping, plus carrying other players.
- **October 16, 2026**: Throwing and physics. Charge-based throwing, sound effects, floating text, custom particles, and weight scaling by mob type.
- **October 17, 2026**: Cross-platform controls. Consistent input on PC, console, and mobile, with hold-to-charge replaced by a toggle system.
- **October 18, 2026**: Mob stacking. Thrown mobs can land on and stack with nearby mobs.
- **October 20, 2026**: Stacking overhaul. Top-down mounting replaced with a bottom-up insertion system.
- **October 21, 2026**: Control refinements and bug fixes.
- **October 22, 2026**: Maintenance, stability improvements, and polish.
- **October 24, 2026**: Handcuffs and keys with crafting recipes, plus the Resource Pack with textures and localization.
- **October 27, 2026**: Tutorial and TR, EN languages added.
- **October 28, 2026**: Pack icon and carry animation added.
- **October 29, 2026**: Bug fixed and optimized.
- **October 31, 2026**: Throwing mechanics have been changed.
- **November 01, 2026**: Throwing a mob directly at another player will apply a knockback effect to that player upon impact.
- **November 07, 2026**: Added 2 new abilities, fixed bugs, and optimized.
- **November 12, 2026**: Added mobs, bug fixed.
- **November 14, 2026**: Added mobs, animation rendering, bug fixed.