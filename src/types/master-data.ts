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
}

export interface CastingBomItem {
  id: string;
  casting_grade_id: string;
  material_id: string;
  weight_kg: number; // Khối lượng dùng cho 1 mẻ 1000kg
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
  tonnage_min: number; // Tấn từ
  tonnage_max: number; // Tấn đến
  rate_per_hour: number; // Đơn giá VNĐ/giờ
  created_at?: string;
}

export interface HydraulicHammerRate {
  id: string;
  energy_min: number; // Năng lượng/tải trọng từ
  energy_max: number; // Năng lượng/tải trọng đến
  rate_per_hour: number; // Đơn giá VNĐ/giờ
  created_at?: string;
}

export interface SystemUnitRate {
  id: string;
  rate_key: string; // 'sinto_molding' | 'cnc_turning' | 'cnc_milling' | 'cnc_drilling' | 'cnc_grinding' | 'cnc_broaching' | 'elec_kwh' | 'trans_kg'
  rate_name: string;
  category: string; // 'Sinto' | 'CNC' | 'Hệ thống'
  unit: string; // 'VNĐ/khuôn' | 'VNĐ/phút' | 'VNĐ/kWh' | 'VNĐ/kg'
  value: number;
  updated_at?: string;
}

export interface LiquidMetalPriceResult {
  casting_grade_id: string;
  casting_grade_name?: string;
  total_weight_kg: number; // Tổng kg trong BOM (nên bằng 1000)
  DG_liquid: number;       // Đơn giá trung bình nước gang lỏng (VNĐ/kg)
  DG_cast_scrap: number;   // Đơn giá hồi liệu gang phế (VNĐ/kg)
  bom_items_calculated: Array<CastingBomItem & { item_cost: number; percentage: number }>;
}
