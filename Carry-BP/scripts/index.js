import { system } from "@minecraft/server";
import { entityCarrying, powerCount } from "./entity/carry";
import { playerAnimation } from "./player/data";
import { entityRiding } from "./entity/ride";
import "./utils/event";

system.runInterval(() => {
    entityCarrying();
    entityRiding()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)