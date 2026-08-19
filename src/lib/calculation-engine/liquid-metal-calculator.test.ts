import { describe, it, expect } from 'vitest';
import { calculateLiquidMetalPrice } from './liquid-metal-calculator';
import type { CastingBomItem, MaterialPriceHistory, Material, CastingGrade } from '../../types/master-data';

describe('Liquid Metal BOM Price Calculator', () => {
  const materials: Material[] = [
    { id: 'm1', name: 'Gang thỏi F1', unit: 'kg', category: 'Gang thỏi' },
    { id: 'm2', name: 'Thép phế đúc', unit: 'kg', category: 'Thép phế đúc' },
    { id: 'm3', name: 'Hồi liệu FCD450', unit: 'kg', category: 'Hồi liệu' },
    { id: 'm4', name: 'Fe-Si 75', unit: 'kg', category: 'Fe-Si' },
    { id: 'm5', name: 'Hồi liệu FC250', unit: 'kg', category: 'Hồi liệu' },
  ];

  const priceHistory: MaterialPriceHistory[] = [
    { id: 'p1', material_id: 'm1', price: 15000, effective_date: '2026-01-01' },
    { id: 'p2', material_id: 'm1', price: 16000, effective_date: '2026-06-01' }, // Giá mới nhất = 16,000
    { id: 'p3', material_id: 'm2', price: 12000, effective_date: '2026-01-01' }, // Giá = 12,000
    { id: 'p4', material_id: 'm3', price: 10000, effective_date: '2026-01-01' }, // Giá hồi liệu = 10,000
    { id: 'p5', material_id: 'm4', price: 45000, effective_date: '2026-01-01' }, // Giá Fe-Si = 45,000
    { id: 'p6', material_id: 'm5', price: 8000, effective_date: '2026-01-01' }, // Giá hồi liệu FC250 = 8,000
  ];

  it('Tính chính xác DG_liquid và DG_cast_scrap với mác gang có gán vật tư hồi liệu nằm trong BOM', () => {
    const grade: CastingGrade = {
      id: 'grade-fcd450',
      name: 'FCD450',
      return_scrap_material_id: 'm3'
    };

    const bomItems: CastingBomItem[] = [
      { id: 'b1', casting_grade_id: 'grade-fcd450', material_id: 'm1', weight_kg: 400, is_return_scrap: false },
      { id: 'b2', casting_grade_id: 'grade-fcd450', material_id: 'm2', weight_kg: 200, is_return_scrap: false },
      { id: 'b3', casting_grade_id: 'grade-fcd450', material_id: 'm3', weight_kg: 380, is_return_scrap: true }, // Vẫn có mặt trong BOM để nấu
      { id: 'b4', casting_grade_id: 'grade-fcd450', material_id: 'm4', weight_kg: 20, is_return_scrap: false },
    ];

    const result = calculateLiquidMetalPrice(grade, bomItems, priceHistory, materials);

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
    expect(result.DG_cast_scrap_warning).toBeUndefined();
  });

  it('Tính chính xác DG_cast_scrap ngay cả khi vật tư hồi liệu KHÔNG NẰM TRONG BOM', () => {
    const grade: CastingGrade = {
      id: 'grade-fc250',
      name: 'FC250',
      return_scrap_material_id: 'm5' // Gán vật tư m5
    };

    const bomItems: CastingBomItem[] = [
      { id: 'b1', casting_grade_id: 'grade-fc250', material_id: 'm1', weight_kg: 500, is_return_scrap: false },
      { id: 'b2', casting_grade_id: 'grade-fc250', material_id: 'm2', weight_kg: 500, is_return_scrap: false },
      // Không có m5 trong BOM
    ];

    const result = calculateLiquidMetalPrice(grade, bomItems, priceHistory, materials);

    expect(result.total_weight_kg).toBe(1000);

    // m1: 500 * 16,000 = 8,000,000
    // m2: 500 * 12,000 = 6,000,000
    // Tổng = 14,000,000 -> DG_liquid = 14,000
    expect(result.DG_liquid).toBe(14000);

    // DG_cast_scrap phải được lấy từ m5 = 8,000
    expect(result.DG_cast_scrap).toBe(8000);
    expect(result.DG_cast_scrap_warning).toBeUndefined();
  });

  it('Cảnh báo khi mác gang chưa gán vật tư hồi liệu', () => {
    const grade: CastingGrade = {
      id: 'grade-unknown',
      name: 'Unknown Grade',
      // không có return_scrap_material_id
    };

    const bomItems: CastingBomItem[] = []; // Không quan trọng

    const result = calculateLiquidMetalPrice(grade, bomItems, priceHistory, materials);

    expect(result.DG_cast_scrap).toBe(0);
    expect(result.DG_cast_scrap_warning).toContain('Chưa gán vật tư hồi liệu');
  });
});
