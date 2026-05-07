export const CURRENCY_SYMBOL = "GH₵";

export const formatCedi = (value, options = {}) => {
  const { decimals } = options;
  const amount = Number(value) || 0;
  const displayValue = typeof decimals === "number" ? amount.toFixed(decimals) : amount;

  return `${CURRENCY_SYMBOL} ${displayValue}`;
};
