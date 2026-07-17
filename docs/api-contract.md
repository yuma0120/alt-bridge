# Local AI Server API Contract (MVP)

This document fixes the MVP contract between AltBridge and a local image-captioning server.

## `POST /caption`

Generate a description for one image.

```http
POST /caption
Content-Type: multipart/form-data
Accept: application/json
```

### Request fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `image` | File | Yes | An image such as PNG, JPEG, or WebP. |
| `prompt` | string | No | Captioning prompt. The extension supplies its default prompt when none is configured. |
| `maxSize` | string (integer) | No | Maximum image edge in pixels. The extension resizes before upload; the server may treat this as informational. |
| `requestId` | string | No | Correlation ID for logs and integration tests. |
| `model` | string | No | Requested inference model. The server chooses its default when omitted. |

The MVP uses `prompt` as the only prompt field. Server-specific prompt formats are out of scope.

### Successful response

Return `200 OK`.

```json
{
  "caption": "A red bicycle is parked in front of a building.",
  "confidence": 0.82,
  "confidenceSource": "heuristic",
  "confidenceReasons": ["The response includes concrete visual details."],
  "model": "example-captioner-1"
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `caption` | string | Yes | 1–500 characters after trimming. |
| `confidence` | number | Yes | A finite number from 0.0 through 1.0. |
| `confidenceSource` | string | No | `provider` for a model-supplied score, or `heuristic` for a response-quality estimate. |
| `confidenceReasons` | string[] | No | Human-readable signals used by a heuristic estimate. |
| `model` | string | No | Actual model name, 1–100 characters. |

The extension ignores unknown fields. Missing or invalid required fields are treated as an invalid server response.

Ollama does not provide a confidence score. Its proxy returns `confidenceSource: "heuristic"` and estimates response reliability from observable response patterns. This is not a measure of image-caption accuracy.

### Error response

```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "The image could not be read."
  }
}
```

| HTTP status | `error.code` | Meaning |
| --- | --- | --- |
| `400` | `INVALID_IMAGE` | Invalid request or image file. |
| `413` | `IMAGE_TOO_LARGE` | Image exceeds the size limit. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Unsupported image format. |
| `422` | `CAPTION_UNAVAILABLE` | The image cannot be captioned. |
| `422` | `UNSUPPORTED_MODEL` | The requested model is unavailable on the server. |
| `500` | `INTERNAL_ERROR` | Server-side failure. |
| `503` | `MODEL_UNAVAILABLE` | The model is not ready or the server is unavailable. |

## Model selection

`LocalCaptionProvider` does not depend on a particular inference backend or model. The supplied Ollama proxy defaults to `llava:7b` and can use other compatible vision models such as `moondream` or `bakllava`; any local implementation may be used as long as it follows this contract.

- Set the optional request `model` field to request a model.
- Return the actual model through the optional response `model` field.
- Return `422 UNSUPPORTED_MODEL` when the requested model cannot be used.
- The extension saves an optional model name in Settings. An empty value means “use the server default.”

## Development mock server

The Express mock server allows the extension and a real inference server to be developed in parallel. It exposes `POST /caption` and `GET /health`.

### `X-Mock-Confidence`

This development-only header is accepted by the mock server and is not part of the real local-server contract.

```http
X-Mock-Confidence: 0.3
```

- Without the header, the mock returns `confidence: 0.82`.
- With a finite value from 0.0 through 1.0, the mock returns that value as `confidence`.
- An invalid value returns `400 INVALID_MOCK_CONFIDENCE`.
- A supplied multipart `model` field is echoed in the mock response.

Use this header to exercise low, medium, and high confidence UI states in integration tests. Cover exact confidence boundaries with unit tests.

### `GET /health`

The mock server and production local server should return:

```json
{ "status": "ok" }
```

When the health check fails, the extension disables captioning controls and guides the user to local-server setup.
