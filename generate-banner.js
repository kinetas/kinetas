const fs = require('fs');

const FONT = {
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'B':["11110","10001","10001","11110","10001","10001","11110"],
  'C':["01111","10000","10000","10000","10000","10000","01111"],
  'D':["11110","10001","10001","10001","10001","10001","11110"],
  'E':["11111","10000","10000","11110","10000","10000","11111"],
  'F':["11111","10000","10000","11110","10000","10000","10000"],
  'G':["01111","10000","10000","10111","10001","10001","01111"],
  'H':["10001","10001","10001","11111","10001","10001","10001"],
  'I':["11111","00100","00100","00100","00100","00100","11111"],
  'K':["10001","10010","10100","11000","10100","10010","10001"],
  'L':["10000","10000","10000","10000","10000","10000","11111"],
  'M':["10001","11011","10101","10001","10001","10001","10001"],
  'N':["10001","11001","10101","10011","10001","10001","10001"],
  'O':["01110","10001","10001","10001","10001","10001","01110"],
  'P':["11110","10001","10001","11110","10000","10000","10000"],
  'R':["11110","10001","10001","11110","10100","10010","10001"],
  'S':["01111","10000","10000","01110","00001","00001","11110"],
  'T':["11111","00100","00100","00100","00100","00100","00100"],
  'U':["10001","10001","10001","10001","10001","10001","01110"],
  'V':["10001","10001","10001","10001","01010","01010","00100"],
  'X':["10001","10001","01010","00100","01010","10001","10001"],
  '[':["01110","01000","01000","01000","01000","01000","01110"],
  ']':["01110","00010","00010","00010","00010","00010","01110"],
  '_':["00000","00000","00000","00000","00000","00000","11111"],
  'J':["01111","00001","00001","00001","10001","10001","01110"],
  'Q':["01110","10001","10001","10001","10101","10011","01111"],
  'W':["10001","10001","10101","10101","10101","10101","01010"],
  '+':["00100","00100","11111","00100","00100","00000","00000"],
  '#':["01010","01010","11111","01010","11111","01010","01010"],
  '-':["00000","00000","00000","11111","00000","00000","00000"],
  'Y':["10001","10001","01010","00100","00100","00100","00100"],
  'Z':["11111","00001","00010","00100","01000","10000","11111"],
  '0':["01110","10001","10001","10001","10001","10001","01110"],
  '1':["00100","01100","00100","00100","00100","00100","01110"],
  '2':["01110","10001","00001","00110","01000","10000","11111"],
  '3':["01110","00001","00001","00110","00001","00001","01110"],
  '4':["00010","00110","01010","10010","11111","00010","00010"],
  '5':["11111","10000","10000","11110","00001","00001","11110"],
  '6':["01110","10000","10000","11110","10001","10001","01110"],
  '7':["11111","00001","00010","00100","01000","01000","01000"],
  '8':["01110","10001","10001","01110","10001","10001","01110"],
  '9':["01110","10001","10001","01111","00001","00001","01110"],
};

function getPixels(text, px, gap, x0, y0) {
  const pts = [];
  for (let ci = 0; ci < text.length; ci++) {
    const rows = FONT[text[ci].toUpperCase()] || FONT[' '];
    const ox = x0 + ci * (5 * px + gap);
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (rows[r][c] === '1')
          pts.push({ x: ox + c * px, y: y0 + r * px, row: r, px });
  }
  return pts;
}

// ── THEMES ────────────────────────────────────────────────
const DARK  = { bg: '#050a05', px: '#00ff41', sub: '#00d23c', hi: '#c8ffd7', barOff: '#003c0f' };
const LIGHT = { bg: '#f0fdf4', px: '#006b21', sub: '#005a1a', hi: '#c8ffd7', barOff: '#a7f3c0' };

// ── SHARED ────────────────────────────────────────────────
const BPX = 5, BM = BPX * 2;
function bracketRects(bx, by, dx, dy) {
  const r = [];
  for (let i = 0; i < 5; i++) r.push([bx + i*BPX*dx, by,           BPX-1, BPX-1]);
  for (let j = 1; j < 4; j++) r.push([bx,             by + j*BPX*dy, BPX-1, BPX-1]);
  return r;
}

// ── BANNER ────────────────────────────────────────────────
function generateBanner(theme, suffix) {
  const W = 860, H = 180;
  const PX1 = 7, G1 = 2, MAIN_TEXT = 'DEVELOPER_LIFE', MAIN_Y = 30;
  const PX2 = 4, G2 = 2, SUB_TEXT  = 'HAS ENTERED THE PROFILE', SUB_Y = 95;

  const mainX = Math.round((W - (MAIN_TEXT.length * (5*PX1+G1) - G1)) / 2);
  const subX  = Math.round((W - (SUB_TEXT.length  * (5*PX2+G2) - G2)) / 2);
  const mainPts = getPixels(MAIN_TEXT, PX1, G1, mainX, MAIN_Y);
  const subPts  = getPixels(SUB_TEXT,  PX2, G2, subX,  SUB_Y);

  const brackets = [
    ...bracketRects(BM,        BM,        1,  1),
    ...bracketRects(W-BM-BPX,  BM,       -1,  1),
    ...bracketRects(BM,        H-BM-BPX,  1, -1),
    ...bracketRects(W-BM-BPX,  H-BM-BPX,-1, -1),
  ];

  let seed = 98765;
  function rnd() {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return seed / 0xffffffff;
  }

  const DGRID = 14;
  const drops = [];
  const usedCols = new Set();
  for (let i = 0; i < 20; i++) {
    let col, tries = 0;
    do { col = Math.floor(rnd() * Math.floor(W / DGRID)); tries++; } while (usedCols.has(col) && tries < 60);
    if (tries >= 60) continue;
    usedCols.add(col);
    drops.push({
      x:     col * DGRID,
      dur:   (2.0 + rnd() * 3.0).toFixed(1),
      delay: `-${(rnd() * 5.0).toFixed(2)}s`,
      trail: 3 + Math.floor(rnd() * 3),
      alpha: (0.12 + rnd() * 0.18).toFixed(3),
    });
  }

  function genNoise() {
    const out = [];
    let s = 11111;
    function nr() { s = ((s * 1664525 + 1013904223) >>> 0); return s / 0xffffffff; }
    for (let x = 0; x < W; x += 14) {
      for (let y = 0; y < H; y += 14) {
        if (nr() < 0.013) {
          const a = (0.03 + nr() * 0.08).toFixed(3);
          out.push(`<rect x="${x+1}" y="${y+1}" width="12" height="12" fill="${theme.px}" opacity="${a}"/>`);
        }
      }
    }
    return out.join('\n');
  }

  const R = p => `<rect x="${p.x}" y="${p.y}" width="${p.px}" height="${p.px}"/>`;
  const mainRects = mainPts.map(R).join('\n');
  const subRects  = subPts.map(R).join('\n');

  const cy1 = MAIN_Y + PX1, ch1 = PX1 * 2;
  const cy2 = MAIN_Y + PX1 * 3, ch2 = PX1 * 2;

  const rainCSS = drops.map((d, i) =>
    `.d${i}{animation:df${i} ${d.dur}s linear ${d.delay} infinite;}` +
    `@keyframes df${i}{from{transform:translateY(-${(d.trail+1)*DGRID}px);}` +
    `to{transform:translateY(${H+DGRID}px);}}`
  ).join('');

  const rainSVG = drops.map((d, i) => {
    const blocks = Array.from({length: d.trail}, (_, t) => {
      const a = (d.alpha * (1 - t / d.trail)).toFixed(3);
      return `<rect x="${d.x+1}" y="${-(t+1)*DGRID+1}" width="${DGRID-2}" height="${DGRID-2}" fill="${theme.px}" opacity="${a}"/>`;
    }).join('');
    return `<g class="d${i}">${blocks}</g>`;
  }).join('\n');

  const scanlines = Array.from({length: Math.ceil(H/2)}, (_, i) =>
    `<rect x="0" y="${i*2}" width="${W}" height="1" fill="#000" opacity="0.07"/>`
  ).join('');

  const hpBar = [
    `<text x="${W-208}" y="${H-13}" font-family="Courier New,monospace" font-size="9" fill="${theme.px}" opacity="0.42">LIFE</text>`,
    ...Array.from({length: 8}, (_, i) =>
      `<rect x="${W-208+40+i*15}" y="${H-23}" width="12" height="9" fill="${i<6?theme.px:theme.barOff}" opacity="${i<6?'0.72':'0.40'}"/>`
    ),
  ].join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"    stop-color="${theme.px}" stop-opacity="0"/>
    <stop offset="0.65" stop-color="${theme.px}" stop-opacity="0.06"/>
    <stop offset="1"    stop-color="#b4ffca" stop-opacity="0.2"/>
  </linearGradient>
  <clipPath id="ct"><rect x="0" y="${cy1}" width="${W}" height="${ch1}"/></clipPath>
  <clipPath id="cm"><rect x="0" y="${cy2}" width="${W}" height="${ch2}"/></clipPath>
  <style>
    .mt{animation:gp 2.8s ease-in-out infinite;}
    @keyframes gp{
      0%,100%{filter:drop-shadow(0 0 3px ${theme.px}) drop-shadow(0 0 6px ${theme.px});}
      50%{filter:drop-shadow(0 0 7px ${theme.px}) drop-shadow(0 0 15px ${theme.px});}
    }
    .sw{animation:sw 5s ease-in 1s infinite;}
    @keyframes sw{
      0%{transform:translateY(-30px);opacity:0;}
      5%{opacity:1;}
      85%{opacity:0.9;}
      100%{transform:translateY(${H+30}px);opacity:0;}
    }
    .g1{animation:ga 9s steps(1) 0s infinite;}
    @keyframes ga{
      0%,87%,91%,100%{transform:translateX(0);opacity:0;}
      88%{transform:translateX(-7px);opacity:1;}
      89%{transform:translateX(5px);opacity:1;}
      90%{transform:translateX(-3px);opacity:1;}
    }
    .g2{animation:gb 11s steps(1) 3s infinite;}
    @keyframes gb{
      0%,91%,95%,100%{transform:translateX(0);opacity:0;}
      92%{transform:translateX(6px);opacity:1;}
      93%{transform:translateX(-6px);opacity:1;}
      94%{transform:translateX(3px);opacity:1;}
    }
    ${rainCSS}
  </style>
</defs>

<rect width="${W}" height="${H}" fill="${theme.bg}"/>
${scanlines}
${genNoise()}
${brackets.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.px}" opacity="0.5"/>`).join('\n')}
${rainSVG}

<g class="mt" fill="${theme.px}">
${mainRects}
</g>
${mainPts.map(p => `<rect x="${p.x+1}" y="${p.y+1}" width="2" height="2" fill="${theme.hi}" opacity="0.26"/>`).join('\n')}

<g clip-path="url(#ct)" fill="${theme.px}" class="g1">
${mainRects}
</g>
<g clip-path="url(#cm)" fill="#ccffcc" class="g2">
${mainRects}
</g>

<g fill="${theme.sub}" opacity="0.85">
${subRects}
</g>

<rect class="sw" x="0" y="0" width="${W}" height="28" fill="url(#sg)"/>

${hpBar}
<text x="35" y="${H-15}" font-family="Courier New,monospace" font-size="9" fill="${theme.px}" opacity="0.28">[ PIXEL ART HEADER v2.0 ]</text>
</svg>`;

  fs.writeFileSync(`banner${suffix}.svg`, svg);
  console.log(`Generated banner${suffix}.svg — ${mainPts.length} main pixels, ${subPts.length} sub pixels, ${drops.length} rain drops`);
}

// ── FOOTER ────────────────────────────────────────────────
function generateFooter(theme, suffix) {
  const FW = 860, FH = 130;

  const FOOT_TEXT = 'EXIT PROFILE';
  const FSUB_TEXT = 'THANKS FOR VISITING';
  const FPX1 = 8, FG1 = 2;
  const FPX2 = 4, FG2 = 2;
  const footX = Math.round((FW - (FOOT_TEXT.length * (5*FPX1+FG1) - FG1)) / 2);
  const fsubX = Math.round((FW - (FSUB_TEXT.length * (5*FPX2+FG2) - FG2)) / 2);
  const FOOT_Y = 20;
  const FSUB_Y = 80;
  const footPts = getPixels(FOOT_TEXT, FPX1, FG1, footX, FOOT_Y);
  const fsubPts = getPixels(FSUB_TEXT, FPX2, FG2, fsubX, FSUB_Y);

  const dividerBlocks = [];
  for (let x = 0; x < FW; x += 10) {
    if (Math.floor(x / 10) % 2 === 0) continue;
    dividerBlocks.push(`<rect x="${x+1}" y="2" width="8" height="4" fill="${theme.px}" opacity="0.35"/>`);
  }

  const fbrackets = [
    ...bracketRects(BM,        BM,         1,  1),
    ...bracketRects(FW-BM-BPX, BM,        -1,  1),
    ...bracketRects(BM,        FH-BM-BPX,  1, -1),
    ...bracketRects(FW-BM-BPX, FH-BM-BPX,-1, -1),
  ];

  const fScanlines = Array.from({length: Math.ceil(FH/2)}, (_, i) =>
    `<rect x="0" y="${i*2}" width="${FW}" height="1" fill="#000" opacity="0.07"/>`
  ).join('');

  const R = p => `<rect x="${p.x}" y="${p.y}" width="${p.px}" height="${p.px}"/>`;
  const footRects = footPts.map(R).join('\n');
  const fsubRects = fsubPts.map(R).join('\n');

  const footerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}" viewBox="0 0 ${FW} ${FH}">
<defs>
  <style>
    .ft{animation:fg 3s ease-in-out infinite;}
    @keyframes fg{
      0%,100%{filter:drop-shadow(0 0 3px ${theme.px}) drop-shadow(0 0 5px ${theme.px});}
      50%{filter:drop-shadow(0 0 8px ${theme.px}) drop-shadow(0 0 16px ${theme.px});}
    }
    .fc{animation:fc 1s steps(1) 0.5s infinite;}
    @keyframes fc{0%,49%{opacity:1;}50%,100%{opacity:0;}}
  </style>
</defs>

<rect width="${FW}" height="${FH}" fill="${theme.bg}"/>
${fScanlines}
${dividerBlocks.join('\n')}
${fbrackets.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.px}" opacity="0.45"/>`).join('\n')}

<g class="ft" fill="${theme.px}">
${footRects}
</g>
${footPts.map(p => `<rect x="${p.x+1}" y="${p.y+1}" width="2" height="2" fill="${theme.hi}" opacity="0.24"/>`).join('\n')}

<g fill="${theme.sub}" opacity="0.7">
${fsubRects}
</g>

<rect class="fc" x="${fsubX + FSUB_TEXT.length*(5*FPX2+FG2) + 4}" y="${FSUB_Y}" width="${FPX2-1}" height="${7*FPX2-1}" fill="${theme.px}"/>
</svg>`;

  fs.writeFileSync(`footer${suffix}.svg`, footerSvg);
  console.log(`Generated footer${suffix}.svg — ${footPts.length} main pixels, ${fsubPts.length} sub pixels`);
}

// ── BADGE ────────────────────────────────────────────────
function generateBadge(text, filename, theme) {
  const BPX = 4, BGAP = 2;
  const PAD_X = 18, PAD_Y = 11;
  const textW = text.length * (5 * BPX + BGAP) - BGAP;
  const BW = textW + PAD_X * 2;
  const BH = 7 * BPX + PAD_Y * 2;
  const pts = getPixels(text, BPX, BGAP, PAD_X, PAD_Y);
  const rects = pts.map(p =>
    `<rect x="${p.x}" y="${p.y}" width="${p.px}" height="${p.px}"/>`
  ).join('\n');
  const scanlines = Array.from({length: Math.ceil(BH/2)}, (_, i) =>
    `<rect x="0" y="${i*2}" width="${BW}" height="1" fill="#000" opacity="0.07"/>`
  ).join('');
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">
<defs>
  <style>
    .bg{animation:bg 2.8s ease-in-out infinite;}
    @keyframes bg{
      0%,100%{filter:drop-shadow(0 0 2px ${theme.px}) drop-shadow(0 0 5px ${theme.px});}
      50%{filter:drop-shadow(0 0 5px ${theme.px}) drop-shadow(0 0 12px ${theme.px});}
    }
  </style>
</defs>
<rect width="${BW}" height="${BH}" fill="${theme.bg}"/>
<rect x="0.5" y="0.5" width="${BW-1}" height="${BH-1}" fill="none" stroke="${theme.px}" stroke-width="1" opacity="0.35"/>
${scanlines}
<g class="bg" fill="${theme.px}">
${rects}
</g>
${pts.map(p => `<rect x="${p.x+1}" y="${p.y+1}" width="2" height="2" fill="${theme.hi}" opacity="0.22"/>`).join('\n')}
</svg>`;
  fs.writeFileSync(filename, out);
  console.log(`Generated ${filename} (${BW}x${BH})`);
}

// ── SKILL TREE ────────────────────────────────────────────
function generateSkillTree(theme, suffix) {
  const SW = 860;
  const LX = 32;

  const TITLE = 'SKILL';
  const TPX = 5, TG = 2;
  const titleY = 16;

  const categories = [
    {
      label: 'LANGUAGES',
      rows: [
        '[PY] [JAVA] [C] [C++] [C#] [SQL]',
        '[JS] [HTML] [CSS]',
      ],
    },
  ];

  const CPX = 3, CG = 1;
  const CAT_PX = 4, CAT_G = 2;
  const ROW_H = 7 * CPX;
  const ROW_GAP = 8;
  const CAT_H = 7 * CAT_PX;
  const CAT_GAP = 16;

  const divY = titleY + 7 * TPX + 12;
  let cy = divY + 14;
  categories.forEach(cat => {
    cy += CAT_H + 8;
    cat.rows.forEach(() => { cy += ROW_H + ROW_GAP; });
    cy += CAT_GAP;
  });
  const SH = cy + 6;

  const titlePts = getPixels(TITLE, TPX, TG, LX, titleY);

  const divRects = [];
  for (let x = LX; x < SW - LX; x += 6) {
    if (Math.floor((x - LX) / 6) % 2 === 0)
      divRects.push(`<rect x="${x}" y="${divY}" width="4" height="2" fill="${theme.px}" opacity="0.28"/>`);
  }

  const catPts = [], tagPts = [];
  let ry = divY + 14;
  categories.forEach(cat => {
    catPts.push(...getPixels(cat.label, CAT_PX, CAT_G, LX, ry));
    ry += CAT_H + 8;
    cat.rows.forEach(row => {
      tagPts.push(...getPixels(row, CPX, CG, LX, ry));
      ry += ROW_H + ROW_GAP;
    });
    ry += CAT_GAP;
  });

  const scanlines = Array.from({length: Math.ceil(SH / 2)}, (_, i) =>
    `<rect x="0" y="${i*2}" width="${SW}" height="1" fill="#000" opacity="0.07"/>`
  ).join('');

  const BP = 5, BMP = BP * 2;
  function br(bx, by, dx, dy) {
    const r = [];
    for (let i = 0; i < 5; i++) r.push([bx + i*BP*dx, by,          BP-1, BP-1]);
    for (let j = 1; j < 4; j++) r.push([bx,            by + j*BP*dy, BP-1, BP-1]);
    return r;
  }
  const corners = [
    ...br(BMP, BMP, 1, 1), ...br(SW-BMP-BP, BMP, -1, 1),
    ...br(BMP, SH-BMP-BP, 1, -1), ...br(SW-BMP-BP, SH-BMP-BP, -1, -1),
  ];

  const R = p => `<rect x="${p.x}" y="${p.y}" width="${p.px}" height="${p.px}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
<defs>
  <style>
    .st{animation:sg 2.8s ease-in-out infinite;}
    @keyframes sg{
      0%,100%{filter:drop-shadow(0 0 3px ${theme.px}) drop-shadow(0 0 6px ${theme.px});}
      50%{filter:drop-shadow(0 0 7px ${theme.px}) drop-shadow(0 0 15px ${theme.px});}
    }
  </style>
</defs>
<rect width="${SW}" height="${SH}" fill="${theme.bg}"/>
${scanlines}
${corners.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.px}" opacity="0.45"/>`).join('\n')}
${divRects.join('\n')}
<g class="st" fill="${theme.px}">
${titlePts.map(R).join('\n')}
</g>
<g fill="${theme.px}">
${catPts.map(R).join('\n')}
</g>
<g fill="${theme.px}" opacity="0.7">
${tagPts.map(R).join('\n')}
</g>
</svg>`;

  fs.writeFileSync(`skill-tree${suffix}.svg`, svg);
  console.log(`Generated skill-tree${suffix}.svg (${SW}x${SH})`);
}

// ── PLAYER PROFILE ────────────────────────────────────────
function generateProfile(theme, suffix) {
  const PW = 860, PH = 290;

  const TITLE = 'DEVELOPER_PROFILE';
  const TPX = 5, TG = 2;
  const titleX = 32;
  const titleY = 16;
  const titlePts = getPixels(TITLE, TPX, TG, titleX, titleY);

  const ONLINE_TXT = '[ ONLINE ]';
  const OPX = 4, OG = 2;
  const onlineW = ONLINE_TXT.length * (5*OPX+OG) - OG;
  const onlineX = PW - 32 - onlineW;
  const onlineY = titleY + Math.round((7*TPX - 7*OPX) / 2);
  const onlinePts = getPixels(ONLINE_TXT, OPX, OG, onlineX, onlineY);

  const divY = titleY + 7*TPX + 13;
  const divRects = [];
  for (let x = 30; x < PW - 30; x += 6) {
    if (Math.floor((x - 30) / 6) % 2 === 0)
      divRects.push(`<rect x="${x}" y="${divY}" width="4" height="2" fill="${theme.px}" opacity="0.28"/>`);
  }

  const CPX = 3, CG = 1;
  const CW = 5*CPX + CG;
  const LX = 32;
  const VX = LX + 8 * CW;
  const ROW_H = 7*CPX + 8;
  const CY = divY + 13;

  const rows = [
    { label: 'ID',    value: 'KINETAS' },
    { label: 'CLASS', value: 'DEVELOPER' },
    { label: 'LVL',   value: '26' },
    { label: 'WILL',    bar: { filled: 14, total: 14 }, tag: '[ MAX ]' },
    { label: 'EXP',   bar: { filled: 5,  total: 14 }, tag: 'Growing' },
    { label: 'BIO',   value: 'DEV_OPS   ARCHITECTURE' },
    { label: 'NOW',   value: 'AI AGENT   LLM' },
  ];

  const labelPts = [], valuePts = [];
  const barRects = [];

  rows.forEach((row, i) => {
    const ry = CY + i * ROW_H;
    labelPts.push(...getPixels(row.label, CPX, CG, LX, ry));

    if (row.value) {
      valuePts.push(...getPixels(row.value, CPX, CG, VX, ry));
    }

    if (row.bar) {
      const { filled, total } = row.bar;
      const BW = 12, BH = 7, BG = 2;
      const by = ry + Math.round((7*CPX - BH) / 2);
      for (let j = 0; j < total; j++) {
        const bx = VX + j * (BW + BG);
        if (j < filled)
          barRects.push(`<rect x="${bx}" y="${by}" width="${BW}" height="${BH}" fill="${theme.px}" opacity="0.82"/>`);
        else
          barRects.push(`<rect x="${bx}" y="${by}" width="${BW}" height="${BH}" fill="none" stroke="${theme.px}" stroke-width="1" opacity="0.22"/>`);
      }
      const tagX = VX + total * (BW + BG) + 10;
      valuePts.push(...getPixels(row.tag, CPX, CG, tagX, ry));
    }
  });

  const scanlines = Array.from({length: Math.ceil(PH/2)}, (_, i) =>
    `<rect x="0" y="${i*2}" width="${PW}" height="1" fill="#000" opacity="0.07"/>`
  ).join('');

  const BPXP = 5, BMPP = BPXP * 2;
  function bRects(bx, by, dx, dy) {
    const r = [];
    for (let i = 0; i < 5; i++) r.push([bx + i*BPXP*dx, by,            BPXP-1, BPXP-1]);
    for (let j = 1; j < 4; j++) r.push([bx,              by + j*BPXP*dy, BPXP-1, BPXP-1]);
    return r;
  }
  const corners = [
    ...bRects(BMPP,         BMPP,          1,  1),
    ...bRects(PW-BMPP-BPXP, BMPP,         -1,  1),
    ...bRects(BMPP,         PH-BMPP-BPXP,  1, -1),
    ...bRects(PW-BMPP-BPXP, PH-BMPP-BPXP,-1, -1),
  ];

  const R = p => `<rect x="${p.x}" y="${p.y}" width="${p.px}" height="${p.px}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">
<defs>
  <style>
    .pt{animation:pg 2.8s ease-in-out infinite;}
    @keyframes pg{
      0%,100%{filter:drop-shadow(0 0 3px ${theme.px}) drop-shadow(0 0 6px ${theme.px});}
      50%{filter:drop-shadow(0 0 7px ${theme.px}) drop-shadow(0 0 15px ${theme.px});}
    }
  </style>
</defs>
<rect width="${PW}" height="${PH}" fill="${theme.bg}"/>
${scanlines}
${corners.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.px}" opacity="0.45"/>`).join('\n')}
${divRects.join('\n')}
<g class="pt" fill="${theme.px}">
${titlePts.map(R).join('\n')}
</g>
${titlePts.map(p => `<rect x="${p.x+1}" y="${p.y+1}" width="2" height="2" fill="${theme.hi}" opacity="0.24"/>`).join('\n')}
<g fill="${theme.px}" opacity="0.55">
${onlinePts.map(R).join('\n')}
</g>
<g fill="${theme.px}">
${labelPts.map(R).join('\n')}
</g>
<g fill="${theme.px}" opacity="0.62">
${valuePts.map(R).join('\n')}
</g>
${barRects.join('\n')}
</svg>`;

  fs.writeFileSync(`player-profile${suffix}.svg`, svg);
  console.log(`Generated player-profile${suffix}.svg (${PW}x${PH})`);
}

// ── RUN ───────────────────────────────────────────────────
generateBanner(DARK, '');
generateBanner(LIGHT, '-light');
generateFooter(DARK, '');
generateFooter(LIGHT, '-light');
generateBadge('[ MAIL ]', 'mail-badge.svg', DARK);
generateBadge('[ MAIL ]', 'mail-badge-light.svg', LIGHT);
generateBadge('[ PORTFOLIO ]', 'portfolio-badge.svg', DARK);
generateBadge('[ PORTFOLIO ]', 'portfolio-badge-light.svg', LIGHT);
generateSkillTree(DARK, '');
generateSkillTree(LIGHT, '-light');
generateProfile(DARK, '');
generateProfile(LIGHT, '-light');
