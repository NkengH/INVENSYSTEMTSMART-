import { describe, it, expect } from "vitest";
import { encodeCode128B, generateBarcodeSVG, generateQRCodeSVG, generateQRCodeMatrix } from "@/lib/barcode";

describe("Barcode & QR Code Generator", () => {
  it("encodes ASCII string into Code 128 modules", () => {
    const modules = encodeCode128B("TEST-123");
    expect(modules.length).toBeGreaterThan(50);
    // Should have quiet zones
    expect(modules.slice(0, 10).every((m) => m === false)).toBe(true);
    expect(modules.slice(-10).every((m) => m === false)).toBe(true);
  });

  it("generates valid SVG for Code 128 barcode", () => {
    const result = generateBarcodeSVG({ text: "AIR-LAP-001", height: 60, moduleWidth: 2 });
    expect(result.svgContent).toContain("<svg");
    expect(result.svgContent).toContain("<rect");
    expect(result.svgContent).toContain("AIR-LAP-001");
    expect(result.totalWidth).toBeGreaterThan(100);
    expect(result.totalHeight).toBe(60);
  });

  it("generates valid 2D QR matrix and SVG", () => {
    const matrix = generateQRCodeMatrix("SKU:AIR-LAP-001");
    expect(matrix.length).toBe(25);
    expect(matrix[0].length).toBe(25);

    const svg = generateQRCodeSVG({ data: "SKU:AIR-LAP-001", size: 90 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
    expect(svg).toContain('viewBox="0 0 90 90"');
  });
});
