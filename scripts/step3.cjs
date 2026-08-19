const fs = require('fs');
let content = fs.readFileSync('src/lib/master-data-service.ts', 'utf8');

// 1. Update INITIAL_CASTING_GRADES
content = content.replace(
  /export const INITIAL_CASTING_GRADES: CastingGrade\[\] = \[([\s\S]*?)\];/,
  (match, p1) => {
    let newP1 = p1.replace(/{ id: '6ca47b3e-313e-442a-8b5b-f71e0e6e3688'/g, "{ id: '6ca47b3e-313e-442a-8b5b-f71e0e6e3688', return_scrap_material_id: 'mat-3'");
    newP1 = newP1.replace(/{ id: '1e630083-0215-4d58-ae7e-2dc1dbccc65b'/g, "{ id: '1e630083-0215-4d58-ae7e-2dc1dbccc65b', return_scrap_material_id: 'mat-3'");
    newP1 = newP1.replace(/{ id: '890b6849-f35a-4412-b9cc-5740230d7e40'/g, "{ id: '890b6849-f35a-4412-b9cc-5740230d7e40', return_scrap_material_id: 'mat-3'");
    newP1 = newP1.replace(/{ id: 'fc200000-0000-4000-a000-000000000200'/g, "{ id: 'fc200000-0000-4000-a000-000000000200', return_scrap_material_id: 'mat-4'");
    return `export const INITIAL_CASTING_GRADES: CastingGrade[] = [${newP1}];`;
  }
);

// 2. Update INITIAL_BOM_ITEMS
content = content.replace(/is_return_scrap: true/g, "is_return_scrap: false");

// 3. Update fetchLiquidMetalPriceForGrade
const oldFetch = `export async function fetchLiquidMetalPriceForGrade(gradeId: string) {
  const [bomItems, materials, priceHistory] = await Promise.all([
    fetchCastingBomItems(gradeId),
    fetchMaterials(),
    fetchPriceHistory(),
  ]);
  return calculateLiquidMetalPrice(gradeId, bomItems, priceHistory, materials);
}`;

const newFetch = `export async function fetchLiquidMetalPriceForGrade(gradeId: string) {
  const [bomItems, materials, priceHistory, grades] = await Promise.all([
    fetchCastingBomItems(gradeId),
    fetchMaterials(),
    fetchPriceHistory(),
    fetchCastingGrades(), // Must fetch grades to get return_scrap_material_id
  ]);
  const grade = grades.find(g => g.id === gradeId);
  return calculateLiquidMetalPrice(grade, bomItems, priceHistory, materials);
}`;

content = content.replace(oldFetch, newFetch);

// 4. Update saveCastingGrade
content = content.replace(
  /\.update\(\{ name: grade\.name, code: grade\.code, notes: grade\.notes \}\)/,
  `.update({ name: grade.name, code: grade.code, notes: grade.notes, return_scrap_material_id: grade.return_scrap_material_id })`
);
content = content.replace(
  /\.insert\(\{ name: grade\.name \|\| 'Mác gang mới', code: grade\.code \|\| '', notes: grade\.notes \|\| '' \}\)/,
  `.insert({ name: grade.name || 'Mác gang mới', code: grade.code || '', notes: grade.notes || '', return_scrap_material_id: grade.return_scrap_material_id })`
);
// Also for ASCII text:
content = content.replace(
  /\.insert\(\{ name: grade\.name \|\| 'MAc gang m>i', code: grade\.code \|\| '', notes: grade\.notes \|\| '' \}\)/,
  `.insert({ name: grade.name || 'Mác gang mới', code: grade.code || '', notes: grade.notes || '', return_scrap_material_id: grade.return_scrap_material_id })`
);

fs.writeFileSync('src/lib/master-data-service.ts', content);
console.log('Fixed master-data-service.ts');
