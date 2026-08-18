const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

content = content.replace(/addMaterialPrice\(newMat\.id, price, undefined\)/, "addMaterialPrice(newMat.id, price, new Date().toISOString().split('T')[0])");

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

if (!content.includes('id="import-form"')) {
  // Use lastIndexOf to insert right before the last closing tags
  const lastIndex = content.lastIndexOf('</Modal>');
  if (lastIndex !== -1) {
    const before = content.substring(0, lastIndex + 8);
    const after = content.substring(lastIndex + 8);
    content = before + '\n' + importModal + after;
  }
}

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed errors 4');
