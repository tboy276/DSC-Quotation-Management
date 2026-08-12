import type { SawingInput, SawingResult } from './types';

/**
 * Pure Calculation Engine function for Sawing (Cưa/Cắt Phôi + Gia Công CNC)
 */
export function calculateSawingPrice(input: SawingInput): SawingResult {
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
    t_cut_sec = 0,
    DG_sawing_machine_hour = 120000,
    machining_operations = [],
    k_mgmt,
    C_pack = 0,
    DG_pack_kg,
    DG_trans_kg,
    k_profit_sawing,
    DG_heat_treat_per_kg = 0,
    DG_paint_per_kg = 0,
  } = input;

  // Section 1 — Vật liệu
  const DG_scrap_cnc_eff = DG_scrap_cnc ?? DG_scrap;

  let m_bavia_forging = 0;
  let m_bavia_cnc = 0;

  if (use_m_tinh && m_tinh !== undefined) {
    m_bavia_forging = Math.max(0, (m_chi - m_phoi) * (1 - k_loss / 100));
    m_bavia_cnc = Math.max(0, m_phoi - m_tinh);
  } else {
    m_bavia_forging = Math.max(0, (m_chi - m_phoi) * (1 - k_loss / 100));
    m_bavia_cnc = 0;
  }

  const m_bavia = m_bavia_forging + m_bavia_cnc;

  // C_mat_sawing = (m_chi × DG_steel_eff) - (m_bavia_forging × DG_scrap) - (m_bavia_cnc × DG_scrap_cnc_eff)
  const effective_DG_steel = DG_steel * (1 + k_mgmt_mat / 100);
  const C_mat_sawing = (m_chi * effective_DG_steel) - (m_bavia_forging * DG_scrap) - (m_bavia_cnc * DG_scrap_cnc_eff);

  // Section 2 — Công nghệ (Chỉ có cưa cắt)
  const C_ops_sawing = (t_cut_sec / 3600) * DG_sawing_machine_hour;

  // Section 3 — Gia công cơ khí (Machining)
  const C_machining = machining_operations.reduce((total, op) => {
    const C_machining_i = (op.t_prep_min + op.t_man_min) * (op.DG_machine_hour / 60);
    return total + C_machining_i;
  }, 0);

  // Tiền vận chuyển và bao gói tính theo m_tinh
  const final_weight = m_tinh || m_phoi || 0;
  let computed_C_pack = C_pack;
  if (DG_pack_kg !== undefined && DG_pack_kg > 0) {
    computed_C_pack = final_weight * DG_pack_kg;
  }
  const C_trans = final_weight * DG_trans_kg;

  const C_heat_treat = (m_phoi || 0) * DG_heat_treat_per_kg;
  const C_paint = (m_phoi || 0) * DG_paint_per_kg;

  // Tổng Giá vốn hàng bán (COGS thuần - không gồm C_mgmt)
  const COGS = C_mat_sawing + C_ops_sawing + C_machining + C_heat_treat + C_paint;
  const C_mgmt = COGS * (k_mgmt / 100);

  // Tổng Giá Trước Lợi Nhuận
  const pre_profit_price = COGS + C_mgmt + computed_C_pack + C_trans;

  // Giá Bán Cuối Cùng (Làm tròn VNĐ)
  const C_profit = pre_profit_price * (k_profit_sawing / 100);
  const P_SAWING = Math.round(pre_profit_price + C_profit);

  return {
    m_bavia,
    m_bavia_forging,
    m_bavia_cnc,
    C_mat_sawing,
    C_ops_sawing,
    C_machining,
    C_heat_treat,
    C_paint,
    COGS,
    C_mgmt,
    pre_profit_price,
    C_profit,
    P_SAWING,
  };
}
