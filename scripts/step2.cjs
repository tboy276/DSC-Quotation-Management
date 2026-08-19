const fs = require('fs');
let content = `import type {
  CastingGrade,
  CastingBomItem,
  MaterialPriceHistory,
  Material,
  LiquidMetalPriceResult,
} from '../../types/master-data';

/**
 * Pure Calculation Function: Calculate Liquid Metal Price (DG_liquid) and Return Scrap Price (DG_cast_scrap)
 *
 * DG_liquid = (Tổng chi phí các vật tư trong mẻ 1000kg) / 1000
 * DG_cast_scrap = Giá của vật tư hồi liệu được gán trực tiếp cho mác gang
 */
export function calculateLiquidMetalPrice(
  grade: CastingGrade | undefined,
  bomItems: CastingBomItem[],
  priceHistoryList: MaterialPriceHistory[],
  materialsList: Material[] = []
): LiquidMetalPriceResult {
  const gradeId = grade?.id || '';

  // 1. Lọc các dòng BOM của mác gang này
  const gradeBomItems = bomItems.filter(
    (item) => item.casting_grade_id === gradeId
  );

  const totalWeight = gradeBomItems.reduce((sum, item) => sum + item.weight_kg, 0);
  let totalBatchCost = 0;

  const bomItemsCalculated = gradeBomItems.map((item) => {
    // Tìm giá hiệu lực mới nhất của vật tư này từ lịch sử giá
    const materialPrices = priceHistoryList
      .filter((ph) => ph.material_id === item.material_id)
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    const materialObj = materialsList.find((m) => m.id === item.material_id);
    const latestPrice = materialPrices.length > 0
      ? materialPrices[0].price
      : (materialObj?.latest_price || 0);

    const itemCost = item.weight_kg * latestPrice;
    totalBatchCost += itemCost;

    return {
      ...item,
      material_name: materialObj?.name || item.material_name || 'Vật tư',
      unit_price: latestPrice,
      item_cost: itemCost,
      percentage: totalWeight > 0 ? (item.weight_kg / totalWeight) * 100 : 0,
    };
  });

  // 2. Tính DG_cast_scrap dựa trên return_scrap_material_id
  let returnScrapPrice = 0;
  let warning: string | undefined = undefined;

  if (grade?.return_scrap_material_id) {
    const scrapMaterialPrices = priceHistoryList
      .filter((ph) => ph.material_id === grade.return_scrap_material_id)
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
    
    const scrapMaterialObj = materialsList.find((m) => m.id === grade.return_scrap_material_id);
    
    returnScrapPrice = scrapMaterialPrices.length > 0
      ? scrapMaterialPrices[0].price
      : (scrapMaterialObj?.latest_price || 0);
      
    if (returnScrapPrice === 0) {
      warning = \`Vật tư hồi liệu (\${scrapMaterialObj?.name || 'Không rõ'}) chưa có giá hiệu lực.\`;
    }
  } else if (gradeId) {
    warning = 'Chưa gán vật tư hồi liệu cho mác gang này. Đơn giá hồi liệu mặc định = 0.';
  }

  // Đơn giá 1kg nước gang lỏng = Tổng chi phí mẻ / Tổng khối lượng thực tế mẻ
  const DG_liquid = totalWeight > 0 ? totalBatchCost / totalWeight : 0;

  return {
    casting_grade_id: gradeId,
    casting_grade_name: grade?.name,
    total_weight_kg: totalWeight,
    DG_liquid,
    DG_cast_scrap: returnScrapPrice,
    DG_cast_scrap_warning: warning,
    bom_items_calculated: bomItemsCalculated,
  };
}
`;

fs.writeFileSync('src/lib/calculation-engine/liquid-metal-calculator.ts', content);
console.log('Fixed liquid-metal-calculator.ts');
