const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

// 1. Add Upload to imports
if (!content.includes('Upload')) {
  content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1, Upload } from 'lucide-react';");
}

// 2. Add bulk_import button
const bulkImportBtn = `
    {
      key: 'bulk_import',
      label: 'Nhập Từ Excel',
      icon: <Upload className="w-3.5 h-3.5" />,
      tooltip: 'Nhập hàng loạt từ Excel',
      variant: 'neutral',
      enabled: () => isAdmin,
      onClick: () => setShowImportModal(true),
    },`;

if (!content.includes("key: 'bulk_import'")) {
  content = content.replace(/key: 'create',[\s\S]*?onClick: \(\) => handleOpenMaterialModal\(\),\n    \},/, "$&" + bulkImportBtn);
}

// 3. Replace handleImportSubmit
const newHandleImportSubmit = `  const [importSummary, setImportSummary] = useState<{ success: number; skipped: number } | null>(null);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportSummary(null);
    let successCount = 0;
    let skippedCount = 0;
    const seenNames = new Set<string>(); // To track duplicates in the current paste

    try {
      const rows = importText.trim().split('\\n');
      for (const row of rows) {
        // Expected format: STT, Nhóm VT, Tên VT, Ghi chú, ĐVT, Đơn giá 2025, Đơn giá 2026
        const cols = row.split('\\t');
        if (cols.length >= 6) {
          const cat = cols[1]?.trim();
          const name = cols[2]?.trim();
          const notes = cols[3]?.trim();
          const unit = cols[4]?.trim();
          const price25Str = cols[5]?.replace(/\\./g, '').trim();
          const price26Str = cols[6]?.replace(/\\./g, '').trim();
          
          if (!name || name.toLowerCase() === 'tên vt') continue; // Skip header or empty name

          // Check duplicate in same paste
          if (seenNames.has(name.toLowerCase())) {
            skippedCount++;
            continue;
          }
          seenNames.add(name.toLowerCase());

          const price2025 = parseInt(price25Str || '0', 10);
          const price2026 = parseInt(price26Str || '0', 10);
          
          const newMat = await saveMaterial({
            name,
            category: cat,
            notes,
            unit: unit || 'kg',
          });
          
          if (newMat.id) {
            if (price2025 > 0) {
              await addMaterialPrice(newMat.id, price2025, '2025-01-01');
            }
            if (price2026 > 0 && price2026 !== price2025) {
              await addMaterialPrice(newMat.id, price2026, '2026-01-01');
            }
            successCount++;
          } else {
            skippedCount++;
          }
        } else {
          // invalid row format
          skippedCount++;
        }
      }
      
      setImportSummary({ success: successCount, skipped: skippedCount });
      setImportText('');
      loadData();
    } catch (err: any) {
      alert('Lỗi nhập: ' + err.message);
    }
    setImporting(false);
  };`;

content = content.replace(/const handleImportSubmit = async \([\s\S]*?setImporting\(false\);\n  };/, newHandleImportSubmit);

// 4. Update Import Modal HTML to show summary
const summaryHtml = `
          {importSummary && (
            <div className="p-3 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-[6px] text-xs font-bold">
              <p>Đã nhập thành công: {importSummary.success} dòng.</p>
              <p>Bị bỏ qua (trùng lặp/lỗi): {importSummary.skipped} dòng.</p>
            </div>
          )}
`;

content = content.replace(/<form id="import-form" onSubmit=\{handleImportSubmit\} className="space-y-4">/, "$&\n" + summaryHtml);

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed MaterialsManager.tsx for STEP 1 & 2');
