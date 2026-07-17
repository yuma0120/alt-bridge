import express from "express";
import { parseMultipart } from "../server-utils/multipart";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.post("/caption", express.raw({ type: () => true, limit: "10mb" }), (request, response) => {
  const raw = request.header("X-Mock-Confidence");
  const confidence = raw === undefined ? 0.82 : Number(raw);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    return response
      .status(400)
      .json({ error: { code: "INVALID_MOCK_CONFIDENCE", message: "X-Mock-Confidence must be a number from 0 to 1." } });
  if (!request.headers["content-type"]?.includes("multipart/form-data"))
    return response
      .status(400)
      .json({ error: { code: "INVALID_IMAGE", message: "Send an image using multipart/form-data." } });
  const { fields } = parseMultipart(request.body, request.header("content-type"));
  return response.json({
    caption: "This is an image description returned by the mock server.",
    confidence,
    model: fields.model?.trim() || "altbridge-mock-1",
  });
});
app.listen(port, "127.0.0.1", () => console.log(`AltBridge mock server: http://127.0.0.1:${port}`));
