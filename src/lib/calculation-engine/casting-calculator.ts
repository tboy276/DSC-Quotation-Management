import type { CastingInput, CastingResult } from './types';

/**
 * Pure Calculation Engine function for Iron Casting (Đúc Gang)
 * Based on real foundry workshop cost sheets (Part A 1,000kg liquid metal + Part B per kg cast product)
 */
export function calculateCastingPrice(input: CastingInput): CastingResult {
  const {
    m_tinh,
    m_cast,
    Y_yield,
    k_burn_loss = 0,
    DG_liquid,
    DG_cast_scrap,

    // Section 2 — Operations & Molding per 1,000kg Liquid Metal
    C_furnace_ladle_per_1000kg = 0,
    C_molding_recipe_total_1000kg = 0,
    m_resin_core = 0,
    DG_resin_core_per_kg = 12500,
    m_core = 0,
    DG_core_sand_kg = 0,
    C_ops_override,

    // Part B — Post-Casting Workshop Costs per kg Cast Product
    DG_finishing_per_kg = 0,
    DG_utility_per_kg = 0,
    DG_labor_per_kg = 0,
    DG_workshop_mgmt_per_kg = 0,
    DG_equipment_depr_per_kg = 0,

    // Section 3 — Machining & QA (Gia công & QC)
    DG_heat_treat_per_kg = 0,
    DG_paint_per_kg = 0,
    machining_operations = [],
    C_coating = 0,
    C_QA = 0,
    C_machining_override,

    // Section 4 — Pattern Amortization
    pattern_components = [],
    C_design = 15000000,
    k_mgmt_die = 10,
    cavity = 1,
    life_coefficient = 20000,
    C_pattern_total = 0,
    L_pattern_life = 0,
    pattern_cost_treatment,
    C_pattern_amortization_override,

    // Section 5 — Summary Parameters
    N_order = 1,
    k_mgmt_cast,
    C_pack = 0,
    DG_pack_kg,
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
  const batchRatio = m_liquid / 1000;
  let C_furnace_ladle = C_furnace_ladle_per_1000kg * batchRatio;
  let C_molding_materials = C_molding_recipe_total_1000kg * batchRatio; // 3 vật tư cố định
  let C_resin_core = m_resin_core * DG_resin_core_per_kg; // Tính riêng theo 1 sản phẩm
  let C_core = m_core * DG_core_sand_kg;
  
  let C_ops_casting = 0;
  if (C_ops_override !== undefined) {
    C_ops_casting = C_ops_override;
  } else {
    C_ops_casting = C_furnace_ladle + C_molding_materials + C_resin_core + C_core;
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
  
  // TÍNH TOÁN PART A THEO ĐÚNG BƯỚC 1000KG (Tránh sai số làm tròn so với UI)
  const cost_metal_1000 = 1000 * DG_liquid;
  const yield_ratio = validYield / 100;
  const burn_ratio = k_burn_loss / 100;
  const scrap_kg_1000 = Math.max(0, 1000 - (1000 * yield_ratio) - (1000 * burn_ratio));
  const cost_scrap_1000 = scrap_kg_1000 * DG_cast_scrap;
  
  const total_batch_cost = cost_metal_1000 - cost_scrap_1000 + C_furnace_ladle_per_1000kg + C_molding_recipe_total_1000kg;
  const dg_liquid_final = total_batch_cost / 1000;
  
  const totalCoreCostPerProduct = C_resin_core + C_core;
  const coreCostPerKg = totalCoreCostPerProduct / validMCast;
  
  const partA_per_kg = (dg_liquid_final / yield_ratio) + coreCostPerKg;
  
  const partB_per_kg = C_part_b_total / validMCast;
  const workshop_cost_per_kg = partA_per_kg + partB_per_kg;

  // ----------------------------------------------------------------------
  // Section 3 — Machining & QA (Gia công & QC)
  // ----------------------------------------------------------------------
  let C_machining_casting = 0;
  if (C_machining_override !== undefined) {
    C_machining_casting = C_machining_override;
  } else {
    const C_machining = machining_operations.reduce((total, op) => {
      const C_machining_i = (op.t_prep_min + op.t_man_min) * (op.DG_machine_hour / 60);
      return total + C_machining_i;
    }, 0);

    C_machining_casting = C_machining + C_coating + C_QA;
  }
  
  const C_heat_treat = m_cast * DG_heat_treat_per_kg;
  const C_paint = m_cast * DG_paint_per_kg;

  // ----------------------------------------------------------------------
  // Section 4 — Pattern Amortization (Khấu hao mẫu)
  // ----------------------------------------------------------------------
  let actual_C_pattern_total = C_pattern_total;
  let actual_L_pattern_life = L_pattern_life;

  if (pattern_components.length > 0) {
    const totalComponentsCost = pattern_components.reduce((sum, comp) => {
      const materialCost = comp.weight_kg * comp.material_price_kg;
      const machiningCost = comp.weight_kg * comp.machining_price_kg;
      const heatTreatmentCost = comp.needs_heat_treatment ? (comp.weight_kg * comp.heat_treatment_price_kg) : 0;
      
      return sum + materialCost + machiningCost + heatTreatmentCost;
    }, 0);
    actual_C_pattern_total = (totalComponentsCost + C_design) * (1 + k_mgmt_die / 100);
    actual_L_pattern_life = life_coefficient * cavity;
  }

  let C_pattern_amortization = 0;
  if (C_pattern_amortization_override !== undefined) {
    C_pattern_amortization = C_pattern_amortization_override;
  } else if (actual_C_pattern_total > 0 && actual_L_pattern_life > 0) {
    const denominator = Math.min(actual_L_pattern_life, Math.max(1, N_order));
    C_pattern_amortization = actual_C_pattern_total / denominator;
  }

  // ----------------------------------------------------------------------
  // Section 5 — Summary Parameters & Final Price (Giá vốn & Giá bán)
  // ----------------------------------------------------------------------
  const patternInCogs = pattern_cost_treatment === 'amortized' ? C_pattern_amortization : 0;
  const separate_pattern_cost = pattern_cost_treatment === 'separate' ? C_pattern_amortization : undefined;

  // Updated COGS includes Part A + Part B + Machining + Heat Treat + Paint + Pattern Amortization
  const COGS = C_metal_casting + C_ops_casting + C_machining_casting + C_heat_treat + C_paint + C_part_b_total + patternInCogs;

  const C_admin = COGS * (k_mgmt_cast / 100);
  const final_weight = m_tinh || m_cast || 0;
  const C_transport = final_weight * DG_trans_kg;
  const actual_C_pack = DG_pack_kg !== undefined && DG_pack_kg > 0 ? DG_pack_kg * final_weight : (C_pack || 0);
  const pre_profit_price = COGS + C_admin + actual_C_pack + C_transport;

  const P_CASTING = Math.round(pre_profit_price * (1 + k_profit_casting / 100));

  return {
    m_liquid,
    m_scrap_cast,
    C_metal_casting,
    C_furnace_ladle,
    C_resin_core,
    C_molding_materials,
    C_core,
    C_ops_casting,
    partA_per_kg,
    C_finishing,
    C_utility,
    C_labor,
    C_workshop_mgmt,
    C_equipment_depreciation,
    C_part_b_total,
    workshop_cost_per_kg,
    C_heat_treat,
    C_paint,
    C_machining_casting,
    C_pattern_amortization,
    COGS,
    pre_profit_price,
    P_CASTING,
    separate_pattern_cost,
    actual_C_pattern_total,
    actual_L_pattern_life,
    C_pattern_amortization_per_unit: patternInCogs,
  };
}
