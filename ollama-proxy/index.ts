import express from "express";
import { estimateCaptionConfidence } from "./confidence";
import { parseMultipart } from "../server-utils/multipart";

const app = express();
const port = Number(process.env.PORT ?? 8788);
const ollamaUrl = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
const defaultModel = process.env.DEFAULT_MODEL ?? "llava:7b";
let lastImage: { bytes: Buffer; mimeType: string; requestId: string } | undefined;

app.get("/debug/last-image", (_request, response) => {
  if (!lastImage) return response.status(404).json({ error: { code: "NO_DEBUG_IMAGE", message: "No image has been sent to Ollama since the proxy started." } });
  response.set({ "Cache-Control": "no-store", "X-AltBridge-Request-Id": lastImage.requestId });
  return response.type(lastImage.mimeType).send(lastImage.bytes);
});

app.get("/health", async (_request, response) => {
  try {
    const upstream = await fetch(`${ollamaUrl}/api/tags`);
    return response.status(upstream.ok ? 200 : 503).json({ status: upstream.ok ? "ok" : "unavailable" });
  } catch {
    return response.status(503).json({ status: "unavailable" });
  }
});

app.post("/caption", express.raw({ type: () => true, limit: "10mb" }), async (request, response) => {
  if (!request.headers["content-type"]?.includes("multipart/form-data")) return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "Send an image using multipart/form-data." } });
  let payload: ReturnType<typeof parseMultipart>;
  try { payload = parseMultipart(request.body, request.header("content-type")); } catch { return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "Unable to parse multipart/form-data." } }); }
  if (!payload.image?.length) return response.status(400).json({ error: { code: "INVALID_IMAGE", message: "The image field is required." } });
  const model = payload.fields.model?.trim() || defaultModel;
  const requestId = payload.fields.requestId?.trim() || crypto.randomUUID();
  const mimeType = detectImageMimeType(payload.image);
  lastImage = { bytes: payload.image, mimeType, requestId };
  console.log(`[${requestId}] Sending ${payload.image.length} bytes (${mimeType}) to Ollama with model "${model}".`);
  console.log(`[${requestId}] View the exact image sent: http://127.0.0.1:${port}/debug/last-image`);
  try {
    const upstream = await fetch(`${ollamaUrl}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "user", content: payload.fields.prompt ?? "", images: [payload.image.toString("base64")] }], stream: false }) });
    const result = await upstream.json().catch(() => ({})) as { message?: { content?: unknown }; error?: unknown };
    if (!upstream.ok) {
      const detail = typeof result.error === "string" ? result.error : "Ollama could not generate a description.";
      const unavailable = /model.*(not found|does not exist)|unknown model/i.test(detail);
      console.error(`[${requestId}] Ollama error: ${detail}`);
      return response.status(unavailable ? 422 : 503).json({ error: { code: unavailable ? "UNSUPPORTED_MODEL" : "MODEL_UNAVAILABLE", message: detail } });
    }
    if (typeof result.message?.content !== "string" || !result.message.content.trim()) return response.status(422).json({ error: { code: "CAPTION_UNAVAILABLE", message: "Ollama did not return a description." } });
    const caption = result.message.content.trim().slice(0, 500);
    const reliability = estimateCaptionConfidence(caption);
    console.log(`[${requestId}] Ollama returned a ${caption.length}-character caption with heuristic reliability ${reliability.confidence}.`);
    return response.json({ caption, confidence: reliability.confidence, confidenceSource: "heuristic", confidenceReasons: reliability.confidenceReasons, model });
  } catch {
    console.error(`[${requestId}] Unable to connect to Ollama at ${ollamaUrl}.`);
    return response.status(503).json({ error: { code: "MODEL_UNAVAILABLE", message: "Unable to connect to Ollama." } });
  }
});

function detectImageMimeType(image: Buffer): string {
  if (image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (image.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (image.subarray(0, 6).toString("ascii") === "GIF87a" || image.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  if (image.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "application/octet-stream";
}

app.listen(port, "127.0.0.1", () => console.log(`AltBridge Ollama proxy: http://127.0.0.1:${port}`));
