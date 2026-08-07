import type { MachiningInput, MachiningResult } from './types';

/**
 * Pure Calculation Engine function for Machining Only (Chỉ Gia Công CNC)
 */
export function calculateMachiningPrice(input: MachiningInput): MachiningResult {
  const {
    m_tinh,
    machining_operations = [],
    C_machining_override,
    k_mgmt,
    C_pack = 0,
    DG_pack_kg,
    DG_trans_kg,
    k_profit_machining,
  } = input;

  // Section 1 — Gia công cơ khí (Machining)
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
  const final_weight = m_tinh || 0;
  let computed_C_pack = C_pack;
  if (DG_pack_kg !== undefined && DG_pack_kg > 0) {
    computed_C_pack = final_weight * DG_pack_kg;
  }
  const C_trans = final_weight * DG_trans_kg;

  // Tổng Giá vốn hàng bán (COGS thuần - không gồm C_mgmt)
  const COGS = C_machining;
  const C_mgmt = COGS * (k_mgmt / 100);

  // Tổng Giá Trước Lợi Nhuận
  const pre_profit_price = COGS + C_mgmt + computed_C_pack + C_trans;

  // Giá Bán Cuối Cùng (Làm tròn VNĐ)
  const C_profit = pre_profit_price * (k_profit_machining / 100);
  const P_MACHINING = Math.round(pre_profit_price + C_profit);

  return {
    C_machining,
    COGS,
    C_mgmt,
    pre_profit_price,
    C_profit,
    P_MACHINING,
  };
}
