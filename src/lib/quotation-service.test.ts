import { describe, it, expect, beforeEach } from 'vitest';
import { useQuotationStore } from '../store/useQuotationStore';
import type { QuoteRecord } from '../types/quote';

describe('P0 Requirements Unit Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useQuotationStore.getState().resetSegmentInput('forging');
    useQuotationStore.getState().resetSegmentInput('casting');
    useQuotationStore.getState().resetSegmentInput('sawing');
    useQuotationStore.getState().resetSegmentInput('machining');
  });

  describe('P0-2: cloneInputsFromQuote for 4 segments', () => {
    it('clones forging quote inputs correctly', () => {
      const mockForgingQuote: Partial<QuoteRecord> = {
        segment: 'forging',
        currency: 'USD',
        exchange_rate: 25000,
        inputs_json: { m_phoi: 2.5, m_chi: 3.1, forging_line: '1600T' },
      };

      useQuotationStore.getState().cloneInputsFromQuote(mockForgingQuote as QuoteRecord);

      const state = useQuotationStore.getState();
      expect(state.segment).toBe('forging');
      expect(state.currency).toBe('USD');
      expect(state.forgingInput.m_phoi).toBe(2.5);
      expect(state.forgingInput.forging_line).toBe('1600T');
    });

    it('clones casting quote inputs correctly into castingInput', () => {
      const mockCastingQuote: Partial<QuoteRecord> = {
        segment: 'casting',
        currency: 'VND',
        exchange_rate: 1,
        inputs_json: { m_cast: 7.5, Y_yield: 65 },
      };

      useQuotationStore.getState().cloneInputsFromQuote(mockCastingQuote as QuoteRecord);

      const state = useQuotationStore.getState();
      expect(state.segment).toBe('casting');
      expect(state.castingInput.m_cast).toBe(7.5);
      expect(state.castingInput.Y_yield).toBe(65);
    });

    it('clones sawing quote inputs correctly into sawingInput', () => {
      const mockSawingQuote: Partial<QuoteRecord> = {
        segment: 'sawing',
        currency: 'EUR',
        exchange_rate: 27000,
        inputs_json: { m_phoi: 4.2, t_cut_sec: 45 },
      };

      useQuotationStore.getState().cloneInputsFromQuote(mockSawingQuote as QuoteRecord);

      const state = useQuotationStore.getState();
      expect(state.segment).toBe('sawing');
      expect(state.sawingInput.m_phoi).toBe(4.2);
      expect(state.sawingInput.t_cut_sec).toBe(45);
    });

    it('clones machining quote inputs correctly into machiningInput', () => {
      const mockMachiningQuote: Partial<QuoteRecord> = {
        segment: 'machining',
        currency: 'JPY',
        exchange_rate: 170,
        inputs_json: { m_tinh: 3.8, k_mgmt: 12 },
      };

      useQuotationStore.getState().cloneInputsFromQuote(mockMachiningQuote as QuoteRecord);

      const state = useQuotationStore.getState();
      expect(state.segment).toBe('machining');
      expect(state.machiningInput.m_tinh).toBe(3.8);
      expect(state.machiningInput.k_mgmt).toBe(12);
    });
  });

  describe('P0-3: Item switching sequence integrity (Item A saved -> Item B new -> Item A saved)', () => {
    it('resets input state for new items and preserves saved items when switching back', () => {
      const itemAQuote: Partial<QuoteRecord> = {
        segment: 'forging',
        inputs_json: { m_phoi: 9.9, forging_line: '80kJ' },
      };

      // 1. Open Item A (saved item)
      useQuotationStore.getState().cloneInputsFromQuote(itemAQuote as QuoteRecord);
      expect(useQuotationStore.getState().forgingInput.m_phoi).toBe(9.9);
      expect(useQuotationStore.getState().forgingInput.forging_line).toBe('80kJ');

      // 2. Switch to Item B (new item with no saved inputs_json) -> Reset segment input
      useQuotationStore.getState().resetSegmentInput('forging');
      expect(useQuotationStore.getState().forgingInput.m_phoi).toBe(1.2); // Default value
      expect(useQuotationStore.getState().forgingInput.forging_line).toBe('1000T'); // Default value

      // 3. Switch back to Item A -> Clone inputs_json again
      useQuotationStore.getState().cloneInputsFromQuote(itemAQuote as QuoteRecord);
      expect(useQuotationStore.getState().forgingInput.m_phoi).toBe(9.9);
      expect(useQuotationStore.getState().forgingInput.forging_line).toBe('80kJ');
    });
  });
});
