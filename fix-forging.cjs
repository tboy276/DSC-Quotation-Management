const fs = require('fs');

const file = 'src/components/master-data/ForgingRatesManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/key: 'delete_press',\n\s*label: 'XoA Di MAy D-p'/g, "key: 'delete_press',\n        tooltip: 'Xoá Dải Máy Dập'");
content = content.replace(/label: 'Xoá Dải Máy Dập'/g, "tooltip: 'Xoá Dải Máy Dập'");

content = content.replace(/key: 'delete_hammer',\n\s*label: 'XoA Di MAy BAa'/g, "key: 'delete_hammer',\n        tooltip: 'Xoá Dải Máy Búa'");
content = content.replace(/label: 'Xoá Dải Máy Búa'/g, "tooltip: 'Xoá Dải Máy Búa'");

fs.writeFileSync(file, content);
console.log('Fixed ForgingRatesManager labels');
