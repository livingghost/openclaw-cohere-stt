# Cohere STT for OpenClaw

Unofficial, community-maintained OpenClaw plugin that adds the Cohere audio
transcription provider.

- Package name: `openclaw-cohere-stt`
- Extension/plugin id: `cohere-stt`
- Media-understanding provider id: `cohere`
- License: `MIT`
- Required auth: `COHERE_API_KEY` or an auth profile referenced from `tools.media.audio.models[].profile`

The extension registers the `cohere` media-understanding provider, so OpenClaw
config uses `tools.media.audio.models` and the normal provider auth flow.

## Requirements

- OpenClaw `>=2026.4.11`
- Cohere API key via `COHERE_API_KEY` or an auth profile for provider `cohere`
- Audio files supported by the Cohere transcription endpoint: `flac`, `mp3`,
  `mpeg`, `mpga`, `ogg`, `wav`

## Install

Once published, install it like any other external OpenClaw plugin:

```bash
openclaw plugins install openclaw-cohere-stt
```

## Recommended auth setup

Use `COHERE_API_KEY` in the runtime environment. This is the simplest path and
matches the plugin manifest's auth metadata.

```bash
export COHERE_API_KEY="your-cohere-api-key"
```

## Minimal audio config

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "cohere", model: "cohere-transcribe-03-2026", language: "ja" }],
      },
    },
  },
}
```

## Example with supported settings

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          cohere: {
            temperature: 0.2,
          },
        },
        models: [
          {
            provider: "cohere",
            model: "cohere-transcribe-03-2026",
            language: "en",
            baseUrl: "https://api.cohere.com/v2",
          },
        ],
      },
    },
  },
}
```

## Alternative auth setup: auth profile

If you want to avoid a provider-wide env var, create an auth profile and point
the audio model entry at it.

`tools.media.audio.models[].profile`:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          {
            provider: "cohere",
            model: "cohere-transcribe-03-2026",
            language: "ja",
            profile: "cohere:default",
          },
        ],
      },
    },
  },
}
```

`auth-profiles.json`:

```json
{
  "version": 1,
  "profiles": {
    "cohere:default": {
      "type": "api_key",
      "provider": "cohere",
      "keyRef": {
        "source": "env",
        "provider": "default",
        "id": "COHERE_API_KEY"
      }
    }
  }
}
```

OpenClaw also supports inline `key` instead of `keyRef`, but env-backed refs are
easier to rotate and keep out of committed config.

## What the plugin sends

The current Cohere transcription docs confirm these request fields:

- `file`
- `model`
- `language`
- `temperature`

This plugin intentionally keeps the request surface to that documented set. It
does not add prompt injection or undocumented multipart fields.

## Config reference

| Key                                                    | Type     | Default                     | Notes                                              |
| ------------------------------------------------------ | -------- | --------------------------- | -------------------------------------------------- |
| `tools.media.audio.models[].provider`                  | `string` | required                    | Must be `cohere`.                                  |
| `tools.media.audio.models[].model`                     | `string` | `cohere-transcribe-03-2026` | Cohere transcription model id.                     |
| `tools.media.audio.models[].language`                  | `string` | unset                       | ISO-639-1 language hint.                           |
| `tools.media.audio.models[].baseUrl`                   | `string` | `https://api.cohere.com/v2` | Optional per-entry override for proxies/gateways.  |
| `tools.media.audio.models[].profile`                   | `string` | unset                       | Optional auth profile id for provider `cohere`.    |
| `tools.media.audio.providerOptions.cohere.temperature` | `number` | unset                       | Optional sampling temperature between `0` and `1`. |

## OpenClaw behavior notes

- This is not realtime STT. It handles pre-recorded audio attachments through
  `tools.media.audio`.
- Transcript output is injected back into the normal OpenClaw reply pipeline as
  `{{Transcript}}` and an `[Audio]` block, same as other audio providers.
- Provider auth follows the normal provider resolution order. In practice,
  `COHERE_API_KEY` or `tools.media.audio.models[].profile` are the useful
  options for this plugin.
- `tools.media.audio.providerOptions.cohere.temperature` is merged from the
  global audio config and the individual model entry, with the entry taking
  precedence.

## Validation

```bash
pnpm install
pnpm run check
```

## References

- Cohere API overview: https://docs.cohere.com/reference/about
- Cohere API reference: https://docs.cohere.com/reference/create-audio-transcription

## Support

If this plugin is useful, you can support maintenance here:

- https://github.com/sponsors/livingghost
