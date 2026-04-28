export const CEDI_SYMBOL = "₵";

export function formatCedi(value, options = {}) {
  const { decimals = 2 } = options;
  const numericValue = Number(value) || 0;

  return `${CEDI_SYMBOL}${numericValue.toFixed(decimals)}`;
}
