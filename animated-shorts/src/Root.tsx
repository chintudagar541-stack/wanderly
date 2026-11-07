import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { DeadShort, DEAD_FRAMES } from "./videos/dead/Dead";
import { GhostShort, GHOST_FRAMES } from "./videos/ghost/Ghost";
import { DiwaliShort, DIWALI_FRAMES } from "./videos/diwali/Diwali";
import { JarShort, JAR_FRAMES } from "./videos/jar/Jar";
import { EiffelShort, EIFFEL_FRAMES } from "./videos/eiffel/Eiffel";
import { ShadowShort, SHADOW_FRAMES } from "./videos/shadow/Shadow";
import { CapitalShort, CAPITAL_FRAMES } from "./videos/capital/Capital";
import { ToonTest } from "./videos/capital/ToonTest";
import { Diwali2Short, DIWALI2_FRAMES } from "./videos/diwali2/Diwali2";

// Register each new short next to BridgeShort (1080x1920, 30 fps; final render uses --scale 1.3333 for 1440x2560).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Diwali2Short" component={Diwali2Short} durationInFrames={DIWALI2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ToonTest" component={ToonTest} durationInFrames={1} fps={30} width={1080} height={1200} />
    <Composition id="CapitalShort" component={CapitalShort} durationInFrames={CAPITAL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ShadowShort" component={ShadowShort} durationInFrames={SHADOW_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="EiffelShort" component={EiffelShort} durationInFrames={EIFFEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="JarShort" component={JarShort} durationInFrames={JAR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DiwaliShort" component={DiwaliShort} durationInFrames={DIWALI_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GhostShort" component={GhostShort} durationInFrames={GHOST_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DeadShort" component={DeadShort} durationInFrames={DEAD_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
