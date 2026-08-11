import type { TechnologyRequirementType } from '../types/quote';

export const TECH_FAMILY_MAP: Record<TechnologyRequirementType, string> = {
  'Phôi rèn': 'forging',
  'Rèn+Gia công': 'forging',
  'Phôi đúc': 'casting',
  'Đúc+Gia công': 'casting',
  'Phôi cưa': 'sawing',
  'Phôi cưa+Gia công': 'sawing',
  'Chỉ gia công CNC': 'machining',
};

export const getTechFamily = (tech?: TechnologyRequirementType): string =>
  tech ? (TECH_FAMILY_MAP[tech] ?? 'unspecified') : 'unspecified';
