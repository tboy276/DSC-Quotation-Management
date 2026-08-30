/**
 * DSC-Quotation-Management Calculation Engine Types
 * Pure TypeScript interfaces for Forging (RÃ¨n Dáº­p) and Iron Casting (ÄÃºc Gang)
 */

export type CostTreatment = 'amortized' | 'separate';

export type ForgingMachineType = 'press' | 'hammer';

/**
 * Cáº¥u trÃºc má»™t nguyÃªn cÃ´ng gia cÃ´ng cơ khí­ (Machining Operation)
 */
export interface MachiningOperation {
  name?: string;
  t_prep_min?: number;      // Thá»i gian gÃ¡ Ä‘áº·t/chuáº©n bá»‹ (phÃºt) - t_prep_i
  t_man_min?: number;       // Thá»i gian cÃ´ng Ä‘oáº¡n/chi tiết (phÃºt) - t_man_i
  DG_machine_hour: number; // ÄÆ¡n giÃ¡ mÃ¡y (/giờ) - DG_machine_i
}

export interface ToolingComponent {
  name: string; // TÃªn thÃ nh pháº§n
  depreciation_qty?: number; // Tuá»•i thá» riÃªng cá»§a thÃ nh pháº§n nÃ y (sá»‘ chi tiết)
  material_id?: string; // LiÃªn káº¿t tá»›i Material á»Ÿ Tab 1
  material: string; // MÃ¡c váº­t liá»‡u
  weight_kg: number; // Trá»ng lÆ°á»£ng sá»­ dá»¥ng
  material_price_kg: number; // ÄÆ¡n giÃ¡ váº­t tÆ°
  machining_price_kg: number; // ÄÆ¡n giÃ¡ gia cÃ´ng
  needs_heat_treatment: boolean; // Cáº§n xử lý nhiệt
  heat_treatment_price_kg: number; // ÄÆ¡n giÃ¡ xử lý nhiệt
  
  // RÃˆN ONLY
  needs_reworking?: boolean; // Cáº§n háº¡ cá»‘t
  rework_ratio?: number; // Tá»· lá»‡ háº¡ cá»‘t má»—i láº§n (%)
  rework_count?: number; // Sá»‘ láº§n háº¡ cá»‘t trong vÃ²ng Ä‘á»i
}

// ----------------------------------------------------------------------
// FORGING (RÃˆN Dáº¬P) TYPES
// ----------------------------------------------------------------------

export interface ForgingInput {
  // Section 1 â€” Material (Váº­t liá»‡u)
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia công (kg) - Má»›i
  m_phoi?: number;      // Trá»ng lÆ°á»£ng phÃ´i rÃ¨n (kg) - CÅ© lÃ  m_tinh
  m_chi?: number;       // Trá»ng lÆ°á»£ng chi phôi đầu vào (kg) - CÅ© lÃ  m_phoi/m_bavia
  d_cut?: number;      // ÄÆ°á»ng kÃ­nh cắt (mm)
  l_cut?: number;      // Chiá»u dÃ i cắt (mm)
  k_loss: number;      // Phần trăm cháy hao % (VD: 2.0 = 2%)
  DG_steel: number;    // ÄÆ¡n giÃ¡ thép phôi (VNĐ/kg)
  DG_scrap: number;    // ÄÆ¡n giÃ¡ thu hồi ba-via (VNĐ/kg)
  DG_scrap_cnc?: number; // ÄÆ¡n giÃ¡ thu hồi phoi CNC (VNĐ/kg) - Nháº­p tay riÃªng
  k_mgmt_mat?: number; // Chi phí­ quản lý váº­t tÆ° (%)
  use_m_tinh?: boolean;// TÃ­nh chi phÃ­ váº­t tÆ° theo TL sau gia công

  // Section 2 â€” Technology & Operations (CÃ´ng nghá»‡ & Nhiá»‡t luyá»‡n)
  sawing_machine_type?: 'band_saw' | 'punch_cut'; // Loáº¡i mÃ¡y cắt
  t_cut_sec?: number;              // Thá»i gian cắt phÃ´i (giây)
  DG_sawing_machine_hour?: number; // ÄÆ¡n giÃ¡ máy cưa (VNĐ/giờ)
  w_elec_kwh_per_kg?: number;      // Äiá»‡n nÄƒng nung (kWh/kg)
  DG_elec_kwh?: number;            // ÄÆ¡n giÃ¡ Ä‘iá»‡n (VNĐ/kWh)
  forging_line?: '1000T' | '1600T' | '63kJ' | '80kJ'; // DÃ¢y chuyá»n rÃ¨n
  expected_productivity?: number;  // NÄƒng suáº¥t dá»± kiáº¿n (CÃ¡i/ca)
  DG_forging_machine_hour?: number;// ÄÆ¡n giÃ¡ mÃ¡y dáº­p/bÃºa (VNĐ/giờ)
  DG_heat_treat_per_kg?: number;   // ÄÆ¡n giÃ¡ nhiệt luyá»‡n (VNĐ/kg) - Alias má»›i
  DG_paint_per_kg?: number;        // ÄÆ¡n giÃ¡ sơn (VNĐ/kg)
  DG_clean_kg?: number;            // ÄÆ¡n giÃ¡ lÃ m sáº¡ch/phun bi (VNĐ/kg)
  C_coining_per_unit?: number;     // Chi phí­ Náº¯n pháº³ng (Coining) â€” nháº­p tay, VNĐ/sản phẩm



  // Section 3 â€” Machining (Gia cÃ´ng cơ khí­)
  machining_operations?: MachiningOperation[];
  machining_notes?: string;        // Ghi chÃº chung cho khá»‘i CNC

  // Section 4 â€” Die Amortization (Kháº¥u hao khuôn)
  die_components?: ToolingComponent[];
  C_design?: number;          // Tiá»n thiết kế
  k_mgmt_die?: number;        // Phần trăm quản lý khuôn
  cavity?: number;            // Sá»‘ khoang khuôn
  life_coefficient?: number;  // Hệ số‘ tuá»•i thá»/cavity
  C_die_total?: number;       // Tổng chi phÃ­ bá»™ khuôn (VNĐ) - Legacy
  L_die_life?: number;        // Tuá»•i thá» bá»™ khuôn (sá»‘ sản phẩm) - Legacy
  die_cost_treatment: CostTreatment; // 'amortized' | 'separate'
  C_die_amortization_override?: number;

  // Section 5 â€” Summary Parameters (Tổng há»£p)
  quoted_moq?: number;        // MOQ Báo Giá (cái/lô)
  N_order?: number;           // Số lượng sản lượng Ä‘Æ¡n hÃ ng (chi tiết), máº·c Ä‘á»‹nh 1
  k_mgmt: number;             // Phần trăm chi phÃ­ quản lý % (VD: 8 = 8%)
  C_pack?: number;            // Chi phí­ đóng gói (VNĐ/chi tiết)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ đóng gói (VNĐ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ vận chuyển (VNĐ/kg phÃ´i)
  k_profit_forging: number;   // Phần trăm lợi nhuận % (VD: 15 = 15%)
}

export interface ForgingResult {
  m_phoi: number;             // Trá»ng lÆ°á»£ng chi đầu vào (kg) - CÅ© lÃ  m_phoi
  m_bavia: number;            // Khối lượng ba-via tá»•ng (kg)
  m_bavia_forging?: number;   // Khối lượng ba-via rÃ¨n thu hồi (kg)
  m_bavia_cnc?: number;       // Khối lượng phoi CNC thu hồi (kg)
  C_mat_forging: number;      // Chi phí­ váº­t liá»‡u rÃ¨n (VNĐ)
  C_cut: number;
  C_heat_induction: number;
  C_forging_op: number;
  C_clean: number;
  C_coining: number;
  C_ops_forging: number;      // Chi phí­ công nghệ rÃ¨n tá»•ng (VNĐ)
  C_machining: number;        // Chi phí­ gia cÃ´ng cơ khí­ (VNĐ)
  C_heat_treat: number;       // Chi phí­ xử lý nhiệt (VNĐ)
  C_paint: number;            // Chi phí­ sơn (VNĐ)
  C_die_amortization: number; // Chi phí­ khấu hao khuôn (/chi tiết) (VNĐ)
  die_components_breakdown?: any[]; // Chi tiáº¿t khấu hao tá»«ng pháº§n cá»§a khuôn (Astemo form)
  COGS: number;               // Giá vốn hàng bán (VNĐ)
  C_mgmt: number;             // Chi phí­ quản lý (VNĐ)
  C_pack: number;             // Chi phí­ bao gói (VNĐ)
  C_trans: number;            // Chi phí­ vận chuyển (VNĐ)
  pre_profit_price: number;   // Giá trước lợi nhuận (VNĐ)
  C_profit: number;           // Lá»£i nhuáº­n (VNĐ)
  P_FORGING: number;          // Giá bán rÃ¨n dáº­p cuối cùng (VNĐ/cái)
  separate_die_cost?: number; // Khoáº£n chi phÃ­ khuôn trả riêng nếu die_cost_treatment = 'separate'
  actual_C_die_total?: number;
  actual_L_die_life?: number;
  C_die_amortized_per_unit?: number;
  shipping_weight_kg: number;
}

// ----------------------------------------------------------------------
// CASTING (ÄÃšC GANG) TYPES
// ----------------------------------------------------------------------

export interface CastingInput {
  m_tinh?: number;           // Trá»ng lÆ°á»£ng tinh sau gia công (kg) - Má»›i
  // Section 1 â€” Cast Metal (Váº­t đúc & Hao há»¥t)
  m_cast?: number;            // Khối lượng váº­t đúc tinh (kg)
  Y_yield?: number;           // Thu há»“i kim loại % (VD: 57 = 57%)
  k_burn_loss?: number;      // Hao há»¥t chÃ¡y % khi náº¥u khÃ´ng thu hồi (VD: 2.15 = 2.15%)
  DG_liquid: number;         // ÄÆ¡n giÃ¡ nÆ°á»›c gang lá»ng (VNĐ/kg)
  DG_cast_scrap: number;     // ÄÆ¡n giÃ¡ thu hồi gang phế (VNĐ/kg)

  // Section 2 â€” Operations & Molding per 1,000kg Liquid Metal (CÃ´ng nghá»‡ & Vật tư khuôn)
  C_furnace_ladle_per_1000kg?: number;    // Chi phí­ lÃ³t Lò & Gàu cho 1,000kg kim loại lá»ng (VNĐ)
  C_molding_recipe_total_1000kg?: number; // Tổng chi phÃ­ CÃ´ng thá»©c váº­t tÆ° khuôn (3 váº­t tÆ° cá»‘ Ä‘á»‹nh) cho 1,000kg kim loại lá»ng (VNĐ)
  m_resin_core?: number;                  // Trá»ng lÆ°á»£ng thao tác nhựa cho 1 sản phẩm (kg)
  DG_resin_core_per_kg?: number;          // ÄÆ¡n giÃ¡ thao tác nhựa (VNĐ/kg)

  // Section 2 (Deprecated legacy fields kept optional for backward compatibility)
  DG_sinto_op?: number;
  n_cavity_per_mold?: number;

  // Part B â€” Post-Casting Workshop Costs per kg Cast Product (Chi phí­ sau đúc / kg thành phẩm)
  DG_finishing_per_kg?: number;     // ÄÆ¡n giÃ¡ Vật tư HTSP/kg thành phẩm (VNĐ/kg)
  DG_utility_per_kg?: number;       // ÄÆ¡n giÃ¡ Äiá»‡n + NÆ°á»›c/kg thành phẩm (VNĐ/kg)
  DG_labor_per_kg?: number;         // ÄÆ¡n giÃ¡ LÆ°Æ¡ng trá»±c tiáº¿p & giÃ¡n tiáº¿p/kg thành phẩm (VNĐ/kg)
  DG_workshop_mgmt_per_kg?: number; // ÄÆ¡n giÃ¡ Quáº£n lÃ½ PhÃ¢n xÆ°á»Ÿng/kg thành phẩm (VNĐ/kg)
  DG_equipment_depr_per_kg?: number;// ÄÆ¡n giÃ¡ Kháº¥u hao Thiáº¿t bá»‹/kg thành phẩm (VNĐ/kg)

  // Section 3 â€” Machining & QA (Gia cÃ´ng & QC)
  DG_heat_treat_per_kg?: number; // ÄÆ¡n giÃ¡ nhiệt luyá»‡n (VNĐ/kg)
  DG_paint_per_kg?: number;      // ÄÆ¡n giÃ¡ sơn (VNĐ/kg)
  machining_operations?: MachiningOperation[];
  machining_notes?: string;

  // Section 4 â€” Pattern Amortization (Kháº¥u hao mẫu đúc)
  pattern_components?: ToolingComponent[];
  C_design?: number;          // Tiá»n thiết kế
  k_mgmt_die?: number;        // Phần trăm quản lý khuôn
  cavity?: number;            // Sá»‘ khoang khuôn
  life_coefficient?: number;  // Hệ số‘ tuá»•i thá»/cavity
  C_pattern_total?: number;       // Tổng chi phÃ­ bá»™ mẫu đúc (VNĐ) - Legacy
  L_pattern_life?: number;        // Tuá»•i thá» bá»™ mẫu đúc (sá»‘ sản phẩm) - Legacy
  pattern_cost_treatment: CostTreatment; // 'amortized' | 'separate'

  // Section 5 â€” Summary Parameters (Tổng há»£p)
  quoted_moq?: number;        // MOQ Báo Giá (cái/lô)
  N_order?: number;           // Số lượng sản lượng Ä‘Æ¡n hÃ ng (chi tiết), máº·c Ä‘á»‹nh 1
  k_mgmt_cast: number;        // Phần trăm chi phÃ­ quản lý công ty % (VD: 10 = 10%)
  C_pack?: number;            // Chi phí­ đóng gói (VNĐ/chi tiết)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ đóng gói (VNĐ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ vận chuyển (VNĐ/kg váº­t đúc)
  k_profit_casting: number;   // Phần trăm lợi nhuận đúc % (VD: 12 = 12%)
  k_casting_price_adjustment?: number; // Hệ số điều chỉnh giá đúc để báo giá (%), mặc định 100 = giữ nguyên giá vốn tính toán
}

export interface CastingResult {
  m_liquid: number;               // Khối lượng gang lá»ng (kg)
  m_scrap_cast: number;          // Khối lượng gang phế thu hồi (kg)
  C_metal_casting: number;       // Chi phí­ kim loại đúc (VNĐ)
  
  // Section 2 Breakdowns
  C_furnace_ladle: number;       // Chi phí­ Lò & Gàu (VNĐ)
  C_resin_core: number;          // Chi phí­ thao tác nhựa cho 1 sản phẩm (VNĐ)
  C_molding_materials: number;   // Chi phí­ Vật tư khuôn tá»•ng (3 váº­t tÆ° cá»‘ Ä‘á»‹nh + Thao tác nhựa) (VNĐ)
  C_ops_casting: number;         // Chi phí­ công nghệ đúc tá»•ng (VNĐ)
  partA_per_kg: number;          // ÄÆ¡n giÃ¡ Phần A / kg thành phẩm (C_metal + C_ops / m_cast) (VNĐ/kg)
  partA_total_calculated: number; // Giá đúc TÍNH TOÁN THẬT (giá vốn), chưa điều chỉnh — dùng để tham chiếu nội bộ
  partA_total_quoted: number;     // Giá đúc SAU điều chỉnh — dùng để tính COGS và giá bán cuối
  partA_per_kg_calculated: number; // Giá đúc tính toán trên kg

  // Part B Breakdowns (Phần B â€” Chi phí­ sau đúc / kg thành phẩm)
  C_finishing: number;           // Chi phí­ váº­t tÆ° HTSP (VNĐ)
  C_utility: number;             // Chi phí­ điện nước (VNĐ)
  C_labor: number;               // Chi phí­ nhân công (VNĐ)
  C_workshop_mgmt: number;       // Chi phí­ quản lý phân xưởng (VNĐ)
  C_equipment_depreciation: number; // Chi phí­ khấu hao thiết bị (VNĐ)
  C_part_b_total: number;        // Tổng chi phÃ­ Phần B (VNĐ)
  workshop_cost_per_kg: number;  // Giá thành phân xưởng / kg thành phẩm (Part A + Part B / m_cast) (VNĐ/kg)

  // Section 3 & 4
  C_heat_treat: number;          // Chi phí­ xử lý nhiệt (VNĐ)
  C_paint: number;               // Chi phí­ sơn (VNĐ)
  C_machining_casting: number;   // Tổng chi phÃ­ gia cÃ´ng & QA (VNĐ)
  C_pattern_amortization: number;// Chi phí­ khấu hao mẫu (/chi tiết) (VNĐ)

  // Section 5 & Final Price
  COGS: number;                  // Giá vốn hàng bán (VNĐ)
  C_admin: number;               // Chi phí­ quản lý (VNĐ)
  C_pack: number;                // Chi phí­ bao gói (VNĐ)
  C_trans: number;               // Chi phí­ vận chuyển (VNĐ)
  pre_profit_price: number;      // Giá trước lợi nhuận (VNĐ)
  C_profit: number;              // Lá»£i nhuáº­n (VNĐ)
  P_CASTING: number;              // Giá bán đúc cuối cùng (VNĐ/cái)
  separate_pattern_cost?: number; // Khoáº£n chi phÃ­ mẫu trả riêng nếu pattern_cost_treatment = 'separate'
  actual_C_pattern_total?: number;
  actual_L_pattern_life?: number;
  C_pattern_amortization_per_unit?: number;
}

// ----------------------------------------------------------------------
// SAWING (CƯA/CẮT PHÔI + GIA CÃ”NG) TYPES
// ----------------------------------------------------------------------

export interface SawingInput {
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia công (kg)
  m_phoi?: number;      // Trá»ng lÆ°á»£ng phÃ´i cắt (kg)
  m_chi?: number;       // Trá»ng lÆ°á»£ng chi phôi đầu vào (kg)
  d_cut?: number;      // ÄÆ°á»ng kÃ­nh cắt (mm)
  l_cut?: number;      // Chiá»u dÃ i cắt (mm)
  k_loss: number;      // Phần trăm cháy hao %
  DG_steel: number;    // ÄÆ¡n giÃ¡ thép phôi (VNĐ/kg)
  DG_scrap: number;    // ÄÆ¡n giÃ¡ thu hồi ba-via (VNĐ/kg)
  DG_scrap_cnc?: number; // ÄÆ¡n giÃ¡ thu hồi phoi CNC (VNĐ/kg) - Nháº­p tay riÃªng
  k_mgmt_mat?: number; // Chi phí­ quản lý váº­t tÆ° (%)
  use_m_tinh?: boolean;// TÃ­nh chi phÃ­ váº­t tÆ° theo TL sau gia công

  sawing_machine_type?: 'band_saw' | 'punch_cut'; 
  t_cut_sec?: number;              // Thá»i gian cắt phÃ´i (giây)
  DG_sawing_machine_hour?: number; // ÄÆ¡n giÃ¡ máy cưa (VNĐ/giờ)

  machining_operations?: MachiningOperation[];
  machining_notes?: string;
  DG_heat_treat_per_kg?: number;
  DG_paint_per_kg?: number;

  quoted_moq?: number;        // MOQ Báo Giá (cái/lô)
  N_order?: number;           // Số lượng Ä‘Æ¡n hÃ ng
  k_mgmt: number;             // Phần trăm chi phÃ­ quản lý %
  C_pack?: number;            // Chi phí­ đóng gói (VNĐ/chi tiết)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ đóng gói (VNĐ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ vận chuyển (VNĐ/kg)
  k_profit_sawing: number;    // Phần trăm lợi nhuận %
}

export interface SawingResult {
  m_bavia: number;            // Khối lượng ba-via tá»•ng (kg)
  m_bavia_forging?: number;   // Khối lượng phoi cÆ°a/cắt (kg)
  m_bavia_cnc?: number;       // Khối lượng phoi CNC (kg)
  C_mat_sawing: number;       // Chi phí­ váº­t liá»‡u (VNĐ)
  C_ops_sawing: number;       // Chi phí­ công nghệ cắt (VNĐ)
  C_machining: number;        // Chi phí­ gia cÃ´ng cơ khí­ (VNĐ)
  C_heat_treat: number;       // Chi phí­ xử lý nhiệt (VNĐ)
  C_paint: number;            // Chi phí­ sơn (VNĐ)
  COGS: number;               // Giá vốn hàng bán thuần (VNĐ)
  C_mgmt: number;             // Chi phí­ quản lý (VNĐ)
  C_pack: number;             // Chi phí­ bao gói (VNĐ)
  C_trans: number;            // Chi phí­ vận chuyển (VNĐ)
  pre_profit_price: number;   // Giá trước lợi nhuận (VNĐ)
  C_profit: number;           // Lá»£i nhuáº­n (VNĐ)
  P_SAWING: number;           // Giá bán cuối cùng (VNĐ/cái)
}

// ----------------------------------------------------------------------
// MACHINING (CHỈ GIA CÔNG CNC) TYPES
// ----------------------------------------------------------------------

export interface MachiningInput {
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia công (kg)

  machining_operations?: MachiningOperation[];
  machining_notes?: string;
  DG_heat_treat_per_kg?: number;
  DG_paint_per_kg?: number;

  quoted_moq?: number;        // MOQ Báo Giá (cái/lô)
  k_mgmt: number;             // Phần trăm chi phÃ­ quản lý %
  C_pack?: number;            // Chi phí­ đóng gói (VNĐ/chi tiết)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ đóng gói (VNĐ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ vận chuyển (VNĐ/kg)
  k_profit_machining: number; // Phần trăm lợi nhuận %
}

export interface MachiningResult {
  C_machining: number;        // Chi phí­ gia cÃ´ng cơ khí­ (VNĐ)
  C_heat_treat: number;       // Chi phí­ xử lý nhiệt (VNĐ)
  C_paint: number;            // Chi phí­ sơn (VNĐ)
  COGS: number;               // Giá vốn hàng bán thuần (VNĐ)
  C_mgmt: number;             // Chi phí­ quản lý (VNĐ)
  C_pack: number;             // Chi phí­ bao gói (VNĐ)
  C_trans: number;            // Chi phí­ vận chuyển (VNĐ)
  pre_profit_price: number;   // Giá trước lợi nhuận (VNĐ)
  C_profit: number;           // Lá»£i nhuáº­n (VNĐ)
  P_MACHINING: number;        // Giá bán cuối cùng (VNĐ/cái)
}
