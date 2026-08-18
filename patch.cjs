const fs = require('fs');

let content = fs.readFileSync('temp.ts', 'utf8');

content = content.replace(
  /(export async function saveMaterial\(material: Partial<Material>\): Promise<Material> \{[\s\S]*?)(  return newMaterial;\n\})/,
  "$1  await logAudit(material.id ? 'UPDATE_MATERIAL' : 'CREATE_MATERIAL', 'materials', newMaterial.id, { name: newMaterial.material_name });\n$2"
);

content = content.replace(
  /(export async function deleteMaterials\(ids: string\[\])(\): Promise<void> \{[\s\S]*?)(  \}\n\})/,
  "$1, names?: string[]$2    await logAudit('DELETE_MATERIAL', 'materials', undefined, { count: ids.length, names: names || [] });\n$3"
);

content = content.replace(
  /(export async function deletePriceHistoryItem\(historyId: string)(\): Promise<void> \{[\s\S]*?)(  \}\n\})/,
  "$1, materialName?: string$2    await logAudit('DELETE_MATERIAL_PRICE_HISTORY', 'material_price_history', historyId, { material_name: materialName || 'N/A' });\n$3"
);

content = content.replace(
  /(export async function addBomItem\(gradeId: string, item: Partial<CastingBomItem>)(\): Promise<CastingBomItem> \{[\s\S]*?)(  return newItem;\n\})/,
  "$1, gradeName?: string$2  await logAudit('CREATE_BOM', 'casting_bom_items', newItem.id, { material_name: newItem.material_name, grade_name: gradeName || 'N/A' });\n$3"
);

content = content.replace(
  /(export async function updateBomItem\(itemId: string, updates: Partial<CastingBomItem>)(\): Promise<void> \{[\s\S]*?)(  \}\n\})/,
  "$1, gradeName?: string$2    await logAudit('UPDATE_BOM', 'casting_bom_items', itemId, { material_name: updates.material_name || 'N/A', grade_name: gradeName || 'N/A' });\n$3"
);

content = content.replace(
  /(export async function updatePressingRate\(id: string, ratePerHour: number)(\): Promise<void> \{[\s\S]*?)(  \}\n)(  localPressingRates =)/,
  "$1, label?: string$2$3  await logAudit('UPDATE_PRESS_RATE', 'pressing_machine_rates', id, { label: label || 'Máy dập', rate_per_hour: ratePerHour });\n$4"
);

content = content.replace(
  /(export async function updateHammerRate\(id: string, ratePerHour: number)(\): Promise<void> \{[\s\S]*?)(  \}\n)(  localHammerRates =)/,
  "$1, label?: string$2$3  await logAudit('UPDATE_HAMMER_RATE', 'hydraulic_hammer_rates', id, { label: label || 'Máy búa', rate_per_hour: ratePerHour });\n$4"
);

content = content.replace(
  /(export async function updateSystemUnitRate\(rateId: string, newValue: number)(\): Promise<void> \{[\s\S]*?)(  \}\n)(  localSystemRates =)/,
  "$1, rateName?: string$2$3  await logAudit('UPDATE_SYSTEM_RATE', 'system_unit_rates', rateId, { rate_name: rateName || 'Đơn giá', new_value: newValue });\n$4"
);

content = content.replace(
  /(export async function saveCastingSettings\(settings: Partial<CastingFactorySettings>\): Promise<CastingFactorySettings> \{[\s\S]*?)(  return localCastingSettings;\n\})/,
  "$1  await logAudit('UPDATE_CASTING_SETTINGS', 'casting_factory_settings', '1');\n$2"
);

content = content.replace(
  /(export async function saveMoldingRecipeItem\(item: Partial<MoldingRecipeItem>\): Promise<MoldingRecipeItem> \{[\s\S]*?)(  return newItem;\n\})/,
  "$1  await logAudit(item.id ? 'UPDATE_MOLDING_RECIPE' : 'CREATE_MOLDING_RECIPE', 'casting_molding_recipes', newItem.id, { material_name: newItem.material_name });\n$2"
);

content = content.replace(
  /(export async function deleteMoldingRecipeItem\(itemId: string)(\): Promise<void> \{[\s\S]*?)(  \}\n)(  localMoldingRecipe =)/,
  "$1, materialName?: string$2$3  await logAudit('DELETE_MOLDING_RECIPE', 'casting_molding_recipes', itemId, { material_name: materialName || 'N/A' });\n$4"
);

fs.writeFileSync('src/lib/master-data-service.ts', content, 'utf8');
