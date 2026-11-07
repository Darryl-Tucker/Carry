import { system } from "@minecraft/server";

import { mobCarry, powerCount } from "./mob/carry";
import { mobRide, playerRide } from "./utils/ride";
import { mobHandcuffs } from "./mob/handcuffs";
import { playerAnimation } from "./player/playerData";
import "./utils/events";

system.runInterval(() => {
    mobHandcuffs();
    mobCarry();
    mobRide();
    
    playerRide()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)