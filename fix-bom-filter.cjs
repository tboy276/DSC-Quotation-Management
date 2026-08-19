const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

// 1. Import ALL_MATERIAL_CATEGORIES
if (!content.includes('ALL_MATERIAL_CATEGORIES')) {
  content = content.replace(/import \{/, "import { ALL_MATERIAL_CATEGORIES } from '../../utils/material-categories';\n$&");
}

// 2. Add state
const filterState = `  const [addCategoryFilter, setAddCategoryFilter] = useState('ALL');`;
if (!content.includes('addCategoryFilter')) {
  content = content.replace(/const \[showAddModal, setShowAddModal\] = useState\(false\);/, "$&\n" + filterState);
}

// 3. Modifying onClick to reset filter
// Old: 
// onClick: () => {
//   if (materials.length > 0) setAddMaterialId(materials[0].id);
//   setShowAddModal(true);
// },
// New:
// onClick: () => {
//   setAddCategoryFilter('ALL');
//   if (materials.length > 0) setAddMaterialId(materials[0].id);
//   else setAddMaterialId('');
//   setShowAddModal(true);
// },
content = content.replace(/onClick: \(\) => \{\s*if \(materials\.length > 0\) setAddMaterialId\(materials\[0\]\.id\);\s*setShowAddModal\(true\);\s*\}/g, 
`onClick: () => {
          setAddCategoryFilter('ALL');
          if (materials.length > 0) setAddMaterialId(materials[0].id);
          else setAddMaterialId('');
          setShowAddModal(true);
        }`);

// 4. Update the form inside the modal
const formRegex = /<form id="add-bom-item-form" onSubmit=\{handleAddBomItemSubmit\} className="space-y-3">\s*<div>\s*<label className="block text-\[10px\] font-bold text-\[\#787774\] uppercase mb-1">\s*Ch?n V-t T NguyAn Liu/i;
// Oh wait, Vietnamese accents might be mangled. Let's use a simpler regex.
const newFormFields = `
          <form id="add-bom-item-form" onSubmit={handleAddBomItemSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                Lọc Theo Nhóm Vật Tư
              </label>
              <select
                value={addCategoryFilter}
                onChange={(e) => {
                  setAddCategoryFilter(e.target.value);
                  setAddMaterialId('');
                }}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                <option value="ALL">Tất cả Nhóm</option>
                {ALL_MATERIAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                Chọn Vật Tư Nguyên Liệu
              </label>
              <select
                value={addMaterialId}
                onChange={(e) => setAddMaterialId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
                required
              >
                <option value="" disabled>-- Chọn Vật Tư --</option>
                {materials
                  .filter(m => addCategoryFilter === 'ALL' || m.category === addCategoryFilter)
                  .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category}) — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}
                  </option>
                ))}
              </select>
            </div>
`;

// Replace from <form id="add-bom-item-form" ... to </select>\s*</div> for the first select (Material)
content = content.replace(/<form id="add-bom-item-form" onSubmit=\{handleAddBomItemSubmit\} className="space-y-3">[\s\S]*?<\/select>\s*<\/div>/, newFormFields);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed BOM Manager Dropdown');
