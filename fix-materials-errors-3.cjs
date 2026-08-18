const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

content = content.replace(/import \{ isSteelCategory \}/, "import { ALL_MATERIAL_CATEGORIES, isSteelCategory }");

// `addMaterialPrice(newMat.id, price)` needs 3 args. Wait, what is the third arg? `scrapPrice?: number`. But wait!
// The error says "Expected 3-4 arguments, but got 2."
// Let's check signature of addMaterialPrice in master-data-service.ts
// Wait, I can just pass undefined: `addMaterialPrice(newMat.id, price, undefined)`

content = content.replace(/addMaterialPrice\(newMat\.id, price\)/, "addMaterialPrice(newMat.id, price, undefined)");

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
  // Find the last `</Modal>` and insert before the ending `</div>`
  content = content.replace(/<\/Modal>\s*<\/div>\s*\)\;\s*\}\s*$/, "</Modal>\n" + importModal + "\n    </div>\n  );\n}");
}

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed MaterialsManager.tsx errors 3');
