export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl isn't available or options unsupported
    try {
      return "₹" + Math.round(amount).toLocaleString("en-IN");
    } catch (e2) {
      return "₹" + Math.round(amount);
    }
  }
}

export function formatCurrencyCompact(amount: number): string {
  // Try Intl with compact notation, but fall back gracefully if not supported
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(amount);
  } catch (e) {
    // Fallback: produce a compact string (K, M) for readability
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    const rounded = Math.round(Math.abs(amount));

    if (abs >= 1_000_000) {
      return `${sign}₹${Math.round((rounded / 1000000) * 10) / 10}M`;
    }
    if (abs >= 1000) {
      return `${sign}₹${Math.round((rounded / 1000) * 10) / 10}K`;
    }

    try {
      return sign + "₹" + rounded.toLocaleString("en-IN");
    } catch (e2) {
      return sign + "₹" + rounded;
    }
  }
}
