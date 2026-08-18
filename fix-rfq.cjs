const fs = require('fs');
const files = [
  'src/pages/CastingCostingPage.tsx',
  'src/pages/ForgingCostingPage.tsx',
  'src/pages/MachiningCostingPage.tsx',
  'src/pages/SawingCostingPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Restore rfq store
  if (!content.includes('const rfq = useQuotationStore')) {
    content = content.replace(/const \{\s*setIsChildDirty\s*\} = \(useOutletContext.*?\|\| \{\}\);\s*useEffect/g, 'const rfq = useQuotationStore(state => state.rfq);\n  const { setIsChildDirty } = (useOutletContext<any>() || {});\n\n  useEffect');
  }

  // Pass rfqRecord
  if (!content.includes('rfqRecord={rfq}')) {
    content = content.replace(/dossierRecord=\{activeDossierRecord\}/g, 'dossierRecord={activeDossierRecord}\n        rfqRecord={rfq}');
  }

  fs.writeFileSync(file, content);
});
console.log('Fixed pages with rfqRecord');
