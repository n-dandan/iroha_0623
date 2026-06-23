// data/font-list.js
// font-selector で選定したフォントの固定リスト
// app.js から window.FONT_LIST として参照する

window.FONT_LIST = [
  // 日本語（subset: "jp"）
  { family: "Noto Sans JP",        category: "sans-serif", subset: "jp",    weights: [400, 500, 700, 900] },
  { family: "Zen Kaku Gothic New", category: "sans-serif", subset: "jp",    weights: [400, 500, 700] },
  { family: "M PLUS Rounded 1c",   category: "sans-serif", subset: "jp",    weights: [400, 700, 800] },
  { family: "Noto Serif JP",       category: "serif",      subset: "jp",    weights: [400, 700] },
  { family: "Shippori Mincho",     category: "serif",      subset: "jp",    weights: [400, 700, 800] },
  { family: "Zen Maru Gothic",     category: "sans-serif", subset: "jp",    weights: [400, 500, 700] },
  { family: "Kosugi Maru",         category: "sans-serif", subset: "jp",    weights: [400] },
  { family: "Sawarabi Mincho",     category: "serif",      subset: "jp",    weights: [400] },
  // 欧文（subset: "latin"）
  { family: "Playfair Display",    category: "serif",      subset: "latin", weights: [400, 500, 700, 900] },
  { family: "Poppins",             category: "sans-serif", subset: "latin", weights: [400, 500, 600, 700] },
  { family: "Archivo",             category: "sans-serif", subset: "latin", weights: [400, 500, 700] },
  { family: "Space Mono",          category: "monospace",  subset: "latin", weights: [400, 700] },
  { family: "Inter",               category: "sans-serif", subset: "latin", weights: [400, 500, 600, 700] },
  { family: "Montserrat",          category: "sans-serif", subset: "latin", weights: [400, 500, 700] },
  { family: "Cormorant Garamond",  category: "serif",      subset: "latin", weights: [400, 500, 600, 700] },
];
