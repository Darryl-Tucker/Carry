import { system } from "@minecraft/server";
import { mobCarrying, powerCount } from "./mob/carry";
import { playerAnimation } from "./player/data";
import { entityRiding } from "./utils/ride";
import "./utils/events";

system.runInterval(() => {
    mobCarrying();
    entityRiding()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)