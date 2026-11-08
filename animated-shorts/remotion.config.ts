import fs from "node:fs";
import { Config } from "@remotion/cli/config";

// GPU machines: "angle" (default). Containers without a GPU: REMOTION_GL=swangle (software WebGL, slower).
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as "angle" | "swangle" | undefined) ?? "angle");
// Use a local Chrome/Chromium if CHROME_PATH is set (or the cloud container's pre-installed one); else Remotion downloads its own.
const chrome = process.env.CHROME_PATH ?? (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
if (chrome) Config.setBrowserExecutable(chrome);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Software WebGL is slow: render one frame at a time and allow 3 min per frame.
if (process.env.REMOTION_GL === "swangle") Config.setConcurrency(1);
Config.setDelayRenderTimeoutInMilliseconds(180000);
