const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

content = content.replace(
  /await saveCastingGrade\(\{ id: currentGrade\.id, return_scrap_material_id: newId \|\| null \}\);\s*loadBomItems\(currentGrade\.id\);/,
  `await saveCastingGrade({ id: currentGrade.id, return_scrap_material_id: newId || null });\n                  loadGradesAndMaterials();`
);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed CastingBomManager loadGradesAndMaterials bug');
