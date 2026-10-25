# 🐄 Carry

**Pick up, carry, throw and stack mobs in Minecraft Bedrock Edition — and cuff them when they misbehave.**

Carry is a Bedrock add-on (Behavior Pack + Resource Pack) built on the `@minecraft/server` Script API. It adds a physics-flavoured mob-carrying system with charge-based throwing, mob stacking, player riding, and a craftable handcuffs & key mechanic.

![Minecraft Bedrock](https://img.shields.io/badge/Minecraft-Bedrock-62B47A)
![Min Engine](https://img.shields.io/badge/min__engine-1.26.0-blue)
![Script API](https://img.shields.io/badge/@minecraft/server-2.9.0-orange)
![Language](https://img.shields.io/badge/language-JavaScript-F7DF1E)

---

## 📑 Table of Contents

- [Features](#-features)
- [How to Play](#-how-to-play)
- [Crafting](#-crafting)
- [Supported Mobs](#-supported-mobs)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Localization](#-localization)
- [Development Timeline](#-development-timeline)
- [Known Notes](#-known-notes)

---

## ✨ Features

- **Mob carrying** – Lift supported mobs and hold them in front of you.
- **Charge-based throwing** – Charge up power, then hit the mob to launch it up to 15 blocks.
- **Dynamic weight** – Heavier mobs (Iron Golem, Camel, Panda…) slow you down much more than light ones.
- **Mob stacking** – Throw a mob onto another one to stack them. Stacks are built with a bottom-up insertion mechanic.
- **Player riding** – Climb onto other players and ride them around.
- **Handcuffs & Key** – Restrain mobs with handcuffs and lock/unlock them with a personal key.
- **Cross-platform controls** – Toggle-based input that works the same on PC, console and mobile.
- **Feedback** – Sound effects, action-bar power meter and custom particles.
- **Resource Pack** – Custom item textures and `en_US` / `tr_TR` localization.

---

## 🎮 How to Play

### Carrying & Throwing

| Action | Control |
| --- | --- |
| **Pick up a mob** | Sneak + interact with a supported mob (both hands must be empty) |
| **Start / stop charging a throw** | Interact with the carried mob (toggle – no need to hold the button) |
| **Throw the mob** | Hit the carried mob while charged – the farther the charge, the farther it flies |
| **Cancel a charge** | Sneak |
| **Place the mob down** | Hit it without charging (it will stack onto a nearby mob if one is in range) |
| **Drop the mob** | Sprint, or hold any item in your main hand / off-hand |

While carrying a mob you cannot jump, break blocks, interact with blocks, or pick up items.

> 💡 The power bar in the action bar shows your current charge (max 15 blocks).

### Stacking Mobs

Throw or place a carried mob next to another mob (within ~1.5 blocks) and it will be stacked on top. Hitting a mob in the stack removes it and re-orders the remaining mobs automatically.

### Riding Players

Interact with another player (without sneaking) to mount them. The carrier receives a slowness effect while being ridden. The carrier can dismount the rider by pressing **Sneak + Jump**.

### Handcuffs & Keys

1. **Cuff** – Right-click a supported mob (not sneaking) while holding **Handcuffs**. The handcuffs are consumed.
2. **Lock** – Right-click the cuffed mob with a **Key**. The key is bound to you and the mob becomes immobilized.
3. **Unlock** – Right-click the mob with the **matching key**. The handcuffs drop and the mob is free again.

If a handcuffed mob dies, the handcuffs drop at its location. Keys store their owner's ID in their lore, so only the key that locked a mob can unlock it.

---

## 🔨 Crafting

### Handcuffs (`carry:handcuffs`)

```
 I  I  I
 I  N  I        I = Iron Ingot
 I  I  I        N = Iron Nugget
```

### Key (`carry:key`)

```
    N
    N           N = Gold Nugget
    G           G = Gold Ingot
```

Both recipes are crafted at a crafting table and unlock when you pick up the related nugget or ingot.

---

## 🐾 Supported Mobs

Iron Golem, Cow, Sheep, Chicken, Villager, Cod, Cat, Wolf, Copper Golem, Pig, Horse, Axolotl, Llama, Armadillo, Camel, Trader Llama, Wandering Trader, Camel Husk, Bee, Sulfur Cube, Rabbit, Fox, Frog, Goat, Sniffer, Panda, Snow Golem, Ocelot.

### Weight Classes

| Slowness level | Mobs |
| --- | --- |
| **Very heavy** (5) | Iron Golem, Camel, Camel Husk, Sniffer, Panda |
| **Heavy** (4) | Copper Golem |
| **Medium** (2) | Villager, Wandering Trader, Horse, Llama, Trader Llama, Snow Golem |
| **Light** (1) | Cow, Sheep, Pig, Goat |
| **Featherweight** | Everything else |

---

## 📦 Installation

### Requirements

- Minecraft Bedrock Edition with engine version **1.26.0** or newer
- **Beta APIs / Script API** support enabled for the world
- Both packs must be active (the Behavior Pack depends on the Resource Pack)

### Steps

1. Clone or download this repository.
2. Copy the pack folders into your Minecraft development directories:
   - `Carry-BP` → `.../minecraftWorlds/<world>/behavior_packs/` *(or* `development_behavior_packs/` *)*
   - `Carry-RP` → `.../minecraftWorlds/<world>/resource_packs/` *(or* `development_resource_packs/` *)*
3. Create or open a world and activate **Carry BP** and **Carry RP**.
4. (Optional, for development) Run `npm install` inside `Carry-BP` to get the `@minecraft/server` typings.

---

## 🗂️ Project Structure

```
Carry/
├── Carry-BP/                      # Behavior Pack
│   ├── manifest.json
│   ├── package.json
│   ├── entities/
│   │   └── player.json            # Player entity override (rideable by players)
│   ├── items/
│   │   ├── handcuffs.json
│   │   └── key.json
│   ├── recipes/
│   │   ├── handcuffs.json
│   │   └── key.json
│   └── scripts/
│       ├── index.js               # Entry point & main tick loops
│       ├── mob/
│       │   ├── carry.js           # Carry, throw, power charge, protection
│       │   └── handcuffs.js       # Handcuffs & key logic
│       ├── player/
│       │   └── playerData.js      # Per-player state & input permissions
│       └── utils/
│           ├── config.js          # Allowed / excluded mob lists
│           ├── events.js          # World event subscriptions
│           └── ride.js            # Mob stacking & player riding
└── Carry-RP/                      # Resource Pack
    ├── manifest.json
    ├── texts/                     # en_US / tr_TR language files
    └── textures/
        ├── item_texture.json
        └── items/                 # handcuffs.png, key.png
```

---

## ⚙️ Configuration

Edit [`Carry-BP/scripts/utils/config.js`](Carry-BP/scripts/utils/config.js):

- `allowMobs` – list of mob type IDs that can be carried and handcuffed.
- `excludeMobs` – entity types ignored by the stacking system.

To adjust how heavy a mob feels, edit the `mobWeight()` switch in [`scripts/mob/carry.js`](Carry-BP/scripts/mob/carry.js). Note that weights are currently matched by the **index** of the mob in `allowMobs`, so keep the list order in sync if you add or remove entries.

---

## 🌍 Localization

| Language | File |
| --- | --- |
| English (US) | `Carry-RP/texts/en_US.lang` |
| Turkish (TR) | `Carry-RP/texts/tr_TR.lang` |

Add new languages by creating a `<lang>.lang` file and registering it in `texts/languages.json`.

---

## 📅 Development Timeline

### 🛠️ October 15, 2026
- **Core Mechanics:** Introduced initial mob carrying and dropping features.
- **Player Interaction:** Added the ability for players to carry and transport other players.

### 🎯 October 16, 2026
- **Launch Mechanics:** Added a charge-based throwing mechanic determined by accumulated power.
- **Audio & Visuals:** Integrated sound effects, floating text indicators, and custom particles.
- **Physics System:** Implemented dynamic weight scaling based on the specific mob being carried.

### 🎮 October 17, 2026
- **Cross-Platform Optimization:** Overhauled input mechanics for a seamless multi-platform experience.
- **Toggle System:** Replaced the tedious hold-to-charge mechanism (right-click on PC / tap-and-hold on mobile) with a much smoother **toggle (switch) mechanism**.
- **Stability:** Resolved initial integration bugs.

### 🔄 October 18, 2026
- **Mob Stacking:** Introduced a feature allowing thrown mobs to stack on top of other mobs upon collision.

### 🏗️ October 20, 2026
- **Stacking Overhaul:** Redesigned the stacking logic, shifting from a **top-down** mounting system to a **bottom-up** insertion mechanic.

### 🕹️ October 21, 2026
- **Control Refinement:** Implemented new, intuitive control schemes.
- **Bug Fixes:** Patched stability and performance issues.

### 🐛 October 22, 2026
- **Maintenance:** Dedicated session focused purely on debugging and polishing existing mechanics.

### 🔗 October 24, 2026
- **Handcuff Mechanic:** Added a specialized cuffing/restraining feature with craftable handcuffs and keys.
- **Assets:** Integrated a custom Resource Pack for updated textures and visual elements.
- **Stability:** Final round of bug fixes and performance balancing.

---

## 📝 Known Notes

- Weather changes are currently **cancelled** by a debug line in `utils/events.js`; remove it if you want natural weather.
- To prevent carried mobs from turning aggressive, the script briefly switches the player to Spectator mode for one tick (skipped in Creative mode and on Peaceful difficulty).
- Handcuffed mobs are immobilized with a maximum-level slowness effect while locked with a key.

---

## 🤝 Contributing

Issues and pull requests are welcome. If you plan a larger change, please open an issue first to discuss it.

## 📄 License

No license has been specified yet. Add a `LICENSE` file to define how others may use this project.
