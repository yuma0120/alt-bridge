# Local and LAN setup

## Local Ollama proxy

The default proxy listens only on `127.0.0.1:8788` and forwards requests to Ollama at `127.0.0.1:11434`.

```bash
ollama pull gemma3:4b
npm run ollama-proxy
```

Load the built extension and keep its endpoint set to `http://127.0.0.1:8788`.

## LAN proxy

A LAN server receives images from another device. Treat it as a deliberate, authenticated connection rather than as the default local setup.

1. Set a strong random `AUTH_TOKEN` on the server.
2. Bind the proxy explicitly with `HOST=0.0.0.0`.
3. Set the extension endpoint to the server address.
4. Enter the same token in Settings and acknowledge the LAN image-transfer notice.

Example environment values:

```text
HOST=0.0.0.0
AUTH_TOKEN=replace-with-a-strong-random-token
OLLAMA_URL=http://127.0.0.1:11434
DEFAULT_MODEL=gemma3:4b
```

The proxy checks `Authorization: Bearer <token>` on both `/health` and `/caption` when `AUTH_TOKEN` is set. Prefer HTTPS or another trusted encrypted transport when the LAN is not fully trusted.

## Language and prompt settings

Settings offers `Auto`, `English`, and `Japanese`. `Auto` follows the browser UI language and falls back to English. Each supported language has a built-in prompt that asks the model to answer in that language.

Editing the prompt marks it as custom. Changing the UI language does not overwrite a custom prompt; use the prompt-preset action to restore one explicitly.

## Validation

```bash
npm run build
npm test
```

The extension build produces a single-file `dist/content.js`, which is required because Chrome content scripts cannot execute ES module imports.
