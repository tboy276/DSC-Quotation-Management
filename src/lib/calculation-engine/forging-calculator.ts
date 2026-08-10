import type { ForgingInput, ForgingResult } from './types';

/**
 * Pure Calculation Engine function for Forging (Rèn Dập)
 */
export function calculateForgingPrice(input: ForgingInput): ForgingResult {
  const {
    m_tinh,
    m_phoi,
    m_chi,
    k_loss,
    DG_steel,
    DG_scrap,
    DG_scrap_cnc,
    k_mgmt_mat = 0,
    use_m_tinh = false,
    t_cut_sec = 15,
    DG_sawing_machine_hour = 120000,
    expected_productivity = 1000,
    DG_forging_machine_hour = 1200000,
    w_elec_kwh_per_kg = 0.8,
    DG_elec_kwh = 2200,
    C_heat_treat = 0,
    C_paint = 0,
    DG_clean_kg = 1000,
    C_ops_override,
    machining_operations = [],
    C_machining_override,
    die_components = [],
    C_design = 15000000,
    k_mgmt_die = 10,
    cavity = 1,
    life_coefficient = 20000,
    C_die_total = 0,
    L_die_life = 0,
    die_cost_treatment,
    C_die_amortization_override,
    N_order = 1,
    k_mgmt,
    C_pack = 0,
    DG_pack_kg,
    DG_trans_kg,
    k_profit_forging,
  } = input;

  // Section 1 — Vật liệu
  const DG_scrap_cnc_eff = DG_scrap_cnc ?? DG_scrap;

  let m_bavia_forging = 0;
  let m_bavia_cnc = 0;

  if (use_m_tinh && m_tinh !== undefined) {
    m_bavia_forging = (m_chi - m_phoi) * (1 - k_loss / 100);
    m_bavia_cnc = Math.max(0, m_phoi - m_tinh);
  } else {
    m_bavia_forging = (m_chi - m_phoi) * (1 - k_loss / 100);
    m_bavia_cnc = 0;
  }

  const m_bavia = m_bavia_forging + m_bavia_cnc;

  // C_mat_forging = (m_chi × DG_steel_eff) - (m_bavia_forging × DG_scrap) - (m_bavia_cnc × DG_scrap_cnc_eff)
  const effective_DG_steel = DG_steel * (1 + k_mgmt_mat / 100);
  const C_mat_forging = (m_chi * effective_DG_steel) - (m_bavia_forging * DG_scrap) - (m_bavia_cnc * DG_scrap_cnc_eff);

  // Section 2 — Công nghệ & Nhiệt luyện
  let C_ops_forging = 0;
  if (C_ops_override !== undefined) {
    C_ops_forging = C_ops_override;
  } else {
    const C_cut = (t_cut_sec / 3600) * DG_sawing_machine_hour;
    const C_heat_induction = m_chi * w_elec_kwh_per_kg * DG_elec_kwh;
    // (8 giờ x 60 phút / năng suất dự kiến) x (DG_forging_machine_hour / 60)
    // Simplify: (8 * DG_forging_machine_hour) / expected_productivity
    const safeProductivity = expected_productivity > 0 ? expected_productivity : 1;
    const C_forging_op = (8 * DG_forging_machine_hour) / safeProductivity;
    const C_clean = m_chi * DG_clean_kg;

    C_ops_forging = C_cut + C_heat_induction + C_forging_op + C_clean;
  }

  // Section 3 — Gia công cơ khí
  let C_machining = 0;
  if (C_machining_override !== undefined) {
    C_machining = C_machining_override;
  } else if (machining_operations.length > 0) {
    C_machining = machining_operations.reduce((total, op) => {
      const C_machining_i = (op.t_prep_min + op.t_man_min) * (op.DG_machine_hour / 60);
      return total + C_machining_i;
    }, 0);
  }

  // Section 4 — Khấu hao khuôn
  let actual_C_die_total = C_die_total;
  let actual_L_die_life = L_die_life;

  if (die_components.length > 0) {
    const totalComponentsCost = die_components.reduce((sum, comp) => {
      const materialCost = comp.weight_kg * comp.material_price_kg;
      const machiningCost = comp.weight_kg * comp.machining_price_kg;
      const heatTreatmentCost = comp.needs_heat_treatment ? (comp.weight_kg * comp.heat_treatment_price_kg) : 0;
      
      let reworkCost = 0;
      if (comp.needs_reworking) {
        const reworkRatio = (comp.rework_ratio ?? 30) / 100;
        const reworkCount = comp.rework_count ?? 9;
        const reworkCostPerTime = reworkRatio * machiningCost;
        reworkCost = reworkCount * reworkCostPerTime;
      }
      
      return sum + materialCost + machiningCost + heatTreatmentCost + reworkCost;
    }, 0);
    actual_C_die_total = (totalComponentsCost + C_design) * (1 + k_mgmt_die / 100);
    actual_L_die_life = life_coefficient * cavity;
  }

  let C_die_amortization = 0;
  if (C_die_amortization_override !== undefined) {
    C_die_amortization = C_die_amortization_override;
  } else if (actual_C_die_total > 0 && actual_L_die_life > 0) {
    const denominator = Math.min(actual_L_die_life, Math.max(1, N_order));
    C_die_amortization = actual_C_die_total / denominator;
  }

  // Section 5 — Tổng hợp
  const dieInCogs = die_cost_treatment === 'amortized' ? C_die_amortization : 0;
  const separate_die_cost = die_cost_treatment === 'separate' ? C_die_amortization : undefined;

  const C_heat_treat = m_phoi * (input.DG_heat_treat_per_kg ?? input.DG_heat_treat_kg ?? 0);
  const C_paint = m_phoi * (input.DG_paint_per_kg ?? 0);

  const COGS = C_mat_forging + C_ops_forging + C_machining + C_heat_treat + C_paint + dieInCogs;

  const final_weight = m_tinh || m_phoi || m_chi || 0;
  const actual_C_pack = DG_pack_kg !== undefined && DG_pack_kg > 0 ? DG_pack_kg * final_weight : (C_pack || 0);
  const pre_profit_price =
    COGS * (1 + k_mgmt / 100) + actual_C_pack + (final_weight * DG_trans_kg);

  const P_FORGING = Math.round(pre_profit_price * (1 + k_profit_forging / 100));

  return {
    m_phoi: m_chi, // Legacy mapping in result (Trọng lượng chi)
    m_bavia,
    m_bavia_forging,
    m_bavia_cnc,
    C_mat_forging,
    C_ops_forging,
    C_machining,
    C_heat_treat,
    C_paint,
    C_die_amortization,
    COGS,
    pre_profit_price,
    P_FORGING,
    separate_die_cost,
    actual_C_die_total,
    actual_L_die_life,
  };
}
