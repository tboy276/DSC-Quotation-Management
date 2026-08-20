export const REQUIRED_FIELDS_FOR_SAVE: Record<string, Array<{ key: string; label: string; condition?: (inp: any) => boolean }>> = {
  forging: [
    { key: 'm_chi', label: 'Trọng lượng chi (m_chi)' },
    { key: 'm_phoi', label: 'Trọng lượng phôi rèn (m_phoi)' },
    { key: 'm_tinh', label: 'Trọng lượng tinh (m_tinh)', condition: (inp) => !!inp.use_m_tinh },
  ],
  sawing: [
    { key: 'm_chi', label: 'Trọng lượng chi (m_chi)' },
    { key: 'm_phoi', label: 'Trọng lượng phôi cắt (m_phoi)' },
    { key: 'm_tinh', label: 'Trọng lượng tinh (m_tinh)', condition: (inp) => !!inp.use_m_tinh },
  ],
  casting: [
    { key: 'm_cast', label: 'Khối lượng vật đúc (m_cast)' },
    { key: 'Y_yield', label: 'Tỷ lệ thu hồi kim loại (Y_yield)' },
    { key: 'm_core', label: 'Khối lượng cát ruột (m_core)' },
  ],
  machining: [
    { key: 'm_tinh', label: 'Trọng lượng tinh (m_tinh)' },
  ],
};

export function getMissingRequiredFields(segment: string, inp: any): string[] {
  const rules = REQUIRED_FIELDS_FOR_SAVE[segment] || [];
  return rules
    .filter((r) => (r.condition ? r.condition(inp) : true))
    .filter((r) => !inp[r.key] || Number(inp[r.key]) === 0)
    .map((r) => r.label);
}