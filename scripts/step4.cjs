const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/CastingBomManager.tsx', 'utf8');

// 1. Remove column 'Cờ Hồi Liệu'
content = content.replace(
  /\{\s*key: 'is_return_scrap',[\s\S]*?\},/g,
  ''
);

// 2. Remove 'toggle_scrap' action
content = content.replace(
  /\{\s*key: 'toggle_scrap',[\s\S]*?\},/g,
  ''
);
// Also remove handleToggleReturnScrap
content = content.replace(
  /const handleToggleReturnScrap = async \([^}]+\} => \{[\s\S]*?loadBomItems\(selectedGradeId\);\s*\};/g,
  ''
);

// 3. Remove addIsReturnScrap checkbox from modal
content = content.replace(
  /const \[addIsReturnScrap, setAddIsReturnScrap\] = useState\(false\);/,
  ''
);
content = content.replace(
  /await addBomItem\(selectedGradeId, addMaterialId, addWeightKg, addIsReturnScrap\);/,
  `await addBomItem(selectedGradeId, addMaterialId, addWeightKg, false);`
);
content = content.replace(
  /<div className="flex items-center space-x-2 pt-1">[\s\S]*?Đánh dấu là Hồi liệu đúc \(is_return_scrap\)[\s\S]*?<\/div>/,
  ''
);

// 4. In loadBomItems / calculateLiquidMetalPrice logic
// Old: const calcResult = calculateLiquidMetalPrice(gradeId, bomData, priceData, matData);
// New: const calcResult = calculateLiquidMetalPrice(gradeObj, bomData, priceData, matData);
content = content.replace(
  /const calcResult = calculateLiquidMetalPrice\(gradeId, bomData, priceData, matData\);/,
  `const gradeObj = gradesData.find((g: any) => g.id === gradeId);\n      const calcResult = calculateLiquidMetalPrice(gradeObj, bomData, priceData, matData);`
);

// Also need to update the hook where price history is fetched
content = content.replace(
  /const loadBomItems = async \(gradeId: string\) => \{[\s\S]*?setBomItems\(bomData\);/,
  `const loadBomItems = async (gradeId: string) => {
    setLoading(true);
    try {
      const [bomData, matData, priceData, gradesData] = await Promise.all([
        fetchCastingBomItems(gradeId),
        fetchMaterials(),
        fetchPriceHistory(),
        fetchCastingGrades(),
      ]);
      const gradeObj = gradesData.find((g: any) => g.id === gradeId);
      const calcResult = calculateLiquidMetalPrice(gradeObj, bomData, priceData, matData);
      setLiquidPriceResult(calcResult);
      setBomItems(calcResult.bom_items_calculated as CastingBomItem[]);`
);

// 5. Add Dropdown for return_scrap_material_id
const returnScrapSelector = `
      {/* Return Scrap Material Selector */}
      {currentGrade && (
        <div className="p-4 bg-white border border-[#EAEAEA] rounded-[10px] shadow-sm mb-4">
          <label className="block text-[11px] font-bold text-[#111111] uppercase mb-2">
            Vật tư hồi liệu áp dụng cho mác gang này
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1 max-w-sm">
              <select
                value={currentGrade.return_scrap_material_id || ''}
                disabled={!isAdmin}
                onChange={async (e) => {
                  const newId = e.target.value;
                  await saveCastingGrade({ id: currentGrade.id, return_scrap_material_id: newId || null });
                  loadData();
                  loadBomItems(currentGrade.id);
                }}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                <option value="">-- Chọn vật tư hồi liệu --</option>
                {materials
                  .filter((m) => m.category === 'Hồi liệu')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.latest_price?.toLocaleString('vi-VN')} đ/kg
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-[#787774] mt-1.5 italic">
                * Để điều chỉnh đơn giá này, vào Master Data → Vật Tư → sửa giá vật tư hồi liệu tương ứng.
              </p>
            </div>
            
            {/* Cảnh báo nếu chưa gán */}
            {liquidPriceResult?.DG_cast_scrap_warning && (
              <div className="flex-1 p-3 rounded-[8px] bg-[#FFF8E6] border border-[#FDEBC8] text-[#956400] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-semibold">{liquidPriceResult.DG_cast_scrap_warning}</span>
              </div>
            )}
          </div>
        </div>
      )}
`;

content = content.replace(
  /\{\/\* Alert Banner 1000kg Check \*\/\}/,
  returnScrapSelector + '\n      {/* Alert Banner 1000kg Check */}'
);

fs.writeFileSync('src/components/master-data/CastingBomManager.tsx', content);
console.log('Fixed CastingBomManager.tsx');
