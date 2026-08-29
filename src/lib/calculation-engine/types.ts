/**
 * DSC-Quotation-Management Calculation Engine Types
 * Pure TypeScript interfaces for Forging (RÃ¨n Dáº­p) and Iron Casting (ÄÃºc Gang)
 */

export type CostTreatment = 'amortized' | 'separate';

export type ForgingMachineType = 'press' | 'hammer';

/**
 * Cáº¥u trÃºc má»™t nguyÃªn cÃ´ng gia cÃ´ng cÆ¡ khÃ­ (Machining Operation)
 */
export interface MachiningOperation {
  name?: string;
  t_prep_min?: number;      // Thá»i gian gÃ¡ Ä‘áº·t/chuáº©n bá»‹ (phÃºt) - t_prep_i
  t_man_min?: number;       // Thá»i gian cÃ´ng Ä‘oáº¡n/chi tiáº¿t (phÃºt) - t_man_i
  DG_machine_hour: number; // ÄÆ¡n giÃ¡ mÃ¡y (/giá») - DG_machine_i
}

export interface ToolingComponent {
  name: string; // TÃªn thÃ nh pháº§n
  depreciation_qty?: number; // Tuá»•i thá» riÃªng cá»§a thÃ nh pháº§n nÃ y (sá»‘ chi tiáº¿t)
  material_id?: string; // LiÃªn káº¿t tá»›i Material á»Ÿ Tab 1
  material: string; // MÃ¡c váº­t liá»‡u
  weight_kg: number; // Trá»ng lÆ°á»£ng sá»­ dá»¥ng
  material_price_kg: number; // ÄÆ¡n giÃ¡ váº­t tÆ°
  machining_price_kg: number; // ÄÆ¡n giÃ¡ gia cÃ´ng
  needs_heat_treatment: boolean; // Cáº§n xá»­ lÃ½ nhiá»‡t
  heat_treatment_price_kg: number; // ÄÆ¡n giÃ¡ xá»­ lÃ½ nhiá»‡t
  
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
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia cÃ´ng (kg) - Má»›i
  m_phoi?: number;      // Trá»ng lÆ°á»£ng phÃ´i rÃ¨n (kg) - CÅ© lÃ  m_tinh
  m_chi?: number;       // Trá»ng lÆ°á»£ng chi phÃ´i Ä‘áº§u vÃ o (kg) - CÅ© lÃ  m_phoi/m_bavia
  d_cut?: number;      // ÄÆ°á»ng kÃ­nh cáº¯t (mm)
  l_cut?: number;      // Chiá»u dÃ i cáº¯t (mm)
  k_loss: number;      // Pháº§n trÄƒm chÃ¡y hao % (VD: 2.0 = 2%)
  DG_steel: number;    // ÄÆ¡n giÃ¡ thÃ©p phÃ´i (VNÄ/kg)
  DG_scrap: number;    // ÄÆ¡n giÃ¡ thu há»“i ba-via (VNÄ/kg)
  DG_scrap_cnc?: number; // ÄÆ¡n giÃ¡ thu há»“i phoi CNC (VNÄ/kg) - Nháº­p tay riÃªng
  k_mgmt_mat?: number; // Chi phÃ­ quáº£n lÃ½ váº­t tÆ° (%)
  use_m_tinh?: boolean;// TÃ­nh chi phÃ­ váº­t tÆ° theo TL sau gia cÃ´ng

  // Section 2 â€” Technology & Operations (CÃ´ng nghá»‡ & Nhiá»‡t luyá»‡n)
  sawing_machine_type?: 'band_saw' | 'punch_cut'; // Loáº¡i mÃ¡y cáº¯t
  t_cut_sec?: number;              // Thá»i gian cáº¯t phÃ´i (giÃ¢y)
  DG_sawing_machine_hour?: number; // ÄÆ¡n giÃ¡ mÃ¡y cÆ°a (VNÄ/giá»)
  w_elec_kwh_per_kg?: number;      // Äiá»‡n nÄƒng nung (kWh/kg)
  DG_elec_kwh?: number;            // ÄÆ¡n giÃ¡ Ä‘iá»‡n (VNÄ/kWh)
  forging_line?: '1000T' | '1600T' | '63kJ' | '80kJ'; // DÃ¢y chuyá»n rÃ¨n
  expected_productivity?: number;  // NÄƒng suáº¥t dá»± kiáº¿n (CÃ¡i/ca)
  DG_forging_machine_hour?: number;// ÄÆ¡n giÃ¡ mÃ¡y dáº­p/bÃºa (VNÄ/giá»)
  DG_heat_treat_per_kg?: number;   // ÄÆ¡n giÃ¡ nhiá»‡t luyá»‡n (VNÄ/kg) - Alias má»›i
  DG_paint_per_kg?: number;        // ÄÆ¡n giÃ¡ sÆ¡n (VNÄ/kg)
  DG_clean_kg?: number;            // ÄÆ¡n giÃ¡ lÃ m sáº¡ch/phun bi (VNÄ/kg)
  C_coining_per_unit?: number;     // Chi phÃ­ Náº¯n pháº³ng (Coining) â€” nháº­p tay, VNÄ/sáº£n pháº©m



  // Section 3 â€” Machining (Gia cÃ´ng cÆ¡ khÃ­)
  machining_operations?: MachiningOperation[];
  machining_notes?: string;        // Ghi chÃº chung cho khá»‘i CNC

  // Section 4 â€” Die Amortization (Kháº¥u hao khuÃ´n)
  die_components?: ToolingComponent[];
  C_design?: number;          // Tiá»n thiáº¿t káº¿
  k_mgmt_die?: number;        // Pháº§n trÄƒm quáº£n lÃ½ khuÃ´n
  cavity?: number;            // Sá»‘ khoang khuÃ´n
  life_coefficient?: number;  // Há»‡ sá»‘ tuá»•i thá»/cavity
  C_die_total?: number;       // Tá»•ng chi phÃ­ bá»™ khuÃ´n (VNÄ) - Legacy
  L_die_life?: number;        // Tuá»•i thá» bá»™ khuÃ´n (sá»‘ sáº£n pháº©m) - Legacy
  die_cost_treatment: CostTreatment; // 'amortized' | 'separate'
  C_die_amortization_override?: number;

  // Section 5 â€” Summary Parameters (Tá»•ng há»£p)
  quoted_moq?: number;        // MOQ BÃ¡o GiÃ¡ (cÃ¡i/lÃ´)
  N_order?: number;           // Sá»‘ lÆ°á»£ng sáº£n lÆ°á»£ng Ä‘Æ¡n hÃ ng (chi tiáº¿t), máº·c Ä‘á»‹nh 1
  k_mgmt: number;             // Pháº§n trÄƒm chi phÃ­ quáº£n lÃ½ % (VD: 8 = 8%)
  C_pack?: number;            // Chi phÃ­ Ä‘Ã³ng gÃ³i (VNÄ/chi tiáº¿t)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ Ä‘Ã³ng gÃ³i (VNÄ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ váº­n chuyá»ƒn (VNÄ/kg phÃ´i)
  k_profit_forging: number;   // Pháº§n trÄƒm lá»£i nhuáº­n % (VD: 15 = 15%)
}

export interface ForgingResult {
  m_phoi: number;             // Trá»ng lÆ°á»£ng chi Ä‘áº§u vÃ o (kg) - CÅ© lÃ  m_phoi
  m_bavia: number;            // Khá»‘i lÆ°á»£ng ba-via tá»•ng (kg)
  m_bavia_forging?: number;   // Khá»‘i lÆ°á»£ng ba-via rÃ¨n thu há»“i (kg)
  m_bavia_cnc?: number;       // Khá»‘i lÆ°á»£ng phoi CNC thu há»“i (kg)
  C_mat_forging: number;      // Chi phÃ­ váº­t liá»‡u rÃ¨n (VNÄ)
  C_cut: number;
  C_heat_induction: number;
  C_forging_op: number;
  C_clean: number;
  C_coining: number;
  C_ops_forging: number;      // Chi phÃ­ cÃ´ng nghá»‡ rÃ¨n tá»•ng (VNÄ)
  C_machining: number;        // Chi phÃ­ gia cÃ´ng cÆ¡ khÃ­ (VNÄ)
  C_heat_treat: number;       // Chi phÃ­ xá»­ lÃ½ nhiá»‡t (VNÄ)
  C_paint: number;            // Chi phÃ­ sÆ¡n (VNÄ)
  C_die_amortization: number; // Chi phÃ­ kháº¥u hao khuÃ´n (/chi tiáº¿t) (VNÄ)
  die_components_breakdown?: any[]; // Chi tiáº¿t kháº¥u hao tá»«ng pháº§n cá»§a khuÃ´n (Astemo form)
  COGS: number;               // GiÃ¡ vá»‘n hÃ ng bÃ¡n (VNÄ)
  C_mgmt: number;             // Chi phÃ­ quáº£n lÃ½ (VNÄ)
  C_pack: number;             // Chi phÃ­ bao gÃ³i (VNÄ)
  C_trans: number;            // Chi phÃ­ váº­n chuyá»ƒn (VNÄ)
  pre_profit_price: number;   // GiÃ¡ trÆ°á»›c lá»£i nhuáº­n (VNÄ)
  C_profit: number;           // Lá»£i nhuáº­n (VNÄ)
  P_FORGING: number;          // GiÃ¡ bÃ¡n rÃ¨n dáº­p cuá»‘i cÃ¹ng (VNÄ/cÃ¡i)
  separate_die_cost?: number; // Khoáº£n chi phÃ­ khuÃ´n tráº£ riÃªng náº¿u die_cost_treatment = 'separate'
  actual_C_die_total?: number;
  actual_L_die_life?: number;
  C_die_amortized_per_unit?: number;
  shipping_weight_kg: number;
}

// ----------------------------------------------------------------------
// CASTING (ÄÃšC GANG) TYPES
// ----------------------------------------------------------------------

export interface CastingInput {
  m_tinh?: number;           // Trá»ng lÆ°á»£ng tinh sau gia cÃ´ng (kg) - Má»›i
  // Section 1 â€” Cast Metal (Váº­t Ä‘Ãºc & Hao há»¥t)
  m_cast?: number;            // Khá»‘i lÆ°á»£ng váº­t Ä‘Ãºc tinh (kg)
  Y_yield?: number;           // Thu há»“i kim loáº¡i % (VD: 57 = 57%)
  k_burn_loss?: number;      // Hao há»¥t chÃ¡y % khi náº¥u khÃ´ng thu há»“i (VD: 2.15 = 2.15%)
  DG_liquid: number;         // ÄÆ¡n giÃ¡ nÆ°á»›c gang lá»ng (VNÄ/kg)
  DG_cast_scrap: number;     // ÄÆ¡n giÃ¡ thu há»“i gang pháº¿ (VNÄ/kg)

  // Section 2 â€” Operations & Molding per 1,000kg Liquid Metal (CÃ´ng nghá»‡ & Váº­t tÆ° khuÃ´n)
  C_furnace_ladle_per_1000kg?: number;    // Chi phÃ­ lÃ³t LÃ² & Gáº§u cho 1,000kg kim loáº¡i lá»ng (VNÄ)
  C_molding_recipe_total_1000kg?: number; // Tá»•ng chi phÃ­ CÃ´ng thá»©c váº­t tÆ° khuÃ´n (3 váº­t tÆ° cá»‘ Ä‘á»‹nh) cho 1,000kg kim loáº¡i lá»ng (VNÄ)
  m_resin_core?: number;                  // Trá»ng lÆ°á»£ng thao cÃ¡t nhá»±a cho 1 sáº£n pháº©m (kg)
  DG_resin_core_per_kg?: number;          // ÄÆ¡n giÃ¡ thao cÃ¡t nhá»±a (VNÄ/kg)

  // Section 2 (Deprecated legacy fields kept optional for backward compatibility)
  DG_sinto_op?: number;
  n_cavity_per_mold?: number;

  // Part B â€” Post-Casting Workshop Costs per kg Cast Product (Chi phÃ­ sau Ä‘Ãºc / kg thÃ nh pháº©m)
  DG_finishing_per_kg?: number;     // ÄÆ¡n giÃ¡ Váº­t tÆ° HTSP/kg thÃ nh pháº©m (VNÄ/kg)
  DG_utility_per_kg?: number;       // ÄÆ¡n giÃ¡ Äiá»‡n + NÆ°á»›c/kg thÃ nh pháº©m (VNÄ/kg)
  DG_labor_per_kg?: number;         // ÄÆ¡n giÃ¡ LÆ°Æ¡ng trá»±c tiáº¿p & giÃ¡n tiáº¿p/kg thÃ nh pháº©m (VNÄ/kg)
  DG_workshop_mgmt_per_kg?: number; // ÄÆ¡n giÃ¡ Quáº£n lÃ½ PhÃ¢n xÆ°á»Ÿng/kg thÃ nh pháº©m (VNÄ/kg)
  DG_equipment_depr_per_kg?: number;// ÄÆ¡n giÃ¡ Kháº¥u hao Thiáº¿t bá»‹/kg thÃ nh pháº©m (VNÄ/kg)

  // Section 3 â€” Machining & QA (Gia cÃ´ng & QC)
  DG_heat_treat_per_kg?: number; // ÄÆ¡n giÃ¡ nhiá»‡t luyá»‡n (VNÄ/kg)
  DG_paint_per_kg?: number;      // ÄÆ¡n giÃ¡ sÆ¡n (VNÄ/kg)
  machining_operations?: MachiningOperation[];
  machining_notes?: string;

  // Section 4 â€” Pattern Amortization (Kháº¥u hao máº«u Ä‘Ãºc)
  pattern_components?: ToolingComponent[];
  C_design?: number;          // Tiá»n thiáº¿t káº¿
  k_mgmt_die?: number;        // Pháº§n trÄƒm quáº£n lÃ½ khuÃ´n
  cavity?: number;            // Sá»‘ khoang khuÃ´n
  life_coefficient?: number;  // Há»‡ sá»‘ tuá»•i thá»/cavity
  C_pattern_total?: number;       // Tá»•ng chi phÃ­ bá»™ máº«u Ä‘Ãºc (VNÄ) - Legacy
  L_pattern_life?: number;        // Tuá»•i thá» bá»™ máº«u Ä‘Ãºc (sá»‘ sáº£n pháº©m) - Legacy
  pattern_cost_treatment: CostTreatment; // 'amortized' | 'separate'

  // Section 5 â€” Summary Parameters (Tá»•ng há»£p)
  quoted_moq?: number;        // MOQ BÃ¡o GiÃ¡ (cÃ¡i/lÃ´)
  N_order?: number;           // Sá»‘ lÆ°á»£ng sáº£n lÆ°á»£ng Ä‘Æ¡n hÃ ng (chi tiáº¿t), máº·c Ä‘á»‹nh 1
  k_mgmt_cast: number;        // Pháº§n trÄƒm chi phÃ­ quáº£n lÃ½ cÃ´ng ty % (VD: 10 = 10%)
  C_pack?: number;            // Chi phÃ­ Ä‘Ã³ng gÃ³i (VNÄ/chi tiáº¿t)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ Ä‘Ã³ng gÃ³i (VNÄ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ váº­n chuyá»ƒn (VNÄ/kg váº­t Ä‘Ãºc)
  k_profit_casting: number;   // Pháº§n trÄƒm lá»£i nhuáº­n Ä‘Ãºc % (VD: 12 = 12%)
}

export interface CastingResult {
  m_liquid: number;               // Khá»‘i lÆ°á»£ng gang lá»ng (kg)
  m_scrap_cast: number;          // Khá»‘i lÆ°á»£ng gang pháº¿ thu há»“i (kg)
  C_metal_casting: number;       // Chi phÃ­ kim loáº¡i Ä‘Ãºc (VNÄ)
  
  // Section 2 Breakdowns
  C_furnace_ladle: number;       // Chi phÃ­ LÃ² & Gáº§u (VNÄ)
  C_resin_core: number;          // Chi phÃ­ thao cÃ¡t nhá»±a cho 1 sáº£n pháº©m (VNÄ)
  C_molding_materials: number;   // Chi phÃ­ Váº­t tÆ° khuÃ´n tá»•ng (3 váº­t tÆ° cá»‘ Ä‘á»‹nh + Thao cÃ¡t nhá»±a) (VNÄ)
  C_ops_casting: number;         // Chi phÃ­ cÃ´ng nghá»‡ Ä‘Ãºc tá»•ng (VNÄ)
  partA_per_kg: number;          // ÄÆ¡n giÃ¡ Pháº§n A / kg thÃ nh pháº©m (C_metal + C_ops / m_cast) (VNÄ/kg)

  // Part B Breakdowns (Pháº§n B â€” Chi phÃ­ sau Ä‘Ãºc / kg thÃ nh pháº©m)
  C_finishing: number;           // Chi phÃ­ váº­t tÆ° HTSP (VNÄ)
  C_utility: number;             // Chi phÃ­ Ä‘iá»‡n nÆ°á»›c (VNÄ)
  C_labor: number;               // Chi phÃ­ nhÃ¢n cÃ´ng (VNÄ)
  C_workshop_mgmt: number;       // Chi phÃ­ quáº£n lÃ½ phÃ¢n xÆ°á»Ÿng (VNÄ)
  C_equipment_depreciation: number; // Chi phÃ­ kháº¥u hao thiáº¿t bá»‹ (VNÄ)
  C_part_b_total: number;        // Tá»•ng chi phÃ­ Pháº§n B (VNÄ)
  workshop_cost_per_kg: number;  // GiÃ¡ thÃ nh phÃ¢n xÆ°á»Ÿng / kg thÃ nh pháº©m (Part A + Part B / m_cast) (VNÄ/kg)

  // Section 3 & 4
  C_heat_treat: number;          // Chi phÃ­ xá»­ lÃ½ nhiá»‡t (VNÄ)
  C_paint: number;               // Chi phÃ­ sÆ¡n (VNÄ)
  C_machining_casting: number;   // Tá»•ng chi phÃ­ gia cÃ´ng & QA (VNÄ)
  C_pattern_amortization: number;// Chi phÃ­ kháº¥u hao máº«u (/chi tiáº¿t) (VNÄ)

  // Section 5 & Final Price
  COGS: number;                  // GiÃ¡ vá»‘n hÃ ng bÃ¡n (VNÄ)
  C_admin: number;               // Chi phÃ­ quáº£n lÃ½ (VNÄ)
  C_pack: number;                // Chi phÃ­ bao gÃ³i (VNÄ)
  C_trans: number;               // Chi phÃ­ váº­n chuyá»ƒn (VNÄ)
  pre_profit_price: number;      // GiÃ¡ trÆ°á»›c lá»£i nhuáº­n (VNÄ)
  C_profit: number;              // Lá»£i nhuáº­n (VNÄ)
  P_CASTING: number;              // GiÃ¡ bÃ¡n Ä‘Ãºc cuá»‘i cÃ¹ng (VNÄ/cÃ¡i)
  separate_pattern_cost?: number; // Khoáº£n chi phÃ­ máº«u tráº£ riÃªng náº¿u pattern_cost_treatment = 'separate'
  actual_C_pattern_total?: number;
  actual_L_pattern_life?: number;
  C_pattern_amortization_per_unit?: number;
}

// ----------------------------------------------------------------------
// SAWING (CÆ¯A/Cáº®T PHÃ”I + GIA CÃ”NG) TYPES
// ----------------------------------------------------------------------

export interface SawingInput {
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia cÃ´ng (kg)
  m_phoi?: number;      // Trá»ng lÆ°á»£ng phÃ´i cáº¯t (kg)
  m_chi?: number;       // Trá»ng lÆ°á»£ng chi phÃ´i Ä‘áº§u vÃ o (kg)
  d_cut?: number;      // ÄÆ°á»ng kÃ­nh cáº¯t (mm)
  l_cut?: number;      // Chiá»u dÃ i cáº¯t (mm)
  k_loss: number;      // Pháº§n trÄƒm chÃ¡y hao %
  DG_steel: number;    // ÄÆ¡n giÃ¡ thÃ©p phÃ´i (VNÄ/kg)
  DG_scrap: number;    // ÄÆ¡n giÃ¡ thu há»“i ba-via (VNÄ/kg)
  DG_scrap_cnc?: number; // ÄÆ¡n giÃ¡ thu há»“i phoi CNC (VNÄ/kg) - Nháº­p tay riÃªng
  k_mgmt_mat?: number; // Chi phÃ­ quáº£n lÃ½ váº­t tÆ° (%)
  use_m_tinh?: boolean;// TÃ­nh chi phÃ­ váº­t tÆ° theo TL sau gia cÃ´ng

  sawing_machine_type?: 'band_saw' | 'punch_cut'; 
  t_cut_sec?: number;              // Thá»i gian cáº¯t phÃ´i (giÃ¢y)
  DG_sawing_machine_hour?: number; // ÄÆ¡n giÃ¡ mÃ¡y cÆ°a (VNÄ/giá»)

  machining_operations?: MachiningOperation[];
  machining_notes?: string;
  DG_heat_treat_per_kg?: number;
  DG_paint_per_kg?: number;

  quoted_moq?: number;        // MOQ BÃ¡o GiÃ¡ (cÃ¡i/lÃ´)
  N_order?: number;           // Sá»‘ lÆ°á»£ng Ä‘Æ¡n hÃ ng
  k_mgmt: number;             // Pháº§n trÄƒm chi phÃ­ quáº£n lÃ½ %
  C_pack?: number;            // Chi phÃ­ Ä‘Ã³ng gÃ³i (VNÄ/chi tiáº¿t)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ Ä‘Ã³ng gÃ³i (VNÄ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ váº­n chuyá»ƒn (VNÄ/kg)
  k_profit_sawing: number;    // Pháº§n trÄƒm lá»£i nhuáº­n %
}

export interface SawingResult {
  m_bavia: number;            // Khá»‘i lÆ°á»£ng ba-via tá»•ng (kg)
  m_bavia_forging?: number;   // Khá»‘i lÆ°á»£ng phoi cÆ°a/cáº¯t (kg)
  m_bavia_cnc?: number;       // Khá»‘i lÆ°á»£ng phoi CNC (kg)
  C_mat_sawing: number;       // Chi phÃ­ váº­t liá»‡u (VNÄ)
  C_ops_sawing: number;       // Chi phÃ­ cÃ´ng nghá»‡ cáº¯t (VNÄ)
  C_machining: number;        // Chi phÃ­ gia cÃ´ng cÆ¡ khÃ­ (VNÄ)
  C_heat_treat: number;       // Chi phÃ­ xá»­ lÃ½ nhiá»‡t (VNÄ)
  C_paint: number;            // Chi phÃ­ sÆ¡n (VNÄ)
  COGS: number;               // GiÃ¡ vá»‘n hÃ ng bÃ¡n thuáº§n (VNÄ)
  C_mgmt: number;             // Chi phÃ­ quáº£n lÃ½ (VNÄ)
  C_pack: number;             // Chi phÃ­ bao gÃ³i (VNÄ)
  C_trans: number;            // Chi phÃ­ váº­n chuyá»ƒn (VNÄ)
  pre_profit_price: number;   // GiÃ¡ trÆ°á»›c lá»£i nhuáº­n (VNÄ)
  C_profit: number;           // Lá»£i nhuáº­n (VNÄ)
  P_SAWING: number;           // GiÃ¡ bÃ¡n cuá»‘i cÃ¹ng (VNÄ/cÃ¡i)
}

// ----------------------------------------------------------------------
// MACHINING (CHá»ˆ GIA CÃ”NG CNC) TYPES
// ----------------------------------------------------------------------

export interface MachiningInput {
  m_tinh?: number;     // Trá»ng lÆ°á»£ng tinh sau gia cÃ´ng (kg)

  machining_operations?: MachiningOperation[];
  machining_notes?: string;
  DG_heat_treat_per_kg?: number;
  DG_paint_per_kg?: number;

  quoted_moq?: number;        // MOQ BÃ¡o GiÃ¡ (cÃ¡i/lÃ´)
  k_mgmt: number;             // Pháº§n trÄƒm chi phÃ­ quáº£n lÃ½ %
  C_pack?: number;            // Chi phÃ­ Ä‘Ã³ng gÃ³i (VNÄ/chi tiáº¿t)
  DG_pack_kg?: number;        // ÄÆ¡n giÃ¡ Ä‘Ã³ng gÃ³i (VNÄ/kg)
  DG_trans_kg: number;        // ÄÆ¡n giÃ¡ váº­n chuyá»ƒn (VNÄ/kg)
  k_profit_machining: number; // Pháº§n trÄƒm lá»£i nhuáº­n %
}

export interface MachiningResult {
  C_machining: number;        // Chi phÃ­ gia cÃ´ng cÆ¡ khÃ­ (VNÄ)
  C_heat_treat: number;       // Chi phÃ­ xá»­ lÃ½ nhiá»‡t (VNÄ)
  C_paint: number;            // Chi phÃ­ sÆ¡n (VNÄ)
  COGS: number;               // GiÃ¡ vá»‘n hÃ ng bÃ¡n thuáº§n (VNÄ)
  C_mgmt: number;             // Chi phÃ­ quáº£n lÃ½ (VNÄ)
  C_pack: number;             // Chi phÃ­ bao gÃ³i (VNÄ)
  C_trans: number;            // Chi phÃ­ váº­n chuyá»ƒn (VNÄ)
  pre_profit_price: number;   // GiÃ¡ trÆ°á»›c lá»£i nhuáº­n (VNÄ)
  C_profit: number;           // Lá»£i nhuáº­n (VNÄ)
  P_MACHINING: number;        // GiÃ¡ bÃ¡n cuá»‘i cÃ¹ng (VNÄ/cÃ¡i)
}
