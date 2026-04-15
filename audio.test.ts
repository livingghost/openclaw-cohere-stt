import { afterEach, describe, expect, it, vi } from "vitest";

const {
  assertOkOrThrowHttpErrorMock,
  postTranscriptionRequestMock,
  releaseMock,
  requireTranscriptionTextMock,
  resolveProviderHttpRequestConfigMock,
} = vi.hoisted(() => ({
  assertOkOrThrowHttpErrorMock: vi.fn(async (res: Response, label: string) => {
    if (!res.ok) {
      throw new Error(`${label} (HTTP ${res.status})`);
    }
  }),
  postTranscriptionRequestMock: vi.fn(),
  releaseMock: vi.fn(async () => {}),
  requireTranscriptionTextMock: vi.fn((value: string | undefined, message: string) => {
    const text = value?.trim();
    if (!text) {
      throw new Error(message);
    }
    return text;
  }),
  resolveProviderHttpRequestConfigMock: vi.fn(() => ({
    baseUrl: "https://api.cohere.com/v2",
    allowPrivateNetwork: false,
    headers: new Headers({ authorization: "Bearer test-token" }),
    dispatcherPolicy: undefined,
  })),
}));

vi.mock("openclaw/plugin-sdk/provider-http", () => ({
  assertOkOrThrowHttpError: assertOkOrThrowHttpErrorMock,
  postTranscriptionRequest: postTranscriptionRequestMock,
  resolveProviderHttpRequestConfig: resolveProviderHttpRequestConfigMock,
  requireTranscriptionText: requireTranscriptionTextMock,
}));

import { DEFAULT_COHERE_AUDIO_MODEL, transcribeCohereAudio } from "./audio.js";

describe("Cohere audio transcription", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds the documented multipart request", async () => {
    postTranscriptionRequestMock.mockResolvedValue({
      response: new Response(JSON.stringify({ text: "hello world" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      release: releaseMock,
    });

    const result = await transcribeCohereAudio({
      buffer: Buffer.from("audio"),
      fileName: "sample.wav",
      mime: "audio/wav",
      apiKey: "test-token",
      model: "cohere-transcribe-03-2026",
      language: "ja",
      query: { temperature: 0.25 },
      timeoutMs: 30_000,
    });

    expect(resolveProviderHttpRequestConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultBaseUrl: "https://api.cohere.com/v2",
        provider: "cohere",
        api: "cohere-audio-transcriptions",
      }),
    );
    expect(postTranscriptionRequestMock).toHaveBeenCalledTimes(1);
    const request = postTranscriptionRequestMock.mock.calls[0]?.[0] as {
      url: string;
      headers: Headers;
      body: FormData;
    };
    expect(request.url).toBe("https://api.cohere.com/v2/audio/transcriptions");
    expect(request.headers.get("authorization")).toBe("Bearer test-token");
    expect(Array.from(request.body.entries(), ([key]) => key)).toEqual([
      "model",
      "language",
      "temperature",
      "file",
    ]);
    expect(request.body.get("model")).toBe("cohere-transcribe-03-2026");
    expect(request.body.get("language")).toBe("ja");
    expect(request.body.get("temperature")).toBe("0.25");
    const file = request.body.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("sample.wav");
    expect(result).toEqual({
      text: "hello world",
      model: "cohere-transcribe-03-2026",
    });
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it("uses the default model when omitted", async () => {
    postTranscriptionRequestMock.mockResolvedValue({
      response: new Response(JSON.stringify({ text: "hello world" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      release: releaseMock,
    });

    const result = await transcribeCohereAudio({
      buffer: Buffer.from("audio"),
      fileName: "sample.wav",
      apiKey: "test-token",
      timeoutMs: 30_000,
    });

    expect(result.model).toBe(DEFAULT_COHERE_AUDIO_MODEL);
    const request = postTranscriptionRequestMock.mock.calls[0]?.[0] as {
      body: FormData;
    };
    expect(request.body.get("model")).toBe(DEFAULT_COHERE_AUDIO_MODEL);
  });

  it("rejects unsupported temperature values", async () => {
    await expect(
      transcribeCohereAudio({
        buffer: Buffer.from("audio"),
        fileName: "sample.wav",
        apiKey: "test-token",
        timeoutMs: 30_000,
        query: { temperature: 2 },
      }),
    ).rejects.toThrow("Cohere transcription temperature must be between 0 and 1");
    expect(postTranscriptionRequestMock).not.toHaveBeenCalled();
  });
});
