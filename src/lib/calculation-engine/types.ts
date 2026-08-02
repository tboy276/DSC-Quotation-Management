/**
 * DSC-Quotation-Management Calculation Engine Types
 * Pure TypeScript interfaces for Forging (Rèn Dập) and Iron Casting (Đúc Gang)
 */

export type CostTreatment = 'amortized' | 'separate';

export type ForgingMachineType = 'press' | 'hammer';

/**
 * Cấu trúc một nguyên công gia công cơ khí (Machining Operation)
 */
export interface MachiningOperation {
  name?: string;
  t_prep_min: number;      // Thời gian gá đặt/chuẩn bị (phút) - t_prep_i
  t_man_min: number;       // Thời gian công đoạn/chi tiết (phút) - t_man_i
  DG_machine_hour: number; // Đơn giá máy (/giờ) - DG_machine_i
  C_tooling: number;       // Chi phí dao cụ (/chi tiết) - C_tooling_i
}

// ----------------------------------------------------------------------
// FORGING (RÈN DẬP) TYPES
// ----------------------------------------------------------------------

export interface ForgingInput {
  // Section 1 — Material (Vật liệu)
  m_tinh: number;      // Phôi tinh (kg)
  m_bavia: number;     // Khối lượng ba-via (kg)
  k_loss: number;      // Phần trăm cháy hao % (VD: 2.0 = 2%)
  DG_steel: number;    // Đơn giá thép phôi (VNĐ/kg)
  DG_scrap: number;    // Đơn giá thu hồi ba-via (VNĐ/kg)

  // Section 2 — Technology & Operations (Công nghệ & Nhiệt luyện)
  t_cut_sec?: number;              // Thời gian cắt phôi (giây)
  DG_sawing_machine_hour?: number; // Đơn giá máy cưa (VNĐ/giờ)
  w_elec_kwh_per_kg?: number;      // Điện năng nung (kWh/kg)
  DG_elec_kwh?: number;            // Đơn giá điện (VNĐ/kWh)
  t_forging_sec?: number;          // Thời gian dập/búa (giây)
  forging_machine_type?: ForgingMachineType;
  DG_forging_machine_hour?: number;// Đơn giá máy dập/búa (VNĐ/giờ)
  t_trim_sec?: number;             // Thời gian cắt ba-via (giây)
  DG_trim_machine_hour?: number;   // Đơn giá máy cắt bavia (VNĐ/giờ)
  DG_heat_treat_kg?: number;       // Đơn giá nhiệt luyện (VNĐ/kg)
  DG_clean_kg?: number;            // Đơn giá làm sạch/phun bi (VNĐ/kg)

  // Optional override for Section 2 ops (cho trường hợp nhập tổng sẵn)
  C_ops_override?: number;

  // Section 3 — Machining (Gia công cơ khí)
  machining_operations?: MachiningOperation[];
  C_machining_override?: number;

  // Section 4 — Die Amortization (Khấu hao khuôn)
  C_die_total?: number;       // Tổng chi phí bộ khuôn (VNĐ)
  L_die_life?: number;        // Tuổi thọ bộ khuôn (số sản phẩm)
  die_cost_treatment: CostTreatment; // 'amortized' | 'separate'
  C_die_amortization_override?: number;

  // Section 5 — Summary Parameters (Tổng hợp)
  N_order?: number;           // Số lượng sản lượng đơn hàng (chi tiết), mặc định 1
  k_mgmt: number;             // Phần trăm chi phí quản lý % (VD: 8 = 8%)
  C_pack?: number;            // Chi phí đóng gói (VNĐ/chi tiết)
  DG_trans_kg: number;        // Đơn giá vận chuyển (VNĐ/kg phôi)
  k_profit_forging: number;   // Phần trăm lợi nhuận % (VD: 15 = 15%)
}

export interface ForgingResult {
  m_phoi: number;             // Khối lượng phôi tổng (kg)
  C_mat_forging: number;      // Chi phí vật liệu rèn (VNĐ)
  C_ops_forging: number;      // Chi phí công nghệ rèn (VNĐ)
  C_machining: number;        // Chi phí gia công cơ khí (VNĐ)
  C_die_amortization: number; // Chi phí khấu hao khuôn (/chi tiết) (VNĐ)
  COGS: number;               // Giá vốn hàng bán (VNĐ)
  pre_profit_price: number;   // Giá trước lợi nhuận (VNĐ)
  P_FORGING: number;          // Giá bán rèn dập cuối cùng (VNĐ/cái)
  separate_die_cost?: number; // Khoản chi phí khuôn trả riêng nếu die_cost_treatment = 'separate'
}

// ----------------------------------------------------------------------
// CASTING (ĐÚC GANG) TYPES
// ----------------------------------------------------------------------

export interface CastingInput {
  // Section 1 — Cast Metal (Vật đúc)
  m_cast: number;            // Khối lượng vật đúc tinh (kg)
  Y_yield: number;           // Thu hồi kim loại % (VD: 60 = 60%)
  DG_liquid: number;         // Đơn giá nước gang lỏng (VNĐ/kg)
  DG_cast_scrap: number;     // Đơn giá thu hồi gang phế (VNĐ/kg)

  // Section 2 — Molding, Core, Finishing (Tạo khuôn, làm ruột, hoàn thiện)
  DG_sinto_op?: number;       // Đơn giá vận hành máy Sinto (VNĐ/khuôn)
  n_cavity_per_mold?: number; // Số lòng khuôn (cavities per mold)
  m_core?: number;            // Khối lượng cát ruột (kg)
  DG_core_sand_kg?: number;   // Đơn giá cát ruột (VNĐ/kg)
  DG_finish_kg?: number;      // Đơn giá làm sạch/phun bi (VNĐ/kg)
  C_ops_override?: number;    // Chi phí công nghệ đúc override

  // Section 3 — Machining & QA (Gia công & QC)
  machining_operations?: MachiningOperation[];
  C_coating?: number;         // Chi phí sơn/mạ (VNĐ/cái)
  C_QA?: number;              // Chi phí kiểm định QA/QC (VNĐ/cái)
  C_machining_override?: number;

  // Section 4 — Pattern Amortization (Khấu hao mẫu đúc)
  C_pattern_total?: number;       // Tổng chi phí bộ mẫu đúc (VNĐ)
  L_pattern_life?: number;        // Tuổi thọ bộ mẫu đúc (số sản phẩm)
  pattern_cost_treatment: CostTreatment; // 'amortized' | 'separate'
  C_pattern_amortization_override?: number;

  // Section 5 — Summary Parameters (Tổng hợp)
  N_order?: number;           // Số lượng sản lượng đơn hàng (chi tiết), mặc định 1
  k_mgmt_cast: number;        // Phần trăm chi phí quản lý đúc % (VD: 10 = 10%)
  C_pack?: number;            // Chi phí đóng gói (VNĐ/chi tiết)
  DG_trans_kg: number;        // Đơn giá vận chuyển (VNĐ/kg vật đúc)
  k_profit_casting: number;   // Phần trăm lợi nhuận đúc % (VD: 12 = 12%)
}

export interface CastingResult {
  m_liquid: number;               // Khối lượng gang lỏng (kg)
  m_scrap_cast: number;          // Khối lượng gang phế thu hồi (kg)
  C_metal_casting: number;       // Chi phí kim loại đúc (VNĐ)
  C_ops_casting: number;         // Chi phí tạo khuôn, ruột, làm sạch (VNĐ)
  C_machining_casting: number;   // Tổng chi phí gia công & QA (VNĐ)
  C_pattern_amortization: number;// Chi phí khấu hao mẫu (/chi tiết) (VNĐ)
  COGS: number;                  // Giá vốn hàng bán (VNĐ)
  pre_profit_price: number;      // Giá trước lợi nhuận (VNĐ)
  P_CASTING: number;             // Giá bán đúc gang cuối cùng (VNĐ/cái)
  separate_pattern_cost?: number;// Khoản chi phí mẫu trả riêng nếu pattern_cost_treatment = 'separate'
}
