const fs = require('fs');

// 1. MaterialsManager.tsx
let matContent = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

if (!matContent.includes('NEW_MATERIAL_CATEGORIES')) {
  matContent = matContent.replace(/import \{ ALL_MATERIAL_CATEGORIES, isSteelCategory \}/, "import { NEW_MATERIAL_CATEGORIES, ALL_MATERIAL_CATEGORIES, isSteelCategory }");
}

// Replace ALL_MATERIAL_CATEGORIES with NEW_MATERIAL_CATEGORIES in dropdown maps
matContent = matContent.replace(/ALL_MATERIAL_CATEGORIES\.map/g, "NEW_MATERIAL_CATEGORIES.map");

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', matContent);


// 2. CastingBomManager.tsx
let castContent = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

if (!castContent.includes('NEW_MATERIAL_CATEGORIES')) {
  castContent = castContent.replace(/import \{ ALL_MATERIAL_CATEGORIES \}/, "import { NEW_MATERIAL_CATEGORIES, ALL_MATERIAL_CATEGORIES }");
}

castContent = castContent.replace(/ALL_MATERIAL_CATEGORIES\.map/g, "NEW_MATERIAL_CATEGORIES.map");

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', castContent);

console.log('Fixed categories to only show NEW_MATERIAL_CATEGORIES');
