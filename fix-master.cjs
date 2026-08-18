const fs = require('fs');
const files = [
  'src/components/master-data/CastingBomManager.tsx',
  'src/components/master-data/ForgingBomManager.tsx',
  'src/components/master-data/MachiningRatesManager.tsx',
  'src/components/master-data/SawingRatesManager.tsx',
  'src/components/master-data/MaterialPricesManager.tsx',
  'src/components/master-data/HeatTreatmentManager.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace edit
  content = content.replace(/key:\s*'edit[\w_]*',\s*\n\s*label:\s*('.*?'),\s*\n\s*icon:\s*<Edit2.*?,\s*\n\s*variant:\s*'(.*?)',/gs, (match, label, variant) => {
    return `key: 'edit',
        tooltip: ${label},
        icon: <Edit2 className="w-3.5 h-3.5" />,
        variant: 'primary',`;
  });

  // Replace delete
  content = content.replace(/key:\s*'delete[\w_]*',\s*\n\s*label:\s*('.*?'),\s*\n\s*icon:\s*<Trash2.*?,\s*\n\s*variant:\s*'(.*?)',/gs, (match, label, variant) => {
    return `key: 'delete',
        tooltip: ${label},
        icon: <Trash2 className="w-3.5 h-3.5" />,
        variant: 'danger',`;
  });

  fs.writeFileSync(file, content);
});
console.log('Fixed master data managers');
