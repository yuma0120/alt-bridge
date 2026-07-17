import type { CaptionProvider, CaptionRequest, CaptionResponse } from "../shared/types";

export class LocalCaptionProvider implements CaptionProvider {
  constructor(private readonly endpoint: string) {}
  async caption(request: CaptionRequest): Promise<CaptionResponse> {
    const image = request.image instanceof Blob ? request.image : new Blob([request.image]);
    const form = new FormData();
    form.append("image", image, "image.png");
    if (request.prompt) form.append("prompt", request.prompt);
    if (request.maxSize) form.append("maxSize", String(request.maxSize));
    if (request.model?.trim()) form.append("model", request.model.trim());
    form.append("requestId", crypto.randomUUID());
    const headers: HeadersInit = { Accept: "application/json" };
    if (request.authToken?.trim()) headers.Authorization = `Bearer ${request.authToken.trim()}`;
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/caption`, {
      method: "POST",
      body: form,
      headers,
    });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(payload) || `Local AI server returned HTTP ${response.status}`);
    if (!isCaptionResponse(payload)) throw new Error("The local AI server returned an invalid response");
    return payload;
  }
}

function isCaptionResponse(value: unknown): value is CaptionResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.caption === "string" &&
    result.caption.trim().length > 0 &&
    result.caption.length <= 500 &&
    typeof result.confidence === "number" &&
    Number.isFinite(result.confidence) &&
    result.confidence >= 0 &&
    result.confidence <= 1 &&
    (result.confidenceSource === undefined ||
      result.confidenceSource === "provider" ||
      result.confidenceSource === "heuristic") &&
    (result.confidenceReasons === undefined ||
      (Array.isArray(result.confidenceReasons) &&
        result.confidenceReasons.every((reason) => typeof reason === "string"))) &&
    (result.model === undefined || typeof result.model === "string")
  );
}
function errorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const error = (value as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : undefined;
}
