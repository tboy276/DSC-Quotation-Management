import { describe, it, expect } from 'vitest';
import { calculateLiquidMetalPrice } from './liquid-metal-calculator';
import type { CastingBomItem, MaterialPriceHistory, Material } from '../../types/master-data';

describe('Liquid Metal BOM Price Calculator', () => {
  it('Tính chính xác DG_liquid và DG_cast_scrap từ danh sách BOM 1000kg', () => {
    const materials: Material[] = [
      { id: 'm1', name: 'Gang thỏi F1', unit: 'kg', category: 'Gang thỏi' },
      { id: 'm2', name: 'Thép phế đúc', unit: 'kg', category: 'Thép phế đúc' },
      { id: 'm3', name: 'Hồi liệu FCD450', unit: 'kg', category: 'Hồi liệu' },
      { id: 'm4', name: 'Fe-Si 75', unit: 'kg', category: 'Fe-Si' },
    ];

    const priceHistory: MaterialPriceHistory[] = [
      { id: 'p1', material_id: 'm1', price: 15000, effective_date: '2026-01-01' },
      { id: 'p2', material_id: 'm1', price: 16000, effective_date: '2026-06-01' }, // Giá mới nhất = 16,000
      { id: 'p3', material_id: 'm2', price: 12000, effective_date: '2026-01-01' }, // Giá = 12,000
      { id: 'p4', material_id: 'm3', price: 10000, effective_date: '2026-01-01' }, // Giá hồi liệu = 10,000
      { id: 'p5', material_id: 'm4', price: 45000, effective_date: '2026-01-01' }, // Giá Fe-Si = 45,000
    ];

    const bomItems: CastingBomItem[] = [
      { id: 'b1', casting_grade_id: 'grade-fcd450', material_id: 'm1', weight_kg: 400, is_return_scrap: false },
      { id: 'b2', casting_grade_id: 'grade-fcd450', material_id: 'm2', weight_kg: 200, is_return_scrap: false },
      { id: 'b3', casting_grade_id: 'grade-fcd450', material_id: 'm3', weight_kg: 380, is_return_scrap: true }, // Hồi liệu
      { id: 'b4', casting_grade_id: 'grade-fcd450', material_id: 'm4', weight_kg: 20, is_return_scrap: false },
    ];

    const result = calculateLiquidMetalPrice('grade-fcd450', bomItems, priceHistory, materials);

    // Tổng kg: 400 + 200 + 380 + 20 = 1000kg
    expect(result.total_weight_kg).toBe(1000);

    // Tính chi phí từng thành phần:
    // m1 (Gang thỏi): 400 * 16,000 = 6,400,000
    // m2 (Thép phế): 200 * 12,000 = 2,400,000
    // m3 (Hồi liệu): 380 * 10,000 = 3,800,000
    // m4 (Fe-Si):    20 * 45,000 = 900,000
    // Tổng mẻ 1000kg = 6.4M + 2.4M + 3.8M + 0.9M = 13,500,000 VNĐ
    // DG_liquid = 13,500,000 / 1000 = 13,500 VNĐ/kg
    expect(result.DG_liquid).toBe(13500);

    // DG_cast_scrap (Hồi liệu m3) = 10,000 VNĐ/kg
    expect(result.DG_cast_scrap).toBe(10000);
  });
});
