# AltBridge

AltBridge generates optional AI-assisted image descriptions without changing the page DOM or existing `alt` attributes.

## What it does

- Detects and classifies page images without modifying the page.
- Generates descriptions only after an explicit user action.
- Uses a configurable local Ollama proxy by default.
- Supports English and Japanese UI and prompt presets.
- Keeps generated results separate by image, endpoint, model, prompt, and image-size setting.

## Quick start

Requirements: Node.js 22+, Ollama, and a vision-capable model.

```bash
npm install
ollama pull gemma3:4b
npm run ollama-proxy
```

In another terminal, build the extension and then load `dist` as an unpacked extension in Chrome or Edge Developer mode.

```bash
npm run build
```

The default extension endpoint is `http://127.0.0.1:8788`. Leave the model field empty to use the proxy default, `gemma3:4b`.

## Development

```bash
npm test
npm run mock-server
```

The mock server runs at `http://127.0.0.1:8787`. It supports the development-only `X-Mock-Confidence` header.

## Security and privacy

Images are sent only after the user selects **Generate AI description**. The default proxy binds only to `127.0.0.1`; production builds do not retain or expose submitted images for debugging.

A LAN server is network-local but still a separate privacy boundary because images leave the current device. AltBridge requires explicit consent and an access token for non-loopback endpoints. Tokens are stored locally in the browser profile, not in sync storage.

## Documentation

- [Specification](./docs/spec.md)
- [Local and LAN setup](./docs/setup.md)
- [Local AI server API contract](./docs/api-contract.md)
- [CI workflow](./.github/workflows/ci.yml)

## AI Assistance & Tooling

During the development of AltBridge, I utilized AI assistance (GPT/Codex-based tooling) to accelerate the engineering process.

- **Architectural Design:** Used AI for brainstorming the proxy-based "local-first" architecture, which helped decouple the extension UI from the inference backend.
- **Scaffolding:** Leveraged AI to generate boilerplate code for the Chrome Extension manifest, React components, and Node.js/Express server structure.
- **Debugging & Refactoring:** Utilized AI to debug complex `multipart/form-data` buffer parsing issues and to refactor the codebase for internationalization (i18n).

## License

Released under the [MIT License](./LICENSE).
