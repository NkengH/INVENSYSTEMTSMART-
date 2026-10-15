import { describe, it, expect } from "vitest";
import { formatCFA } from "@/lib/format";

describe("formatCFA()", () => {
  it("formats a plain integer correctly", () => {
    expect(formatCFA(1000)).toBe("1,000 CFA");
  });

  it("formats a decimal number correctly", () => {
    expect(formatCFA(1234.5)).toBe("1,234.5 CFA");
  });

  it("formats a string number correctly", () => {
    expect(formatCFA("2500")).toBe("2,500 CFA");
  });

  it("returns '0 CFA' for undefined", () => {
    expect(formatCFA(undefined)).toBe("0 CFA");
  });

  it("returns '0 CFA' for null", () => {
    expect(formatCFA(null)).toBe("0 CFA");
  });

  it("returns '0 CFA' for a non-numeric string", () => {
    expect(formatCFA("not-a-number")).toBe("0 CFA");
  });

  it("formats zero as '0 CFA'", () => {
    expect(formatCFA(0)).toBe("0 CFA");
  });

  it("formats large amounts correctly", () => {
    expect(formatCFA(1000000)).toBe("1,000,000 CFA");
  });

  it("formats negative amounts", () => {
    expect(formatCFA(-500)).toBe("-500 CFA");
  });
});
