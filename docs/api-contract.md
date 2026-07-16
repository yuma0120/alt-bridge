# ローカルAIサーバー API 契約（MVP）

AltBridge 拡張機能とローカルAI推論サーバーの結合を安定させるため、MVPでは本書の契約を固定する。

## `POST /caption`

画像の説明文を生成する。

### リクエスト

```http
POST /caption
Content-Type: multipart/form-data
Accept: application/json
```

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `image` | File | はい | PNG、JPEG、WebP等の画像ファイル |
| `prompt` | string | いいえ | 説明生成用プロンプト。未指定時は拡張機能側で定めたデフォルトプロンプトを利用する。 |
| `maxSize` | string（整数） | いいえ | 画像の最大辺（px）。拡張機能側が送信前にリサイズするため、サーバー側では参考情報として扱う。 |
| `requestId` | string | いいえ | クライアント・サーバー間のログ照合および結合テストに使う相関ID。 |

サーバー固有のプロンプト指定形式はMVPに持ち込まない。プロンプトは常に `prompt` テキストフィールドで渡す。

### 成功レスポンス

HTTPステータスは `200 OK` とする。

```json
{
  "caption": "赤い自転車が建物の前に置かれている。",
  "confidence": 0.82,
  "model": "example-captioner-1"
}
```

| フィールド | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| `caption` | string | はい | 前後空白を除いて1〜500文字 |
| `confidence` | number | はい | 有限数値かつ `0.0`〜`1.0` |
| `model` | string | いいえ | 使用モデル名。1〜100文字 |

拡張機能は未知のフィールドを無視する。必須フィールドの欠落または制約違反は、サーバー応答形式エラーとして表示する。

### エラーレスポンス

エラー時は次の形式を返す。

```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "画像を読み込めませんでした。"
  }
}
```

MVPで扱う主なステータスコードは以下のとおり。

| HTTPステータス | `error.code` の例 | 用途 |
| --- | --- | --- |
| `400` | `INVALID_IMAGE` | リクエストまたは画像ファイルが不正 |
| `413` | `IMAGE_TOO_LARGE` | 画像サイズが上限を超過 |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | 未対応の画像形式 |
| `422` | `CAPTION_UNAVAILABLE` | 画像を推論できない |
| `500` | `INTERNAL_ERROR` | サーバー内部エラー |
| `503` | `MODEL_UNAVAILABLE` | モデルが未準備または利用不可 |

## 開発用モックサーバー

フロントエンドと実際の推論サーバーを並行開発するため、Express製のモックサーバーを用意する。モックは `POST /caption` に対して有効なダミー画像説明とconfidenceを返し、`GET /health` で疎通確認を提供する。

### `X-Mock-Confidence`

モックサーバーだけが受け付ける開発・テスト用ヘッダー。実際のローカルAIサーバーの契約には含めない。

```http
X-Mock-Confidence: 0.3
```

- ヘッダー未指定時の `confidence` は `0.82`。
- 指定時は、有限数値かつ `0.0`〜`1.0` の値であればレスポンスの `confidence` を上書きする。
- 値が不正な場合は `400 Bad Request` と `INVALID_MOCK_CONFIDENCE` を返す。

このヘッダーにより、UIのconfidence表示を高・中・低それぞれで結合テストできる。分類境界そのものは、拡張機能側のconfidence変換関数のユニットテストで網羅する。

### `GET /health`

モックおよび実際のローカルAIサーバーは、可能であれば次の疎通確認エンドポイントを提供する。

```json
{
  "status": "ok"
}
```

拡張機能は疎通失敗時、キャプション生成・alt評価の操作を無効化し、ローカルAIサーバーのセットアップガイドへの導線を表示する。
