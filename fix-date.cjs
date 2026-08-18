const fs = require('fs');
const files = [
  'src/pages/CastingCostingPage.tsx',
  'src/pages/ForgingCostingPage.tsx',
  'src/pages/MachiningCostingPage.tsx',
  'src/pages/SawingCostingPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const formatDate = .*?N\/A';/gs, '');
  content = content.replace(/const formatDateVerbose =.*?\}\s*;/gs, '');
  fs.writeFileSync(file, content);
});
console.log('Fixed formats 2');
