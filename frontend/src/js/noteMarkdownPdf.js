/**
 * Markdown -> PDF export for Notes.
 *
 * Detects whether a note body is Markdown and renders it with real
 * formatting (bold, italic, strikethrough, headings, lists, blockquotes,
 * code blocks/spans, links, GFM pipe tables, horizontal rules) using
 * jsPDF text APIs. Plain text is rendered untouched.
 *
 * jsPDF's built-in Helvetica/Courier fonts use WinAnsi encoding and cannot
 * draw emoji or many Unicode symbols; passing them through produces garbage
 * like "Ø=Ý4" (the UTF-16 bytes of 🔴). We therefore:
 *   - map common symbols to WinAnsi-safe equivalents (<= >= -> etc.)
 *   - drop emoji, but use their colour to tint status table cells
 *
 * String-only helpers are exported so they can be unit tested.
 */

/* ----------------------------- unicode safety ---------------------------- */

const WINANSI_EXTRA = new Set([
  0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017D, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022,
  0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x017E, 0x0178,
]);

// Symbols that have a sensible plain-text equivalent.
const SYMBOL_MAP = {
  '\u2264': '<=', '\u2265': '>=', '\u2260': '!=', '\u2248': '~',
  '\u00d7': 'x', '\u00f7': '/', '\u2212': '-',
  '\u2192': '->', '\u2190': '<-', '\u2191': '^', '\u2193': 'v', '\u21d2': '=>',
  '\u25b6': '>', '\u25c0': '<', '\u279c': '->', '\u27a1': '->', '\u27a4': '>',
  '\u2713': 'v', '\u2714': 'v', '\u2705': '[x]', '\u274c': '[ ]',
  '\u2717': '[ ]', '\u2718': '[ ]',
  '\u2b50': '*', '\u2605': '*', '\u2606': '*',
};

function isWinAnsi(cp) {
  if (cp === 9) return true;
  if (cp >= 0x20 && cp <= 0x7e) return true;
  if (cp >= 0xa0 && cp <= 0xff) return true;
  return WINANSI_EXTRA.has(cp);
}

/** Removes/replaces characters jsPDF's built-in fonts cannot draw. */
export function pdfSafeText(str) {
  if (!str) return '';
  let out = '';
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f || cp === 0xfe0e || cp === 0x200d) continue; // variation selectors / ZWJ
    const mapped = SYMBOL_MAP[ch];
    if (mapped !== undefined) { out += mapped; continue; }
    if (isWinAnsi(cp)) out += ch;
    // everything else (emoji, unsupported symbols) is dropped
  }
  return out;
}

/** Returns a status colour if the text starts with a known status emoji. */
export function riskColorFor(str) {
  if (!str) return null;
  if (/\u{1F534}/u.test(str)) return [220, 38, 38];   // 🔴 red
  if (/\u{1F7E0}/u.test(str)) return [234, 88, 12];   // 🟠 orange
  if (/\u{1F7E1}/u.test(str)) return [180, 120, 4];   // 🟡 yellow
  if (/\u{1F7E2}/u.test(str)) return [22, 163, 74];   // 🟢 green
  if (/\u26A0/u.test(str)) return [217, 119, 6];      // ⚠ amber
  if (/\u2139/u.test(str)) return [37, 99, 235];      // ℹ blue
  if (/\u25D4/u.test(str)) return [217, 119, 6];      // ◔ amber
  if (/\u2B1B/u.test(str)) return [63, 63, 70];       // ⬛ dark
  if (/\u2B1C/u.test(str)) return [130, 130, 140];    // ⬜ grey
  return null;
}

/* ------------------------------- detection ------------------------------- */

const MD_INLINE_RULES = [
  [/^\*\*\*(.+?)\*\*\*/, { bold: true, italic: true }],
  [/^___(.+?)___/,         { bold: true, italic: true }],
  [/^\*\*(.+?)\*\*/,     { bold: true }],
  [/^__(.+?)__/,           { bold: true }],
  [/^~~(.+?)~~/,           { strike: true }],
  [/^`([^`]+)`/,           { code: true }],
  [/^\*(.+?)\*/,          { italic: true }],
  [/^_(.+?)_/,             { italic: true }],
];

export function looksLikeMarkdown(text) {
  if (!text) return false;
  const patterns = [
    /^#{1,6}\s+\S/m,
    /\*\*[^*\n]+\*\*/,
    /__[^_\n]+__/,
    /\*[^*\n]+\*/,
    /(^|\s)_[^_\n]+_(\s|$)/,
    /~~[^~\n]+~~/,
    /`[^`\n]+`/,
    /```/,
    /^\s*[-*+]\s+\S/m,
    /^\s*\d+[.)]\s+\S/m,
    /^\s*>\s*\S/m,
    /\[[^\]]+\]\([^)]+\)/,
    /^\s*\|.*\|/m,
    /^\s*\|?\s*:?-{2,}:?\s*\|/m,
  ];
  return patterns.some(re => re.test(text));
}

/* ------------------------------ inline parse ----------------------------- */

/** Turns a line of text into styled runs: "a **b** c" -> [{text:'a '}, {text:'b',bold:true}, {text:' c'}] */
export function parseInline(text) {
  const runs = [];
  let buffer = '';
  let i = 0;
  const flush = () => { if (buffer) { runs.push({ text: buffer }); buffer = ''; } };

  while (i < text.length) {
    const rest = text.slice(i);

    // Backslash escape: \* renders a literal *
    const esc = rest.match(/^\\([*_~`[\]()#>\-+.!])/);
    if (esc) { buffer += esc[1]; i += esc[0].length; continue; }

    // ![alt](url) — inline image syntax renders as its caption in flowing text;
    // standalone image lines are drawn as real pictures by pdfRenderMarkdown.
    const image = rest.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
    if (image) { flush(); runs.push({ text: image[1] || 'image', italic: true }); i += image[0].length; continue; }

    // [label](url)
    const link = rest.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
    if (link) { flush(); runs.push({ text: link[1], link: link[2] }); i += link[0].length; continue; }

    let matched = false;
    for (const [re, style] of MD_INLINE_RULES) {
      const m = rest.match(re);
      if (m) { flush(); runs.push({ text: m[1], ...style }); i += m[0].length; matched = true; break; }
    }
    if (matched) continue;

    buffer += text[i];
    i += 1;
  }
  flush();
  return runs;
}

/* ------------------------------- images ---------------------------------- */

const IMAGE_LINE_RE = /^\s*!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)\s*$/;

/** Collects every image URL referenced by Markdown image syntax. */
export function extractImageUrls(markdown) {
  const urls = [];
  if (!markdown) return urls;
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) urls.push(m[2]);
  return [...new Set(urls)];
}

/** Fetches an image and returns a canvas-normalised PNG data URL + size. */
async function urlToImageData(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const blob = await res.blob();

  let source;
  if (typeof createImageBitmap === 'function') {
    source = await createImageBitmap(blob);
  } else {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    source = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  const w = source.width || source.naturalWidth || 1;
  const h = source.height || source.naturalHeight || 1;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(source, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL('image/png'), w, h, format: 'PNG' };
}

/** Loads every URL into a `{ url: {dataUrl,w,h} }` map, skipping failures. */
export async function prefetchImages(urls) {
  const map = {};
  await Promise.all((urls || []).map(async (url) => {
    if (!url || map[url]) return;
    try { map[url] = await urlToImageData(url); } catch { /* skip unreachable images */ }
  }));
  return map;
}

/* ------------------------------ pdf helpers ------------------------------ */

function pdfSetFont(doc, run, size) {
  if (run.code) doc.setFont('courier', 'normal');
  else if (run.bold && run.italic) doc.setFont('helvetica', 'bolditalic');
  else if (run.bold) doc.setFont('helvetica', 'bold');
  else if (run.italic) doc.setFont('helvetica', 'italic');
  else doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
}

function pdfEnsureSpace(ctx, needed) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    ctx.doc.addPage();
    ctx.y = ctx.margin;
  }
}

/** Draws a preloaded image centred on the page with an optional caption. */
function pdfRenderImage(ctx, img, alt) {
  const doc = ctx.doc;
  const maxW = ctx.pageW - ctx.margin * 2;
  const maxH = ctx.pageH * 0.62;
  const scale = Math.min(maxW / img.w, maxH / img.h, 1);
  const w = img.w * scale;
  const h = img.h * scale;
  const x = ctx.margin + (maxW - w) / 2;

  pdfEnsureSpace(ctx, h + 18);
  try {
    doc.addImage(img.dataUrl, img.format || 'PNG', x, ctx.y, w, h, undefined, 'FAST');
  } catch {
    /* unsupported image — skip it rather than break the export */
  }
  ctx.y += h + 5;

  if (alt) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 140);
    doc.text(pdfSafeText(alt), ctx.pageW / 2, ctx.y, { align: 'center' });
    ctx.y += 13;
  } else {
    ctx.y += 8;
  }
}

/** Flattens styled runs into words (whitespace preserved) with measured widths. */
function runWords(doc, runs, size) {
  const words = [];
  runs.forEach(run => {
    (pdfSafeText(run.text) || '').split(/(\s+)/).forEach(part => {
      if (!part) return;
      const w = { ...run, text: part };
      pdfSetFont(doc, w, size);
      w.width = doc.getTextWidth(part);
      words.push(w);
    });
  });
  return words;
}

/** Wraps styled runs into lines that fit maxW. Used by the table renderer. */
function wrapRunsToLines(doc, runs, maxW, size) {
  const words = runWords(doc, runs, size);
  const lines = [];
  let cur = [];
  let curW = 0;
  for (const w of words) {
    if (/^\s+$/.test(w.text)) {
      if (cur.length) { cur.push(w); curW += w.width; }
      continue;
    }
    if (cur.length && curW + w.width > maxW) {
      while (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) { curW -= cur[cur.length - 1].width; cur.pop(); }
      lines.push(cur); cur = []; curW = 0;
    }
    cur.push(w); curW += w.width;
  }
  while (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) cur.pop();
  if (cur.length) lines.push(cur);
  if (!lines.length) lines.push([]);
  return lines;
}

function drawRunLine(doc, words, x, y, size, color) {
  let cx = x;
  words.forEach(w => {
    pdfSetFont(doc, w, size);
    if (w.text.trim()) {
      if (w.code) {
        doc.setFillColor(244, 244, 245);
        doc.rect(cx - 1.5, y - size + 1, w.width + 3, size + 4, 'F');
        doc.setTextColor(190, 24, 93);
      } else if (w.link) {
        doc.setTextColor(37, 99, 235);
      } else if (color) {
        doc.setTextColor(color[0], color[1], color[2]);
      } else {
        doc.setTextColor(24, 24, 27);
      }
      doc.text(w.text, cx, y);
    }
    cx += w.width;
  });
}

/* ------------------------------ wide layout ------------------------------ */

function pdfRenderRuns(ctx, runs, opts = {}) {
  const doc = ctx.doc;
  const size = opts.size ?? 12;
  const lineHeight = opts.lineHeight ?? size * 1.5;
  const indent = opts.indent ?? 0;
  const x0 = ctx.margin + indent;
  const right = ctx.pageW - ctx.margin;
  const baseColor = opts.color || [24, 24, 27];

  const words = runWords(doc, runs, size);
  let cx = x0;
  pdfEnsureSpace(ctx, lineHeight);

  words.forEach(word => {
    if (/^\s+$/.test(word.text)) {
      if (cx > x0) cx += word.width;
      return;
    }
    if (cx + word.width > right && cx > x0) {
      ctx.y += lineHeight;
      pdfEnsureSpace(ctx, lineHeight);
      cx = x0;
    }

    if (word.code) {
      doc.setFillColor(244, 244, 245);
      doc.rect(cx - 1.5, ctx.y - size + 1, word.width + 3, size + 4, 'F');
      doc.setTextColor(190, 24, 93);
    } else if (word.link) {
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setTextColor(baseColor[0], baseColor[1], baseColor[2]);
    }

    doc.text(word.text, cx, ctx.y);

    if (word.link) {
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.6);
      doc.line(cx, ctx.y + 2.6, cx + word.width, ctx.y + 2.6);
    }
    if (word.strike) {
      doc.setDrawColor(120, 120, 128);
      doc.setLineWidth(0.6);
      doc.line(cx, ctx.y - size * 0.28, cx + word.width, ctx.y - size * 0.28);
    }
    cx += word.width;
  });

  ctx.y += lineHeight;
}

function pdfRenderPlain(ctx, text) {
  const size = 12;
  const lineHeight = 18;
  text.split('\n').forEach(line => {
    if (!line.trim()) { ctx.y += lineHeight * 0.6; return; }
    pdfRenderRuns(ctx, [{ text: line }], { size, lineHeight });
  });
}

/* -------------------------------- tables --------------------------------- */

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

function isSeparatorRow(line) {
  const t = line.trim();
  if (!t.includes('-') || !/^[\s|:-]+$/.test(t)) return false;
  const cells = splitRow(t);
  return cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c));
}

function pdfRenderTable(ctx, rows) {
  const doc = ctx.doc;
  const size = 11;
  const lineHeight = 15;
  const padX = 6;
  const padY = 5;
  const nCols = Math.max(...rows.map(r => r.length));
  const grid = rows.map(r => Array.from({ length: nCols }, (_, i) => r[i] ?? ''));

  // Natural column widths (header measured bold).
  const natural = new Array(nCols).fill(0);
  grid.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      pdfSetFont(doc, { bold: ri === 0 }, size);
      const w = doc.getTextWidth(pdfSafeText(cell));
      if (w > natural[ci]) natural[ci] = w;
    });
  });

  const availW = ctx.pageW - ctx.margin * 2;
  const minW = 46;
  let widths = natural.map(n => Math.min(n + padX * 2, availW * 0.6));
  let sum = widths.reduce((a, b) => a + b, 0);
  if (sum > availW) {
    const minTotal = nCols * minW;
    const need = sum - minTotal;
    const factor = need > 0 ? Math.max(0, availW - minTotal) / need : 0;
    widths = widths.map(w => minW + (w - minW) * factor);
    sum = widths.reduce((a, b) => a + b, 0);
    if (sum > availW) widths[nCols - 1] -= (sum - availW);
  }

  const colX = [];
  let x = ctx.margin;
  widths.forEach(w => { colX.push(x); x += w; });
  const totalW = x - ctx.margin;

  const cellLines = row => row.map((cell, ci) =>
    wrapRunsToLines(doc, parseInline(pdfSafeText(cell)), Math.max(20, widths[ci] - padX * 2), size)
  );

  const drawRow = (row, isHeader) => {
    const linesArr = cellLines(row);
    const h = Math.max(1, ...linesArr.map(l => l.length)) * lineHeight + padY * 2;

    if (ctx.y + h > ctx.pageH - ctx.margin) {
      doc.addPage();
      ctx.y = ctx.margin;
      if (!isHeader) drawRow(grid[0], true); // repeat header on new page
    }

    const top = ctx.y;
    if (isHeader) {
      doc.setFillColor(244, 244, 245);
      doc.rect(ctx.margin, top, totalW, h, 'F');
    }

    row.forEach((cell, ci) => {
      const color = riskColorFor(cell);
      linesArr[ci].forEach((words, li) => {
        drawRunLine(doc, words, colX[ci] + padX, top + padY + size + li * lineHeight, size, color);
      });
    });

    doc.setDrawColor(210, 210, 215);
    doc.setLineWidth(0.75);
    doc.rect(ctx.margin, top, totalW, h);
    let cx = ctx.margin;
    for (let i = 0; i < nCols - 1; i++) {
      cx += widths[i];
      doc.line(cx, top, cx, top + h);
    }
    ctx.y = top + h;
  };

  drawRow(grid[0], true);
  for (let r = 1; r < grid.length; r++) drawRow(grid[r], false);
  ctx.y += 8;
}

/* ------------------------------- markdown -------------------------------- */

function pdfRenderMarkdown(ctx, markdown, images = {}) {
  const doc = ctx.doc;
  const size = 12;
  const lineHeight = 18;
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const isFence = /^\s*```/;
  let inCode = false;
  let codeLines = [];

  const flushCode = () => {
    const text = codeLines.join('\n');
    const codeSize = 10;
    const codeLine = 14.5;
    const indent = 12;
    doc.setFont('courier', 'normal');
    doc.setFontSize(codeSize);
    const maxW = ctx.pageW - ctx.margin * 2 - indent * 2;
    const wrapped = [];
    text.split('\n').forEach(l => {
      const safe = pdfSafeText(l);
      if (!safe) { wrapped.push(''); return; }
      wrapped.push(...doc.splitTextToSize(safe, maxW));
    });
    wrapped.forEach(l => {
      pdfEnsureSpace(ctx, codeLine);
      doc.setFillColor(244, 244, 245);
      doc.rect(ctx.margin + indent - 7, ctx.y - codeSize + 1, maxW + 14, codeLine, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(codeSize);
      doc.setTextColor(55, 55, 65);
      doc.text(l, ctx.margin + indent, ctx.y);
      ctx.y += codeLine;
    });
    ctx.y += 5;
    codeLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isFence.test(line)) {
      if (inCode) { flushCode(); inCode = false; }
      else { inCode = true; codeLines = []; }
      i += 1;
      continue;
    }
    if (inCode) { codeLines.push(line); i += 1; continue; }

    if (!line.trim()) { ctx.y += lineHeight * 0.6; i += 1; continue; }

    // Standalone image line → draw the picture (when it was preloaded).
    const imageLine = line.match(IMAGE_LINE_RE);
    if (imageLine) {
      const img = images[imageLine[2]];
      if (img) { pdfRenderImage(ctx, img, imageLine[1]); i += 1; continue; }
      pdfRenderRuns(ctx, [{ text: imageLine[1] || 'image', italic: true }], {
        size, lineHeight, color: [130, 130, 140],
      });
      i += 1;
      continue;
    }

    // GFM pipe table: header row followed by a separator row.
    if (line.includes('|') && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const rows = [splitRow(line)];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        if (isSeparatorRow(lines[i])) { i += 1; continue; }
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      pdfRenderTable(ctx, rows);
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      pdfEnsureSpace(ctx, 14);
      doc.setDrawColor(210, 210, 215);
      doc.setLineWidth(1);
      doc.line(ctx.margin, ctx.y - 4, ctx.pageW - ctx.margin, ctx.y - 4);
      ctx.y += lineHeight;
      i += 1;
      continue;
    }

    // Heading
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const sizes = { 1: 20, 2: 17, 3: 15, 4: 13, 5: 12, 6: 11 };
      const hSize = sizes[level];
      if (level <= 2) ctx.y += 6;
      pdfRenderRuns(
        ctx,
        parseInline(heading[2]).map(r => ({ ...r, bold: true })),
        { size: hSize, lineHeight: hSize * 1.35 }
      );
      ctx.y += 3;
      i += 1;
      continue;
    }

    // Blockquote
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      pdfEnsureSpace(ctx, lineHeight);
      doc.setFillColor(16, 185, 129);
      doc.rect(ctx.margin, ctx.y - size + 2, 3, size + 4, 'F');
      pdfRenderRuns(ctx, parseInline(quote[1]), {
        size, lineHeight, indent: 14, color: [95, 95, 105],
      });
      i += 1;
      continue;
    }

    // Bullet list
    const bullet = line.match(/^(\s*)([-*+])\s+(.*)$/);
    if (bullet) {
      const indent = 10 + Math.floor(bullet[1].length / 2) * 14;
      pdfEnsureSpace(ctx, lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(45, 106, 79);
      doc.text('•', ctx.margin + indent, ctx.y);
      pdfRenderRuns(ctx, parseInline(bullet[3]), {
        size, lineHeight, indent: indent + 16,
      });
      i += 1;
      continue;
    }

    // Ordered list
    const ordered = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (ordered) {
      const indent = 10 + Math.floor(ordered[1].length / 2) * 14;
      pdfEnsureSpace(ctx, lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(45, 106, 79);
      doc.text(`${ordered[2]}.`, ctx.margin + indent, ctx.y);
      pdfRenderRuns(ctx, parseInline(ordered[3]), {
        size, lineHeight, indent: indent + 20,
      });
      i += 1;
      continue;
    }

    // Regular paragraph line
    pdfRenderRuns(ctx, parseInline(line), { size, lineHeight });
    i += 1;
  }

  if (inCode) flushCode();
}

/* -------------------------------- export --------------------------------- */

function safeFilename(name) {
  return (name || 'note').replace(/[^\w\d\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'note';
}

/**
 * Builds and downloads a PDF for a note.
 * @param {{ title?: string, body?: string }} note
 * @param {{ jsPDF?: Function }} [deps] - injectable for tests
 * @returns {Promise<{ isMarkdown: boolean, filename: string }>}
 */
export async function exportNotePdf({ title, body }, deps = {}) {
  let JsPDF = deps.jsPDF;
  if (!JsPDF) {
    const mod = await import('jspdf');
    JsPDF = mod.jsPDF;
  }

  const noteTitle = (title || 'Note').trim() || 'Note';
  const isMarkdown = looksLikeMarkdown(`${noteTitle}\n${body || ''}`);

  // The first line of a note is its title. If that line is a Markdown
  // heading (# ...), fold the level into the title styling instead of
  // printing the literal hashes; otherwise render inline markup normally.
  let displayTitle = noteTitle;
  let titleSize = 20;
  const titleHeading = noteTitle.match(/^(#{1,6})\s+(.*)$/);
  if (titleHeading) {
    displayTitle = titleHeading[2].trim() || 'Note';
    titleSize = titleHeading[1].length >= 3 ? 16 : 20;
  }

  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const ctx = { doc, y: margin, margin, pageW, pageH };

  // Title (supports inline Markdown too)
  pdfRenderRuns(
    ctx,
    parseInline(displayTitle).map(r => ({ ...r, bold: true })),
    { size: titleSize, lineHeight: titleSize * 1.3 }
  );

  // Meta line
  ctx.y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 140);
  doc.text(`Exported from Archana's Notes · ${new Date().toLocaleString()}`, margin, ctx.y);
  ctx.y += 16;

  // Divider
  doc.setDrawColor(222, 222, 226);
  doc.setLineWidth(1);
  doc.line(margin, ctx.y, pageW - margin, ctx.y);
  ctx.y += 26;

  // Body: render as Markdown when it looks like Markdown, else plain text.
  const source = (body || '').replace(/\r\n?/g, '\n').trim() || '(This note has no additional text.)';
  if (looksLikeMarkdown(source)) pdfRenderMarkdown(ctx, source);
  else pdfRenderPlain(ctx, source);

  const filename = `${safeFilename(displayTitle)}.pdf`;
  doc.save(filename);
  return { isMarkdown, filename };
}

/**
 * Builds a polished, self-contained PDF for a blog post.
 * Includes a cover banner, title, meta line, tags, inline images and page
 * numbers. Images are fetched and normalised to PNG before rendering.
 *
 * @param {object} post
 * @param {string} post.title
 * @param {string} [post.author]
 * @param {string} [post.category]
 * @param {string[]} [post.tags]
 * @param {number|string} [post.readTime]
 * @param {string} [post.status]     'draft' | 'published'
 * @param {string} [post.date]       ISO date string
 * @param {string} [post.coverUrl]
 * @param {string} [post.body]       Markdown body
 * @param {{ jsPDF?: Function }} [deps]
 * @returns {Promise<{ filename: string }>}
 */
export async function exportBlogPdf({
  title,
  author,
  category,
  tags,
  readTime,
  status,
  date,
  coverUrl,
  body,
} = {}, deps = {}) {
  let JsPDF = deps.jsPDF;
  if (!JsPDF) {
    const mod = await import('jspdf');
    JsPDF = mod.jsPDF;
  }

  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const ctx = { doc, y: margin, margin, pageW, pageH };

  // Fetch cover + every inline image up-front (rendering is synchronous).
  const bodyText = (body || '').replace(/\r\n?/g, '\n');
  const inlineUrls = extractImageUrls(bodyText);
  const images = await prefetchImages(coverUrl ? [coverUrl, ...inlineUrls] : inlineUrls);

  // Cover banner
  const cover = coverUrl ? images[coverUrl] : null;
  if (cover) {
    const maxW = pageW - margin * 2;
    const h = Math.min(maxW * (cover.h / cover.w), pageH * 0.42);
    const w = h * (cover.w / cover.h);
    try { doc.addImage(cover.dataUrl, 'PNG', (pageW - w) / 2, ctx.y, w, h, undefined, 'FAST'); } catch { /* skip */ }
    ctx.y += h + 20;
  }

  // Accent bar
  doc.setFillColor(45, 106, 79);
  doc.rect(margin, ctx.y, 34, 3.5, 'F');
  ctx.y += 20;

  // Title
  pdfRenderRuns(
    ctx,
    parseInline(title || 'Untitled post').map(r => ({ ...r, bold: true })),
    { size: 23, lineHeight: 29 }
  );
  ctx.y += 4;

  // Meta line + tags
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 116, 104);
  const meta = [
    author || 'Archana Timilsina',
    date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
    category || null,
    readTime ? `${readTime} min read` : null,
    status === 'draft' ? 'Draft' : null,
  ].filter(Boolean);
  doc.text(pdfSafeText(meta.join('  \u00b7  ')), margin, ctx.y);
  ctx.y += 15;

  if (Array.isArray(tags) && tags.length) {
    doc.setTextColor(45, 106, 79);
    doc.text(pdfSafeText(tags.map(t => `#${t}`).join('   ')), margin, ctx.y);
    ctx.y += 15;
  }

  // Divider
  doc.setDrawColor(222, 222, 226);
  doc.setLineWidth(1);
  doc.line(margin, ctx.y, pageW - margin, ctx.y);
  ctx.y += 24;

  // Body
  const source = bodyText.trim() || '(This post has no content yet.)';
  if (looksLikeMarkdown(source)) pdfRenderMarkdown(ctx, source, images);
  else pdfRenderPlain(ctx, source);

  // Footer: running title + page numbers
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 158);
    doc.text(pdfSafeText(`Archana Timilsina  \u00b7  ${title || ''}`), margin, pageH - 26);
    doc.text(`${p} / ${pages}`, pageW - margin, pageH - 26, { align: 'right' });
  }

  const filename = `${safeFilename(title || 'blog-post')}.pdf`;
  doc.save(filename);
  return { filename };
}
