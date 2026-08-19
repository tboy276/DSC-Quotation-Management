const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

content = content.replace(
  /loadBomItems\(currentGrade\.id\);/g,
  `loadGradesAndMaterials();\n                  loadBomItems(currentGrade.id);`
);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed CastingBomManager loadGradesAndMaterials bug again safely');
