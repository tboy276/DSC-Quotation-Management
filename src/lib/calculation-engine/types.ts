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
}

export interface ToolingComponent {
  name: string; // Tên thành phần
  material: string; // Mác vật liệu
  weight_kg: number; // Trọng lượng sử dụng
  material_price_kg: number; // Đơn giá vật tư
  machining_price_kg: number; // Đơn giá gia công
  needs_heat_treatment: boolean; // Cần xử lý nhiệt
  heat_treatment_price_kg: number; // Đơn giá xử lý nhiệt
  
  // RÈN ONLY
  needs_reworking?: boolean; // Cần hạ cốt
  rework_ratio?: number; // Tỷ lệ hạ cốt mỗi lần (%)
  rework_count?: number; // Số lần hạ cốt trong vòng đời
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
  machining_notes?: string;        // Ghi chú chung cho khối CNC

  // Section 4 — Die Amortization (Khấu hao khuôn)
  die_components?: ToolingComponent[];
  C_design?: number;          // Tiền thiết kế
  k_mgmt_die?: number;        // Phần trăm quản lý khuôn
  cavity?: number;            // Số khoang khuôn
  life_coefficient?: number;  // Hệ số tuổi thọ/cavity
  C_die_total?: number;       // Tổng chi phí bộ khuôn (VNĐ) - Legacy
  L_die_life?: number;        // Tuổi thọ bộ khuôn (số sản phẩm) - Legacy
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
  actual_C_die_total?: number;
  actual_L_die_life?: number;
}

// ----------------------------------------------------------------------
// CASTING (ĐÚC GANG) TYPES
// ----------------------------------------------------------------------

export interface CastingInput {
  // Section 1 — Cast Metal (Vật đúc & Hao hụt)
  m_cast: number;            // Khối lượng vật đúc tinh (kg)
  Y_yield: number;           // Thu hồi kim loại % (VD: 57 = 57%)
  k_burn_loss?: number;      // Hao hụt cháy % khi nấu không thu hồi (VD: 2.15 = 2.15%)
  DG_liquid: number;         // Đơn giá nước gang lỏng (VNĐ/kg)
  DG_cast_scrap: number;     // Đơn giá thu hồi gang phế (VNĐ/kg)

  // Section 2 — Operations & Molding per 1,000kg Liquid Metal (Công nghệ & Vật tư khuôn)
  C_furnace_ladle_per_1000kg?: number;    // Chi phí lót Lò & Gầu cho 1,000kg kim loại lỏng (VNĐ)
  C_molding_recipe_total_1000kg?: number; // Tổng chi phí Công thức vật tư khuôn (3 vật tư cố định) cho 1,000kg kim loại lỏng (VNĐ)
  m_resin_core?: number;                  // Trọng lượng thao cát nhựa cho 1 sản phẩm (kg)
  DG_resin_core_per_kg?: number;          // Đơn giá thao cát nhựa (VNĐ/kg)
  m_core?: number;                        // Khối lượng cát ruột (kg)
  DG_core_sand_kg?: number;               // Đơn giá cát ruột (VNĐ/kg)
  C_ops_override?: number;                // Chi phí công nghệ đúc override

  // Section 2 (Deprecated legacy fields kept optional for backward compatibility)
  DG_sinto_op?: number;
  n_cavity_per_mold?: number;
  DG_finish_kg?: number;

  // Part B — Post-Casting Workshop Costs per kg Cast Product (Chi phí sau đúc / kg thành phẩm)
  DG_finishing_per_kg?: number;     // Đơn giá Vật tư HTSP/kg thành phẩm (VNĐ/kg)
  DG_utility_per_kg?: number;       // Đơn giá Điện + Nước/kg thành phẩm (VNĐ/kg)
  DG_labor_per_kg?: number;         // Đơn giá Lương trực tiếp & gián tiếp/kg thành phẩm (VNĐ/kg)
  DG_workshop_mgmt_per_kg?: number; // Đơn giá Quản lý Phân xưởng/kg thành phẩm (VNĐ/kg)
  DG_equipment_depr_per_kg?: number;// Đơn giá Khấu hao Thiết bị/kg thành phẩm (VNĐ/kg)

  // Section 3 — Machining & QA (Gia công & QC)
  machining_operations?: MachiningOperation[];
  C_coating?: number;         // Chi phí sơn/mạ (VNĐ/cái)
  C_QA?: number;              // Chi phí kiểm định QA/QC (VNĐ/cái)
  C_machining_override?: number;
  machining_notes?: string;

  // Section 4 — Pattern Amortization (Khấu hao mẫu đúc)
  pattern_components?: ToolingComponent[];
  C_design?: number;          // Tiền thiết kế
  k_mgmt_die?: number;        // Phần trăm quản lý khuôn
  cavity?: number;            // Số khoang khuôn
  life_coefficient?: number;  // Hệ số tuổi thọ/cavity
  C_pattern_total?: number;       // Tổng chi phí bộ mẫu đúc (VNĐ) - Legacy
  L_pattern_life?: number;        // Tuổi thọ bộ mẫu đúc (số sản phẩm) - Legacy
  pattern_cost_treatment: CostTreatment; // 'amortized' | 'separate'
  C_pattern_amortization_override?: number;

  // Section 5 — Summary Parameters (Tổng hợp)
  N_order?: number;           // Số lượng sản lượng đơn hàng (chi tiết), mặc định 1
  k_mgmt_cast: number;        // Phần trăm chi phí quản lý công ty % (VD: 10 = 10%)
  C_pack?: number;            // Chi phí đóng gói (VNĐ/chi tiết)
  DG_trans_kg: number;        // Đơn giá vận chuyển (VNĐ/kg vật đúc)
  k_profit_casting: number;   // Phần trăm lợi nhuận đúc % (VD: 12 = 12%)
}

export interface CastingResult {
  m_liquid: number;               // Khối lượng gang lỏng (kg)
  m_scrap_cast: number;          // Khối lượng gang phế thu hồi (kg)
  C_metal_casting: number;       // Chi phí kim loại đúc (VNĐ)
  
  // Section 2 Breakdowns
  C_furnace_ladle: number;       // Chi phí Lò & Gầu (VNĐ)
  C_resin_core: number;          // Chi phí thao cát nhựa cho 1 sản phẩm (VNĐ)
  C_molding_materials: number;   // Chi phí Vật tư khuôn tổng (3 vật tư cố định + Thao cát nhựa) (VNĐ)
  C_core: number;                // Chi phí cát ruột (VNĐ)
  C_ops_casting: number;         // Chi phí công nghệ đúc tổng (VNĐ)
  partA_per_kg: number;          // Đơn giá Phần A / kg thành phẩm (C_metal + C_ops / m_cast) (VNĐ/kg)

  // Part B Breakdowns (Phần B — Chi phí sau đúc / kg thành phẩm)
  C_finishing: number;           // Chi phí vật tư HTSP (VNĐ)
  C_utility: number;             // Chi phí điện nước (VNĐ)
  C_labor: number;               // Chi phí nhân công (VNĐ)
  C_workshop_mgmt: number;       // Chi phí quản lý phân xưởng (VNĐ)
  C_equipment_depreciation: number; // Chi phí khấu hao thiết bị (VNĐ)
  C_part_b_total: number;        // Tổng chi phí Phần B (VNĐ)
  workshop_cost_per_kg: number;  // Giá thành phân xưởng / kg thành phẩm (Part A + Part B / m_cast) (VNĐ/kg)

  // Section 3 & 4
  C_machining_casting: number;   // Tổng chi phí gia công & QA (VNĐ)
  C_pattern_amortization: number;// Chi phí khấu hao mẫu (/chi tiết) (VNĐ)

  // Section 5 & Final Price
  COGS: number;                  // Giá vốn hàng bán (VNĐ)
  pre_profit_price: number;      // Giá trước lợi nhuận (VNĐ)
  P_CASTING: number;              // Giá bán đúc cuối cùng (VNĐ/cái)
  separate_pattern_cost?: number; // Khoản chi phí mẫu trả riêng nếu pattern_cost_treatment = 'separate'
  actual_C_pattern_total?: number;
  actual_L_pattern_life?: number;
}
