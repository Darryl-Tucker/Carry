/**
 * @license MIT
 * Copyright (c) 2026 DarrylTucker
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { system } from "@minecraft/server";
import { entityCarrying, powerCount } from "./entity/carry";
import { playerAnimation } from "./player/dataManager";
import { entityRiding } from "./entity/ride";
import "./utils/event";

system.runInterval(() => {
    entityCarrying();
    entityRiding()
});

system.runInterval(() => powerCount(), 3);

system.runInterval(() => playerAnimation(), 100)