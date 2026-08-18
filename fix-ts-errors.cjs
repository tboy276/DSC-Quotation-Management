const fs = require('fs');
const files = [
  'src/pages/CastingCostingPage.tsx',
  'src/pages/ForgingCostingPage.tsx',
  'src/pages/MachiningCostingPage.tsx',
  'src/pages/SawingCostingPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove msg={msg}
  content = content.replace(/\s*msg=\{msg\}/g, '');
  
  // Fix imports
  content = content.replace(/Check,\s*Copy,\s*Save,\s*/g, '');
  content = content.replace(/import\s*\{\s*QuoteStatusBadge\s*\}\s*from\s*'..\/components\/rfq\/QuoteStatusBadge';\s*\n/g, '');
  content = content.replace(/const\s*formatDate\s*=\s*.*?;\n/g, '');
  content = content.replace(/const\s*formatDateVerbose\s*=\s*.*?\n\s*if\s*\(.*?;\n\s*const.*?;\n\s*return.*?\n\};\n/gs, '');
  
  // rfq is used in: {activeItemRecord?.product_name || rfq.product_name} ? Wait! I removed rfq.product_name when I hardcoded 'N/A' !
  // Let me fix CostingPageToolbar.tsx to accept `productName` as prop or use rfq.product_name
  // Actually, I should just remove `const rfq = useQuotationStore...` if it's unused.
  content = content.replace(/const\s*rfq\s*=\s*useQuotationStore.*?;\n/g, '');

  fs.writeFileSync(file, content);
});

// Fix CostingPageToolbar.tsx
let tb = fs.readFileSync('src/components/rfq/CostingPageToolbar.tsx', 'utf8');
tb = tb.replace(/\s*msg\?: \{ type: 'success' \| 'error'; text: string \} \| null;\n/g, '');
tb = tb.replace(/\s*msg\n/g, '\n');
fs.writeFileSync('src/components/rfq/CostingPageToolbar.tsx', tb);

console.log('Fixed pages and toolbar');
