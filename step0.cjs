const fs = require('fs');

let content = fs.readFileSync('src/lib/master-data-service.ts', 'utf8');

const resetFunc = `
// Expose reset function for testing/initialization
export const resetMaterialsAndBom = async () => {
  try {
    console.log('Bắt đầu xoá dữ liệu cũ...');
    
    // 1. Delete casting_bom_items
    const res1 = await supabase.from('casting_bom_items').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    console.log('Đã xoá thành phần BOM:', res1.data?.length || 0, 'dòng');

    // 2. Delete material_price_history
    const res2 = await supabase.from('material_price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    console.log('Đã xoá lịch sử giá:', res2.data?.length || 0, 'dòng');

    // 3. Delete materials
    const res3 = await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    console.log('Đã xoá vật tư:', res3.data?.length || 0, 'dòng');

    console.log('Hoàn thành xoá sạch dữ liệu vật tư và BOM.');
  } catch (error: any) {
    console.error('Lỗi khi xoá dữ liệu:', error.message);
  }
};

if (typeof window !== 'undefined') {
  (window as any).__resetMaterialsAndBom = resetMaterialsAndBom;
}
`;

content += '\n' + resetFunc;

fs.writeFileSync('src/lib/master-data-service.ts', content);
console.log('Added resetMaterialsAndBom');
