/**
 * Master Data Types for DSC-Quotation-Management
 */

export interface Material {
  id: string;
  name: string;
  unit: string;
  category: string; // 'Gang thỏi' | 'Thép phế đúc' | 'Hồi liệu' | 'Fe-Si' | 'Thép cán - Rèn' | string
  scrap_price?: number; // Giá phế liệu đi kèm cho 'Thép cán - Rèn' (VNĐ/kg)
  notes?: string;
  created_at?: string;
  updated_at?: string;
  latest_price?: number; // Giá hiệu lực mới nhất (join từ material_price_history)
  latest_effective_date?: string;
}

export interface MaterialPriceHistory {
  id: string;
  material_id: string;
  price: number;
  scrap_price?: number; // Giá phế liệu đi kèm cho 'Thép cán - Rèn'
  effective_date: string; // YYYY-MM-DD
  updated_by?: string;
  created_at?: string;
}

export interface CastingGrade {
  id: string;
  name: string; // VD: FCD450, FC250
  code?: string;
  notes?: string;
  created_at?: string;
  return_scrap_material_id?: string | null;
}

export interface CastingBomItem {
  id: string;
  casting_grade_id: string;
  material_id: string;
  weight_kg: number; // Khối lượng dùng cho 1 mẻ 1000kg
  /** @deprecated - Không còn dùng để tính DG_cast_scrap, chỉ giữ lại cho dữ liệu lịch sử */
  is_return_scrap: boolean; // Đánh dấu dòng Hồi liệu
  created_at?: string;
  material?: Material;
  // Joined fields for display
  material_name?: string;
  material_category?: string;
  unit_price?: number; // Giá hiệu lực mới nhất của vật tư này
}

export interface PressingMachineRate {
  id: string;
  name?: string;
  tonnage_min: number; // Tấn từ
  tonnage_max: number; // Tấn đến
  rate_per_hour: number; // Đơn giá VNĐ/giờ
  created_at?: string;
}

export interface HydraulicHammerRate {
  id: string;
  name?: string;
  energy_min: number; // Năng lượng kJ từ
  energy_max: number; // Năng lượng kJ đến
  rate_per_hour: number; // Đơn giá VNĐ/giờ
  created_at?: string;
}

export interface SystemUnitRate {
  id: string;
  rate_key: string; // 'sawing_machine' | 'trimming_machine' | 'cnc_type_1' | 'cnc_type_2' | 'cnc_type_3' | 'cnc_type_4'
  rate_name: string;
  category: 'Rèn' | 'CNC' | 'Đúc' | 'Hệ thống' | string;
  unit: string; // 'VNĐ/giờ' | 'VNĐ/phút' | string
  value: number;
  description?: string;
  updated_at?: string;
}

export interface LiquidMetalPriceResult {
  casting_grade_id: string;
  casting_grade_name?: string;
  total_weight_kg: number; // Tổng kg trong BOM (nên bằng 1000)
  DG_liquid: number;       // Đơn giá trung bình nước gang lỏng (VNĐ/kg)
  DG_cast_scrap: number;   // Đơn giá hồi liệu gang phế (VNĐ/kg)
  DG_cast_scrap_warning?: string; // Cảnh báo nếu chưa gán vật tư hồi liệu
  bom_items_calculated: Array<CastingBomItem & { item_cost: number; percentage: number }>;
}

export interface MoldingRecipeItem {
  id: string;
  material_id?: string;
  material_name: string;
  unit: string;
  category: string;
  quantity_per_1000kg: number;
  unit_price: number;
  is_outsourced: boolean;
  outsourced_cost_per_1000kg: number;
  notes?: string;
  created_at?: string;
}

export interface CastingFactorySettings {
  furnace_lining_cost: number;        // VNĐ / lần lót lò (mặc định: 50,000,000)
  furnace_lifespan_batches: number;   // số mẻ / lần lót lò (mặc định: 500 mẻ -> 100,000đ/1000kg)
  ladle_lining_cost: number;          // VNĐ / lần lót gầu (mặc định: 3,000,000)
  ladle_lifespan_batches: number;     // số mẻ / lần lót gầu (mặc định: 150 mẻ -> 20,000đ/1000kg)
  
  // Đơn giá thao / xử lý cát nhựa (VNĐ / kg thao)
  resin_core_sand_rate_per_kg: number;// Đơn giá thao cát nhựa (mặc định: 12,500 VNĐ/kg)

  // 5 Đơn giá Phần B (VNĐ / kg thành phẩm)
  finishing_material_rate: number;    // Vật tư HTSP (mặc định: 771.82 VNĐ/kg)
  utility_rate: number;               // Điện + Nước xưởng (mặc định: 3,687.6 VNĐ/kg)
  labor_rate: number;                 // Lương (mặc định: 2,461 VNĐ/kg)
  workshop_mgmt_rate: number;         // Quản lý Phân xưởng (mặc định: 0 VNĐ/kg)
  equipment_depreciation_rate: number;// Khấu hao Thiết bị (mặc định: 4,000 VNĐ/kg)
}
