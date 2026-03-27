export function centsToCurrency(cents: number) {
  return cents / 100;
}

export function currencyToCents(amount: number) {
  return Math.round(amount * 100);
}
