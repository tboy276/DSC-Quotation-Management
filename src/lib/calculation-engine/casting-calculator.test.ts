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
      C_furnace_ladle_per_1000kg: 120000,    // Lò (100k) + Gầu (20k) = 120,000đ/1000kg
      C_molding_recipe_total_1000kg: 5012031, // Tổng vật tư khuôn + thuê ngoài = 5,012,031đ/1000kg
      m_core: 0,
      DG_core_sand_kg: 0,

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

    // 2. Kiểm tra Phần A (Kim loại + Công nghệ đúc)
    // C_metal = (1000 * 11138.51) - (408.5 * 5500) = 8,891,760đ
    expect(res.C_metal_casting).toBeCloseTo(8891760, 0);

    // C_ops = 120,000 + 5,012,031 = 5,132,031đ
    expect(res.C_ops_casting).toBeCloseTo(5132031, 0);

    // Tổng Phần A = 8,891,760 + 5,132,031 = 14,023,791đ cho 1000kg gang lỏng
    const partA_total = res.C_metal_casting + res.C_ops_casting;
    expect(partA_total).toBeCloseTo(14023791, 0);

    // Quy đổi Phần A / kg thành phẩm (570kg) = 14,023,791 / 570 ≈ 24,603.14 VNĐ/kg
    const partA_per_kg = partA_total / 570;
    expect(partA_per_kg).toBeCloseTo(24603.14, 1);

    // 3. Kiểm tra Phần B (Chi phí sau đúc)
    // Tổng Phần B / kg = 771.82 + 3687.6 + 2461 + 0 + 4000 = 10,920.42 VNĐ/kg
    const partB_per_kg = res.C_part_b_total / 570;
    expect(partB_per_kg).toBeCloseTo(10920.42, 1);

    // 4. Kiểm tra Tổng Giá Thành Phân Xưởng (A + B) / kg thành phẩm
    // 24,603.14 + 10,920.42 = 35,523.56 VNĐ/kg
    expect(res.workshop_cost_per_kg).toBeCloseTo(35523.56, 1);
    expect(Math.round(res.workshop_cost_per_kg)).toBe(35524);
  });
});
