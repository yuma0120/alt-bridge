# AltBridge

AltBridge generates optional, AI-assisted image descriptions without changing the original page, its HTML, or existing `alt` attributes.

## Run the MVP

Install dependencies with Node.js 22 or later.

```bash
npm install
```

For normal use with Ollama, download a vision model and start the local proxy.

```bash
ollama pull llava:7b
npm run ollama-proxy
```

Build the extension in another terminal.

```bash
npm run build
```

Enable Developer mode in the Chrome or Edge extensions page, then choose **Load unpacked** and select `dist`. The default endpoint is the Ollama proxy at `http://127.0.0.1:8788`.

Images are sent to the local server only after the user explicitly selects **Generate AI description**. AltBridge never changes page DOM or `alt` attributes.

The model name is optional in Settings. When it is empty, the proxy uses its default model (`llava:7b`); a supplied name is passed to Ollama as-is. The proxy sends images through Ollama’s structured `/api/chat` message format.

While the Ollama proxy is running, every caption request is logged with its request ID, model, image byte size, and media type. To inspect the exact in-memory image sent to Ollama, open [http://127.0.0.1:8788/debug/last-image](http://127.0.0.1:8788/debug/last-image). This debug image is replaced by the next request and is cleared when the proxy stops.

For development only, start the mock server with `npm run mock-server`. It listens on `http://127.0.0.1:8787`; change the endpoint in Settings to use it.

See the [API contract](./docs/api-contract.md) for the local-server protocol and the mock-only `X-Mock-Confidence` header.

## License

This project is released under the [MIT License](./LICENSE).
