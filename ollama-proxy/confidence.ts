export interface HeuristicConfidence {
  confidence: number;
  confidenceReasons: string[];
}

const NO_IMAGE_PATTERN =
  /(?:please provide (?:the )?image|no image (?:was )?(?:provided|attached)|i (?:cannot|can’t|can not) (?:see|view)|unable to (?:see|view)|cannot access (?:the )?image)/i;
const UNCERTAINTY_PATTERN = /\b(?:may|might|possibly|appears?|seems?|unclear|unsure|cannot determine)\b/gi;
const VISUAL_DETAIL_PATTERN =
  /\b(?:man|woman|person|people|child|dog|cat|car|building|tree|street|table|room|sky|water|food|text|logo|photo|image|scene|red|blue|green|black|white)\b|(?:男性|女性|人|子供|犬|猫|車|建物|木|道路|テーブル|部屋|空|水|食べ物|テキスト|ロゴ|写真|画像|シーン|赤|青|緑|黒|白)/i;

export function estimateCaptionConfidence(caption: string): HeuristicConfidence {
  const text = caption.trim();
  if (NO_IMAGE_PATTERN.test(text))
    return {
      confidence: 0.05,
      confidenceReasons: ["The model indicates that it did not receive or cannot view an image."],
    };

  let confidence = 0.65;
  const reasons: string[] = [];
  if (text.length < 30) {
    confidence -= 0.18;
    reasons.push("The response is unusually short.");
  }
  if (text.length > 420) {
    confidence -= 0.1;
    reasons.push("The response is unusually long.");
  }
  const uncertaintyCount = [...text.matchAll(UNCERTAINTY_PATTERN)].length;
  if (uncertaintyCount) {
    confidence -= Math.min(uncertaintyCount, 3) * 0.06;
    reasons.push("The response contains uncertainty language.");
  }
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (words.length >= 6 && new Set(words).size / words.length < 0.5) {
    confidence -= 0.1;
    reasons.push("The response has substantial word repetition.");
  }
  if (VISUAL_DETAIL_PATTERN.test(text)) {
    confidence += 0.05;
    reasons.push("The response includes concrete visual details.");
  }
  return {
    confidence: Math.max(0.05, Math.min(0.95, Number(confidence.toFixed(2)))),
    confidenceReasons: reasons.length ? reasons : ["No low-reliability response patterns were detected."],
  };
}
