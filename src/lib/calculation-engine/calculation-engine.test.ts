import { describe, it, expect } from 'vitest';
import { calculateForgingPrice } from './forging-calculator';
import { calculateCastingPrice } from './casting-calculator';
import type { ForgingInput, CastingInput } from './types';

describe('DSC-Quotation-Management Calculation Engine', () => {
  // ------------------------------------------------------------------
  // TEST CASE 1: RÈN BÚA THỦY LỰC (FORGING)
  // ------------------------------------------------------------------
  describe('Test Case 1: Rèn Búa Thủy Lực (Forging)', () => {
    it('Tính chính xác m_phoi, C_mat_forging, COGS, P_FORGING theo yêu cầu', () => {
      const input: ForgingInput = {
        m_phoi: 1.2,
        m_chi: 1.531,
        k_loss: 2.0,
        DG_steel: 22000,
        DG_scrap: 8000,
        // Tổng chi phí Nung + Nhiệt luyện + Machining + Khuôn = 45000
        C_ops_override: 45000,
        die_cost_treatment: 'amortized',
        k_mgmt: 8,
        DG_trans_kg: 1500,
        k_profit_forging: 15,
      };

      const result = calculateForgingPrice(input);

      // 1. m_phoi ≈ 1.531 kg
      expect(result.m_phoi).toBeCloseTo(1.531, 3);

      // 2. C_mat_forging ≈ 31282 VNĐ
      expect(result.C_mat_forging).toBeCloseTo(31282, 0);

      // 3. COGS ≈ 76282 VNĐ
      expect(result.COGS).toBeCloseTo(76282, 0);

      // 4. P_FORGING ≈ 97383 VNĐ/cái
      expect(result.P_FORGING).toBe(97383);
    });

    it('Xử lý đúng cơ chế die_cost_treatment = "separate"', () => {
      const input: ForgingInput = {
        m_phoi: 1.2,
        m_chi: 1.531,
        k_loss: 2.0,
        DG_steel: 22000,
        DG_scrap: 8000,
        C_ops_override: 35000,
        C_die_amortization_override: 10000,
        die_cost_treatment: 'separate',
        k_mgmt: 8,
        DG_trans_kg: 1500,
        k_profit_forging: 15,
      };

      const result = calculateForgingPrice(input);

      // Khuôn tách riêng nên không cộng 10000 vào COGS
      expect(result.COGS).toBeCloseTo(66282, 0);
      expect(result.separate_die_cost).toBe(10000);
    });
  });

  // ------------------------------------------------------------------
  // TEST CASE 2: ĐÚC SINTO (CASTING)
  // ------------------------------------------------------------------
  describe('Test Case 2: Đúc Sinto (Casting)', () => {
    it('Tính chính xác m_liquid, C_metal_casting, COGS, P_CASTING theo yêu cầu', () => {
      const input: CastingInput = {
        m_cast: 4.5,
        Y_yield: 60,
        DG_liquid: 28000,
        DG_cast_scrap: 10000,
        // Tổng chi phí Khuôn Sinto + Phun bi + Machining + Mẫu = 45000
        C_ops_override: 45000,
        pattern_cost_treatment: 'amortized',
        k_mgmt_cast: 10,
        DG_trans_kg: 1000,
        k_profit_casting: 12,
      };

      const result = calculateCastingPrice(input);

      // 1. m_liquid = 7.5 kg
      expect(result.m_liquid).toBe(7.5);

      // 2. C_metal_casting = 180000 VNĐ
      expect(result.C_metal_casting).toBe(180000);

      // 3. COGS = 225000 VNĐ
      expect(result.COGS).toBe(225000);

      // 4. P_CASTING = 282240 VNĐ/cái
      expect(result.P_CASTING).toBe(282240);
    });

    it('Xử lý đúng cơ chế pattern_cost_treatment = "separate"', () => {
      const input: CastingInput = {
        m_cast: 4.5,
        Y_yield: 60,
        DG_liquid: 28000,
        DG_cast_scrap: 10000,
        C_ops_override: 35000,
        C_pattern_amortization_override: 10000,
        pattern_cost_treatment: 'separate',
        k_mgmt_cast: 10,
        DG_trans_kg: 1000,
        k_profit_casting: 12,
      };

      const result = calculateCastingPrice(input);

      // Mẫu đúc tách riêng nên không cộng 10000 vào COGS
      expect(result.COGS).toBe(215000);
      expect(result.separate_pattern_cost).toBe(10000);
    });
  });
});
