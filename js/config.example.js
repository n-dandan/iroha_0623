// config.example.js
// ★ このファイルは Git に含める雛形。キーは空のまま。
// ★ 実際に使う config.js はこのファイルをコピーしてキーを入力し、
//    .gitignore で除外する（Git にコミットしない）。

window.IROHA_CONFIG = {
  GEMINI_API_KEY: "AQ.Ab8RN6ItZO0lVGXPrHwAvwVsSW8zHHxVcF0qcnpFWJA8WnCvnA",   // Google AI Studio から取得したキーを入力
  MODE:      "direct",  // "direct"（課題提出版） | "proxy"（公開版）
  MODEL:     "gemini-3.1-flash-lite",
  PROXY_URL: "/api/generate.php",  // MODE="proxy" のときだけ使う
};
