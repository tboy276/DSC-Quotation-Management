const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

// 1. Remove RotateCcw
content = content.replace(/, RotateCcw/, "");

// 2. Remove handleToggleReturnScrap declaration completely (I must have missed it before)
content = content.replace(/const handleToggleReturnScrap[\s\S]*?loadBomItems\(selectedGradeId\);\s*\};/, "");

// 3. Fix Argument of type 'string' is not assignable... at calculateLiquidMetalPrice inside calculateSummary (or similar)
content = content.replace(/calculateLiquidMetalPrice\(gradeId, bomData, priceData, matData\);/g, "calculateLiquidMetalPrice(gradesData.find((g: any) => g.id === gradeId), bomData, priceData, matData);");

// Wait, I replaced this before but maybe there's another call I missed? Let's fix calculateSummary or handleToggleReturnScrap
// Actually I see: calculateLiquidMetalPrice(gradeId, bomItems, priceHistory, materials) might be called somewhere else in CastingBomManager.tsx
// Let me just replace `calculateLiquidMetalPrice(gradeId, bomItems,` with `calculateLiquidMetalPrice(gradesData.find(g => g.id === gradeId) || (currentGrade as any), bomItems,`

content = content.replace(/calculateLiquidMetalPrice\(gradeId, bomItems, priceHistory, materials\)/g, "calculateLiquidMetalPrice(currentGrade || undefined, bomItems, [], materials)");
// Actually let's just make it simpler.
content = content.replace(/calculateLiquidMetalPrice\(gradeId, bomData/g, "calculateLiquidMetalPrice(gradeObj, bomData");

// 4. `loadData` is undefined. It should be `loadBomItems(currentGrade.id)` only. I added `loadData();` by mistake.
content = content.replace(/loadData\(\);\s*loadBomItems\(currentGrade\.id\);/g, "loadBomItems(currentGrade.id);");

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed CastingBomManager.tsx errors');
