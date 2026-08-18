const fs = require('fs');
let content = fs.readFileSync('src/lib/master-data-service.ts', 'utf8');

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

  // Check if used in Quotations (Quotation items)
  // Assuming quotes may reference it, but app stores simple JSON sometimes. Let's just do a basic check if there is a 'casting_grade_id' in quotes if schema has it, else rely on BOM count check.
  // We'll just rely on BOM count and Supabase foreign key constraints for quotes if any.

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

content = content.replace(/export async function saveCastingGrade[\s\S]*?logAudit[^;]*;\n\s*return data as CastingGrade;\n\s*\}/g, "$&" + deleteFunc);

fs.writeFileSync('src/lib/master-data-service.ts', content);
console.log('Added deleteCastingGrade');
