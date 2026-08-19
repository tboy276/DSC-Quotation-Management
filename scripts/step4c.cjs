const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

content = content.replace(
  /calculateLiquidMetalPrice\(\s*selectedGradeId,\s*bomItems,\s*priceHistory,\s*materials\s*\)/g,
  `calculateLiquidMetalPrice(
    currentGrade,
    bomItems,
    priceHistory,
    materials
  )`
);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed line 204');
