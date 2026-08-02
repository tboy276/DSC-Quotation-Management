import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Material,
  MaterialPriceHistory,
  CastingGrade,
  CastingBomItem,
  PressingMachineRate,
  HydraulicHammerRate,
  SystemUnitRate,
} from '../types/master-data';

// ----------------------------------------------------------------------
// INITIAL SEED MOCK DATA (Fallback khi offline hoặc Supabase chưa sync)
// ----------------------------------------------------------------------

export let INITIAL_MATERIALS: Material[] = [
  { id: 'mat-1', name: 'Gang thỏi F1', unit: 'kg', category: 'Gang thỏi', notes: 'Nhập khẩu chất lượng cao', latest_price: 15500, latest_effective_date: '2026-01-01' },
  { id: 'mat-2', name: 'Thép phế đúc chọn lọc', unit: 'kg', category: 'Thép phế đúc', notes: 'Hao hụt thấp', latest_price: 11800, latest_effective_date: '2026-01-01' },
  { id: 'mat-3', name: 'Hồi liệu FCD450', unit: 'kg', category: 'Hồi liệu', notes: 'Hồi liệu đúc nội bộ FCD450', latest_price: 10000, latest_effective_date: '2026-01-01' },
  { id: 'mat-4', name: 'Hồi liệu FC250', unit: 'kg', category: 'Hồi liệu', notes: 'Hồi liệu đúc nội bộ FC250', latest_price: 9500, latest_effective_date: '2026-01-01' },
  { id: 'mat-5', name: 'Fe-Si 75 (Hợp kim sắt silic)', unit: 'kg', category: 'Fe-Si', notes: 'Chất biến tính đúc gang', latest_price: 42000, latest_effective_date: '2026-01-01' },
  { id: 'mat-6', name: 'S45C - JFE (Nhật Bản)', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 8500, notes: 'Thép phôi rèn chuẩn JFE Nhật', latest_price: 22000, latest_effective_date: '2026-01-01' },
  { id: 'mat-7', name: '40Cr - Baosteel (Trung Quốc)', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 7800, notes: 'Thép hợp kim niken-crom rèn', latest_price: 24500, latest_effective_date: '2026-01-01' },
  { id: 'mat-8', name: '20CrMnTi - HBIS', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 8000, notes: 'Thép thấm cacbon bánh răng', latest_price: 26000, latest_effective_date: '2026-01-01' },
];

export let INITIAL_PRICE_HISTORY: MaterialPriceHistory[] = [
  { id: 'ph-1', material_id: 'mat-1', price: 15000, effective_date: '2025-06-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-2', material_id: 'mat-1', price: 15500, effective_date: '2026-01-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-3', material_id: 'mat-6', price: 21000, scrap_price: 8000, effective_date: '2025-09-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-4', material_id: 'mat-6', price: 22000, scrap_price: 8500, effective_date: '2026-01-01', updated_by: 'estimator@disoco.vn' },
];

export const INITIAL_CASTING_GRADES: CastingGrade[] = [
  { id: 'grade-1', name: 'FCD450 (Gang Cầu)', code: 'FCD450', notes: 'Gang cầu độ bền kéo 450 MPa, độ giãn dài 10%' },
  { id: 'grade-2', name: 'FC250 (Gang Xám)', code: 'FC250', notes: 'Gang xám độ bền kéo 250 MPa, giảm chấn tốt' },
  { id: 'grade-3', name: 'FCD600 (Gang Cầu Cường Độ Cao)', code: 'FCD600', notes: 'Gang cầu chịu lực cao 600 MPa' },
];

export let INITIAL_BOM_ITEMS: CastingBomItem[] = [
  { id: 'bom-1', casting_grade_id: 'grade-1', material_id: 'mat-1', weight_kg: 350, is_return_scrap: false },
  { id: 'bom-2', casting_grade_id: 'grade-1', material_id: 'mat-2', weight_kg: 250, is_return_scrap: false },
  { id: 'bom-3', casting_grade_id: 'grade-1', material_id: 'mat-3', weight_kg: 380, is_return_scrap: true }, // Hồi liệu
  { id: 'bom-4', casting_grade_id: 'grade-1', material_id: 'mat-5', weight_kg: 20, is_return_scrap: false },
  { id: 'bom-5', casting_grade_id: 'grade-2', material_id: 'mat-1', weight_kg: 300, is_return_scrap: false },
  { id: 'bom-6', casting_grade_id: 'grade-2', material_id: 'mat-2', weight_kg: 280, is_return_scrap: false },
  { id: 'bom-7', casting_grade_id: 'grade-2', material_id: 'mat-4', weight_kg: 400, is_return_scrap: true }, // Hồi liệu
  { id: 'bom-8', casting_grade_id: 'grade-2', material_id: 'mat-5', weight_kg: 20, is_return_scrap: false },
];

export const INITIAL_PRESSING_RATES: PressingMachineRate[] = [
  { id: 'pr-1', tonnage_min: 100, tonnage_max: 300, rate_per_hour: 450000 },
  { id: 'pr-2', tonnage_min: 300, tonnage_max: 630, rate_per_hour: 750000 },
  { id: 'pr-3', tonnage_min: 630, tonnage_max: 1000, rate_per_hour: 1200000 },
  { id: 'pr-4', tonnage_min: 1000, tonnage_max: 1600, rate_per_hour: 1800000 },
  { id: 'pr-5', tonnage_min: 1600, tonnage_max: 2500, rate_per_hour: 2700000 },
];

export const INITIAL_HAMMER_RATES: HydraulicHammerRate[] = [
  { id: 'hr-1', energy_min: 16, energy_max: 31.5, rate_per_hour: 600000 },
  { id: 'hr-2', energy_min: 31.5, energy_max: 50, rate_per_hour: 950000 },
  { id: 'hr-3', energy_min: 50, energy_max: 80, rate_per_hour: 1500000 },
  { id: 'hr-4', energy_min: 80, energy_max: 125, rate_per_hour: 2200000 },
];

export const INITIAL_SYSTEM_RATES: SystemUnitRate[] = [
  { id: 'sr-1', rate_key: 'sinto_molding', rate_name: 'Dây chuyền Sinto (Đúc tự động)', category: 'Sinto', unit: 'VNĐ/khuôn', value: 10000 },
  { id: 'sr-2', rate_key: 'cnc_turning', rate_name: 'Máy Tiện CNC', category: 'CNC', unit: 'VNĐ/phút', value: 3500 },
  { id: 'sr-3', rate_key: 'cnc_milling', rate_name: 'Máy Phay CNC (3-5 trục)', category: 'CNC', unit: 'VNĐ/phút', value: 4500 },
  { id: 'sr-4', rate_key: 'cnc_drilling', rate_name: 'Máy Khoan / Taro CNC', category: 'CNC', unit: 'VNĐ/phút', value: 3000 },
  { id: 'sr-5', rate_key: 'cnc_grinding', rate_name: 'Máy Mài Tròn / Mài Phẳng', category: 'CNC', unit: 'VNĐ/phút', value: 4000 },
  { id: 'sr-6', rate_key: 'cnc_broaching', rate_name: 'Máy Chuốt / Xọc Răng', category: 'CNC', unit: 'VNĐ/phút', value: 5000 },
  { id: 'sr-7', rate_key: 'elec_kwh', rate_name: 'Đơn giá điện sản xuất (DG_elec)', category: 'Hệ thống', unit: 'VNĐ/kWh', value: 2200 },
  { id: 'sr-8', rate_key: 'trans_kg', rate_name: 'Đơn giá vận chuyển (DG_trans_kg)', category: 'Hệ thống', unit: 'VNĐ/kg', value: 1500 },
];

// ----------------------------------------------------------------------
// SERVICE FUNCTIONS (SUPABASE + LOCAL CACHE FALLBACK)
// ----------------------------------------------------------------------

export async function fetchMaterials(): Promise<Material[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Material[];
      }
    } catch (err) {
      console.warn('Fallback to local materials:', err);
    }
  }
  return INITIAL_MATERIALS;
}

export async function saveMaterial(mat: Partial<Material>): Promise<Material> {
  if (mat.id) {
    INITIAL_MATERIALS = INITIAL_MATERIALS.map((m) =>
      m.id === mat.id ? { ...m, ...mat } : m
    );
    return INITIAL_MATERIALS.find((m) => m.id === mat.id)!;
  } else {
    const newMat: Material = {
      id: `mat-${Date.now()}`,
      name: mat.name || 'Vật tư mới',
      category: mat.category || 'Gang thỏi',
      unit: mat.unit || 'kg',
      notes: mat.notes || '',
      latest_price: 0,
    };
    INITIAL_MATERIALS.unshift(newMat);
    return newMat;
  }
}

export async function deleteMaterials(ids: string[]): Promise<void> {
  INITIAL_MATERIALS = INITIAL_MATERIALS.filter((m) => !ids.includes(m.id));
}

export async function fetchMaterialPriceHistory(materialId?: string): Promise<MaterialPriceHistory[]> {
  return fetchPriceHistory(materialId);
}

export async function fetchPriceHistory(materialId?: string): Promise<MaterialPriceHistory[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('material_price_history').select('*').order('effective_date', { ascending: false });
      if (materialId) query = query.eq('material_id', materialId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as MaterialPriceHistory[];
      }
    } catch (err) {
      console.warn('Fallback to local price history:', err);
    }
  }
  return materialId
    ? INITIAL_PRICE_HISTORY.filter((p) => p.material_id === materialId)
    : INITIAL_PRICE_HISTORY;
}

export async function addMaterialPrice(
  materialId: string,
  price: number,
  effectiveDate: string,
  scrapPrice?: number
): Promise<MaterialPriceHistory> {
  const newHist: MaterialPriceHistory = {
    id: `ph-${Date.now()}`,
    material_id: materialId,
    price,
    scrap_price: scrapPrice,
    effective_date: effectiveDate,
    updated_by: 'estimator@disoco.vn',
  };
  INITIAL_PRICE_HISTORY.unshift(newHist);

  // Update latest_price in material
  INITIAL_MATERIALS = INITIAL_MATERIALS.map((m) =>
    m.id === materialId
      ? {
          ...m,
          latest_price: price,
          scrap_price: scrapPrice !== undefined ? scrapPrice : m.scrap_price,
          latest_effective_date: effectiveDate,
        }
      : m
  );

  return newHist;
}

export async function updatePriceHistoryItem(historyId: string, updates: Partial<MaterialPriceHistory>): Promise<void> {
  INITIAL_PRICE_HISTORY = INITIAL_PRICE_HISTORY.map((h) =>
    h.id === historyId ? { ...h, ...updates } : h
  );
}

export async function deletePriceHistoryItem(historyId: string): Promise<void> {
  INITIAL_PRICE_HISTORY = INITIAL_PRICE_HISTORY.filter((h) => h.id !== historyId);
}

export async function fetchCastingGrades(): Promise<CastingGrade[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('casting_grades').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as CastingGrade[];
      }
    } catch (err) {
      console.warn('Fallback to local casting grades:', err);
    }
  }
  return INITIAL_CASTING_GRADES;
}

export async function fetchCastingBomItems(gradeId?: string): Promise<CastingBomItem[]> {
  const materials = await fetchMaterials();
  const rawItems = gradeId
    ? INITIAL_BOM_ITEMS.filter((b) => b.casting_grade_id === gradeId)
    : INITIAL_BOM_ITEMS;

  return rawItems.map((item) => ({
    ...item,
    material: materials.find((m) => m.id === item.material_id),
  }));
}

export async function addBomItem(
  gradeId: string,
  materialId: string,
  weightKg: number,
  isReturnScrap: boolean
): Promise<CastingBomItem> {
  const materials = await fetchMaterials();
  const newItem: CastingBomItem = {
    id: `bom-${Date.now()}`,
    casting_grade_id: gradeId,
    material_id: materialId,
    weight_kg: weightKg,
    is_return_scrap: isReturnScrap,
    material: materials.find((m) => m.id === materialId),
  };
  INITIAL_BOM_ITEMS.push(newItem);
  return newItem;
}

export async function updateBomItem(
  itemId: string,
  updates: Partial<CastingBomItem>
): Promise<void> {
  INITIAL_BOM_ITEMS = INITIAL_BOM_ITEMS.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
}

export async function deleteBomItem(itemId: string): Promise<void> {
  INITIAL_BOM_ITEMS = INITIAL_BOM_ITEMS.filter((item) => item.id !== itemId);
}

export async function fetchPressingRates(): Promise<PressingMachineRate[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('pressing_machine_rates').select('*').order('tonnage_min', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as PressingMachineRate[];
      }
    } catch (err) {
      console.warn('Fallback to local pressing rates:', err);
    }
  }
  return INITIAL_PRESSING_RATES;
}

export async function fetchHammerRates(): Promise<HydraulicHammerRate[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('hydraulic_hammer_rates').select('*').order('energy_min', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as HydraulicHammerRate[];
      }
    } catch (err) {
      console.warn('Fallback to local hammer rates:', err);
    }
  }
  return INITIAL_HAMMER_RATES;
}

export async function fetchSystemUnitRates(): Promise<SystemUnitRate[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('system_unit_rates').select('*');
      if (!error && data && data.length > 0) {
        return data as SystemUnitRate[];
      }
    } catch (err) {
      console.warn('Fallback to local system unit rates:', err);
    }
  }
  return INITIAL_SYSTEM_RATES;
}
