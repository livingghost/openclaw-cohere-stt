import type { MediaUnderstandingProvider } from "openclaw/plugin-sdk/media-understanding";
import { DEFAULT_COHERE_AUDIO_MODEL, transcribeCohereAudio } from "./audio.js";

export function buildCohereMediaUnderstandingProvider(): MediaUnderstandingProvider {
  return {
    id: "cohere",
    capabilities: ["audio"],
    defaultModels: { audio: DEFAULT_COHERE_AUDIO_MODEL },
    transcribeAudio: transcribeCohereAudio,
  };
}
