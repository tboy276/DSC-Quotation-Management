const fs = require('fs');

let matContent = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');
if (!matContent.includes('isSteelCategory')) {
  matContent = "import { ALL_MATERIAL_CATEGORIES, isSteelCategory } from '../../utils/material-categories';\n" + matContent;
}
matContent = matContent.replace(/isSteelCategory\(selectedMaterialForPrice\?\.category\)/g, "isSteelCategory(selectedMaterialForPrice?.category)"); // already done
matContent = matContent.replace(/selectedMaterialForPrice\.unit/g, "selectedMaterialForPrice?.unit"); // fix possibly null
fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', matContent);

let castContent = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');
if (!castContent.includes('saveCastingGrade')) {
  castContent = "import { saveCastingGrade, deleteCastingGrade } from '../../lib/master-data-service';\n" + castContent;
}
castContent = castContent.replace(/tooltip="/g, 'title="');

const modalHTML = `
        {/* Modal: Add/Edit Casting Grade */}
        <Modal
          isOpen={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          size="sm"
          title={editingGrade ? 'Sửa Mác Gang' : 'Thêm Mác Gang Mới'}
          footer={
            <>
              <ActionButton variant="neutral" onClick={() => setShowGradeModal(false)} label="Hủy" />
              <ActionButton variant="primary" type="submit" form="grade-form" label="Lưu Mác Gang" />
            </>
          }
        >
          <form id="grade-form" onSubmit={handleGradeSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Tên Mác Gang *</label>
              <input type="text" required value={gradeName} onChange={e => setGradeName(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-bold" placeholder="VD: FCD500-7" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Mã (Tùy chọn)</label>
              <input type="text" value={gradeCode} onChange={e => setGradeCode(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs" placeholder="Mã ngắn gọn" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Ghi Chú</label>
              <textarea value={gradeNotes} onChange={e => setGradeNotes(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs" rows={3} placeholder="Ghi chú thêm..." />
            </div>
          </form>
        </Modal>
`;

if (!castContent.includes('id="grade-form"')) {
  castContent = castContent.replace(/<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/, modalHTML + "\n      </div>\n    </div>\n  );\n}");
}

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', castContent);
console.log('Fixed Casting and Materials Managers');
