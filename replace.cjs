const fs = require('fs');
let content = fs.readFileSync('src/components/rfq/CastingCalculatorForm.tsx', 'utf8');

content = content.replace(
  'const yield_ratio = Math.max(0.01, (casting.Y_yield || 60)) / 100;',
  'const hasYield = casting.Y_yield !== undefined;\n  const yield_ratio = Math.max(0.01, (casting.Y_yield ?? 0.01)) / 100;'
);

content = content.replace(
  '<div className="font-bold text-[#00A651]">- {cost_scrap_1000.toLocaleString(\'vi-VN\')} VNĐ</div>',
  '<div className="font-bold text-[#00A651]">{hasYield ? \- \ VNĐ\ : \'—\'}</div>'
);

content = content.replace(
  '<div className="font-bold text-[#111111]">{Math.round(dg_liquid_final / yield_ratio).toLocaleString(\'vi-VN\')} VNĐ/kg</div>',
  '<div className="font-bold text-[#111111]">{hasYield ? \\ VNĐ/kg\ : \'Nhập % thu hồi để xem\'}</div>'
);

content = content.replace(
  '{Math.round(partA_per_kg * m_cast).toLocaleString(\'vi-VN\')}',
  '{hasYield ? Math.round(partA_per_kg * m_cast).toLocaleString(\'vi-VN\') : \'—\'}'
);

fs.writeFileSync('src/components/rfq/CastingCalculatorForm.tsx', content, 'utf8');
