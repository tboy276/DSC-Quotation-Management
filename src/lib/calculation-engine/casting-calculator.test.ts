import { describe, it, expect } from 'vitest';
import { calculateCastingPrice } from './casting-calculator';
import type { CastingInput } from './types';

describe('Casting Calculation Engine (Đúc Gang FC200 Test Case)', () => {
  it('Khớp 100% con số tính giá thành phân xưởng FC200 thực tế từ xưởng đúc (A+B = 35.523 - 35.524 VNĐ/kg)', () => {
    const input: CastingInput = {
      m_cast: 570,                       // 570 kg thành phẩm
      Y_yield: 57,                       // Thu hồi 57% -> m_liquid = 1,000kg
      k_burn_loss: 2.15,                 // Hao hụt cháy 2.15% -> m_scrap_cast = 408.5kg
      DG_liquid: 11138.51,               // Đơn giá nước gang lỏng = 11,138,510 / 1000kg
      DG_cast_scrap: 5500,               // Đơn giá thu hồi gang phế = 5,500đ/kg

      // Section 2 — Operations per 1,000kg batch
      C_furnace_ladle_per_1000kg: 120000,     // Lò (100k) + Gầu (20k) = 120,000đ/1000kg
      C_molding_recipe_total_1000kg: 1302200, // 3 vật tư cố định (Bột đất sét + Cát đúc + Sơn khuôn) = 1,302,200đ/1000kg
      m_resin_core: 296.78648,               // Thao cát nhựa sản phẩm tính riêng = 296.78648kg @ 12,500đ/kg = 3,709,831đ
      DG_resin_core_per_kg: 12500,

      // Part B — 5 Đơn giá xưởng sau đúc (/kg thành phẩm)
      DG_finishing_per_kg: 771.82,       // Vật tư HTSP
      DG_utility_per_kg: 3687.6,         // Điện nước
      DG_labor_per_kg: 2461,             // Lương
      DG_workshop_mgmt_per_kg: 0,        // Quản lý PX
      DG_equipment_depr_per_kg: 4000,    // Khấu hao thiết bị

      pattern_cost_treatment: 'amortized',
      k_mgmt_cast: 0,                    // 0% để kiểm tra nguyên giá xưởng A+B
      C_pack: 0,
      DG_trans_kg: 0,
      k_profit_casting: 0,
    };

    const res = calculateCastingPrice(input);

    // 1. Kiểm tra Khối lượng
    expect(res.m_liquid).toBeCloseTo(1000, 2);
    expect(res.m_scrap_cast).toBeCloseTo(408.5, 1);

    // 2. Kiểm tra Chi Phí Thao Cát Nhựa & Vật Tư Khuôn
    // C_resin_core = 296.78648 * 12500 = 3,709,831đ
    expect(res.C_resin_core).toBeCloseTo(3709831, 0);

    // C_molding_materials (3 vật tư cố định) = 1,302,200đ
    expect(res.C_molding_materials).toBeCloseTo(1302200, 0);
    // Tổng vật tư khuôn (3 cố định + thao cát nhựa) = 1,302,200 + 3,709,831 = 5,012,031đ
    expect(res.C_molding_materials + res.C_resin_core).toBeCloseTo(5012031, 0);

    // C_metal = (1000 * 11138.51) - (408.5 * 5500) = 8,891,760đ
    expect(res.C_metal_casting).toBeCloseTo(8891760, 0);

    // C_ops = 120,000 + 5,012,031 = 5,132,031đ
    expect(res.C_ops_casting).toBeCloseTo(5132031, 0);

    // 3. Kiểm tra Đơn Giá Phần A / kg thành phẩm
    // (8,891,760 + 5,132,031) / 570 = 24,603.14 VNĐ/kg
    expect(res.partA_per_kg).toBeCloseTo(24603.14, 1);

    // 4. Kiểm tra Tổng Giá Thành Phân Xưởng (A + B) / kg thành phẩm
    // 24,603.14 + 10,920.42 = 35,523.56 VNĐ/kg
    expect(res.workshop_cost_per_kg).toBeCloseTo(35523.56, 1);
    expect(Math.round(res.workshop_cost_per_kg)).toBe(35524);
  });

  it('k_casting_price_adjustment undefined (or 100) -> behaves exactly like original pricing', () => {
    const input = {
      m_cast: 570,
      Y_yield: 57,
      k_burn_loss: 2.15,
      DG_liquid: 11138.51,
      DG_cast_scrap: 5500,
      C_furnace_ladle_per_1000kg: 120000,
      C_molding_recipe_total_1000kg: 1302200,
      m_resin_core: 296.78648,
      DG_resin_core_per_kg: 12500,
      DG_finishing_per_kg: 771.82,
      DG_utility_per_kg: 3687.6,
      DG_labor_per_kg: 2461,
      DG_workshop_mgmt_per_kg: 0,
      DG_equipment_depr_per_kg: 4000,
      pattern_cost_treatment: 'amortized' as const,
      k_mgmt_cast: 0,
      C_pack: 0,
      DG_trans_kg: 0,
      k_profit_casting: 0,
    };

    const res = calculateCastingPrice(input);
    expect(res.partA_total_calculated).toBeCloseTo(8891760 + 5132031, 0); 
    expect(res.partA_total_quoted).toBe(res.partA_total_calculated); 
    expect(res.partA_per_kg_calculated).toBeCloseTo(24603.14, 1);
    expect(res.partA_per_kg).toBe(res.partA_per_kg_calculated);
    expect(res.COGS).toBe(res.partA_total_quoted + res.C_finishing + res.C_utility + res.C_labor + res.C_workshop_mgmt + res.C_equipment_depreciation);
  });

  it('k_casting_price_adjustment = 125 -> partA and COGS correctly inflated by 25%', () => {
    const input = {
      m_cast: 570,
      Y_yield: 57,
      k_burn_loss: 2.15,
      DG_liquid: 11138.51,
      DG_cast_scrap: 5500,
      C_furnace_ladle_per_1000kg: 120000,
      C_molding_recipe_total_1000kg: 1302200,
      m_resin_core: 296.78648,
      DG_resin_core_per_kg: 12500,
      DG_finishing_per_kg: 771.82,
      DG_utility_per_kg: 3687.6,
      DG_labor_per_kg: 2461,
      DG_workshop_mgmt_per_kg: 0,
      DG_equipment_depr_per_kg: 4000,
      pattern_cost_treatment: 'amortized' as const,
      k_mgmt_cast: 10,
      C_pack: 0,
      DG_trans_kg: 0,
      k_profit_casting: 10,
      k_casting_price_adjustment: 125,
    };

    const res = calculateCastingPrice(input);
    const expectedOriginalPartA = 8891760 + 5132031; 
    expect(res.partA_total_calculated).toBeCloseTo(expectedOriginalPartA, 0);
    
    const expectedQuotedPartA = expectedOriginalPartA * 1.25; 
    expect(res.partA_total_quoted).toBeCloseTo(expectedQuotedPartA, 0);
    
    const partBTotal = res.C_finishing + res.C_utility + res.C_labor + res.C_workshop_mgmt + res.C_equipment_depreciation; 
    const expectedCOGS = expectedQuotedPartA + partBTotal;
    expect(res.COGS).toBeCloseTo(expectedCOGS, 0);
    
    const expectedAdmin = expectedCOGS * 0.10;
    const expectedPreProfit = expectedCOGS + expectedAdmin;
    const expectedProfit = expectedPreProfit * 0.10;
    const expectedPrice = Math.round(expectedPreProfit + expectedProfit);
    expect(res.P_CASTING).toBe(expectedPrice);
  });
});
