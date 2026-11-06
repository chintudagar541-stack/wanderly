import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { DeadShort, DEAD_FRAMES } from "./videos/dead/Dead";
import { GhostShort, GHOST_FRAMES } from "./videos/ghost/Ghost";

// Register each new short next to BridgeShort (1080x1920, 30 fps; final render uses --scale 1.3333 for 1440x2560).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GhostShort" component={GhostShort} durationInFrames={GHOST_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DeadShort" component={DeadShort} durationInFrames={DEAD_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
