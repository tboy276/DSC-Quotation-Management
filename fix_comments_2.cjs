const fs = require('fs');
let content = fs.readFileSync('src/lib/calculation-engine/types.ts', 'utf8');

const t1 = /(k_profit_casting:\s*number;)\s*[\r\n]+\s*(k_casting_price_adjustment\?:\s*number;)(\s*\/\/.*)/g;
content = content.replace(t1, '\\\n  \ // Hệ số điều chỉnh giá đúc để báo giá (%), mặc định 100 = giữ nguyên giá vốn tính toán');

const t2 = /(partA_per_kg:\s*number;)\s*[\r\n]+\s*(partA_total_calculated:\s*number;)\s*[\r\n]+\s*(partA_total_quoted:\s*number;)\s*[\r\n]+\s*(partA_per_kg_calculated:\s*number;)(\s*\/\/.*)/g;
content = content.replace(t2, '\\\n  \ // Giá đúc TÍNH TOÁN THẬT (giá vốn), chưa điều chỉnh — dùng để tham chiếu nội bộ\n  \     // Giá đúc SAU điều chỉnh — dùng để tính COGS và giá bán cuối\n  \// Giá đúc tính toán trên kg');

fs.writeFileSync('src/lib/calculation-engine/types.ts', content, 'utf8');