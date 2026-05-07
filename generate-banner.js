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
  '_':["00000","00000","00000","00000","00000","00000","11111"],
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

const W = 860, H = 180;
const PX1 = 7, G1 = 2, MAIN_TEXT = 'DEVELOPER_LIFE', MAIN_Y = 30;
const PX2 = 4, G2 = 2, SUB_TEXT  = 'HAS ENTERED THE GAME', SUB_Y = 95;

const mainX = Math.round((W - (MAIN_TEXT.length * (5*PX1+G1) - G1)) / 2);
const subX  = Math.round((W - (SUB_TEXT.length  * (5*PX2+G2) - G2)) / 2);
const mainPts = getPixels(MAIN_TEXT, PX1, G1, mainX, MAIN_Y);
const subPts  = getPixels(SUB_TEXT,  PX2, G2, subX,  SUB_Y);

// Corner brackets
const BPX = 5, BM = BPX * 2;
function bracketRects(bx, by, dx, dy) {
  const r = [];
  for (let i = 0; i < 5; i++) r.push([bx + i*BPX*dx, by,          BPX-1, BPX-1]);
  for (let j = 1; j < 4; j++) r.push([bx,             by + j*BPX*dy, BPX-1, BPX-1]);
  return r;
}
const brackets = [
  ...bracketRects(BM,         BM,         1,  1),
  ...bracketRects(W-BM-BPX,  BM,        -1,  1),
  ...bracketRects(BM,         H-BM-BPX,  1, -1),
  ...bracketRects(W-BM-BPX,  H-BM-BPX, -1, -1),
];

// Deterministic LCG random
let seed = 98765;
function rnd() {
  seed = ((seed * 1664525 + 1013904223) >>> 0);
  return seed / 0xffffffff;
}

// Rain drops
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

// Background noise
function genNoise() {
  const out = [];
  let s = 11111;
  function nr() { s = ((s * 1664525 + 1013904223) >>> 0); return s / 0xffffffff; }
  for (let x = 0; x < W; x += 14) {
    for (let y = 0; y < H; y += 14) {
      if (nr() < 0.013) {
        const a = (0.03 + nr() * 0.08).toFixed(3);
        out.push(`<rect x="${x+1}" y="${y+1}" width="12" height="12" fill="#00ff41" opacity="${a}"/>`);
      }
    }
  }
  return out.join('\n');
}

const R = p => `<rect x="${p.x+1}" y="${p.y+1}" width="${p.px-2}" height="${p.px-2}"/>`;
const mainRects = mainPts.map(R).join('\n');
const subRects  = subPts.map(R).join('\n');

// ClipPath bands for glitch (row 1-2, row 4-5 of main text)
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
    return `<rect x="${d.x+1}" y="${-(t+1)*DGRID+1}" width="${DGRID-2}" height="${DGRID-2}" fill="#00ff41" opacity="${a}"/>`;
  }).join('');
  return `<g class="d${i}">${blocks}</g>`;
}).join('\n');

const scanlines = Array.from({length: Math.ceil(H/2)}, (_, i) =>
  `<rect x="0" y="${i*2}" width="${W}" height="1" fill="#000" opacity="0.07"/>`
).join('');

const hpBar = [
  `<text x="${W-208}" y="${H-13}" font-family="Courier New,monospace" font-size="9" fill="#00ff41" opacity="0.42">LIFE</text>`,
  ...Array.from({length: 8}, (_, i) =>
    `<rect x="${W-208+40+i*15}" y="${H-23}" width="12" height="9" fill="${i<6?'#00ff41':'#003c0f'}" opacity="${i<6?'0.72':'0.40'}"/>`
  ),
].join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"    stop-color="#00ff41" stop-opacity="0"/>
    <stop offset="0.65" stop-color="#00ff41" stop-opacity="0.06"/>
    <stop offset="1"    stop-color="#b4ffca" stop-opacity="0.2"/>
  </linearGradient>
  <clipPath id="ct"><rect x="0" y="${cy1}" width="${W}" height="${ch1}"/></clipPath>
  <clipPath id="cm"><rect x="0" y="${cy2}" width="${W}" height="${ch2}"/></clipPath>
  <style>
    .mt{animation:gp 2.8s ease-in-out infinite;}
    @keyframes gp{
      0%,100%{filter:drop-shadow(0 0 3px #00ff41) drop-shadow(0 0 6px #00ff41);}
      50%{filter:drop-shadow(0 0 7px #00ff41) drop-shadow(0 0 15px #00ff41);}
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

<rect width="${W}" height="${H}" fill="#050a05"/>
${scanlines}
${genNoise()}
${brackets.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#00ff41" opacity="0.5"/>`).join('\n')}
${rainSVG}

<g class="mt" fill="#00ff41">
${mainRects}
</g>
${mainPts.map(p => `<rect x="${p.x+1}" y="${p.y+1}" width="2" height="2" fill="#c8ffd7" opacity="0.26"/>`).join('\n')}

<g clip-path="url(#ct)" fill="#00ff41" class="g1">
${mainRects}
</g>
<g clip-path="url(#cm)" fill="#ccffcc" class="g2">
${mainRects}
</g>

<g fill="#00d23c" opacity="0.85">
${subRects}
</g>

<rect class="sw" x="0" y="0" width="${W}" height="28" fill="url(#sg)"/>

${hpBar}
<text x="16" y="${H-10}" font-family="Courier New,monospace" font-size="9" fill="#00ff41" opacity="0.28">[ PIXEL ART HEADER v2.0 ]</text>
</svg>`;

fs.writeFileSync('banner.svg', svg);
console.log(`Generated banner.svg — ${mainPts.length} main pixels, ${subPts.length} sub pixels, ${drops.length} rain drops`);
