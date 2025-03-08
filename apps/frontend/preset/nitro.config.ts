import type { NitroPreset } from "nitropack";
import { fileURLToPath } from "node:url"

export default <NitroPreset>{
  extends: "node-server", // You can extend existing presets
  entry: fileURLToPath(new URL("./entry.ts", import.meta.url)),
  hooks: {},
};
