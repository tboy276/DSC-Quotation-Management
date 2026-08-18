const fs = require('fs');

function updateFile(file, replacer) {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
}

// 1. MaterialsManager.tsx
updateFile('src/components/master-data/MaterialsManager.tsx', (content) => {
  // Add import
  if (!content.includes('material-categories')) {
    content = content.replace(/import \{ \w+ \} from 'lucide-react';/, 
      "$& \nimport { ALL_MATERIAL_CATEGORIES, isSteelCategory } from '../../utils/material-categories';");
  }

  // Replace category == 'Thép cán - Rèn' with isSteelCategory
  content = content.replace(/m\.category === 'Thép cán - Rèn'/g, "isSteelCategory(m.category)");
  content = content.replace(/selectedMaterialForPrice\.category === 'Thép cán - Rèn'/g, "isSteelCategory(selectedMaterialForPrice.category)");
  content = content.replace(/selectedMaterialForPrice\?\.category === 'Thép cán - Rèn'/g, "isSteelCategory(selectedMaterialForPrice?.category)");
  content = content.replace(/historyMaterial\?\.category === 'Thép cán - Rèn'/g, "isSteelCategory(historyMaterial?.category)");

  // Replace <select> for matCategory options
  const oldSelect = `<option value="Thép cán - Rèn">Thép cán - Rèn</option>
                <option value="Gang thỏi">Gang thỏi</option>
                <option value="Thép phế đúc">Thép phế đúc</option>
                <option value="Hồi liệu">Hồi liệu</option>
                <option value="Fe-Si">Fe-Si</option>`;
  
  const newSelect = `{ALL_MATERIAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}`;
  
  content = content.replace(oldSelect, newSelect);

  // Replace filter category options
  const oldFilterSelect = `<option value="ALL">Tất cả Nhóm</option>
              <option value="Thép cán - Rèn">Thép cán - Rèn</option>
              <option value="Gang thỏi">Gang thỏi</option>
              <option value="Thép phế đúc">Thép phế đúc</option>
              <option value="Hồi liệu">Hồi liệu</option>
              <option value="Fe-Si">Fe-Si</option>`;
  
  const newFilterSelect = `<option value="ALL">Tất cả Nhóm</option>
              {ALL_MATERIAL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}`;

  content = content.replace(oldFilterSelect, newFilterSelect);
  
  // Also change setMatCategory default
  content = content.replace(/setMatCategory\('Thép cán - Rèn'\)/g, "setMatCategory('VT đúc (chính)')");
  content = content.replace(/useState\('Thép cán - Rèn'\)/g, "useState('VT đúc (chính)')");

  return content;
});

// 2. ForgingCalculatorForm.tsx
updateFile('src/components/rfq/ForgingCalculatorForm.tsx', (content) => {
  if (!content.includes('material-categories')) {
    content = content.replace(/import \{ \w+ \} from '\.\.\/\.\.\/types\/master-data';/, 
      "$& \nimport { isSteelCategory } from '../../utils/material-categories';");
  }
  content = content.replace(/m\.category === 'Thép cán - Rèn'/g, "isSteelCategory(m.category)");
  return content;
});

// 3. SawingCalculatorForm.tsx
updateFile('src/components/rfq/SawingCalculatorForm.tsx', (content) => {
  if (!content.includes('material-categories')) {
    content = content.replace(/import \{ \w+ \} from '\.\.\/\.\.\/types\/master-data';/, 
      "$& \nimport { isSteelCategory } from '../../utils/material-categories';");
  }
  content = content.replace(/m\.category === 'Thép cán - Rèn'/g, "isSteelCategory(m.category)");
  return content;
});

// 4. useQuotationStore.ts
updateFile('src/store/useQuotationStore.ts', (content) => {
  if (!content.includes('material-categories')) {
    content = content.replace(/import \{.*?\} from '\.\.\/lib\/supabase';/, 
      "$& \nimport { isSteelCategory } from '../utils/material-categories';");
  }
  content = content.replace(/m\.category === 'Thép cán - Rèn'/g, "isSteelCategory(m.category)");
  return content;
});

console.log('Fixed categories in all 4 files');
