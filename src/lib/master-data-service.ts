import { supabase } from './supabase';
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
// INITIAL SEED MOCK DATA (Fallback khi fetch lần đầu nếu DB hoàn toàn mới)
// ----------------------------------------------------------------------

export const INITIAL_MATERIALS: Material[] = [
  { id: 'mat-1', name: 'Gang thỏi F1', unit: 'kg', category: 'Gang thỏi', notes: 'Nhập khẩu chất lượng cao', latest_price: 15500, latest_effective_date: '2026-01-01' },
  { id: 'mat-2', name: 'Thép phế đúc chọn lọc', unit: 'kg', category: 'Thép phế đúc', notes: 'Hao hụt thấp', latest_price: 11800, latest_effective_date: '2026-01-01' },
  { id: 'mat-3', name: 'Hồi liệu FCD450', unit: 'kg', category: 'Hồi liệu', notes: 'Hồi liệu đúc nội bộ FCD450', latest_price: 10000, latest_effective_date: '2026-01-01' },
  { id: 'mat-4', name: 'Hồi liệu FC250', unit: 'kg', category: 'Hồi liệu', notes: 'Hồi liệu đúc nội bộ FC250', latest_price: 9500, latest_effective_date: '2026-01-01' },
  { id: 'mat-5', name: 'Fe-Si 75 (Hợp kim sắt silic)', unit: 'kg', category: 'Fe-Si', notes: 'Chất biến tính đúc gang', latest_price: 42000, latest_effective_date: '2026-01-01' },
  { id: 'mat-6', name: 'S45C - JFE (Nhật Bản)', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 8500, notes: 'Thép phôi rèn chuẩn JFE Nhật', latest_price: 22000, latest_effective_date: '2026-01-01' },
  { id: 'mat-7', name: '40Cr - Baosteel (Trung Quốc)', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 7800, notes: 'Thép hợp kim niken-crom rèn', latest_price: 24500, latest_effective_date: '2026-01-01' },
  { id: 'mat-8', name: '20CrMnTi - HBIS', unit: 'kg', category: 'Thép cán - Rèn', scrap_price: 8000, notes: 'Thép thấm cacbon bánh răng', latest_price: 26000, latest_effective_date: '2026-01-01' },
];

export const INITIAL_PRICE_HISTORY: MaterialPriceHistory[] = [
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

export const INITIAL_BOM_ITEMS: CastingBomItem[] = [
  { id: 'bom-1', casting_grade_id: 'grade-1', material_id: 'mat-1', weight_kg: 350, is_return_scrap: false },
  { id: 'bom-2', casting_grade_id: 'grade-1', material_id: 'mat-2', weight_kg: 250, is_return_scrap: false },
  { id: 'bom-3', casting_grade_id: 'grade-1', material_id: 'mat-3', weight_kg: 380, is_return_scrap: true },
  { id: 'bom-4', casting_grade_id: 'grade-1', material_id: 'mat-5', weight_kg: 20, is_return_scrap: false },
  { id: 'bom-5', casting_grade_id: 'grade-2', material_id: 'mat-1', weight_kg: 300, is_return_scrap: false },
  { id: 'bom-6', casting_grade_id: 'grade-2', material_id: 'mat-2', weight_kg: 280, is_return_scrap: false },
  { id: 'bom-7', casting_grade_id: 'grade-2', material_id: 'mat-4', weight_kg: 400, is_return_scrap: true },
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

// In-memory local caches used for fast rendering, strictly synced with Supabase
let localMaterials = [...INITIAL_MATERIALS];
let localPriceHistory = [...INITIAL_PRICE_HISTORY];
let localCastingGrades = [...INITIAL_CASTING_GRADES];
let localBomItems = [...INITIAL_BOM_ITEMS];
let localPressingRates = [...INITIAL_PRESSING_RATES];
let localHammerRates = [...INITIAL_HAMMER_RATES];
let localSystemRates = [...INITIAL_SYSTEM_RATES];

// ----------------------------------------------------------------------
// SERVICE FUNCTIONS (STRICT SUPABASE PERSISTENCE)
// ----------------------------------------------------------------------

export async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Fetching materials from Supabase failed, using cache:', error.message);
    return localMaterials;
  }
  if (data) {
    localMaterials = data as Material[];
    return localMaterials;
  }
  return localMaterials;
}

export async function saveMaterial(mat: Partial<Material>): Promise<Material> {
  if (mat.id) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        name: mat.name,
        category: mat.category,
        unit: mat.unit,
        scrap_price: mat.scrap_price,
        notes: mat.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mat.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Lỗi cập nhật vật tư Supabase: ${error.message}`);
    }
    await fetchMaterials();
    return data as Material;
  } else {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        name: mat.name || 'Vật tư mới',
        category: mat.category || 'Gang thỏi',
        unit: mat.unit || 'kg',
        scrap_price: mat.scrap_price || 0,
        notes: mat.notes || '',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Lỗi thêm vật tư Supabase: ${error.message}`);
    }
    await fetchMaterials();
    return data as Material;
  }
}

export async function deleteMaterials(ids: string[]): Promise<void> {
  const { error } = await supabase.from('materials').delete().in('id', ids);
  if (error) {
    throw new Error(`Lỗi xóa vật tư Supabase: ${error.message}`);
  }
  await fetchMaterials();
}

export async function fetchMaterialPriceHistory(materialId?: string): Promise<MaterialPriceHistory[]> {
  return fetchPriceHistory(materialId);
}

export async function fetchPriceHistory(materialId?: string): Promise<MaterialPriceHistory[]> {
  let query = supabase.from('material_price_history').select('*').order('effective_date', { ascending: false });
  if (materialId) query = query.eq('material_id', materialId);
  const { data, error } = await query;
  if (error) {
    console.warn('Fetching price history from Supabase failed, using cache:', error.message);
    return materialId ? localPriceHistory.filter((p) => p.material_id === materialId) : localPriceHistory;
  }
  if (data) {
    localPriceHistory = data as MaterialPriceHistory[];
    return localPriceHistory;
  }
  return localPriceHistory;
}

export async function addMaterialPrice(
  materialId: string,
  price: number,
  effectiveDate: string,
  scrapPrice?: number,
  userEmail: string = 'estimator@disoco.vn'
): Promise<MaterialPriceHistory> {
  const { data, error } = await supabase
    .from('material_price_history')
    .insert({
      material_id: materialId,
      price,
      scrap_price: scrapPrice || 0,
      effective_date: effectiveDate,
      updated_by: userEmail,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi thêm lịch sử giá Supabase: ${error.message}`);
  }

  // Sync latest price in materials table
  await supabase
    .from('materials')
    .update({
      latest_price: price,
      scrap_price: scrapPrice,
      latest_effective_date: effectiveDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId);

  await fetchMaterials();
  await fetchPriceHistory();
  return data as MaterialPriceHistory;
}

export async function updatePriceHistoryItem(historyId: string, updates: Partial<MaterialPriceHistory>): Promise<void> {
  const { error } = await supabase.from('material_price_history').update(updates).eq('id', historyId);
  if (error) {
    throw new Error(`Lỗi cập nhật lịch sử giá Supabase: ${error.message}`);
  }
  await fetchPriceHistory();
}

export async function deletePriceHistoryItem(historyId: string): Promise<void> {
  const { error } = await supabase.from('material_price_history').delete().eq('id', historyId);
  if (error) {
    throw new Error(`Lỗi xóa lịch sử giá Supabase: ${error.message}`);
  }
  await fetchPriceHistory();
}

export async function fetchCastingGrades(): Promise<CastingGrade[]> {
  const { data, error } = await supabase.from('casting_grades').select('*').order('name', { ascending: true });
  if (error) {
    console.warn('Fetching casting grades from Supabase failed, using cache:', error.message);
    return localCastingGrades;
  }
  if (data) {
    localCastingGrades = data as CastingGrade[];
    return localCastingGrades;
  }
  return localCastingGrades;
}

export async function saveCastingGrade(grade: Partial<CastingGrade>): Promise<CastingGrade> {
  if (grade.id) {
    const { data, error } = await supabase
      .from('casting_grades')
      .update({ name: grade.name, code: grade.code, notes: grade.notes })
      .eq('id', grade.id)
      .select()
      .single();
    if (error) throw new Error(`Lỗi cập nhật Mác gang Supabase: ${error.message}`);
    await fetchCastingGrades();
    return data as CastingGrade;
  } else {
    const { data, error } = await supabase
      .from('casting_grades')
      .insert({ name: grade.name || 'Mác gang mới', code: grade.code || '', notes: grade.notes || '' })
      .select()
      .single();
    if (error) throw new Error(`Lỗi thêm Mác gang Supabase: ${error.message}`);
    await fetchCastingGrades();
    return data as CastingGrade;
  }
}

export async function fetchCastingBomItems(gradeId?: string): Promise<CastingBomItem[]> {
  let query = supabase.from('casting_bom_items').select('*');
  if (gradeId) query = query.eq('casting_grade_id', gradeId);
  const { data, error } = await query;
  if (error) {
    console.warn('Fetching BOM items from Supabase failed, using cache:', error.message);
    const materials = await fetchMaterials();
    return localBomItems.map((b) => ({ ...b, material: materials.find((m) => m.id === b.material_id) }));
  }
  if (data) {
    const materials = await fetchMaterials();
    return (data as CastingBomItem[]).map((b) => ({
      ...b,
      material: materials.find((m) => m.id === b.material_id),
    }));
  }
  return localBomItems;
}

export async function addBomItem(
  gradeId: string,
  materialId: string,
  weightKg: number,
  isReturnScrap: boolean
): Promise<CastingBomItem> {
  const { data, error } = await supabase
    .from('casting_bom_items')
    .insert({
      casting_grade_id: gradeId,
      material_id: materialId,
      weight_kg: weightKg,
      is_return_scrap: isReturnScrap,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi thêm BOM item Supabase: ${error.message}`);
  }
  const materials = await fetchMaterials();
  return { ...data, material: materials.find((m) => m.id === materialId) } as CastingBomItem;
}

export async function updateBomItem(
  itemId: string,
  updates: Partial<CastingBomItem>
): Promise<void> {
  const { error } = await supabase.from('casting_bom_items').update(updates).eq('id', itemId);
  if (error) {
    throw new Error(`Lỗi cập nhật BOM item Supabase: ${error.message}`);
  }
}

export async function deleteBomItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('casting_bom_items').delete().eq('id', itemId);
  if (error) {
    throw new Error(`Lỗi xóa BOM item Supabase: ${error.message}`);
  }
}

export async function fetchPressingRates(): Promise<PressingMachineRate[]> {
  const { data, error } = await supabase.from('pressing_machine_rates').select('*').order('tonnage_min', { ascending: true });
  if (error) {
    return localPressingRates;
  }
  if (data && data.length > 0) {
    localPressingRates = data as PressingMachineRate[];
  }
  return localPressingRates;
}

export async function fetchHammerRates(): Promise<HydraulicHammerRate[]> {
  const { data, error } = await supabase.from('hydraulic_hammer_rates').select('*').order('energy_min', { ascending: true });
  if (error) {
    return localHammerRates;
  }
  if (data && data.length > 0) {
    localHammerRates = data as HydraulicHammerRate[];
  }
  return localHammerRates;
}

export async function fetchSystemUnitRates(): Promise<SystemUnitRate[]> {
  const { data, error } = await supabase.from('system_unit_rates').select('*');
  if (error) {
    return localSystemRates;
  }
  if (data && data.length > 0) {
    localSystemRates = data as SystemUnitRate[];
  }
  return localSystemRates;
}

export async function updateSystemUnitRate(rateId: string, newValue: number): Promise<void> {
  const { error } = await supabase.from('system_unit_rates').update({ value: newValue, updated_at: new Date().toISOString() }).eq('id', rateId);
  if (error) {
    throw new Error(`Lỗi cập nhật Đơn giá hệ thống Supabase: ${error.message}`);
  }
}
