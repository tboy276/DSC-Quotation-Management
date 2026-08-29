const fs = require('fs');
let content = fs.readFileSync('src/components/rfq/CostingPageToolbar.tsx', 'utf8');

content = content.replace(
  /rfqRecord,\r?\n\}: CostingPageToolbarProps/g,
  'rfqRecord,\n  disableSave,\n  disableSaveReason,\n}: CostingPageToolbarProps'
);

fs.writeFileSync('src/components/rfq/CostingPageToolbar.tsx', content, 'utf8');
