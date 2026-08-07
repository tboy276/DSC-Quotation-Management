import { describe, it, expect } from 'vitest';
import { calculateForgingPrice } from './forging-calculator';
import { calculateCastingPrice } from './casting-calculator';
import { calculateSawingPrice } from './sawing-calculator';
import type { ForgingInput, CastingInput, SawingInput } from './types';

describe('DSC-Quotation-Management Calculation Engine', () => {
  // ------------------------------------------------------------------
  // TEST CASE 1: RÈN BÚA THỦY LỰC (FORGING) & P2-3 TÁCH ĐƠN GIÁ PHẾ LIỆU
  // ------------------------------------------------------------------
  describe('Test Case 1: Rèn Búa Thủy Lực (Forging)', () => {
    it('Tính chính xác m_phoi, C_mat_forging, COGS, P_FORGING theo yêu cầu', () => {
      const input: ForgingInput = {
        m_phoi: 1.2,
        m_chi: 1.531,
        k_loss: 2.0,
        DG_steel: 22000,
        DG_scrap: 8000,
        C_ops_override: 45000,
        die_cost_treatment: 'amortized',
        k_mgmt: 8,
        DG_trans_kg: 1500,
        k_profit_forging: 15,
      };

      const result = calculateForgingPrice(input);

      expect(result.m_phoi).toBeCloseTo(1.531, 3);
      expect(result.C_mat_forging).toBeCloseTo(31086.96, 0);
      expect(result.COGS).toBeCloseTo(76086.96, 0);
    });

    it('P2-3 Case A: Chỉ rèn, không CNC (use_m_tinh = false) -> m_bavia_cnc = 0', () => {
      const input: ForgingInput = {
        m_phoi: 1.2,
        m_chi: 1.531,
        k_loss: 2.0,
        DG_steel: 22000,
        DG_scrap: 8000,
        DG_scrap_cnc: 12000, // Should be ignored when use_m_tinh = false
        use_m_tinh: false,
        die_cost_treatment: 'separate',
        k_mgmt: 8,
        DG_trans_kg: 1500,
        k_profit_forging: 15,
      };

      const result = calculateForgingPrice(input);
      expect(result.m_bavia_cnc).toBe(0);
      expect(result.m_bavia_forging).toBeCloseTo((1.531 - 1.2) * 0.98, 4);
      expect(result.C_mat_forging).toBeCloseTo((1.531 * 22000) - (result.m_bavia_forging! * 8000), 2);
    });

    it('P2-3 Case B: Có CNC (use_m_tinh = true, có m_tinh), DG_scrap & DG_scrap_cnc khác nhau', () => {
      const input: ForgingInput = {
        m_phoi: 1.2,
        m_chi: 1.531,
        m_tinh: 0.9,
        k_loss: 2.0,
        DG_steel: 22000,
        DG_scrap: 8000,        // Ba via rèn = 8k
        DG_scrap_cnc: 14000,    // Phoi CNC = 14k
        use_m_tinh: true,
        die_cost_treatment: 'separate',
        k_mgmt: 8,
        DG_trans_kg: 1500,
        k_profit_forging: 15,
      };

      const result = calculateForgingPrice(input);
      const expectedBaviaForging = (1.531 - 1.2) * 0.98; // 0.32438 kg
      const expectedBaviaCnc = 1.2 - 0.9;                 // 0.30000 kg

      expect(result.m_bavia_forging).toBeCloseTo(expectedBaviaForging, 4);
      expect(result.m_bavia_cnc).toBeCloseTo(expectedBaviaCnc, 4);
      expect(result.m_bavia).toBeCloseTo(expectedBaviaForging + expectedBaviaCnc, 4);

      const expectedMatCost = (1.531 * 22000) - (expectedBaviaForging * 8000) - (expectedBaviaCnc * 14000);
      expect(result.C_mat_forging).toBeCloseTo(expectedMatCost, 2);
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

      expect(result.COGS).toBeCloseTo(66086.96, 0);
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
