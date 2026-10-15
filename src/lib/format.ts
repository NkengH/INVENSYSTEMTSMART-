export function formatCFA(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "0 CFA";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 CFA";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} CFA`;
}

