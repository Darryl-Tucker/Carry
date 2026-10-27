import { system } from "@minecraft/server";

import { mobCarry, powerCount } from "./mob/carry";
import { mobRide, playerRide } from "./utils/ride";
import { mobHandcuffs } from "./mob/handcuffs";
//import { playerCarry_animation } from "./player/playerData";
import "./utils/events";

system.runInterval(() => {
    mobHandcuffs();
    mobCarry();
    mobRide();
    //playerCarry_animation();
    playerRide()
});

system.runInterval(() => powerCount(), 3)