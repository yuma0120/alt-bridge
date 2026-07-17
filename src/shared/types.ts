export type ImageCategory = "missing-alt" | "empty-alt" | "suspicious-alt" | "valid-alt" | "excluded";
export type SupportedLocale = "en" | "ja";
export type LanguagePreference = "auto" | SupportedLocale;
export type PromptMode = "preset" | "custom";
export interface ImageRecord { id: string; src: string; alt: string | null; category: ImageCategory; reason: string; width: number; height: number; }
export interface CaptionRequest { image: Blob | ArrayBuffer; prompt?: string; maxSize?: number; model?: string; authToken?: string; }
export interface CaptionResponse { caption: string; confidence: number; confidenceSource?: "provider" | "heuristic"; confidenceReasons?: string[]; model?: string; }
export interface CaptionProvider { caption(request: CaptionRequest): Promise<CaptionResponse>; }
export interface Settings { endpoint: string; model: string; authToken: string; lanConsent: boolean; language: LanguagePreference; promptMode: PromptMode; prompt: string; maxSize: number; lowConfidenceThreshold: number; highConfidenceThreshold: number; }
export interface CachedCaption extends CaptionResponse { createdAt: number; }
export type ExtensionMessage = { type: "getImages" } | { type: "captionUrl"; src: string; force?: boolean } | { type: "health" };
