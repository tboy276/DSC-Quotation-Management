import type {
  CastingBomItem,
  MaterialPriceHistory,
  Material,
  LiquidMetalPriceResult,
} from '../../types/master-data';

/**
 * Pure Calculation Function: Calculate Liquid Metal Price (DG_liquid) and Return Scrap Price (DG_cast_scrap) from BOM
 *
 * DG_liquid = (Tổng chi phí các vật tư trong mẻ 1000kg) / 1000
 * DG_cast_scrap = Giá của vật tư có cờ is_return_scrap = true trong BOM
 */
export function calculateLiquidMetalPrice(
  casting_grade_id: string,
  bomItems: CastingBomItem[],
  priceHistoryList: MaterialPriceHistory[],
  materialsList: Material[] = []
): LiquidMetalPriceResult {
  // 1. Lọc các dòng BOM của mác gang này
  const gradeBomItems = bomItems.filter(
    (item) => item.casting_grade_id === casting_grade_id
  );

  let totalWeight = 0;
  let totalBatchCost = 0;
  let returnScrapPrice = 0;

  const bomItemsCalculated = gradeBomItems.map((item) => {
    totalWeight += item.weight_kg;

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

    // Nếu dòng này là Hồi liệu, lấy làm DG_cast_scrap
    if (item.is_return_scrap) {
      returnScrapPrice = latestPrice;
    }

    return {
      ...item,
      material_name: materialObj?.name || item.material_name || 'Vật tư',
      unit_price: latestPrice,
      item_cost: itemCost,
      percentage: (item.weight_kg / 1000) * 100,
    };
  });

  // Đơn giá 1kg nước gang lỏng = Tổng chi phí mẻ / 1000
  const DG_liquid = totalBatchCost / 1000;

  return {
    casting_grade_id,
    total_weight_kg: totalWeight,
    DG_liquid,
    DG_cast_scrap: returnScrapPrice,
    bom_items_calculated: bomItemsCalculated,
  };
}
