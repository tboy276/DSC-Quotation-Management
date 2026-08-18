const fs = require('fs');
let quote = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

quote = quote.replace(
  /export const createRfqDossierWithItems = async [\s\S]*?return mappedRfq;\s*\};/,
  (match) => {
    if (match.includes("logAudit('CREATE_RFQ'")) return match;
    return match.replace(/return mappedRfq;\s*\};/, "await logAudit('CREATE_RFQ', 'rfqs', dossierId, { customer_name: dossier.customer_name, item_count: items.length });\n  return mappedRfq;\n};");
  }
);

fs.writeFileSync('src/lib/quotation-service.ts', quote, 'utf8');
