import type { CastingInput, CastingResult } from './types';

/**
 * Pure Calculation Engine function for Iron Casting (Đúc Gang)
 */
export function calculateCastingPrice(input: CastingInput): CastingResult {
  const {
    m_cast,
    Y_yield,
    DG_liquid,
    DG_cast_scrap,
    DG_sinto_op = 0,
    n_cavity_per_mold = 1,
    m_core = 0,
    DG_core_sand_kg = 0,
    DG_finish_kg = 0,
    C_ops_override,
    machining_operations = [],
    C_coating = 0,
    C_QA = 0,
    C_machining_override,
    C_pattern_total = 0,
    L_pattern_life = 0,
    pattern_cost_treatment,
    C_pattern_amortization_override,
    N_order = 1,
    k_mgmt_cast,
    C_pack = 0,
    DG_trans_kg,
    k_profit_casting,
  } = input;

  // Section 1 — Vật đúc
  // m_liquid = m_cast / (Y_yield/100)
  const m_liquid = m_cast / (Y_yield / 100);
  const m_scrap_cast = m_liquid - m_cast;

  // C_metal_casting = (m_liquid × DG_liquid) - (m_scrap_cast × DG_cast_scrap)
  const C_metal_casting = (m_liquid * DG_liquid) - (m_scrap_cast * DG_cast_scrap);

  // Section 2 — Tạo khuôn, làm ruột, hoàn thiện
  let C_ops_casting = 0;
  if (C_ops_override !== undefined) {
    C_ops_casting = C_ops_override;
  } else {
    const validCavities = Math.max(1, n_cavity_per_mold);
    const C_sinto_molding = DG_sinto_op / validCavities;
    const C_core = m_core * DG_core_sand_kg;
    const C_finish_cast = m_cast * DG_finish_kg;

    C_ops_casting = C_sinto_molding + C_core + C_finish_cast;
  }

  // Section 3 — Gia công & QC
  let C_machining_casting = 0;
  if (C_machining_override !== undefined) {
    C_machining_casting = C_machining_override;
  } else {
    const validNOrder = Math.max(1, N_order);
    const C_machining = machining_operations.reduce((total, op) => {
      const C_machining_i =
        ((op.t_prep_min / validNOrder) + op.t_man_min) * (op.DG_machine_hour / 60) + op.C_tooling;
      return total + C_machining_i;
    }, 0);

    C_machining_casting = C_machining + C_coating + C_QA;
  }

  // Section 4 — Khấu hao mẫu
  let C_pattern_amortization = 0;
  if (C_pattern_amortization_override !== undefined) {
    C_pattern_amortization = C_pattern_amortization_override;
  } else if (C_pattern_total > 0 && L_pattern_life > 0) {
    const denominator = Math.min(L_pattern_life, Math.max(1, N_order));
    C_pattern_amortization = C_pattern_total / denominator;
  }

  // Section 5 — Tổng hợp
  const patternInCogs = pattern_cost_treatment === 'amortized' ? C_pattern_amortization : 0;
  const separate_pattern_cost = pattern_cost_treatment === 'separate' ? C_pattern_amortization : undefined;

  const COGS = C_metal_casting + C_ops_casting + C_machining_casting + patternInCogs;

  const pre_profit_price =
    COGS * (1 + k_mgmt_cast / 100) + C_pack + (m_cast * DG_trans_kg);

  const P_CASTING = Math.round(pre_profit_price * (1 + k_profit_casting / 100));

  return {
    m_liquid,
    m_scrap_cast,
    C_metal_casting,
    C_ops_casting,
    C_machining_casting,
    C_pattern_amortization,
    COGS,
    pre_profit_price,
    P_CASTING,
    separate_pattern_cost,
  };
}
