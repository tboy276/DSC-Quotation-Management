const fs = require('fs');
let content = fs.readFileSync('src/lib/master-data-service.ts', 'utf8');

const regexFetch = /export async function fetchLiquidMetalPriceForGrade\(gradeId: string\) \{[\s\S]*?return calculateLiquidMetalPrice\([\s\S]*?\);\s*\}/;

const newFetch = `export async function fetchLiquidMetalPriceForGrade(gradeId: string) {
  const [bomItems, materials, priceHistory, grades] = await Promise.all([
    fetchCastingBomItems(gradeId),
    fetchMaterials(),
    fetchPriceHistory(),
    fetchCastingGrades(),
  ]);
  const grade = grades.find(g => g.id === gradeId);
  return calculateLiquidMetalPrice(grade, bomItems, priceHistory, materials);
}`;

content = content.replace(regexFetch, newFetch);

// Let's also check saveCastingGrade insert
content = content.replace(
  /\.insert\(\{ name: grade\.name \|\| '[^']+', code: grade\.code \|\| '', notes: grade\.notes \|\| '' \}\)/g,
  `.insert({ name: grade.name || 'Mác gang mới', code: grade.code || '', notes: grade.notes || '', return_scrap_material_id: grade.return_scrap_material_id })`
);

fs.writeFileSync('src/lib/master-data-service.ts', content);
console.log('Fixed fetchLiquidMetalPriceForGrade');
