const fs = require('fs');

function fixImport(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('material-categories')) {
    content = "import { isSteelCategory } from '../utils/material-categories';\n" + content;
  }
  fs.writeFileSync(file, content);
}

fixImport('src/store/useQuotationStore.ts');
