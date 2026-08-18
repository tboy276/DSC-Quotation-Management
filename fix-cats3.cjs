const fs = require('fs');

function fixImport2(file, depth) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('material-categories')) {
    content = `import { isSteelCategory } from '${depth}utils/material-categories';\n` + content;
  }
  fs.writeFileSync(file, content);
}

fixImport2('src/components/rfq/ForgingCalculatorForm.tsx', '../../');
fixImport2('src/components/rfq/SawingCalculatorForm.tsx', '../../');
