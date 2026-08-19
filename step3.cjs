const fs = require('fs');

let content = fs.readFileSync('src/components/master-data/MaterialsManager.tsx', 'utf8');

// Update imports from master-data-service
content = content.replace(/deletePriceHistoryItem,\n\s*INITIAL_BOM_ITEMS,/, "deletePriceHistoryItem,\n  fetchCastingBomItems,");

// Update imports from quotation-service
content = content.replace(/import \{ INITIAL_QUOTES \} from '\.\.\/\.\.\/lib\/quotation-service';/, "import { fetchQuotes } from '../../lib/quotation-service';");

// Update handleDeleteSelectedMaterials
const newDeleteHandler = `
  const handleDeleteSelectedMaterials = async (selectedRows: Material[]) => {
    setErrorMessage(null);
    if (selectedRows.length === 0) return;

    // Validation: Check usage in BOM or Quotes
    const inUseDetails: string[] = [];

    // Fetch live data instead of using INITIAL static mocks
    const allBomItems = await fetchCastingBomItems();
    const allQuotes = await fetchQuotes();

    for (const mat of selectedRows) {
      // 1. Check BOM items
      const bomUsage = allBomItems.filter((b) => b.material_id === mat.id);
      if (bomUsage.length > 0) {
        inUseDetails.push(\`Vật tư "\${mat.name}" đang thuộc BOM mẻ nấu đúc gang (\${bomUsage.length} thành phần).\`);
      }

      // 2. Check Quotes
      const quoteUsage = allQuotes.filter(
        (q: any) =>
          q.inputs_json?.selected_material_id === mat.id ||
          q.inputs_json?.selected_material === mat.name
      );
      if (quoteUsage.length > 0) {
        inUseDetails.push(\`Vật tư "\${mat.name}" đang được sử dụng trong \${quoteUsage.length} báo giá.\`);
      }
    }

    if (inUseDetails.length > 0) {
      setErrorMessage(\`Không thể xoá vật tư vì dữ liệu đang được liên kết:\\n- \${inUseDetails.join('\\n- ')}\`);
      return;
    }

    const confirmed = await confirm({
`;

content = content.replace(/const handleDeleteSelectedMaterials = async \([\s\S]*?const confirmed = await confirm\(\{/, newDeleteHandler);

fs.writeFileSync('src/components/master-data/MaterialsManager.tsx', content);
console.log('Fixed MaterialsManager.tsx for STEP 3');
