const fs = require('fs');
let content = fs.readFileSync('src/store/useQuotationStore.ts', 'utf8');

content = content.replace(/C_pattern_total:\s*45000000/g, 'C_pattern_total: undefined');
content = content.replace(/C_die_total:\s*85000000/g, 'C_die_total: undefined');

fs.writeFileSync('src/store/useQuotationStore.ts', content, 'utf8');
