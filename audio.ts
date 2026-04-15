import path from "node:path";
import type {
  AudioTranscriptionRequest,
  AudioTranscriptionResult,
} from "openclaw/plugin-sdk/media-understanding";
import {
  assertOkOrThrowHttpError,
  postTranscriptionRequest,
  resolveProviderHttpRequestConfig,
  requireTranscriptionText,
} from "openclaw/plugin-sdk/provider-http";

export const DEFAULT_COHERE_AUDIO_BASE_URL = "https://api.cohere.com/v2";
export const DEFAULT_COHERE_AUDIO_MODEL = "cohere-transcribe-03-2026";

function resolveModel(model?: string): string {
  const trimmed = model?.trim();
  return trimmed || DEFAULT_COHERE_AUDIO_MODEL;
}

function resolveTemperature(query: AudioTranscriptionRequest["query"]): number | undefined {
  const raw = query?.temperature;
  if (raw === undefined) {
    return undefined;
  }
  const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Cohere transcription temperature must be between 0 and 1");
  }
  return value;
}

type CohereTranscriptionResponse = {
  text?: string;
};

export async function transcribeCohereAudio(
  params: AudioTranscriptionRequest,
): Promise<AudioTranscriptionResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const model = resolveModel(params.model);
  const temperature = resolveTemperature(params.query);
  const { baseUrl, allowPrivateNetwork, headers, dispatcherPolicy } =
    resolveProviderHttpRequestConfig({
      baseUrl: params.baseUrl,
      defaultBaseUrl: DEFAULT_COHERE_AUDIO_BASE_URL,
      headers: params.headers,
      request: params.request,
      defaultHeaders: {
        authorization: `Bearer ${params.apiKey}`,
      },
      provider: "cohere",
      api: "cohere-audio-transcriptions",
      capability: "audio",
      transport: "media-understanding",
    });

  const url = `${baseUrl}/audio/transcriptions`;
  const bytes = new Uint8Array(params.buffer);
  const fileName = params.fileName?.trim() || path.basename(params.fileName) || "audio";
  const blob = new Blob([bytes], {
    type: params.mime ?? "application/octet-stream",
  });

  const form = new FormData();
  form.append("model", model);
  if (params.language?.trim()) {
    form.append("language", params.language.trim());
  }
  if (temperature !== undefined) {
    form.append("temperature", String(temperature));
  }
  form.append("file", blob, fileName);

  const { response: res, release } = await postTranscriptionRequest({
    url,
    headers,
    body: form,
    timeoutMs: params.timeoutMs,
    fetchFn,
    pinDns: false,
    allowPrivateNetwork,
    dispatcherPolicy,
  });

  try {
    await assertOkOrThrowHttpError(res, "Audio transcription failed");
    const payload = (await res.json()) as CohereTranscriptionResponse;
    const text = requireTranscriptionText(
      payload.text,
      "Audio transcription response missing text",
    );
    return { text, model };
  } finally {
    await release();
  }
}
