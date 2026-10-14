export const DEFAULT_USD_TO_UGX_RATE = 4140;

export function convertUsdToUgx(
  amount?: number,
  rate = DEFAULT_USD_TO_UGX_RATE,
) {
  return amount == null ? undefined : Math.round(amount * rate);
}

export function formatCurrency(amount?: number, currency = "UGX") {
  return amount == null
    ? "Ask our sales team"
    : `${currency} ${new Intl.NumberFormat("en-UG", { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(amount)}`;
}
