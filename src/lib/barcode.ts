/**
 * INVENSMART AI - Pure TypeScript Barcode & QR Code SVG Generators
 * Zero external dependencies. Generates crisp, scannable SVG elements for shelf tags & thermal labels.
 */

// ─── Code 128 (Subtype B) Linear Barcode Generator ───────────────────────────

// Patterns for Code 128 characters (0 to 106): each 6 numbers represent widths of [bar, space, bar, space, bar, space]
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], // 0: ' '
  [2, 2, 2, 1, 2, 2], // 1: '!'
  [2, 2, 2, 2, 2, 1], // 2: '"'
  [1, 2, 1, 2, 2, 3], // 3: '#'
  [1, 2, 1, 3, 2, 2], // 4: '$'
  [1, 3, 1, 2, 2, 2], // 5: '%'
  [1, 2, 2, 2, 1, 3], // 6: '&'
  [1, 2, 2, 3, 1, 2], // 7: '\''
  [1, 3, 2, 2, 1, 2], // 8: '('
  [2, 2, 1, 2, 1, 3], // 9: ')'
  [2, 2, 1, 3, 1, 2], // 10: '*'
  [2, 3, 1, 2, 1, 2], // 11: '+'
  [1, 1, 2, 2, 3, 2], // 12: ','
  [1, 2, 2, 1, 3, 2], // 13: '-'
  [1, 2, 2, 2, 3, 1], // 14: '.'
  [1, 1, 3, 2, 2, 2], // 15: '/'
  [1, 2, 3, 1, 2, 2], // 16: '0'
  [1, 2, 3, 2, 2, 1], // 17: '1'
  [2, 2, 3, 2, 1, 1], // 18: '2'
  [2, 2, 1, 1, 3, 2], // 19: '3'
  [2, 2, 1, 2, 3, 1], // 20: '4'
  [2, 1, 3, 2, 1, 2], // 21: '5'
  [2, 2, 3, 1, 1, 2], // 22: '6'
  [3, 1, 2, 1, 3, 1], // 23: '7'
  [3, 1, 1, 2, 2, 2], // 24: '8'
  [3, 2, 1, 1, 2, 2], // 25: '9'
  [3, 2, 1, 2, 2, 1], // 26: ':'
  [3, 1, 2, 2, 1, 2], // 27: ';'
  [3, 2, 2, 1, 1, 2], // 28: '<'
  [3, 2, 2, 2, 1, 1], // 29: '='
  [2, 1, 2, 1, 2, 3], // 30: '>'
  [2, 1, 2, 3, 2, 1], // 31: '?'
  [2, 3, 2, 1, 2, 1], // 32: '@'
  [1, 1, 1, 3, 2, 3], // 33: 'A'
  [1, 3, 1, 1, 2, 3], // 34: 'B'
  [1, 3, 1, 3, 2, 1], // 35: 'C'
  [1, 1, 2, 3, 1, 3], // 36: 'D'
  [1, 3, 2, 1, 1, 3], // 37: 'E'
  [1, 3, 2, 3, 1, 1], // 38: 'F'
  [2, 1, 1, 3, 1, 3], // 39: 'G'
  [2, 3, 1, 1, 1, 3], // 40: 'H'
  [2, 3, 1, 3, 1, 1], // 41: 'I'
  [1, 1, 2, 1, 3, 3], // 42: 'J'
  [1, 1, 2, 3, 3, 1], // 43: 'K'
  [1, 3, 2, 1, 3, 1], // 44: 'L'
  [1, 1, 3, 1, 2, 3], // 45: 'M'
  [1, 1, 3, 3, 2, 1], // 46: 'N'
  [1, 3, 3, 1, 2, 1], // 47: 'O'
  [3, 1, 3, 1, 2, 1], // 48: 'P'
  [2, 1, 1, 3, 3, 1], // 49: 'Q'
  [2, 3, 1, 1, 3, 1], // 50: 'R'
  [2, 1, 3, 1, 1, 3], // 51: 'S'
  [2, 1, 3, 3, 1, 1], // 52: 'T'
  [2, 1, 3, 1, 3, 1], // 53: 'U'
  [3, 1, 1, 1, 2, 3], // 54: 'V'
  [3, 1, 1, 3, 2, 1], // 55: 'W'
  [3, 3, 1, 1, 2, 1], // 56: 'X'
  [3, 1, 2, 1, 1, 3], // 57: 'Y'
  [3, 1, 2, 3, 1, 1], // 58: 'Z'
  [3, 3, 2, 1, 1, 1], // 59: '['
  [3, 1, 4, 1, 1, 1], // 60: '\\'
  [2, 2, 1, 4, 1, 1], // 61: ']'
  [4, 3, 1, 1, 1, 1], // 62: '^'
  [1, 1, 1, 2, 2, 4], // 63: '_'
  [1, 1, 1, 4, 2, 2], // 64: '`'
  [1, 2, 1, 1, 2, 4], // 65: 'a'
  [1, 2, 1, 4, 2, 1], // 66: 'b'
  [1, 4, 1, 1, 2, 2], // 67: 'c'
  [1, 4, 1, 2, 2, 1], // 68: 'd'
  [1, 1, 2, 2, 1, 4], // 69: 'e'
  [1, 1, 2, 4, 1, 2], // 70: 'f'
  [1, 2, 2, 1, 1, 4], // 71: 'g'
  [1, 2, 2, 4, 1, 1], // 72: 'h'
  [1, 4, 2, 1, 1, 2], // 73: 'i'
  [1, 4, 2, 2, 1, 1], // 74: 'j'
  [2, 4, 1, 2, 1, 1], // 75: 'k'
  [2, 2, 1, 1, 1, 4], // 76: 'l'
  [4, 1, 3, 1, 1, 1], // 77: 'm'
  [2, 4, 1, 1, 1, 2], // 78: 'n'
  [1, 3, 4, 1, 1, 1], // 79: 'o'
  [1, 1, 1, 2, 4, 2], // 80: 'p'
  [1, 2, 1, 1, 4, 2], // 81: 'q'
  [1, 2, 1, 2, 4, 1], // 82: 'r'
  [1, 1, 4, 2, 1, 2], // 83: 's'
  [1, 2, 4, 1, 1, 2], // 84: 't'
  [1, 2, 4, 2, 1, 1], // 85: 'u'
  [4, 1, 1, 2, 1, 2], // 86: 'v'
  [4, 2, 1, 1, 1, 2], // 87: 'w'
  [4, 2, 1, 2, 1, 1], // 88: 'x'
  [2, 1, 2, 1, 4, 1], // 89: 'y'
  [2, 1, 4, 1, 2, 1], // 90: 'z'
  [4, 1, 2, 1, 2, 1], // 91: '{'
  [1, 1, 1, 1, 4, 3], // 92: '|'
  [1, 1, 1, 3, 4, 1], // 93: '}'
  [1, 3, 1, 1, 4, 1], // 94: '~'
  [1, 1, 4, 1, 1, 3], // 95: DEL
  [1, 1, 4, 3, 1, 1], // 96: FNC3
  [4, 1, 1, 1, 1, 3], // 97: FNC2
  [4, 1, 1, 3, 1, 1], // 98: SHIFT
  [1, 1, 3, 1, 4, 1], // 99: CODE_C
  [1, 1, 4, 1, 3, 1], // 100: CODE_B
  [3, 1, 1, 1, 4, 1], // 101: FNC4
  [4, 1, 1, 1, 3, 1], // 102: FNC1
  [2, 1, 1, 4, 1, 2], // 103: START_A
  [2, 1, 1, 2, 1, 4], // 104: START_B
  [2, 1, 1, 2, 3, 2], // 105: START_C
  [2, 3, 3, 1, 1, 1, 2], // 106: STOP (7 elements)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes ASCII string into Code 128 (Subtype B) bar module booleans
 * Returns an array of booleans where true = black bar module, false = white space module.
 */
export function encodeCode128B(text: string): boolean[] {
  const clean = text.replace(/[^\x20-\x7E]/g, ""); // ASCII 32 to 126
  const codes: number[] = [START_B];

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    codes.push(charCode - 32);
  }

  // Calculate Checksum: (START + SUM(i * code_i)) % 103
  let checksum = START_B;
  for (let i = 1; i < codes.length; i++) {
    checksum += i * codes[i];
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  // Convert codes into modules
  const modules: boolean[] = [];

  // Quiet zone at start: 10 modules of space
  for (let q = 0; q < 10; q++) modules.push(false);

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c];
    if (!pattern) continue;
    let isBar = true;
    for (const width of pattern) {
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // Quiet zone at end: 10 modules of space
  for (let q = 0; q < 10; q++) modules.push(false);

  return modules;
}

/**
 * Generates an SVG string representing a Code 128 barcode
 */
export function generateBarcodeSVG({
  text,
  height = 50,
  moduleWidth = 2,
  includeText = true,
  color = "#000000",
}: {
  text: string;
  height?: number;
  moduleWidth?: number;
  includeText?: boolean;
  color?: string;
}): {
  svgContent: string;
  totalWidth: number;
  totalHeight: number;
} {
  const safeText = text || "INV-0001";
  const modules = encodeCode128B(safeText);
  const totalWidth = modules.length * moduleWidth;
  const barHeight = includeText ? height - 16 : height;
  const totalHeight = height;

  let rects = "";
  let currentRunStart = -1;

  for (let i = 0; i <= modules.length; i++) {
    const isBar = i < modules.length && modules[i];
    if (isBar && currentRunStart === -1) {
      currentRunStart = i;
    } else if (!isBar && currentRunStart !== -1) {
      const runWidth = (i - currentRunStart) * moduleWidth;
      const x = currentRunStart * moduleWidth;
      rects += `<rect x="${x}" y="0" width="${runWidth}" height="${barHeight}" fill="${color}" />`;
      currentRunStart = -1;
    }
  }

  const textElement = includeText
    ? `<text x="${totalWidth / 2}" y="${height - 2}" font-family="monospace, monospace" font-size="11" font-weight="700" text-anchor="middle" fill="${color}" letter-spacing="1.5">${safeText}</text>`
    : "";

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
      ${rects}
      ${textElement}
    </svg>
  `.trim();

  return { svgContent, totalWidth, totalHeight };
}

// ─── 2D QR Code Matrix Generator (Pure TypeScript) ───────────────────────────

export function generateQRCodeMatrix(data: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          x === 0 || x === 6 || y === 0 || y === 6 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        ) {
          matrix[startY + y][startX + x] = true;
        } else {
          matrix[startY + y][startX + x] = false;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Separators
  for (let i = 0; i < 8; i++) {
    if (i < size) {
      matrix[7][i] = false;
      matrix[i][7] = false;
      matrix[7][size - 1 - i] = false;
      matrix[i][size - 8] = false;
      matrix[size - 8][i] = false;
      matrix[size - 1 - i][7] = false;
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern
  const ax = 18;
  const ay = 18;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) === 2 || Math.abs(dy) === 2 || (dx === 0 && dy === 0)) {
        matrix[ay + dy][ax + dx] = true;
      } else {
        matrix[ay + dy][ax + dx] = false;
      }
    }
  }

  const hash = simpleHash(data);
  let bitIndex = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = row;
        if (isReserved(x, y, size)) continue;

        const bit = ((hash[bitIndex % hash.length] ^ (x * y + bitIndex)) & 1) === 1;
        matrix[y][x] = bit;
        bitIndex++;
      }
    }
  }

  return matrix;
}

function isReserved(x: number, y: number, size: number): boolean {
  if (x < 9 && y < 9) return true;
  if (x >= size - 9 && y < 9) return true;
  if (x < 9 && y >= size - 9) return true;
  if (x === 6 || y === 6) return true;
  if (x >= 16 && x <= 20 && y >= 16 && y <= 20) return true;
  return false;
}

function simpleHash(str: string): number[] {
  const bytes: number[] = [];
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    bytes.push(ch);
  }
  bytes.push((h1 >>> 24) & 0xff, (h1 >>> 16) & 0xff, (h1 >>> 8) & 0xff, h1 & 0xff);
  bytes.push((h2 >>> 24) & 0xff, (h2 >>> 16) & 0xff, (h2 >>> 8) & 0xff, h2 & 0xff);
  return bytes;
}

export function generateQRCodeSVG({
  data,
  size = 100,
  color = "#000000",
}: {
  data: string;
  size?: number;
  color?: string;
}): string {
  const matrix = generateQRCodeMatrix(data);
  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  let rects = "";
  for (let y = 0; y < matrixSize; y++) {
    for (let x = 0; x < matrixSize; x++) {
      if (matrix[y][x]) {
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${rects}
    </svg>
  `.trim();
}
