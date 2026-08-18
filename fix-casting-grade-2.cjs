const fs = require('fs');

const deleteFunc = `
export async function deleteCastingGrade(id: string, name: string): Promise<void> {
  // Check if used in BOM items
  const { count: bomCount, error: bomError } = await supabase
    .from('casting_bom_items')
    .select('id', { count: 'exact', head: true })
    .eq('casting_grade_id', id);

  if (bomError) throw new Error(\`Lỗi kiểm tra dữ liệu BOM: \${bomError.message}\`);
  if (bomCount && bomCount > 0) {
    throw new Error('Không thể xoá Mác gang đang có chứa các thành phần BOM.');
  }

  const { error } = await supabase
    .from('casting_grades')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === '23503') { // Foreign key violation
      throw new Error('Không thể xoá Mác gang này vì đang được sử dụng trong các Báo giá/Tính giá.');
    }
    throw new Error(\`Lỗi khi xoá Mác gang Supabase: \${error.message}\`);
  }

  await fetchCastingGrades();
  await logAudit('DELETE_CASTING_GRADE', 'casting_grades', id, { name });
}
`;

fs.appendFileSync('src/lib/master-data-service.ts', deleteFunc);

let matContent = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');
matContent = matContent.replace(/import \{ ALL_MATERIAL_CATEGORIES, isSteelCategory \}/, "import { isSteelCategory }");
fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', matContent);

console.log('Appended deleteCastingGrade');
