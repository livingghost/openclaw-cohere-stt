import { describe, expect, it } from "vitest";
import { buildCohereMediaUnderstandingProvider } from "./media-understanding-provider.js";

describe("Cohere media-understanding provider", () => {
  it("registers as an audio transcription provider", () => {
    const provider = buildCohereMediaUnderstandingProvider();
    expect(provider.id).toBe("cohere");
    expect(provider.capabilities).toEqual(["audio"]);
    expect(provider.defaultModels).toEqual({
      audio: "cohere-transcribe-03-2026",
    });
    expect(provider.autoPriority).toBeUndefined();
    expect(typeof provider.transcribeAudio).toBe("function");
  });
});
