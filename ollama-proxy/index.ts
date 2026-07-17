import express from "express";
import { estimateCaptionConfidence } from "./confidence";
import { parseMultipart } from "../server-utils/multipart";

const app = express();
const port = Number(process.env.PORT ?? 8788);
const host = process.env.HOST ?? "127.0.0.1";
const authToken = process.env.AUTH_TOKEN;
const ollamaUrl = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
const defaultModel = process.env.DEFAULT_MODEL ?? "llava:7b";

function authorized(request: express.Request): boolean { return !authToken || request.header("authorization") === `Bearer ${authToken}`; }
function rejectUnauthorized(response: express.Response): express.Response { return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid bearer token is required." } }); }

app.get("/health", async (request, response) => {
  if (!authorized(request)) return rejectUnauthorized(response);
  try {
    const upstream = await fetch(`${ollamaUrl}/api/tags`);
    return response.status(upstream.ok ? 200 : 503).json({ status: upstream.ok ? "ok" : "unavailable" });
  } catch { return response.status(503).json({ status: "unavailable" }); }
});

app.post("/caption", express.raw({ type: () => true, limit: "10mb" }), async (request, response) => {
  if (!authorized(request)) return rejectUnauthorized(response);
  if (!request.headers["content-type"]?.includes("multipart/form-data")) return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "Send an image using multipart/form-data." } });
  let payload: ReturnType<typeof parseMultipart>;
  try { payload = parseMultipart(request.body, request.header("content-type")); } catch { return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "Unable to parse multipart/form-data." } }); }
  if (!payload.image?.length) return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "The image field is required." } });
  const model = payload.fields.model?.trim() || defaultModel;
  try {
    const upstream = await fetch(`${ollamaUrl}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "user", content: payload.fields.prompt ?? "", images: [payload.image.toString("base64")] }], stream: false }) });
    const result = await upstream.json().catch(() => ({})) as { message?: { content?: unknown }; error?: unknown };
    if (!upstream.ok) {
      const detail = typeof result.error === "string" ? result.error : "Ollama could not generate a description.";
      const unavailable = /model.*(not found|does not exist)|unknown model/i.test(detail);
      return response.status(unavailable ? 422 : 503).json({ error: { code: unavailable ? "UNSUPPORTED_MODEL" : "MODEL_UNAVAILABLE", message: detail } });
    }
    if (typeof result.message?.content !== "string" || !result.message.content.trim()) return response.status(422).json({ error: { code: "CAPTION_UNAVAILABLE", message: "Ollama did not return a description." } });
    const caption = result.message.content.trim().slice(0, 500);
    const reliability = estimateCaptionConfidence(caption);
    return response.json({ caption, confidence: reliability.confidence, confidenceSource: "heuristic", confidenceReasons: reliability.confidenceReasons, model });
  } catch { return response.status(503).json({ error: { code: "MODEL_UNAVAILABLE", message: "Unable to connect to Ollama." } }); }
});

app.listen(port, host, () => console.log(`AltBridge Ollama proxy listening on http://${host}:${port}`));
