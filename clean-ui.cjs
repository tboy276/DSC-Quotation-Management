const fs = require('fs');

const uiFiles = [
  'src/components/quotations/QuotationsManager.tsx',
  'src/components/quotations/DocumentDetailModal.tsx',
  'src/components/master-data/MaterialsManager.tsx',
  'src/components/master-data/ForgingRatesManager.tsx',
  'src/components/master-data/MoldingRecipeManager.tsx',
  'src/pages/DashboardPage.tsx',
];

for (const file of uiFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove imports
    content = content.replace(/import \{ logAudit \} from '.*?audit-service';\n?/g, '');
    content = content.replace(/import \{ logAudit, formatAuditDetails \} from '.*?audit-service';\n?/g, '');
    
    // Remove function calls
    // Example: logAudit('DELETE_RFQ', 'rfq_items', undefined, { count: itemIds.length, ids: itemIds });
    content = content.replace(/^[ \t]*logAudit\(.*?\);\n?/gm, '');
    
    // Special case for DashboardPage: await logAudit
    content = content.replace(/^[ \t]*await logAudit\(.*?\);\n?/gm, '');
    
    // For MaterialManager:
    // logAudit('DELETE_MATERIAL', 'materials', undefined, { count: ... });
    // This is caught by the regex above if it is on a single line. 
    // Wait, logAudit might be multiline.
    content = content.replace(/logAudit\([\s\S]*?\);/g, '');

    // Now, some functions like deleteMaterials(selected.map((r) => r.id)) need to be updated to deleteMaterials(..., names)
    if (file.includes('MaterialsManager.tsx')) {
      content = content.replace(
        /deleteMaterials\(selected\.map\(\(r\) => r\.id\)\)/g,
        "deleteMaterials(selected.map((r) => r.id), selected.map((r) => r.name))"
      );
      content = content.replace(
        /deletePriceHistoryItem\(item\.id\)/g,
        "deletePriceHistoryItem(item.id, selectedMaterial?.name)"
      );
    }
    
    if (file.includes('ForgingRatesManager.tsx')) {
        // no need, we added label in update, but for now we didn't update the UI call signature because it's not a delete, wait, we did add label to updatePressingRate.
        // Let's pass the name.
        content = content.replace(
            /updatePressingRate\(rate\.id, Math\.round\(newRate\)\)/g,
            "updatePressingRate(rate.id, Math.round(newRate), rate.machine_name)"
        );
        content = content.replace(
            /updateHammerRate\(rate\.id, Math\.round\(newRate\)\)/g,
            "updateHammerRate(rate.id, Math.round(newRate), rate.machine_name)"
        );
    }
    
    if (file.includes('DashboardPage.tsx')) {
      content = content.replace(
        /updateUserRole\(targetUserId, role\)/g,
        "updateUserRole(targetUserId, role, userEmail)"
      );
      content = content.replace(
        /revokeUserProfile\(targetUserId\)/g,
        "revokeUserProfile(targetUserId, userEmail)"
      );
    }
    
    if (file.includes('MoldingRecipeManager.tsx')) {
        content = content.replace(
            /deleteMoldingRecipeItem\(item\.id\)/g,
            "deleteMoldingRecipeItem(item.id, item.material_name)"
        );
    }

    fs.writeFileSync(file, content, 'utf8');
  }
}
