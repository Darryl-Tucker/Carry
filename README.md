🐄 Carry

Pick up, carry, throw, and stack mobs in Minecraft Bedrock Edition — and handcuff them when they misbehave!

Carry is a Minecraft Bedrock Edition add-on consisting of a Behavior Pack and a Resource Pack. Built with the @minecraft/server Script API, it introduces a physics-inspired mob-carrying system featuring charge-based throwing, mob stacking, player riding, and craftable handcuffs and keys.

!Minecraft Bedrock Edition !Minimum Engine Version !Script API !Language

📑 Table of Contents
Features
How to Play
Crafting
Supported Mobs
Installation
Project Structure
Configuration
Localization
Development Timeline
Known Issues and Notes
Contributing
✨ Features
Mob Carrying — Pick up supported mobs and hold them in front of you.
Charge-Based Throwing — Charge your throw and launch a mob up to 15 blocks, depending on the accumulated power.
Dynamic Weight System — Heavier mobs, such as Iron Golems, Camels, and Pandas, slow you down more than lighter mobs.
Mob Stacking — Stack mobs on top of one another using a bottom-up insertion system.
Player Riding — Climb onto other players and ride them around.
Handcuffs and Keys — Restrain supported mobs with craftable handcuffs and lock or unlock them using a personal key.
Cross-Platform Controls — Use a toggle-based input system designed for PC, console, and mobile devices.
Immersive Feedback — Enjoy sound effects, an action-bar power meter, and custom particles.
Custom Resource Pack — Includes custom item textures and English (US) and Turkish localization.
🎮 How to Play
Carrying and Throwing
Action	Control
Pick up a mob	Sneak and interact with a supported mob while keeping both hands empty.
Start or stop charging	Interact with the mob you're carrying. Charging uses a toggle system, so you don't need to hold the button.
Throw the mob	Hit the carried mob while charging is active. The longer you charge, the farther the mob travels.
Cancel a charge	Sneak.
Place the mob	Hit the carried mob without charging. If another mob is nearby, the carried mob may be stacked on top of it.
Drop the mob	Sprint or hold an item in either hand.

While carrying a mob, you cannot jump, break blocks, interact with blocks, or pick up items.

💡 Tip: The action bar displays your current throwing power. The maximum throwing distance is 15 blocks.
Stacking Mobs

Throw or place a carried mob near another mob (within approximately 1.5 blocks) to stack it on top.

Hitting a mob in a stack removes it from the stack, and the remaining mobs are automatically rearranged.

Riding Players

Interact with another player without sneaking to mount them.

The player being ridden receives a Slowness effect while carrying a rider. To dismount a rider, the carrier must press Sneak + Jump.

Handcuffs and Keys
Cuff a mob — Interact with a supported mob without sneaking while holding Handcuffs. The Handcuffs are consumed in the process.
Lock a mob — Interact with a handcuffed mob while holding a Key. The key becomes associated with the mob, which is then immobilized.
Unlock a mob — Interact with the locked mob using the matching Key. The Handcuffs are dropped, freeing the mob.

If a handcuffed mob dies, the Handcuffs drop at its location.

Each Key stores its owner's ID in its lore, ensuring that only the player with the matching key can unlock the mob.

🔨 Crafting

Both items can be crafted at a Crafting Table. Their recipes are unlocked when you pick up the corresponding ingredient.

Handcuffs (carry:handcuffs)
text
I I I
I N I
I I I

I = Iron Ingot
N = Iron Nugget

Key (carry:key)
text
  N
  N
  G

N = Gold Nugget
G = Gold Ingot

🐾 Supported Mobs

Carry currently supports the following mobs:

Iron Golem, Cow, Sheep, Chicken, Villager, Cod, Cat, Wolf, Copper Golem, Pig, Horse, Axolotl, Llama, Armadillo, Camel, Trader Llama, Wandering Trader, Camel Husk, Bee, Sulfur Cube, Rabbit, Fox, Frog, Goat, Sniffer, Panda, Snow Golem, and Ocelot.

Weight Classes

The weight system determines how much the player is slowed down while carrying a mob.

Weight Class	Slowness Level	Mobs
Very Heavy	5	Iron Golem, Camel, Camel Husk, Sniffer, Panda
Heavy	4	Copper Golem
Medium	2	Villager, Wandering Trader, Horse, Llama, Trader Llama, Snow Golem
Light	1	Cow, Sheep, Pig, Goat
Featherweight	—	All other supported mobs
📦 Installation
Requirements
Minecraft Bedrock Edition with engine version 1.26.0 or later.
Beta APIs / Script API support enabled for the world, as required by the pack.
Both the Behavior Pack and Resource Pack must be installed and activated. The Behavior Pack depends on the Resource Pack.
Installation Steps
Clone or download this repository.
Copy the pack folders into the appropriate Minecraft directories:
Carry-BP → .../minecraftWorlds/<world>/behavior_packs/ or .../development_behavior_packs/
Carry-RP → .../minecraftWorlds/<world>/resource_packs/ or .../development_resource_packs/
Create a new world or open an existing one.
Activate Carry BP and Carry RP in the world's pack settings.
Enable the required experimental or Beta API features if prompted.
(Optional, for development) Run npm install inside Carry-BP to install the @minecraft/server type definitions and other declared dependencies.
🗂️ Project Structure
text
Carry/
├── Carry-BP/                      # Behavior Pack
│   ├── manifest.json
│   ├── package.json
│   ├── entities/
│   │   └── player.json            # Player entity override for riding
│   ├── items/
│   │   ├── handcuffs.json
│   │   └── key.json
│   ├── recipes/
│   │   ├── handcuffs.json
│   │   └── key.json
│   └── scripts/
│       ├── index.js               # Entry point and main tick loops
│       ├── mob/
│       │   ├── carry.js           # Carrying, throwing, charging, and protection
│       │   └── handcuffs.js       # Handcuff and key mechanics
│       ├── player/
│       │   └── playerData.js      # Per-player state and input permissions
│       └── utils/
│           ├── config.js          # Allowed and excluded mob lists
│           ├── events.js          # World event subscriptions
│           └── ride.js            # Mob stacking and player riding
└── Carry-RP/                      # Resource Pack
    ├── manifest.json
    ├── texts/                     # en_US and tr_TR language files
    └── textures/
        ├── item_texture.json
        └── items/                 # handcuffs.png and key.png

⚙️ Configuration

You can customize the add-on by editing the following files.

Supported and Excluded Mobs

Edit Carry-BP/scripts/utils/config.js:

allowMobs — Defines which mob types can be carried and handcuffed.
excludeMobs — Defines which entity types are ignored by the stacking system.
Adjusting Mob Weight

To change how much a mob slows down the player, edit the mobWeight() switch statement in Carry-BP/scripts/mob/carry.js.

⚠️ Important: Mob weights are currently determined by each mob's index in allowMobs. If you add, remove, or reorder entries in this list, make sure the weight mapping remains synchronized to avoid assigning incorrect weights.
🌍 Localization

Carry currently includes the following languages:

Language	Locale	File
English (United States)	en_US	Carry-RP/texts/en_US.lang
Turkish	tr_TR	Carry-RP/texts/tr_TR.lang
Adding a New Language
Create a new <lang>.lang file in Carry-RP/texts/.
Add the language to Carry-RP/texts/languages.json.
Translate the existing localization keys.
📅 Development Timeline
🛠️ October 15, 2026 — Core Mechanics
Implemented the initial mob-carrying and dropping mechanics.
Added the ability for players to carry and transport other players.
🎯 October 16, 2026 — Throwing and Physics
Introduced charge-based throwing, with launch power determined by the accumulated charge.
Added sound effects, floating text indicators, and custom particles.
Implemented dynamic weight scaling based on mob type.
🎮 October 17, 2026 — Cross-Platform Controls
Improved input handling for a more consistent experience across PC, console, and mobile.
Replaced the hold-to-charge mechanic with a toggle-based system, eliminating the need to hold a button on PC or mobile.
Fixed initial integration and stability issues.
🔄 October 18, 2026 — Mob Stacking
Introduced mob stacking, allowing thrown mobs to land on and stack with nearby mobs.
🏗️ October 20, 2026 — Stacking Overhaul
Redesigned the stacking logic, replacing the top-down mounting approach with a bottom-up insertion system.
🕹️ October 21, 2026 — Control Refinements
Refined the control scheme for a more intuitive gameplay experience.
Fixed additional bugs and improved stability.
🐛 October 22, 2026 — Maintenance and Bug Fixes
Focused on debugging, stability improvements, and polishing existing mechanics.
🔗 October 24, 2026 — Handcuffs and Resource Pack
Added the handcuff mechanic, including craftable Handcuffs and Keys.
Integrated a custom Resource Pack with item textures and localization.
Completed another round of bug fixes and performance adjustments.
📝 Known Issues and Notes
Weather changes: Weather changes are currently disabled by a debug line in scripts/utils/events.js. Remove or modify that line if you want normal weather behavior.
Mob aggression: To prevent carried mobs from becoming aggressive, the script temporarily switches the player to Spectator mode for one tick. This behavior is skipped in Creative mode and on Peaceful difficulty.
Handcuffed mobs: A mob locked with a Key is immobilized using a maximum-level Slowness effect.
🤝 Contributing

Contributions are welcome!

If you find a bug, have a feature request, or want to suggest an improvement, feel free to open an issue.

For larger changes, please open an issue first so we can discuss the proposed approach before you start working on it.

Pull requests are welcome. Thank you for helping improve Carry!