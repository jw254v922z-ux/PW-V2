import { describe, it, expect } from "vitest";

// Test number formatting functions
describe("Number Formatters", () => {
  // formatNumberWithCommas tests
  it("should format numbers with comma separators", () => {
    const formatNumberWithCommas = (value: number | string): string => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";
      return num.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    expect(formatNumberWithCommas(1000)).toBe("1,000");
    expect(formatNumberWithCommas(1234567)).toBe("1,234,567");
    expect(formatNumberWithCommas(100)).toBe("100");
    expect(formatNumberWithCommas(1000000)).toBe("1,000,000");
  });

  it("should handle string number inputs", () => {
    const formatNumberWithCommas = (value: number | string): string => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";
      return num.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    expect(formatNumberWithCommas("1000")).toBe("1,000");
    expect(formatNumberWithCommas("1234567.89")).toBe("1,234,568");
  });

  it("should format currency with GBP symbol and commas", () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
      }).format(value);
    };

    expect(formatCurrency(1000)).toBe("£1,000");
    expect(formatCurrency(1234567)).toBe("£1,234,567");
    expect(formatCurrency(100)).toBe("£100");
  });

  it("should format decimal numbers with specified precision", () => {
    const formatDecimal = (value: number, decimals: number = 2): string => {
      return value.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    expect(formatDecimal(1234.5, 2)).toBe("1,234.50");
    expect(formatDecimal(1234.567, 2)).toBe("1,234.57");
    expect(formatDecimal(1000, 1)).toBe("1,000.0");
  });

  it("should handle zero and negative numbers", () => {
    const formatNumberWithCommas = (value: number | string): string => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";
      return num.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    expect(formatNumberWithCommas(0)).toBe("0");
    expect(formatNumberWithCommas(-1000)).toBe("-1,000");
    expect(formatNumberWithCommas(-1234567)).toBe("-1,234,567");
  });

  it("should handle NaN gracefully", () => {
    const formatNumberWithCommas = (value: number | string): string => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";
      return num.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    expect(formatNumberWithCommas("invalid")).toBe("0");
    expect(formatNumberWithCommas(NaN)).toBe("0");
  });
});
