import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSON5 from "json5";
import { describe, expect, it } from "vitest";

const extensionRoot = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(extensionRoot, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");

function extractFenceAfterHeading(readmeText: string, heading: string): string {
  const headingIndex = readmeText.indexOf(heading);
  if (headingIndex < 0) {
    throw new Error(`missing heading: ${heading}`);
  }
  const fenceStart = readmeText.indexOf("```", headingIndex);
  if (fenceStart < 0) {
    throw new Error(`missing code fence after heading: ${heading}`);
  }
  const bodyStart = readmeText.indexOf("\n", fenceStart);
  if (bodyStart < 0) {
    throw new Error(`missing code fence body after heading: ${heading}`);
  }
  const fenceEnd = readmeText.indexOf("\n```", bodyStart);
  if (fenceEnd < 0) {
    throw new Error(`missing fence terminator after heading: ${heading}`);
  }
  return readmeText.slice(bodyStart + 1, fenceEnd).trim();
}

function parseJson5Fence<T>(heading: string): T {
  return JSON5.parse(extractFenceAfterHeading(readme, heading)) as T;
}

describe("cohere-stt README examples", () => {
  it("keeps the minimal config parseable", () => {
    const example = parseJson5Fence<{
      models?: { providers?: Record<string, { apiKey?: string }> };
      tools?: { media?: { audio?: { models?: Array<Record<string, unknown>> } } };
    }>("## Minimal audio config");

    expect(example.models?.providers?.cohere?.apiKey).toBe("optional-if-COHERE_API_KEY-is-set");
    expect(example.tools?.media?.audio?.models).toEqual([
      {
        provider: "cohere",
        model: "cohere-transcribe-03-2026",
        language: "ja",
      },
    ]);
  });

  it("keeps the full config parseable", () => {
    const example = parseJson5Fence<{
      models?: {
        providers?: Record<string, { apiKey?: string; baseUrl?: string }>;
      };
      tools?: {
        media?: {
          audio?: {
            enabled?: boolean;
            providerOptions?: Record<string, Record<string, unknown>>;
            models?: Array<Record<string, unknown>>;
          };
        };
      };
    }>("## Example with supported settings");

    expect(example.models?.providers?.cohere).toEqual({
      apiKey: "optional-if-COHERE_API_KEY-is-set",
      baseUrl: "https://api.cohere.com/v2",
    });
    expect(example.tools?.media?.audio?.enabled).toBe(true);
    expect(example.tools?.media?.audio?.providerOptions?.cohere).toEqual({
      temperature: 0.2,
    });
    expect(example.tools?.media?.audio?.models).toEqual([
      {
        provider: "cohere",
        model: "cohere-transcribe-03-2026",
        language: "en",
      },
    ]);
  });
});
