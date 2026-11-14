import { system } from "@minecraft/server";

import { mobCarrying, powerCount } from "./mob/carry";
import { mobRiding } from "./mob/ride";

import { playerRiding } from "./player/ride";
import { playerAnimation } from "./player/data";

import "./utils/events";

system.runInterval(() => {
    mobCarrying();
    mobRiding();

    playerRiding()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)