const fs = require('fs');
let content = fs.readFileSync('src/types/master-data.ts', 'utf8');

// Update CastingGrade
content = content.replace(
  /export interface CastingGrade \{([^}]+)\}/,
  `export interface CastingGrade {$1  return_scrap_material_id?: string | null;\n}`
);

// Update CastingBomItem
content = content.replace(
  /is_return_scrap: boolean;/,
  `/** @deprecated - Không còn dùng để tính DG_cast_scrap, chỉ giữ lại cho dữ liệu lịch sử */\n  is_return_scrap: boolean;`
);

// Update LiquidMetalPriceResult
content = content.replace(
  /DG_cast_scrap: number;\s*\/\/\s*[^\n]+/,
  `DG_cast_scrap: number;   // Đơn giá hồi liệu gang phế (VNĐ/kg)\n  DG_cast_scrap_warning?: string; // Cảnh báo nếu chưa gán vật tư hồi liệu`
);

fs.writeFileSync('src/types/master-data.ts', content);
console.log('Fixed types');
