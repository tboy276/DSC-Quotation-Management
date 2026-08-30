const fs = require('fs');
let content = fs.readFileSync('src/lib/calculation-engine/types.ts', 'utf8');

const t1 = 'k_profit_casting: number;   // Ph\u1ea7n tr\u0103m l\u1ee3i nhu\u1eadn \u0111\u00fac % (VD: 12 = 12%)';
const r1 = t1 + '\n  k_casting_price_adjustment?: number; // H\u1ec7 s\u1ed1 \u0111i\u1ec1u ch\u1ec9nh gi\u00e1 \u0111\u00fac \u0111\u1ec3 b\u00e1o gi\u00e1 (%), m\u1eb7c \u0111\u1ecbnh 100 = gi\u1eef nguy\u00ean gi\u00e1 v\u1ed1n t\u00ednh to\u00e1n';
content = content.replace(t1, r1);

const t2 = 'partA_per_kg: number;          // \u0110\u01a1n gi\u00e1 Ph\u1ea7n A / kg th\u00e0nh ph\u1ea9m (C_metal + C_ops / m_cast) (VN\u0110/kg)';
const r2 = t2 + '\n  partA_total_calculated: number; // Gi\u00e1 \u0111\u00fac T\u00cdNH TO\u00c1N TH\u1eacT (gi\u00e1 v\u1ed1n), ch\u01b0a \u0111i\u1ec1u ch\u1ec9nh \u2014 d\u00f9ng \u0111\u1ec3 tham chi\u1ebfu n\u1ed9i b\u1ed9\n  partA_total_quoted: number;     // Gi\u00e1 \u0111\u00fac SAU \u0111i\u1ec1u ch\u1ec9nh \u2014 d\u00f9ng \u0111\u1ec3 t\u00ednh COGS v\u00e0 gi\u00e1 b\u00e1n cu\u1ed1i\n  partA_per_kg_calculated: number;// Gi\u00e1 \u0111\u00fac t\u00ednh to\u00e1n tr\u00ean kg';
content = content.replace(t2, r2);

fs.writeFileSync('src/lib/calculation-engine/types.ts', content, 'utf8');