const fs = require('fs');

let content = fs.readFileSync('src/lib/repricing-service.ts', 'utf8');

if (!content.includes("import { logAudit }")) {
  content = content.replace("import { formatDate } from './format-date';", "import { formatDate } from './format-date';\nimport { logAudit } from './audit-service';");
}

content = content.replace(
  /(export const createRepricingRfqFromDocument = async [\s\S]*?\): Promise<\{ newRfq: RfqDossier; newItemIds: string\[\] \}> => \{[\s\S]*?)(  return \{ newRfq, newItemIds: itemIds \};\n\})/,
  "$1  await logAudit('REPRICE_DOCUMENT', 'quotation_documents', document.id, { document_code: document.document_code || document.id, customer_name: document.customer_name });\n$2"
);

fs.writeFileSync('src/lib/repricing-service.ts', content, 'utf8');
