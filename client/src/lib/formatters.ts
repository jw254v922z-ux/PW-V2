/**
 * Format a number with comma separators
 * @param value - The number to format
 * @returns Formatted string with commas (e.g., "1,234,567")
 */
export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num)) return "0";
  
  return num.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a number as currency with commas
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "£1,234,567")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a decimal number with commas and specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas (e.g., "1,234.56")
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage value
 * @param value - The value to format (can be decimal like 0.10 or 10)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "10.00%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  // If value is a small decimal (< 1), it's already in decimal form (0.10 = 10%)
  // If value is >= 1, it's already in percentage form
  const percentValue = value < 1 ? value : value / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue);
}
