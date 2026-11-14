import { system } from "@minecraft/server";

import { mobCarry, powerCount } from "./mob/carry";
import { mobRide, playerRide } from "./utils/ride";
import { playerAnimation } from "./player/data";
import "./utils/events";

system.runInterval(() => {
    mobCarry();
    mobRide();
    
    playerRide()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)