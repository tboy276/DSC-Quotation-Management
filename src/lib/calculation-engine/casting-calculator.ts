import type { CastingInput, CastingResult } from './types';

/**
 * Pure Calculation Engine function for Iron Casting (Đúc Gang)
 * Based on real foundry workshop cost sheets (Part A 1,000kg liquid metal + Part B per kg cast product)
 */
export function calculateCastingPrice(input: CastingInput): CastingResult {
  const {
    m_cast,
    Y_yield,
    k_burn_loss = 0,
    DG_liquid,
    DG_cast_scrap,

    // Section 2 — Operations & Molding per 1,000kg Liquid Metal
    C_furnace_ladle_per_1000kg = 0,
    C_molding_recipe_total_1000kg = 0,
    m_core = 0,
    DG_core_sand_kg = 0,
    C_ops_override,

    // Part B — Post-Casting Workshop Costs per kg Cast Product
    DG_finishing_per_kg = 0,
    DG_utility_per_kg = 0,
    DG_labor_per_kg = 0,
    DG_workshop_mgmt_per_kg = 0,
    DG_equipment_depr_per_kg = 0,

    // Section 3 — Machining & QA
    machining_operations = [],
    C_coating = 0,
    C_QA = 0,
    C_machining_override,

    // Section 4 — Pattern Amortization
    C_pattern_total = 0,
    L_pattern_life = 0,
    pattern_cost_treatment,
    C_pattern_amortization_override,

    // Section 5 — Summary Parameters
    N_order = 1,
    k_mgmt_cast,
    C_pack = 0,
    DG_trans_kg,
    k_profit_casting,
  } = input;

  // ----------------------------------------------------------------------
  // Section 1 — Cast Metal & Burn Loss (Kim loại lỏng & Hao hụt)
  // ----------------------------------------------------------------------
  // m_liquid = m_cast / (Y_yield / 100)
  const validYield = Math.max(0.01, Y_yield);
  const m_liquid = m_cast / (validYield / 100);

  // m_scrap_cast = m_liquid - m_cast - (m_liquid * k_burn_loss / 100)
  const m_burn_loss = m_liquid * (k_burn_loss / 100);
  const m_scrap_cast = Math.max(0, m_liquid - m_cast - m_burn_loss);

  // C_metal_casting = (m_liquid * DG_liquid) - (m_scrap_cast * DG_cast_scrap)
  const C_metal_casting = (m_liquid * DG_liquid) - (m_scrap_cast * DG_cast_scrap);

  // ----------------------------------------------------------------------
  // Section 2 — Technology & Operations for Liquid Metal Batch (Phần A)
  // ----------------------------------------------------------------------
  let C_furnace_ladle = 0;
  let C_molding_materials = 0;
  let C_core = m_core * DG_core_sand_kg;
  let C_ops_casting = 0;

  if (C_ops_override !== undefined) {
    C_ops_casting = C_ops_override;
  } else {
    const batchRatio = m_liquid / 1000;
    C_furnace_ladle = C_furnace_ladle_per_1000kg * batchRatio;
    C_molding_materials = C_molding_recipe_total_1000kg * batchRatio;
    C_ops_casting = C_furnace_ladle + C_molding_materials + C_core;
  }

  // ----------------------------------------------------------------------
  // Part B — Post-Casting Workshop Costs per kg Cast Product (Phần B)
  // ----------------------------------------------------------------------
  const C_finishing = DG_finishing_per_kg * m_cast;
  const C_utility = DG_utility_per_kg * m_cast;
  const C_labor = DG_labor_per_kg * m_cast;
  const C_workshop_mgmt = DG_workshop_mgmt_per_kg * m_cast;
  const C_equipment_depreciation = DG_equipment_depr_per_kg * m_cast;
  const C_part_b_total = C_finishing + C_utility + C_labor + C_workshop_mgmt + C_equipment_depreciation;

  // Total Workshop Cost per kg cast product (Part A per kg + Part B per kg)
  const validMCast = Math.max(0.0001, m_cast);
  const partA_per_kg = (C_metal_casting + C_ops_casting) / validMCast;
  const partB_per_kg = C_part_b_total / validMCast;
  const workshop_cost_per_kg = partA_per_kg + partB_per_kg;

  // ----------------------------------------------------------------------
  // Section 3 — Machining & QA (Gia công & QC)
  // ----------------------------------------------------------------------
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

  // ----------------------------------------------------------------------
  // Section 4 — Pattern Amortization (Khấu hao mẫu)
  // ----------------------------------------------------------------------
  let C_pattern_amortization = 0;
  if (C_pattern_amortization_override !== undefined) {
    C_pattern_amortization = C_pattern_amortization_override;
  } else if (C_pattern_total > 0 && L_pattern_life > 0) {
    const denominator = Math.min(L_pattern_life, Math.max(1, N_order));
    C_pattern_amortization = C_pattern_total / denominator;
  }

  // ----------------------------------------------------------------------
  // Section 5 — Summary Parameters & Final Price (Giá vốn & Giá bán)
  // ----------------------------------------------------------------------
  const patternInCogs = pattern_cost_treatment === 'amortized' ? C_pattern_amortization : 0;
  const separate_pattern_cost = pattern_cost_treatment === 'separate' ? C_pattern_amortization : undefined;

  // Updated COGS includes Part A + Part B + Machining + Pattern Amortization
  const COGS = C_metal_casting + C_ops_casting + C_machining_casting + C_part_b_total + patternInCogs;

  const C_admin = COGS * (k_mgmt_cast / 100);
  const C_transport = m_cast * DG_trans_kg;
  const pre_profit_price = COGS + C_admin + C_pack + C_transport;

  const P_CASTING = Math.round(pre_profit_price * (1 + k_profit_casting / 100));

  return {
    m_liquid,
    m_scrap_cast,
    C_metal_casting,
    C_furnace_ladle,
    C_molding_materials,
    C_core,
    C_ops_casting,
    C_finishing,
    C_utility,
    C_labor,
    C_workshop_mgmt,
    C_equipment_depreciation,
    C_part_b_total,
    workshop_cost_per_kg,
    C_machining_casting,
    C_pattern_amortization,
    COGS,
    pre_profit_price,
    P_CASTING,
    separate_pattern_cost,
  };
}
