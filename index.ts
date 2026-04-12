import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { buildCohereMediaUnderstandingProvider } from "./media-understanding-provider.js";

export default definePluginEntry({
  id: "cohere-stt",
  name: "Cohere STT",
  description: "Cohere audio transcription provider for OpenClaw media understanding",
  register(api) {
    api.registerMediaUnderstandingProvider(buildCohereMediaUnderstandingProvider());
  },
});
