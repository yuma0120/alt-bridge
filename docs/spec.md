# AltBridge Specification

## Purpose

AltBridge generates optional AI-assisted image descriptions for web pages without changing the source document.

## Non-goals

- Replace an existing `alt` attribute.
- Modify page HTML or DOM.
- Upload images to an external service by default.
- Analyze CSS `background-image` in the MVP.

## Design principles

1. **Never alter alt text or DOM.** Generated content exists only inside the extension popup or optional overlay.
2. **Local-first.** Image data stays on the user’s machine unless they explicitly opt into another provider in a future release.
3. **Provider independence.** The extension depends only on `CaptionProvider`, not a particular model or inference backend.

## Image detection

### Included

- `img` elements, including lazy-loaded images.
- Images inserted or changed dynamically; the content script observes relevant DOM mutations.

### Classification

- **Missing alt:** no `alt` attribute; an image may need a description.
- **Empty alt:** `alt=""`; this is a neutral category because it may be deliberately decorative.
- **Possibly weak alt:** filename-like text, generic terms such as `image` or `photo`, URLs, or strings shorter than three characters.
- **Alt present:** any other alt text.

`alt=""` is not automatically an error. Nearby text, image dimensions, `figure`/`figcaption`, and whether the image is inside a link or button are useful future signals, but they do not establish intent with certainty.

### Excluded

- Icons no larger than 16 × 16 px.
- Small data-URI images.
- SVG icons and favicons.
- Images explicitly marked with `role="presentation"` or `aria-hidden="true"`.
- CSS background images.

## MVP features

### Caption generation

- Generate only after a deliberate user action; automatic generation is off by default.
- Use an editable language-specific prompt preset by default.
- Keep cached results isolated by image URL, endpoint, model, prompt, and image-size setting.

### Popup

The browser action popup groups page images by classification and shows an image preview, original alt text, classification reason, and a **Generate AI description** action. It also shows a natural-language confidence warning instead of a raw score.

### Context menu

Right-clicking an image provides **Generate AI description**.

### Settings

- Local server endpoint, defaulting to the Ollama proxy at `http://127.0.0.1:8788`.
- Optional model name; an empty field uses the server default.
- Editable language-specific prompt.
- Maximum image size before transfer.
- Low and high confidence thresholds.

## Internationalization

AltBridge localizes both its UI and default caption prompt. This avoids an English-only control surface while a user expects captions in another language.

### Initial languages

- English (`en`)
- Japanese (`ja`)

### Language selection

The language setting offers `Auto`, `English`, and `Japanese`.

- `Auto` is the default and uses the browser UI language, with English as the fallback.
- An explicit setting overrides browser detection.
- The selected language is stored in `chrome.storage.sync`.
- Changing the language updates localized UI strings and the built-in prompt preset.

### UI strings

All user-visible extension strings, including popup labels, settings, errors, classification reasons, and confidence messages, are loaded from language dictionaries. Source files must use stable message keys rather than embedding translated strings.

### Caption prompts and output language

Each supported language has a built-in prompt preset. A preset explicitly requests that the model return the caption in the selected language.

A user-edited custom prompt is never translated or overwritten automatically. The settings UI identifies it as custom and provides an explicit action to restore the current-language preset.

### Provider behavior

The `CaptionProvider` request continues to send a plain `prompt` field. Providers remain language-agnostic; language selection and prompt construction belong to the extension.

### Accessibility and fallback

Localized strings retain the same semantic meaning and accessible labels. If a requested locale has no dictionary or prompt preset, AltBridge falls back to English without blocking caption generation.

## Confidence display

| Range | UI treatment |
| --- | --- |
| High | “AI-generated description” |
| Medium | “AI-generated description (some details may be uncertain)” |
| Low | “The AI could not recognize this image reliably. Treat this as a reference only.” |

Thresholds are configurable. The default low/high values are selected for the current provider and can be adjusted in Settings.

## Local server

The extension uses the `POST /caption` contract documented in [api-contract.md](./api-contract.md). The supplied Ollama proxy defaults to `llava:7b` and can use other compatible vision models; the supplied Express mock server is only for development and integration testing.

## Privacy and accessibility

Generated captions are supplemental information. Existing accessibility metadata is preserved, and no page content is modified. The default deployment only sends a user-selected image to the configured local endpoint.

## LAN servers

A LAN server is network-local but remains a separate privacy boundary because images leave the current device. Loopback endpoints are the default. A non-loopback endpoint requires user acknowledgement and an access token, which is sent as a bearer token and stored only in `chrome.storage.local`. The supplied proxy binds to loopback by default; LAN exposure requires `HOST=0.0.0.0` and `AUTH_TOKEN`. Production builds do not expose debug images or request-detail logs.

## Server unavailable behavior

If the extension cannot reach the configured local server, it disables caption-generation controls, avoids disruptive errors, and directs the user to Settings and setup documentation.
