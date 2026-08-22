/**
 * Chuyển chuỗi nhập tay thành số, nhận diện linh hoạt cả kiểu Việt Nam
 * (dấu phẩy là thập phân: "12,5") lẫn kiểu quốc tế (dấu chấm là thập phân: "12.5"),
 * kể cả khi có dấu ngăn cách hàng nghìn (dán từ Excel: "1.250.000" hoặc "1,250,000").
 */
export function parseFlexibleNumber(valueStr: string | number | undefined | null): number {
  if (valueStr === undefined || valueStr === null || valueStr === "") return NaN;
  if (typeof valueStr === "number") return valueStr;

  let cleanStr = valueStr.trim().replace(/\s/g, "");
  if (!cleanStr) return NaN;

  const dotCount = (cleanStr.match(/\./g) || []).length;
  const commaCount = (cleanStr.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount > 0) {
    const lastDot = cleanStr.lastIndexOf('.');
    const lastComma = cleanStr.lastIndexOf(',');
    if (lastDot > lastComma) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (dotCount > 1) {
    cleanStr = cleanStr.replace(/\./g, '');
  } else if (commaCount > 1) {
    cleanStr = cleanStr.replace(/,/g, '');
  } else if (dotCount === 1) {
    const parts = cleanStr.split('.');
    const decimalPart = parts[1];
    if (decimalPart.length === 3) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  } else if (commaCount === 1) {
    const parts = cleanStr.split(',');
    const decimalPart = parts[1];
    if (decimalPart.length === 3) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(/,/g, '.');
    }
  }

  return parseFloat(cleanStr);
}