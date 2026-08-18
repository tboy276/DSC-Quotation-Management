const fs = require('fs');
let quote = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

quote = quote.replace(
  /localItemsCache\.unshift\(\.\.\.createdDossier\.items\);\r?\n\s*\}\r?\n\r?\n\s*return createdDossier;/g,
  "localItemsCache.unshift(...createdDossier.items);\n  }\n\n  await logAudit('CREATE_RFQ', 'rfqs', dbDossier.id, { customer_name: dossier.customer_name, item_count: items.length });\n  return createdDossier;"
);

fs.writeFileSync('src/lib/quotation-service.ts', quote, 'utf8');
