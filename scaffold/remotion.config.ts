import { Config } from "@remotion/cli/config";

// Default render config. Overridden by per-script flags in package.json.
Config.setVideoImageFormat("jpeg");          // png needed for alpha — overridden in render:opening:transparent
Config.setOverwriteOutput(true);             // re-runs replace the previous out file
Config.setConcurrency(null);                 // null = auto (cores - 2)
