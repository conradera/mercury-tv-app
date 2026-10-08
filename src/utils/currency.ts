export function formatCurrency(amount?: number, currency = "UGX") {
  return amount == null
    ? "Ask our sales team"
    : `${currency} ${new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(amount)}`;
}
