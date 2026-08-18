const fs = require('fs');
let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

const importAction = `    {
      key: 'import',
      label: 'Nhập Từ Excel',
      icon: <TrendingUp className="w-3.5 h-3.5" />, // Reusing icon for now
      tooltip: 'Dán dữ liệu từ Excel để thêm nhiều vật tư',
      variant: 'neutral',
      enabled: () => isAdmin,
      onClick: () => setShowImportModal(true),
    },`;

content = content.replace(/key: 'create',[\s\S]*?onClick: \(\) => handleOpenMaterialModal\(\),\n    \},/, "$&\n" + importAction);

const stateImport = `  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
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
          
          if (!name || name === 'Tên VT') continue; // Skip header

          const price = parseInt(price26Str || price25Str || '0', 10);
          
          const newMat = await saveMaterial({
            name,
            category: cat,
            notes,
            unit: unit || 'kg',
          });
          
          if (price > 0 && newMat.id) {
            await addMaterialPrice(newMat.id, price, null);
          }
        }
      }
      setShowImportModal(false);
      setImportText('');
      loadData();
    } catch (err: any) {
      alert('Lỗi nhập: ' + err.message);
    }
    setImporting(false);
  };
`;

content = content.replace(/const \[showHistoryModal, setShowHistoryModal\] = useState\(false\);/, "$&\n" + stateImport);

const importModal = `
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        size="lg"
        title="Nhập Hàng Loạt Từ Excel"
        footer={
          <>
            <ActionButton variant="neutral" onClick={() => setShowImportModal(false)} label="Hủy" />
            <ActionButton variant="primary" type="submit" form="import-form" label={importing ? 'Đang Xử Lý...' : 'Nhập Dữ Liệu'} disabled={importing} />
          </>
        }
      >
        <form id="import-form" onSubmit={handleImportSubmit} className="space-y-4">
          <div className="bg-[#FBFBFA] p-3 rounded-[8px] border border-[#EAEAEA] text-xs text-[#787774] space-y-1">
            <p className="font-bold text-[#111111]">Hướng dẫn:</p>
            <p>1. Copy dữ liệu trực tiếp từ Excel (Bao gồm các cột: STT, Nhóm VT, Tên VT, Ghi chú, ĐVT, Đơn giá 2025, Đơn giá 2026).</p>
            <p>2. Dán (Paste) vào ô bên dưới.</p>
            <p className="italic text-amber-600 mt-1">Lưu ý: Hệ thống sẽ tự tạo vật tư và gán giá lịch sử tự động.</p>
          </div>
          <div>
            <textarea
              required
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] text-xs font-mono"
              rows={10}
              placeholder="Dán dữ liệu Excel (TSV) vào đây..."
            />
          </div>
        </form>
      </Modal>
`;

content = content.replace(/\{renderHistoryModal\(\)\}/, "$&\n" + importModal);

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Added Import feature');
