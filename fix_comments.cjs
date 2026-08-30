const fs = require('fs');
let content = fs.readFileSync('src/lib/calculation-engine/types.ts', 'utf8');

const t1 = /(k_profit_casting: number;)\s*\\n\s*(k_casting_price_adjustment\?: number;)(\s*\/\/.*)/g;
content = content.replace(t1, '\\\n  \ // Hệ số điều chỉnh giá đúc để báo giá (%), mặc định 100 = giữ nguyên giá vốn tính toán');

const t2 = /(partA_per_kg: number;)\s*\\n\s*(partA_total_calculated: number;)\s*\\n\s*(partA_total_quoted: number;)\s*\\n\s*(partA_per_kg_calculated: number;)(\s*\/\/.*)/g;
content = content.replace(t2, '\\\n  \ // Giá đúc TÍNH TOÁN THẬT (giá vốn), chưa điều chỉnh — dùng để tham chiếu nội bộ\n  \     // Giá đúc SAU điều chỉnh — dùng để tính COGS và giá bán cuối\n  \// Giá đúc tính toán trên kg');

fs.writeFileSync('src/lib/calculation-engine/types.ts', content, 'utf8');