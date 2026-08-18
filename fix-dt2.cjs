const fs = require('fs');

const file = 'src/components/ui/DataTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix duplicated onClick
content = content.replace(/className=\{`group \$\{onRowClick \? 'cursor-pointer' : ''\} hover:bg-\[\#FBFBFA\] transition-colors \$\{isChecked \? 'bg-slate-50 font-medium' : ''\}`\}\s*onClick=\{\(\) => onRowClick && onRowClick\(row\)\}/g,
"className={`group ${onRowClick ? 'cursor-pointer' : ''} hover:bg-[#FBFBFA] transition-colors ${isChecked ? 'bg-slate-50 font-medium' : ''}`}");

// Fix tooltip={action.tooltip} to title={action.tooltip}
content = content.replace(/tooltip=\{action\.tooltip\}/g, 'title={action.tooltip}');

fs.writeFileSync(file, content);
console.log('Fixed DataTable.tsx errors');
