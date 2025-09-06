export function nFormatter(num: number | string | null | undefined) {
  // Handle null, undefined, or empty string
  if (num === null || num === undefined || num === '') {
    return '0';
  }

  // Convert to number and check if valid
  const numValue = Number(num);
  if (isNaN(numValue)) {
    console.warn(`Invalid number input to nFormatter: "${num}"`);
    return '0';
  }

  // For numbers less than 1 million, use comma formatting
  if (numValue < 1e6) {
    return numValue.toLocaleString();
  }

  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
  ];
  lookup.reverse();
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item =
    lookup.find((item) => numValue >= item.value) ??
    lookup[lookup.length - 1];

  // For large numbers, show more precision for better readability
  let precision = 2;
  if (numValue >= 1e9) precision = 3; // Show more precision for billions+

  const v = parseFloat((numValue / item.value).toFixed(precision))
    .toString()
    .replace(regexp, "");

  return `${v}${item.symbol ? ' ' + item.symbol : ''}`;
}
