// ===================================================
// いろは — logic.js
// 純粋 JS ロジック（JSX なし）
// config.js / font-list.js の後に読み込む
// ===================================================

// ── config.js から取得 ───────────────────────────────
const { GEMINI_API_KEY, MODE, MODEL, PROXY_URL } = window.IROHA_CONFIG;
const CONFIG = { MODE, MODEL, PROXY_URL };
const FONT_LIST = window.FONT_LIST;

// ── 定数 ─────────────────────────────────────────────
const MAIN_COLORS = [
  { key: "red",      label: "赤",        hint: "#d8453c" },
  { key: "orange",   label: "オレンジ",  hint: "#e8843c" },
  { key: "yellow",   label: "黄",        hint: "#e8c23c" },
  { key: "green",    label: "緑",        hint: "#4ca85f" },
  { key: "blue",     label: "青",        hint: "#3c6fe8" },
  { key: "purple",   label: "紫",        hint: "#8a5ce8" },
  { key: "monotone", label: "モノクロ",      hint: "#5a6271" },
];

const TONE_AXES = [
  { key: "form",   left: "やわらか",   right: "かっちり" },
  { key: "era",    left: "クラシック", right: "モダン" },
  { key: "energy", left: "にぎやか",   right: "静か" },
  { key: "class",  left: "カジュアル", right: "ラグジュアリー" },
];

const ROLE_LABELS = {
  primary: "Primary", secondary: "Secondary",
  accent: "Accent", base: "Base", text: "Text",
};

// ── 色ユーティリティ ──────────────────────────────────
const C = {
  hexToRGB(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0,2),16),
      g: parseInt(h.slice(2,4),16),
      b: parseInt(h.slice(4,6),16),
    };
  },
  hexToHSL(hex) {
    let {r,g,b} = C.hexToRGB(hex);
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; }
    else{
      const d=max-min;
      s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){
        case r: h=((g-b)/d+(g<b?6:0))/6; break;
        case g: h=((b-r)/d+2)/6; break;
        case b: h=((r-g)/d+4)/6; break;
      }
    }
    return {h:h*360,s:s*100,l:l*100};
  },
  hslToHex(h,s,l){
    s/=100; l/=100;
    const a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*c).toString(16).padStart(2,"0");};
    return `#${f(0)}${f(8)}${f(4)}`;
  },
  rgbToCMYK(r,g,b){
    const r1=r/255,g1=g/255,b1=b/255;
    const k=1-Math.max(r1,g1,b1);
    if(k===1) return {c:0,m:0,y:0,k:100};
    return {
      c:Math.round((1-r1-k)/(1-k)*100),
      m:Math.round((1-g1-k)/(1-k)*100),
      y:Math.round((1-b1-k)/(1-k)*100),
      k:Math.round(k*100),
    };
  },
  lum(hex){
    const {r,g,b}=C.hexToRGB(hex);
    const [rs,gs,bs]=[r,g,b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*rs+0.7152*gs+0.0722*bs;
  },
  contrast(a,b){
    const la=C.lum(a),lb=C.lum(b);
    return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);
  },
  textOn(bg){return C.lum(bg)>0.4?"#20242f":"#ffffff";},
  valid(h){return /^#[0-9A-Fa-f]{6}$/.test(h);},
};

// ── フォント動的ロード ────────────────────────────────
const dynLoaded = new Set();
function loadFont(family, weights=[400,700]) {
  if (dynLoaded.has(family)) return;
  dynLoaded.add(family);
  const w = weights.join(";");
  const href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g,"+")}:wght@${w}&display=swap`;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// ── guardPalette（Gemini出力検証） ───────────────────
function guardPalette(palette) {
  const roles = ["primary","secondary","accent","base","text"];
  const result = [...(palette||[])];
  roles.forEach(role => {
    if (!result.find(p=>p.role===role)) {
      result.push({hex:"#888888",role,name:role});
    }
  });
  const validResult = result.map(p=>({...p, hex: C.valid(p.hex)?p.hex:"#888888"}));
  // コントラスト比チェック
  const base = validResult.find(p=>p.role==="base");
  const text = validResult.find(p=>p.role==="text");
  if (base && text) {
    const ratio = C.contrast(base.hex, text.hex);
    if (ratio < 4.5) {
      const baseLum = C.lum(base.hex);
      const {h,s} = C.hexToHSL(text.hex);
      text.hex = baseLum > 0.4 ? C.hslToHex(h,s,18) : C.hslToHex(h,s,92);
    }
  }
  return validResult;
}

// ── resolveFont（フォント検証） ──────────────────────
function resolveFont(family, weight, preferJp=false) {
  const found = FONT_LIST.find(f=>f.family.toLowerCase()===family?.toLowerCase());
  if (!found) {
    const fb = preferJp ? FONT_LIST.find(f=>f.subset==="jp") : FONT_LIST[0];
    return {font: fb, weight: fb.weights[0]};
  }
  const nearest = found.weights.reduce((a,b)=>Math.abs(b-weight)<Math.abs(a-weight)?b:a, found.weights[0]);
  return {font: found, weight: nearest};
}

// ── CSS変数動的適用 ───────────────────────────────────
function applyToCSS(palette) {
  const map = {primary:"--gen-primary",secondary:"--gen-secondary",accent:"--gen-accent",base:"--gen-base",text:"--gen-text"};
  palette.forEach(p=>document.documentElement.style.setProperty(map[p.role], p.hex));
}

// ── クリップボードコピー ──────────────────────────────
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

// ── プロンプト組み立て ────────────────────────────────
function mainColorLabel(key) {
  return MAIN_COLORS.find(c=>c.key===key)?.label || "";
}

function buildPrompt({mainColor,tone,purpose,fontMode,langMode,free}) {
  const parts = [];
  if (mainColor) parts.push(`メインカラーの方向性：${mainColorLabel(mainColor)}`);
  const toneParts = [];
  TONE_AXES.forEach(ax=>{
    const v=tone[ax.key];
    if(v===-1) toneParts.push(`${ax.left}寄り`);
    if(v===1) toneParts.push(`${ax.right}寄り`);
  });
  if (toneParts.length) parts.push(`トンマナ：${toneParts.join("、")}`);
  parts.push(purpose==="print"?"用途：印刷物":"用途：デジタル（Web）");
  parts.push(fontMode==="single"?"フォント：タイトルと本文で同一のフォントを使う":"フォント：タイトルと本文で別のフォントを使う");
  parts.push(langMode==="jp_only"?"フォント言語：日本語フォントのみ":"フォント言語：日本語フォントと英語フォントの組み合わせ");
  if (free?.trim()) parts.push(`自由記入（最優先で反映）：${free.trim()}`);
  if (!parts.length) parts.push("おまかせで、汎用的に使いやすい上質な配色とフォントを提案してください。");
  return parts.join("\n");
}

function buildSystemPrompt(fontCatalog, purpose) {
  return [
    "あなたは日本語UI向けのアートディレクターです。指示に合う「デザインの方向性」を必ず2案提案します。",
    "2案は互いにムード・配色・フォントの方向性に明確な差をつけ、ユーザーが選ぶ意味があるようにします。",
    "各案は配色5色とフォントペアのセットで構成します。",
    "",
    "【配色】",
    "各案の配色は必ず5色で、role を primary / secondary / accent / base / text に1つずつ割り当てます。",
    "base は背景向けの明るい色、text は base 上で十分読める文字色にします（コントラスト比4.5以上を意識）。",
    "name は各色の短い日本語名（例：朱赤、墨、生成り）。",
    "",
    "【フォント】",
    "フォントは必ず次のカタログの family からのみ選びます（存在しない名前を作らない）。",
    "日本語の本文・見出しには subset が jp のフォントを選びます。",
    "bilingual（日英の組み合わせ）の場合は、heading に subset が latin のフォントを、body に subset が jp のフォントを選んでください。",
    `カタログ: ${JSON.stringify(fontCatalog)}`,
    "",
    "【指示の優先順位】",
    "ユーザーの「自由記入」が他の選択（メインカラー・トンマナ）と矛盾する場合は、自由記入を優先します。",
    "",
    purpose==="print"
      ? "【印刷用途】用途が「印刷物」の場合、印刷で再現が難しい高彩度・蛍光色を避け、彩度をやや抑えた配色にします。"
      : "",
    "",
    "【各案に含めるテキスト】",
    "theme … 提案の方向性を表す短い日本語のテーマ名（15文字以内）",
    "reason … なぜこの配色・フォントがその指示に合うかの理由（1〜2文）",
    "fontReason … フォントペア全体の選定理由（1文・タイトルと本文をまとめて）",
  ].filter(Boolean).join("\n");
}

const RESPONSE_SCHEMA = {
  type:"object",
  properties:{
    proposals:{
      type:"array",
      minItems:2,maxItems:2,
      items:{
        type:"object",
        properties:{
          theme:{type:"string"},
          reason:{type:"string"},
          fontReason:{type:"string"},
          palette:{
            type:"array",
            items:{
              type:"object",
              properties:{
                hex:{type:"string"},
                role:{type:"string",enum:["primary","secondary","accent","base","text"]},
                name:{type:"string"},
              },
              required:["hex","role","name"],
            }
          },
          fontPairing:{
            type:"object",
            properties:{
              heading:{type:"object",properties:{family:{type:"string"},weight:{type:"number"}},required:["family","weight"]},
              body:{type:"object",properties:{family:{type:"string"},weight:{type:"number"}},required:["family","weight"]},
            },
            required:["heading","body"],
          }
        },
        required:["theme","reason","fontReason","palette","fontPairing"],
      }
    }
  },
  required:["proposals"],
};

// ── Gemini API 呼び出し（本番化は中身だけ差し替え） ──
async function callGemini(bodyPayload) {
  if (CONFIG.MODE === "proxy") {
    const res = await fetch(CONFIG.PROXY_URL, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) throw new Error(`プロキシエラー HTTP ${res.status}`);
    return await res.json();
  } else {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({}));
      throw new Error(e?.error?.message || `APIエラー HTTP ${res.status}`);
    }
    return await res.json();
  }
}

async function generate(input) {
  const fontCatalog = FONT_LIST.map(({family,subset,category})=>({family,subset,category}));
  const body = {
    system_instruction:{parts:[{text: buildSystemPrompt(fontCatalog, input.purpose)}]},
    contents:[{role:"user",parts:[{text: buildPrompt(input)}]}],
    generationConfig:{
      responseMimeType:"application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.9,
      maxOutputTokens: 900,
    },
  };

  let data;
  try {
    data = await callGemini(body);
  } catch(e) {
    // 1回リトライ
    data = await callGemini(body);
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
  const proposals = parsed.proposals.map(p => {
    const palette = guardPalette(p.palette);
    const needJp = input.langMode === "jp_only";
    const {font: hFont, weight: hW} = resolveFont(p.fontPairing.heading.family, p.fontPairing.heading.weight, needJp);
    let {font: bFont, weight: bW} = resolveFont(p.fontPairing.body.family, p.fontPairing.body.weight, needJp);
    if (input.fontMode === "single") { bFont = hFont; bW = hW; }
    loadFont(hFont.family, hFont.weights);
    if (bFont.family !== hFont.family) loadFont(bFont.family, bFont.weights);
    return {
      ...p,
      palette,
      fontPairing: {
        heading: {family:hFont.family, weight:hW, subset:hFont.subset, category:hFont.category},
        body:    {family:bFont.family, weight:bW, subset:bFont.subset, category:bFont.category},
      },
    };
  });
  return proposals;
}

// ── 定型文プロンプト生成（AI不使用） ─────────────────
function buildDesignPrompt(color, font, purpose) {
  const roleJa = {primary:"メイン",secondary:"サブ",accent:"アクセント",base:"背景",text:"文字"};
  const hexes = color.palette.map(p=>`${roleJa[p.role]}=${p.hex}`).join(", ");
  const kind = purpose==="print" ? "チラシ／印刷物" : "Webサイト";
  return [
    `次の配色とフォントで${kind}のデザイン案を作成してください。`,
    `配色: ${hexes}`,
    `見出しフォント（${font.heading.subset==="jp"?"和文":"欧文"}）: ${font.heading.family} (${font.heading.weight})`,
    `本文フォント（${font.body.subset==="jp"?"和文":"欧文"}）: ${font.body.family} (${font.body.weight})`,
    `メインカラーを主役、アクセントをポイント、背景色を地色、文字色をテキストに使ってください。`,
  ].join("\n");
}

// ── 状態管理 useReducer ──────────────────────────────

// 生成 reducer
const genInitial = {status:"idle", proposals:[], selectedIndex:null, error:null};
function genReducer(state, action) {
  switch(action.type) {
    case "GENERATE_START":   return {...state, status:"loading", error:null, selectedIndex:null};
    case "GENERATE_SUCCESS": return {...state, status:"ready", proposals:action.proposals};
    case "GENERATE_ERROR":   return {...state, status:"error", error:action.error};
    case "SELECT":           return {...state, selectedIndex:action.index};
    case "RESET":            return genInitial;
    default: return state;
  }
}

// お気に入り reducer
const favInitial = {colors:[], fonts:[], selColorId:null, selFontId:null};
function favReducer(state, action) {
  switch(action.type) {
    case "HYDRATE": return {...state, ...action.payload};
    case "ADD_COLOR": {
      if (state.colors.find(c=>c.id===action.item.id)) return state;
      const colors = [action.item, ...state.colors].slice(0,10);
      return {...state, colors, selColorId: state.selColorId || action.item.id};
    }
    case "REMOVE_COLOR": {
      const colors = state.colors.filter(c=>c.id!==action.id);
      return {...state, colors, selColorId: state.selColorId===action.id ? (colors[0]?.id||null) : state.selColorId};
    }
    case "SELECT_COLOR": return {...state, selColorId:action.id};
    case "ADD_FONT": {
      if (state.fonts.find(f=>f.id===action.item.id)) return state;
      const fonts = [action.item, ...state.fonts].slice(0,10);
      return {...state, fonts, selFontId: state.selFontId || action.item.id};
    }
    case "REMOVE_FONT": {
      const fonts = state.fonts.filter(f=>f.id!==action.id);
      return {...state, fonts, selFontId: state.selFontId===action.id ? (fonts[0]?.id||null) : state.selFontId};
    }
    case "SELECT_FONT": return {...state, selFontId:action.id};
    default: return state;
  }
}
