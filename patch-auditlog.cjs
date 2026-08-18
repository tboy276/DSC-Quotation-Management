const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditLogPage.tsx', 'utf8');

content = content.replace(
  /key: 'table_name',\r?\n\s*header: 'Table',\r?\n\s*sortable: true,\r?\n\s*className: 'font-mono text-\[11px\] text-\[#787774\]',/,
  "key: 'table_name',\n      header: 'Table',\n      sortable: true,\n      defaultHidden: true,\n      className: 'font-mono text-[11px] text-[#787774]',"
);

fs.writeFileSync('src/pages/AuditLogPage.tsx', content, 'utf8');
