const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MARK_SVG_PATH = path.join(__dirname, '../assets/mark.svg');

// Rasterized once per server process and cached — pdfkit can't embed SVG
// directly, and there's no reason to re-render the same fixed logo on every
// statement request. The promise itself is cached (not just the result) so
// concurrent first requests share one render instead of racing to do it twice.
let cached;
exports.getMarkPng = () => {
  if (!cached) {
    const svg = fs.readFileSync(MARK_SVG_PATH);
    cached = sharp(svg).resize({ height: 160 }).png().toBuffer();
  }
  return cached;
};
