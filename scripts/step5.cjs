const fs = require('fs');

let content = fs.readFileSync('src/store/useQuotationStore.ts', 'utf8');

content = content.replace(
  /const fallbackResult = calculateLiquidMetalPrice\([\s\S]*?gradeId,[\s\S]*?INITIAL_BOM_ITEMS,[\s\S]*?INITIAL_PRICE_HISTORY,[\s\S]*?INITIAL_MATERIALS[\s\S]*?\);/,
  `const fallbackGrade = INITIAL_CASTING_GRADES.find(g => g.id === gradeId);
      const fallbackResult = calculateLiquidMetalPrice(
        fallbackGrade,
        INITIAL_BOM_ITEMS,
        INITIAL_PRICE_HISTORY,
        INITIAL_MATERIALS
      );`
);

fs.writeFileSync('src/store/useQuotationStore.ts', content);
console.log('Fixed useQuotationStore.ts');
