const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/EquipmentRatesManager.tsx', 'utf8');
content = content.replace(/tooltip=".*?"/g, 'title="Sửa giá"');
fs.writeFileSync('src/components/master-data/EquipmentRatesManager.tsx', content);

let dtContent = fs.readFileSync('src/components/ui/DataTable.tsx', 'utf8');
dtContent = dtContent.replace(/onClick=\{\(\) => onRowClick && onRowClick\(row\)\}\s*onClick/g, 'onClick');
fs.writeFileSync('src/components/ui/DataTable.tsx', dtContent);
