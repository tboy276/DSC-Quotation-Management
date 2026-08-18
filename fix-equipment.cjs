const fs = require('fs');

const file = 'src/components/master-data/EquipmentRatesManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<td className="py-3\.5 px-4 text-center">/g, 
'<td className="py-3.5 px-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">');

content = content.replace(/label="Sửa giá"/g, 'tooltip="Sửa giá"');

fs.writeFileSync(file, content);
console.log('Fixed EquipmentRatesManager hover reveal and icon-only');
