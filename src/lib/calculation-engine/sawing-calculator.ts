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
    k_mgmt_mat = 0,
    use_m_tinh = false,
    t_cut_sec = 0,
    DG_sawing_machine_hour = 0,
    C_ops_override,
    machining_operations = [],
    C_machining_override,
    k_mgmt,
    C_pack = 0,
    DG_pack_kg,
    DG_trans_kg,
    k_profit_sawing,
  } = input;

  // Section 1 — Vật liệu
  const base_weight = use_m_tinh ? (m_tinh || 0) : m_phoi;
  const m_bavia = (m_chi - base_weight) * (1 - k_loss / 100);

  // C_mat_sawing = (m_chi × DG_steel_eff) - (m_bavia × DG_scrap)
  const effective_DG_steel = DG_steel * (1 + k_mgmt_mat / 100);
  const C_mat_sawing = (m_chi * effective_DG_steel) - (m_bavia * DG_scrap);

  // Section 2 — Công nghệ (Chỉ có cưa cắt)
  let C_ops_sawing = 0;
  if (C_ops_override !== undefined) {
    C_ops_sawing = C_ops_override;
  } else {
    C_ops_sawing = (t_cut_sec / 3600) * DG_sawing_machine_hour;
  }

  // Section 3 — Gia công cơ khí (Machining)
  let C_machining = 0;
  if (C_machining_override !== undefined) {
    C_machining = C_machining_override;
  } else {
    C_machining = machining_operations.reduce((total, op) => {
      const opTimeHours = (op.t_prep_min + op.t_man_min) / 60;
      return total + (opTimeHours * op.DG_machine_hour);
    }, 0);
  }

  // Tiền vận chuyển và bao gói tính theo m_tinh
  const final_weight = m_tinh || m_phoi || 0;
  let computed_C_pack = C_pack;
  if (DG_pack_kg !== undefined && DG_pack_kg > 0) {
    computed_C_pack = final_weight * DG_pack_kg;
  }
  const C_trans = final_weight * DG_trans_kg;

  // Tổng Giá vốn hàng bán (COGS)
  const base_COGS = C_mat_sawing + C_ops_sawing + C_machining;
  const C_mgmt = base_COGS * (k_mgmt / 100);
  const COGS = base_COGS + C_mgmt;

  // Tổng Giá Trước Lợi Nhuận
  const pre_profit_price = COGS + computed_C_pack + C_trans;

  // Giá Bán Cuối Cùng
  const C_profit = pre_profit_price * (k_profit_sawing / 100);
  const P_SAWING = pre_profit_price + C_profit;

  return {
    m_bavia,
    C_mat_sawing,
    C_ops_sawing,
    C_machining,
    COGS,
    pre_profit_price,
    P_SAWING,
  };
}
