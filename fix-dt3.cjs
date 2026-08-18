const fs = require('fs');
const file = 'src/components/ui/DataTable.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className=\{`group \$\{onRowClick \? 'cursor-pointer' : ''\} hover:bg-\[\#FBFBFA\] transition-colors \$\{isChecked \? 'bg-slate-50 font-medium' : ''\}`\}\n\s*onClick=\{\(\) => onRowClick && onRowClick\(row\)\}/g,
"className={`group ${onRowClick ? 'cursor-pointer' : ''} hover:bg-[#FBFBFA] transition-colors ${isChecked ? 'bg-slate-50 font-medium' : ''}`}");

fs.writeFileSync(file, content);
