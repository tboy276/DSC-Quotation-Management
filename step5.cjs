const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

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
  content = content.replace(/\{\s*key: 'edit',/g, bulkImportBtn + "    {\n      key: 'edit',");
}

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed MaterialsManager.tsx remaining errors');
