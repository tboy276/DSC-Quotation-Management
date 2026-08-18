const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

// 1. Add imports
if (!content.includes('saveCastingGrade')) {
  content = content.replace(/import \{\n  fetchCastingBomItems,/, 
    "import {\n  fetchCastingBomItems,\n  saveCastingGrade,\n  deleteCastingGrade,");
}

// 2. Add state
const stateInsertion = `
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<CastingGrade | null>(null);
  const [gradeName, setGradeName] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeNotes, setGradeNotes] = useState('');
`;
content = content.replace(/const \[showEditWeightModal, setShowEditWeightModal\] = useState\(false\);/, "$&\n" + stateInsertion);

// 3. Add handlers
const handlersInsertion = `
  const handleOpenAddGrade = () => {
    setEditingGrade(null);
    setGradeName('');
    setGradeCode('');
    setGradeNotes('');
    setShowGradeModal(true);
  };

  const handleOpenEditGrade = () => {
    const g = grades.find(x => x.id === selectedGradeId);
    if (!g) return;
    setEditingGrade(g);
    setGradeName(g.name);
    setGradeCode(g.code || '');
    setGradeNotes(g.notes || '');
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCastingGrade({
      id: editingGrade?.id,
      name: gradeName,
      code: gradeCode,
      notes: gradeNotes
    });
    setShowGradeModal(false);
    loadGradesAndMaterials(); // Refresh grades
  };

  const handleDeleteGrade = async () => {
    const g = grades.find(x => x.id === selectedGradeId);
    if (!g) return;
    
    const confirmed = await confirm({
      title: 'Xoá Mác Gang',
      message: \`Bạn có chắc chắn muốn xoá mác gang "\${g.name}"? Chỉ có thể xoá khi mác gang này không có thành phần BOM nào.\`,
      confirmLabel: 'Xoá',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteCastingGrade(g.id, g.name);
      // Wait a bit to ensure it completes, then select the first one if possible
      const fetchedGrades = await fetchCastingGrades();
      setGrades(fetchedGrades);
      if (fetchedGrades.length > 0) {
        setSelectedGradeId(fetchedGrades[0].id);
      } else {
        setSelectedGradeId('');
        setBomItems([]);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };
`;
content = content.replace(/const handleAddBomItemSubmit = async/, handlersInsertion + "\n  const handleAddBomItemSubmit = async");

// 4. Update Header UI
const oldHeader = `          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-[#787774] uppercase">Mác Gang:</label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="px-3.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] 
focus:outline-none"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>`;
          
const newHeader = `          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-[#787774] uppercase whitespace-nowrap">Mác Gang:</label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="px-3.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-1 pl-1">
              <ActionButton
                variant="neutral"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                tooltip="Sửa mác gang này"
                onClick={handleOpenEditGrade}
                disabled={!selectedGradeId}
              />
              <ActionButton
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                tooltip="Xoá mác gang này"
                onClick={handleDeleteGrade}
                disabled={!selectedGradeId}
              />
              <div className="w-px h-4 bg-[#EAEAEA] mx-1" />
              <ActionButton
                variant="primary"
                icon={<Plus className="w-3.5 h-3.5" />}
                label="Thêm Mác Gang"
                onClick={handleOpenAddGrade}
              />
            </div>
          </div>`;

// Regex matching the space-x-2 div with select
content = content.replace(/<div className="flex items-center space-x-2">[\s\S]*?<\/select>\s*<\/div>/, newHeader);

// 5. Add Modal HTML
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
content = content.replace(/\{renderToolbar\(\)\}/, "$&\n" + modalHTML); // Wait, no renderToolbar in CastingBomManager.
content = content.replace(/<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/, modalHTML + "\n    </div>\n  );\n}");

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed CastingBomManager.tsx UI');
