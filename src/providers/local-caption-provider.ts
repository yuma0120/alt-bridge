import type { CaptionProvider, CaptionRequest, CaptionResponse } from "../shared/types";

export class LocalCaptionProvider implements CaptionProvider {
  constructor(private readonly endpoint: string) {}
  async caption(request: CaptionRequest): Promise<CaptionResponse> {
    const image = request.image instanceof Blob ? request.image : new Blob([request.image]);
    const form = new FormData();
    form.append("image", image, "image.png");
    if (request.prompt) form.append("prompt", request.prompt);
    if (request.maxSize) form.append("maxSize", String(request.maxSize));
    form.append("requestId", crypto.randomUUID());
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/caption`, { method: "POST", body: form, headers: { Accept: "application/json" } });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(payload) || `ローカルAIサーバーがHTTP ${response.status}を返しました`);
    if (!isCaptionResponse(payload)) throw new Error("ローカルAIサーバーの応答形式が不正です");
    return payload;
  }
}

function isCaptionResponse(value: unknown): value is CaptionResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.caption === "string" && result.caption.trim().length > 0 && result.caption.length <= 500 && typeof result.confidence === "number" && Number.isFinite(result.confidence) && result.confidence >= 0 && result.confidence <= 1 && (result.model === undefined || typeof result.model === "string");
}
function errorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const error = (value as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : undefined;
}
