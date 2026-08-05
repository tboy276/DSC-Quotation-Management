import type { ForgingInput, ForgingResult } from './types';

/**
 * Pure Calculation Engine function for Forging (Rèn Dập)
 */
export function calculateForgingPrice(input: ForgingInput): ForgingResult {
  const {
    m_tinh,
    m_bavia,
    k_loss,
    DG_steel,
    DG_scrap,
    t_cut_sec = 0,
    DG_sawing_machine_hour = 0,
    w_elec_kwh_per_kg = 0,
    DG_elec_kwh = 0,
    t_forging_sec = 0,
    DG_forging_machine_hour = 0,
    t_trim_sec = 0,
    DG_trim_machine_hour = 0,
    DG_heat_treat_kg = 0,
    DG_clean_kg = 0,
    C_ops_override,
    machining_operations = [],
    C_machining_override,
    C_die_total = 0,
    L_die_life = 0,
    die_cost_treatment,
    C_die_amortization_override,
    N_order = 1,
    k_mgmt,
    C_pack = 0,
    DG_trans_kg,
    k_profit_forging,
  } = input;

  // Section 1 — Vật liệu
  // m_phoi = (m_tinh + m_bavia) / (1 - k_loss/100)
  const m_phoi_exact = (m_tinh + m_bavia) / (1 - k_loss / 100);
  const m_phoi = Number(m_phoi_exact.toFixed(3)); // Round to 3 decimal places for kg

  // C_mat_forging = (m_phoi × DG_steel) - (m_bavia × DG_scrap)
  const C_mat_forging = (m_phoi * DG_steel) - (m_bavia * DG_scrap);

  // Section 2 — Công nghệ & Nhiệt luyện
  let C_ops_forging = 0;
  if (C_ops_override !== undefined) {
    C_ops_forging = C_ops_override;
  } else {
    const C_cut = (t_cut_sec / 3600) * DG_sawing_machine_hour;
    const C_heat_induction = m_phoi * w_elec_kwh_per_kg * DG_elec_kwh;
    const C_forging_op = (t_forging_sec / 3600) * DG_forging_machine_hour;
    const C_trim = (t_trim_sec / 3600) * DG_trim_machine_hour;
    const C_heat_treat = m_phoi * DG_heat_treat_kg;
    const C_clean = m_phoi * DG_clean_kg;

    C_ops_forging = C_cut + C_heat_induction + C_forging_op + C_trim + C_heat_treat + C_clean;
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
  let C_die_amortization = 0;
  if (C_die_amortization_override !== undefined) {
    C_die_amortization = C_die_amortization_override;
  } else if (C_die_total > 0 && L_die_life > 0) {
    const denominator = Math.min(L_die_life, Math.max(1, N_order));
    C_die_amortization = C_die_total / denominator;
  }

  // Section 5 — Tổng hợp
  const dieInCogs = die_cost_treatment === 'amortized' ? C_die_amortization : 0;
  const separate_die_cost = die_cost_treatment === 'separate' ? C_die_amortization : undefined;

  const COGS = C_mat_forging + C_ops_forging + C_machining + dieInCogs;

  const pre_profit_price =
    COGS * (1 + k_mgmt / 100) + C_pack + (m_phoi * DG_trans_kg);

  const P_FORGING = Math.round(pre_profit_price * (1 + k_profit_forging / 100));

  return {
    m_phoi,
    C_mat_forging,
    C_ops_forging,
    C_machining,
    C_die_amortization,
    COGS,
    pre_profit_price,
    P_FORGING,
    separate_die_cost,
  };
}
