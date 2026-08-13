import { supabase } from './supabase';
import { calculateLiquidMetalPrice } from './calculation-engine/liquid-metal-calculator';
import type {
  Material,
  MaterialPriceHistory,
  CastingGrade,
  CastingBomItem,
  PressingMachineRate,
  HydraulicHammerRate,
  SystemUnitRate,
  MoldingRecipeItem,
  CastingFactorySettings,
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
  { id: 'mat-9', name: 'Điện năng', unit: 'kWh', category: 'Năng lượng', scrap_price: 0, notes: 'Đơn giá điện năng chung', latest_price: 2200, latest_effective_date: '2026-01-01' },
];

export const INITIAL_PRICE_HISTORY: MaterialPriceHistory[] = [
  { id: 'ph-1', material_id: 'mat-1', price: 15000, effective_date: '2025-06-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-2', material_id: 'mat-1', price: 15500, effective_date: '2026-01-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-3', material_id: 'mat-6', price: 21000, scrap_price: 8000, effective_date: '2025-09-01', updated_by: 'estimator@disoco.vn' },
  { id: 'ph-4', material_id: 'mat-6', price: 22000, scrap_price: 8500, effective_date: '2026-01-01', updated_by: 'estimator@disoco.vn' },
];

export const INITIAL_CASTING_GRADES: CastingGrade[] = [
  { id: '6ca47b3e-313e-442a-8b5b-f71e0e6e3688', name: 'FCD450-10', code: 'FCD450-10', notes: 'Mác gang cầu FCD 450-10 theo tiêu chuẩn DISOCO' },
  { id: '1e630083-0215-4d58-ae7e-2dc1dbccc65b', name: 'FCD600-3', code: 'FCD600-3', notes: 'Mác gang cầu FCD 600-3 theo tiêu chuẩn DISOCO' },
  { id: '890b6849-f35a-4412-b9cc-5740230d7e40', name: 'FCD700-2', code: 'FCD700-2', notes: 'Mác gang cầu FCD 700-2 theo tiêu chuẩn DISOCO' },
  { id: 'fc200000-0000-4000-a000-000000000200', name: 'FC200 (Gang Xám)', code: 'FC200', notes: 'Mác gang xám FC200 theo tiêu chuẩn DISOCO (BOM 1000kg)' },
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
  { id: 'pr-1', name: 'Máy Dập 1000 Tấn (1000T)', tonnage_min: 1000, tonnage_max: 1000, rate_per_hour: 1200000 },
  { id: 'pr-2', name: 'Máy Dập 1600 Tấn (1600T)', tonnage_min: 1600, tonnage_max: 1600, rate_per_hour: 1800000 },
];

export const INITIAL_HAMMER_RATES: HydraulicHammerRate[] = [
  { id: 'hr-1', name: 'Máy Búa 63 kJ', energy_min: 63, energy_max: 63, rate_per_hour: 1500000 },
  { id: 'hr-2', name: 'Máy Búa 80 kJ', energy_min: 80, energy_max: 80, rate_per_hour: 2200000 },
];

export const INITIAL_SYSTEM_RATES: SystemUnitRate[] = [
  // 1. Nhóm Thiết Bị Rèn & Cắt Phôi Đầu Vào
  { id: 'sr-saw', rate_key: 'sawing_machine', rate_name: 'Máy cưa vòng', category: 'Rèn', unit: 'VNĐ/giờ', value: 120000, description: 'Cắt phôi thép cây đầu vào' },
  { id: 'sr-trim', rate_key: 'trimming_machine', rate_name: 'Máy cắt đột', category: 'Rèn', unit: 'VNĐ/giờ', value: 180000, description: 'Cắt phôi thép đầu vào' },

  // 2. Nhóm Thiết Bị Gia Công Cơ Khí (CNC)
  { id: 'sr-cnc-1', rate_key: 'cnc_type_1', rate_name: 'Loại I: Trung tâm gia công tổ hợp, ngang, đứng', category: 'CNC', unit: 'VNĐ/giờ', value: 390000, description: 'Trung tâm gia công tổ hợp, trung tâm ngang, trung tâm đứng (6.500 đ/phút)' },
  { id: 'sr-cnc-2', rate_key: 'cnc_type_2', rate_name: 'Loại II: Máy tiện đứng, máy phay 3 trục,...', category: 'CNC', unit: 'VNĐ/giờ', value: 338000, description: 'Máy tiện đứng, máy phay 3 trục,... (5.633 đ/phút)' },
  { id: 'sr-cnc-3', rate_key: 'cnc_type_3', rate_name: 'Loại III: Máy tiện, máy phay CNC', category: 'CNC', unit: 'VNĐ/giờ', value: 234000, description: 'Máy tiện CNC, máy phay CNC tiêu chuẩn (3.900 đ/phút)' },
  { id: 'sr-cnc-4', rate_key: 'cnc_type_4', rate_name: 'Loại IV: Máy khoan cần, máy gia công cũ,..', category: 'CNC', unit: 'VNĐ/giờ', value: 182000, description: 'Máy khoan cần, máy gia công cũ,.. (3.033 đ/phút)' },
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

export async function updatePressingRate(id: string, ratePerHour: number): Promise<void> {
  const { error } = await supabase.from('pressing_machine_rates').update({ rate_per_hour: ratePerHour }).eq('id', id);
  if (error) {
    throw new Error(`Lỗi cập nhật máy dập: ${error.message}`);
  }
  localPressingRates = localPressingRates.map((r) => (r.id === id ? { ...r, rate_per_hour: ratePerHour } : r));
}

export async function updateHammerRate(id: string, ratePerHour: number): Promise<void> {
  const { error } = await supabase.from('hydraulic_hammer_rates').update({ rate_per_hour: ratePerHour }).eq('id', id);
  if (error) {
    throw new Error(`Lỗi cập nhật máy búa: ${error.message}`);
  }
  localHammerRates = localHammerRates.map((r) => (r.id === id ? { ...r, rate_per_hour: ratePerHour } : r));
}

export async function updateSystemUnitRate(rateId: string, newValue: number): Promise<void> {
  const { error } = await supabase.from('system_unit_rates').update({ value: newValue, updated_at: new Date().toISOString() }).eq('id', rateId);
  if (error) {
    throw new Error(`Lỗi cập nhật đơn giá hệ thống: ${error.message}`);
  }
  localSystemRates = localSystemRates.map((r) => (r.id === rateId ? { ...r, value: newValue, updated_at: new Date().toISOString() } : r));
}

// ----------------------------------------------------------------------
// CASTING FACTORY SETTINGS & MOLDING RECIPE (CÔNG THỨC VẬT TƯ KHUÔN & LÓT LÒ/GẦU)
// ----------------------------------------------------------------------

let localCastingSettings: CastingFactorySettings = {
  furnace_lining_cost: 50000000,
  furnace_lifespan_batches: 500,
  ladle_lining_cost: 3000000,
  ladle_lifespan_batches: 150,
  resin_core_sand_rate_per_kg: 12500,
  finishing_material_rate: 771.82,
  utility_rate: 3687.6,
  labor_rate: 2461,
  workshop_mgmt_rate: 0,
  equipment_depreciation_rate: 4000,
};

let localMoldingRecipe: MoldingRecipeItem[] = [
  {
    id: 'rec-1',
    material_name: 'Bột đất sét',
    unit: 'kg',
    category: 'Vật tư khuôn',
    quantity_per_1000kg: 50,
    unit_price: 13900,
    is_outsourced: false,
    outsourced_cost_per_1000kg: 0,
    notes: 'Bột đất sét bentonite chuẩn xưởng đúc',
  },
  {
    id: 'rec-2',
    material_name: 'Cát đúc',
    unit: 'kg',
    category: 'Vật tư khuôn',
    quantity_per_1000kg: 300,
    unit_price: 1560,
    is_outsourced: false,
    outsourced_cost_per_1000kg: 0,
    notes: 'Cát đúc thạch anh mịn',
  },
  {
    id: 'rec-3',
    material_name: 'Sơn khuôn',
    unit: 'kg',
    category: 'Vật tư khuôn',
    quantity_per_1000kg: 4,
    unit_price: 34800,
    is_outsourced: false,
    outsourced_cost_per_1000kg: 0,
    notes: 'Sơn chịu nhiệt chịu áp suất',
  },
];

export async function fetchLiquidMetalPriceForGrade(gradeId: string) {
  const [bomItems, materials, priceHistory] = await Promise.all([
    fetchCastingBomItems(gradeId),
    fetchMaterials(),
    fetchPriceHistory(),
  ]);
  return calculateLiquidMetalPrice(gradeId, bomItems, priceHistory, materials);
}

export async function fetchCastingSettings(): Promise<CastingFactorySettings> {
  try {
    const { data } = await supabase.from('casting_factory_settings').select('*').maybeSingle();
    if (data) {
      localCastingSettings = { ...localCastingSettings, ...data };
    }
  } catch (e) {
    // Graceful fallback to localCastingSettings
  }
  return localCastingSettings;
}

export async function saveCastingSettings(settings: Partial<CastingFactorySettings>): Promise<CastingFactorySettings> {
  const { error } = await supabase.from('casting_factory_settings').upsert({ id: 1, ...localCastingSettings, ...settings });
  if (error) {
    throw new Error(`Lỗi lưu thiết lập đúc: ${error.message}`);
  }
  localCastingSettings = { ...localCastingSettings, ...settings };
  return localCastingSettings;
}

export async function fetchMoldingRecipe(): Promise<MoldingRecipeItem[]> {
  try {
    const { data } = await supabase.from('casting_molding_recipes').select('*');
    if (data && data.length > 0) {
      localMoldingRecipe = data as MoldingRecipeItem[];
    }
  } catch (e) {
    // Graceful fallback to localMoldingRecipe
  }
  return localMoldingRecipe;
}

export async function saveMoldingRecipeItem(item: Partial<MoldingRecipeItem>): Promise<MoldingRecipeItem> {
  let newItem: MoldingRecipeItem;
  if (item.id) {
    const existing = localMoldingRecipe.find((r) => r.id === item.id);
    newItem = { ...existing, ...item } as MoldingRecipeItem;
  } else {
    newItem = {
      id: `rec-${Date.now()}`,
      material_name: item.material_name || 'Vật tư khuôn mới',
      unit: item.unit || 'kg',
      category: item.category || 'Vật tư khuôn',
      quantity_per_1000kg: item.quantity_per_1000kg || 0,
      unit_price: item.unit_price || 0,
      is_outsourced: !!item.is_outsourced,
      outsourced_cost_per_1000kg: item.outsourced_cost_per_1000kg || 0,
      notes: item.notes || '',
    };
  }

  const { error } = await supabase.from('casting_molding_recipes').upsert(newItem);
  if (error) {
    throw new Error(`Lỗi lưu công thức khuôn: ${error.message}`);
  }

  if (item.id) {
    const idx = localMoldingRecipe.findIndex((r) => r.id === item.id);
    if (idx >= 0) localMoldingRecipe[idx] = newItem;
  } else {
    localMoldingRecipe.push(newItem);
  }

  return newItem;
}

export async function deleteMoldingRecipeItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('casting_molding_recipes').delete().eq('id', itemId);
  if (error) {
    throw new Error(`Lỗi xóa vật tư khuôn: ${error.message}`);
  }
  localMoldingRecipe = localMoldingRecipe.filter((r) => r.id !== itemId);
}

export function getMoldingRecipeTotalCost1000kg(items: MoldingRecipeItem[] = localMoldingRecipe): number {
  return items.reduce((sum, item) => {
    if (item.is_outsourced) {
      return sum + (item.outsourced_cost_per_1000kg || 0);
    }
    return sum + (item.quantity_per_1000kg || 0) * (item.unit_price || 0);
  }, 0);
}

export function getFurnaceLadleCostPer1000kg(settings: CastingFactorySettings = localCastingSettings): number {
  const fCost = settings.furnace_lifespan_batches > 0
    ? settings.furnace_lining_cost / settings.furnace_lifespan_batches
    : 0;
  const lCost = settings.ladle_lifespan_batches > 0
    ? settings.ladle_lining_cost / settings.ladle_lifespan_batches
    : 0;
  return fCost + lCost;
}
