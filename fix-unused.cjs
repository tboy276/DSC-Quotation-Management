const fs = require('fs');

// 1. MaterialsManager.tsx
let matContent = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');
matContent = matContent.replace(/import \{ NEW_MATERIAL_CATEGORIES, ALL_MATERIAL_CATEGORIES, isSteelCategory \}/, "import { NEW_MATERIAL_CATEGORIES, isSteelCategory }");
fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', matContent);


// 2. CastingBomManager.tsx
let castContent = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');
castContent = castContent.replace(/import \{ NEW_MATERIAL_CATEGORIES, ALL_MATERIAL_CATEGORIES \}/, "import { NEW_MATERIAL_CATEGORIES }");
fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', castContent);

console.log('Fixed TS unused imports');
