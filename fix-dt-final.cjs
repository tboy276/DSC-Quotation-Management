const fs = require('fs');
let content = fs.readFileSync('src/components/ui/DataTable.tsx', 'utf8');

content = content.replace(/className=\{`hover:bg-\[\#F0F0EE\] transition-colors cursor-pointer \$\{isChecked \? 'bg-\[\#F0F0EE\]\/60' : ''\}`\}/g, '');

fs.writeFileSync('src/components/ui/DataTable.tsx', content);
