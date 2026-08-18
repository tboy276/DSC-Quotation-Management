const fs = require('fs');

const files = [
  'src/components/master-data/CastingBomManager.tsx',
  'src/components/master-data/ForgingBomManager.tsx',
  'src/components/master-data/MachiningRatesManager.tsx',
  'src/components/master-data/SawingRatesManager.tsx',
  'src/components/master-data/MaterialPricesManager.tsx',
  'src/components/master-data/HeatTreatmentManager.tsx',
  'src/components/master-data/CastingOperationsRatesManager.tsx',
  'src/components/master-data/CastingSettingsManager.tsx',
  'src/components/master-data/EquipmentRatesManager.tsx',
  'src/components/master-data/ForgingRatesManager.tsx',
  'src/components/master-data/MoldingRecipeManager.tsx',
  'src/components/master-data/SystemRatesManager.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Extract edit and delete actions from toolbarActions if they exist
  const editMatch = content.match(/\{\s*key:\s*'edit[\w_]*',\s*tooltip:.*?,[\s\S]*?\},/);
  const deleteMatch = content.match(/\{\s*key:\s*'delete[\w_]*',\s*tooltip:.*?,[\s\S]*?\},/);

  if (editMatch || deleteMatch) {
    if (editMatch) content = content.replace(editMatch[0], '');
    if (deleteMatch) content = content.replace(deleteMatch[0], '');

    let rowActionsContent = `const rowActions: DataTableAction<any>[] = [\n`;
    if (editMatch) {
      let editStr = editMatch[0].replace(/selectedRows\[0\]/g, 'selectedRows[0]').replace(/count === 1/g, 'count > 0');
      rowActionsContent += `    ${editStr}\n`;
    }
    if (deleteMatch) {
      let delStr = deleteMatch[0].replace(/selectedRows\.map\(\(r\) => r\.id\)/g, 'selectedRows.map((r) => r.id)');
      rowActionsContent += `    ${delStr}\n`;
    }
    rowActionsContent += `  ];\n\n  const toolbarActions`;

    content = content.replace(/const toolbarActions/g, rowActionsContent);
    content = content.replace(/toolbarActions=\{toolbarActions\}/g, 'toolbarActions={toolbarActions}\n          rowActions={rowActions}');
  }

  fs.writeFileSync(file, content);
});

console.log('Fixed master data managers to use rowActions');
