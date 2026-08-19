export const NEW_MATERIAL_CATEGORIES = [
  'VT đúc (chính)',
  'VT đúc (phụ)',
  'VT làm khuôn & Lõi',
  'Vật liệu làm khuôn mẫu',
  'VT hoàn thiện',
  'Thép carbon',
  'Thép hợp kim',
  'Thép không gỉ',
  'Hồi liệu'
];

export const STEEL_CATEGORIES = [
  'Thép cán - Rèn',
  'Thép carbon',
  'Thép hợp kim',
  'Thép không gỉ'
];

export const isSteelCategory = (category?: string) => {
  if (!category) return false;
  return STEEL_CATEGORIES.includes(category);
};
