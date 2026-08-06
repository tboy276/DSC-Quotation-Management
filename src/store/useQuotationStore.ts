import { create } from 'zustand';
import type { ForgingInput, CastingInput, MachiningOperation } from '../lib/calculation-engine/types';
import type { CurrencyType, QuoteRecord } from '../types/quote';
import { calculateForgingPrice } from '../lib/calculation-engine/forging-calculator';
import { calculateCastingPrice } from '../lib/calculation-engine/casting-calculator';
import { calculateLiquidMetalPrice } from '../lib/calculation-engine/liquid-metal-calculator';
import {
  INITIAL_MATERIALS,
  INITIAL_PRICE_HISTORY,
  INITIAL_CASTING_GRADES,
  INITIAL_BOM_ITEMS,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
  INITIAL_SYSTEM_RATES,
  fetchLiquidMetalPriceForGrade,
} from '../lib/master-data-service';

export type SegmentType = 'forging' | 'casting';
export type TradeTermType = 'EXW' | 'FOB' | 'CIF' | 'DAP';

export interface RfqHeaderState {
  customer_name: string;
  product_name: string;
  annual_volume: number;
  trade_terms: TradeTermType;
  target_price: number;
}

export interface QuotationStoreState {
  // 1. RFQ Header Info & Currency Settings
  rfq: RfqHeaderState;
  activeRfqItemId: string | null;
  segment: SegmentType;
  currency: CurrencyType;
  exchange_rate: number;

  // 2. Forging State
  forgingInput: ForgingInput & {
    selected_material_id: string;
    selected_press_rate_id: string;
    selected_hammer_rate_id: string;
  };

  // 3. Casting State
  castingInput: CastingInput & {
    selected_casting_grade_id: string;
  };

  // Actions
  setRfqField: (field: keyof RfqHeaderState, value: any) => void;
  setActiveRfqItemId: (id: string | null) => void;
  resetRfq: () => void;
  setSegment: (segment: SegmentType) => void;
  setCurrency: (currency: CurrencyType) => void;
  setExchangeRate: (rate: number) => void;
  cloneInputsFromQuote: (quote: QuoteRecord) => void;

  // Forging Actions
  setForgingField: (field: string, value: any) => void;
  addForgingMachiningOp: (op: MachiningOperation) => void;
  updateForgingMachiningOp: (index: number, op: MachiningOperation) => void;
  removeForgingMachiningOp: (index: number) => void;
  addForgingDieComponent: (comp: any) => void;
  updateForgingDieComponent: (index: number, comp: any) => void;
  removeForgingDieComponent: (index: number) => void;
  selectForgingMaterial: (materialId: string) => void;
  selectForgingMachineRate: (rateId: string, type: 'press' | 'hammer') => void;

  // Casting Actions
  setCastingField: (field: string, value: any) => void;
  addCastingMachiningOp: (op: MachiningOperation) => void;
  updateCastingMachiningOp: (index: number, op: MachiningOperation) => void;
  removeCastingMachiningOp: (index: number) => void;
  addCastingPatternComponent: (comp: any) => void;
  updateCastingPatternComponent: (index: number, comp: any) => void;
  removeCastingPatternComponent: (index: number) => void;
  selectCastingGrade: (gradeId: string) => void;

  // Computed Getters
  getForgingResult: () => ReturnType<typeof calculateForgingPrice>;
  getCastingResult: () => ReturnType<typeof calculateCastingPrice>;
}

// Initial Forging Defaults
const defaultForgingMaterial = INITIAL_MATERIALS.find((m) => m.category === 'Thép cán - Rèn') || INITIAL_MATERIALS[5];
const defaultPressRate = INITIAL_PRESSING_RATES[0]; // 1000T (1.200.000 đ/h)
const defaultSawingRate = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === 'sawing_machine')?.value || 120000;
const defaultTrimmingRate = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === 'trimming_machine')?.value || 180000;
const defaultElecRate = 2200;
const defaultTransRate = 1500;

// Initial Casting Defaults
const defaultCastingGrade = INITIAL_CASTING_GRADES[0]; // FCD450

const DEFAULT_EXCHANGE_RATES: Record<CurrencyType, number> = {
  VND: 1,
  USD: 25400,
  JPY: 165,
  EUR: 27500,
};

export const useQuotationStore = create<QuotationStoreState>((set, get) => ({
  // 1. RFQ Initial State
  rfq: {
    customer_name: 'Công ty Cổ phần Cơ khí DISOCO',
    product_name: 'Bánh Răng Truyền Động D450',
    annual_volume: 12000,
    trade_terms: 'FOB',
    target_price: 95000,
  },
  activeRfqItemId: null,
  segment: 'forging',
  currency: 'VND',
  exchange_rate: 1,

  // 2. Forging Initial Input State
  forgingInput: {
    m_phoi: 1.2,
    m_chi: 1.531,
    k_loss: 5.0,
    k_mgmt_mat: 0,
    use_m_tinh: false,
    selected_material_id: defaultForgingMaterial.id,
    DG_steel: defaultForgingMaterial.latest_price || 22000,
    DG_scrap: defaultForgingMaterial.scrap_price || 8000,

    forging_machine_type: 'press',
    selected_press_rate_id: defaultPressRate.id,
    selected_hammer_rate_id: INITIAL_HAMMER_RATES[0].id,
    DG_forging_machine_hour: defaultPressRate.rate_per_hour,

    t_cut_sec: 15,
    DG_sawing_machine_hour: defaultSawingRate,
    w_elec_kwh_per_kg: 0.45,
    DG_elec_kwh: defaultElecRate,
    t_forging_sec: 12,
    t_trim_sec: 8,
    DG_trim_machine_hour: defaultTrimmingRate,
    DG_heat_treat_kg: 4500,
    DG_clean_kg: 1200,

    machining_operations: [
      { name: 'Tiện thô CNC mặt đầu & đường kính', t_prep_min: 2.0, t_man_min: 2.5, DG_machine_hour: 234000 },
      { name: 'Phay rãnh then CNC', t_prep_min: 1.5, t_man_min: 1.8, DG_machine_hour: 234000 },
    ],
    machining_notes: '',

    C_die_total: 85000000,
    L_die_life: 20000,
    N_order: 20000,
    die_cost_treatment: 'separate',

    k_mgmt: 8,
    DG_trans_kg: defaultTransRate,
    DG_pack_kg: 0,
    k_profit_forging: 15,
  },

  // 3. Casting Initial Input State
  castingInput: {
    selected_casting_grade_id: defaultCastingGrade.id,
    DG_liquid: 13500,
    DG_cast_scrap: 10000,

    m_cast: 4.5,
    Y_yield: 60,
    k_burn_loss: 2.15,

    // Section 2 & Part B Workshop Costs
    C_furnace_ladle_per_1000kg: 120000,
    C_molding_recipe_total_1000kg: 1302200,
    m_resin_core: 0,
    DG_resin_core_per_kg: 12500,
    m_core: 1.2,
    DG_core_sand_kg: 3500,

    // 5 Part B Unit Rates
    DG_finishing_per_kg: 771.82,
    DG_utility_per_kg: 3687.6,
    DG_labor_per_kg: 2461,
    DG_workshop_mgmt_per_kg: 0,
    DG_equipment_depr_per_kg: 4000,

    // Deprecated legacy fields
    n_cavity_per_mold: 2,
    DG_finish_kg: 1800,

    machining_operations: [
      { name: 'Tiện mặt đúc CNC', t_prep_min: 2.0, t_man_min: 3.0, DG_machine_hour: 234000 },
      { name: 'Khoan lỗ gá CNC', t_prep_min: 1.0, t_man_min: 1.5, DG_machine_hour: 182000 },
    ],
    machining_notes: '',
    C_coating: 1200,
    C_QA: 1500,

    C_pattern_total: 45000000,
    L_pattern_life: 20000,
    N_order: 20000,
    pattern_cost_treatment: 'separate',

    k_mgmt_cast: 10,
    DG_trans_kg: defaultTransRate,
    DG_pack_kg: 0,
    k_profit_casting: 12,
  },

  // Actions
  setRfqField: (field, value) =>
    set((state) => ({
      rfq: { ...state.rfq, [field]: value },
    })),

  setActiveRfqItemId: (id) => set({ activeRfqItemId: id }),

  resetRfq: () =>
    set({
      rfq: {
        customer_name: '',
        product_name: '',
        annual_volume: 1000,
        trade_terms: 'FOB',
        target_price: 0,
      },
      activeRfqItemId: null,
    }),

  setSegment: (segment) => set({ segment }),

  setCurrency: (currency) =>
    set({
      currency,
      exchange_rate: DEFAULT_EXCHANGE_RATES[currency] || 1,
    }),

  setExchangeRate: (rate) => set({ exchange_rate: Math.max(0.0001, rate) }),

  cloneInputsFromQuote: (quote) => {
    const clonedInputs = JSON.parse(JSON.stringify(quote.inputs_json));

    if (quote.segment === 'forging') {
      set((state) => {
        let mappedInputs = { ...clonedInputs };
        // Backward compatibility: map old m_tinh -> m_phoi, old m_bavia -> calculate m_chi
        if (mappedInputs.m_chi === undefined && mappedInputs.m_tinh !== undefined && mappedInputs.m_bavia !== undefined) {
          const old_m_tinh = mappedInputs.m_tinh;
          const old_m_bavia = mappedInputs.m_bavia;
          mappedInputs.m_phoi = old_m_tinh;
          mappedInputs.m_tinh = undefined;
          mappedInputs.m_chi = Number(((old_m_tinh + old_m_bavia) / (1 - (mappedInputs.k_loss || 5.0) / 100)).toFixed(4));
          delete mappedInputs.m_bavia;
        }

        return {
          segment: 'forging',
          currency: quote.currency || 'VND',
          exchange_rate: quote.exchange_rate || 1,
          forgingInput: {
            ...state.forgingInput,
            ...mappedInputs,
          },
        };
      });
    } else {
      set((state) => ({
        segment: 'casting',
        currency: quote.currency || 'VND',
        exchange_rate: quote.exchange_rate || 1,
        castingInput: {
          ...state.castingInput,
          ...clonedInputs,
        },
      }));
    }
  },

  // Forging Actions
  setForgingField: (field, value) =>
    set((state) => ({
      forgingInput: { ...state.forgingInput, [field]: value },
    })),

  addForgingMachiningOp: (op) =>
    set((state) => ({
      forgingInput: {
        ...state.forgingInput,
        machining_operations: [...(state.forgingInput.machining_operations || []), op],
      },
    })),

  updateForgingMachiningOp: (index, op) =>
    set((state) => {
      const ops = [...(state.forgingInput.machining_operations || [])];
      ops[index] = op;
      return {
        forgingInput: { ...state.forgingInput, machining_operations: ops },
      };
    }),

  removeForgingMachiningOp: (index) =>
    set((state) => ({
      forgingInput: {
        ...state.forgingInput,
        machining_operations: (state.forgingInput.machining_operations || []).filter((_, i) => i !== index),
      },
    })),

  addForgingDieComponent: (comp) =>
    set((state) => ({
      forgingInput: {
        ...state.forgingInput,
        die_components: [...(state.forgingInput.die_components || []), comp],
      },
    })),

  updateForgingDieComponent: (index, comp) =>
    set((state) => {
      const comps = [...(state.forgingInput.die_components || [])];
      comps[index] = comp;
      return {
        forgingInput: { ...state.forgingInput, die_components: comps },
      };
    }),

  removeForgingDieComponent: (index) =>
    set((state) => ({
      forgingInput: {
        ...state.forgingInput,
        die_components: (state.forgingInput.die_components || []).filter((_, i) => i !== index),
      },
    })),

  selectForgingMaterial: (materialId) => {
    const mat = INITIAL_MATERIALS.find((m) => m.id === materialId);
    if (mat) {
      set((state) => ({
        forgingInput: {
          ...state.forgingInput,
          selected_material_id: materialId,
          DG_steel: mat.latest_price || state.forgingInput.DG_steel,
          DG_scrap: mat.scrap_price || state.forgingInput.DG_scrap,
        },
      }));
    }
  },

  selectForgingMachineRate: (rateId, type) => {
    if (type === 'press') {
      const rateObj = INITIAL_PRESSING_RATES.find((r) => r.id === rateId);
      if (rateObj) {
        set((state) => ({
          forgingInput: {
            ...state.forgingInput,
            forging_machine_type: 'press',
            selected_press_rate_id: rateId,
            DG_forging_machine_hour: rateObj.rate_per_hour,
          },
        }));
      }
    } else {
      const rateObj = INITIAL_HAMMER_RATES.find((r) => r.id === rateId);
      if (rateObj) {
        set((state) => ({
          forgingInput: {
            ...state.forgingInput,
            forging_machine_type: 'hammer',
            selected_hammer_rate_id: rateId,
            DG_forging_machine_hour: rateObj.rate_per_hour,
          },
        }));
      }
    }
  },

  // Casting Actions
  setCastingField: (field, value) =>
    set((state) => ({
      castingInput: { ...state.castingInput, [field]: value },
    })),

  addCastingMachiningOp: (op) =>
    set((state) => ({
      castingInput: {
        ...state.castingInput,
        machining_operations: [...(state.castingInput.machining_operations || []), op],
      },
    })),

  updateCastingMachiningOp: (index, op) =>
    set((state) => {
      const ops = [...(state.castingInput.machining_operations || [])];
      ops[index] = op;
      return {
        castingInput: { ...state.castingInput, machining_operations: ops },
      };
    }),

  removeCastingMachiningOp: (index) =>
    set((state) => ({
      castingInput: {
        ...state.castingInput,
        machining_operations: (state.castingInput.machining_operations || []).filter((_, i) => i !== index),
      },
    })),

  addCastingPatternComponent: (comp) =>
    set((state) => ({
      castingInput: {
        ...state.castingInput,
        pattern_components: [...(state.castingInput.pattern_components || []), comp],
      },
    })),

  updateCastingPatternComponent: (index, comp) =>
    set((state) => {
      const comps = [...(state.castingInput.pattern_components || [])];
      comps[index] = comp;
      return {
        castingInput: { ...state.castingInput, pattern_components: comps },
      };
    }),

  removeCastingPatternComponent: (index) =>
    set((state) => ({
      castingInput: {
        ...state.castingInput,
        pattern_components: (state.castingInput.pattern_components || []).filter((_, i) => i !== index),
      },
    })),

  selectCastingGrade: async (gradeId) => {
    try {
      const liquidMetalResult = await fetchLiquidMetalPriceForGrade(gradeId);
      set((state) => ({
        castingInput: {
          ...state.castingInput,
          selected_casting_grade_id: gradeId,
          DG_liquid: Math.round(liquidMetalResult.DG_liquid),
          DG_cast_scrap: Math.round(liquidMetalResult.DG_cast_scrap),
        },
      }));
    } catch (e) {
      const fallbackResult = calculateLiquidMetalPrice(
        gradeId,
        INITIAL_BOM_ITEMS,
        INITIAL_PRICE_HISTORY,
        INITIAL_MATERIALS
      );

      set((state) => ({
        castingInput: {
          ...state.castingInput,
          selected_casting_grade_id: gradeId,
          DG_liquid: Math.round(fallbackResult.DG_liquid),
          DG_cast_scrap: Math.round(fallbackResult.DG_cast_scrap),
        },
      }));
    }
  },

  // Real-time Calculation Getters using Calculation Engine (Phase 1)
  getForgingResult: () => {
    const input = get().forgingInput;
    return calculateForgingPrice(input);
  },

  getCastingResult: () => {
    const input = get().castingInput;
    return calculateCastingPrice(input);
  },
}));
