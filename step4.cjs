const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

content = content.replace('INITIAL_BOM_ITEMS,', 'fetchCastingBomItems,');
content = content.replace('INITIAL_BOM_ITEMS', 'fetchCastingBomItems'); // Just in case there are multiple

content = content.replace('b => b.material_id', '(b: any) => b.material_id');

// Make sure `bulk_import` button exists in toolbarActions
const bulkImportBtn = `    {
      key: 'bulk_import',
      label: 'Nhập Từ Excel',
      icon: <Upload className="w-3.5 h-3.5" />,
      tooltip: 'Nhập hàng loạt từ Excel',
      variant: 'neutral',
      enabled: () => isAdmin,
      onClick: () => setShowImportModal(true),
    },
`;

if (!content.includes("key: 'bulk_import'")) {
  // Find where toolbarActions starts and insert after the first action
  content = content.replace(/(key: 'create',[\s\S]*?onClick: \(\) => handleOpenMaterialModal\(\),\n\s*\},)/, "$1\n" + bulkImportBtn);
}

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed MaterialsManager.tsx remaining errors');
