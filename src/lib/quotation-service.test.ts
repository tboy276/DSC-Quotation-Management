import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNextRfqCode, createRfqDossierWithItems } from './quotation-service';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('quotation-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNextRfqCode', () => {
    it('should generate code 001 if no existing rfqs for the date', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockLike = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        like: mockLike,
      });

      const code = await generateNextRfqCode('20260811');
      expect(code).toBe('20260811-001');
      expect(supabase.from).toHaveBeenCalledWith('rfqs');
      expect(mockLike).toHaveBeenCalledWith('rfq_code', '20260811-%');
    });

    it('should increment the max existing code', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockLike = vi.fn().mockResolvedValue({
        data: [{ rfq_code: '20260811-005' }, { rfq_code: '20260811-012' }, { rfq_code: '20260811-002' }],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        like: mockLike,
      });

      const code = await generateNextRfqCode('20260811');
      expect(code).toBe('20260811-013');
    });
  });

  describe('createRfqDossierWithItems', () => {
    it('should retry insertion on unique_violation (23505)', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();

      let insertAttempt = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'rfq_items') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockImplementation((col) => {
            if (col === 'rfq_code') {
              return {
                like: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            return {
              single: vi.fn().mockImplementation(() => {
                insertAttempt++;
                if (insertAttempt === 1) {
                  return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
                }
                return Promise.resolve({ data: { id: 'dossier-1' }, error: null });
              }),
            };
          }),
          insert: mockInsert,
        };
      });

      const dossier = {
        customer_name: 'Test Customer',
        rfq_received_date: '2026-08-11',
        customer_deadline: '2026-08-18',
      };
      
      const result = await createRfqDossierWithItems(dossier, [], 'test@test.com');
      
      expect(insertAttempt).toBe(2);
      expect(result).toHaveProperty('id', 'dossier-1');
    });

    it('should retry insertion on unique_violation even if rfq_code is provided', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      
      let insertAttempt = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'rfq_items') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockImplementation((col) => {
            if (col === 'rfq_code') {
              return {
                like: vi.fn().mockResolvedValue({ data: [{ rfq_code: '20260811-001' }], error: null }),
              };
            }
            return {
              single: vi.fn().mockImplementation(() => {
                insertAttempt++;
                if (insertAttempt === 1) {
                  return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
                }
                return Promise.resolve({ data: { id: 'dossier-2', rfq_code: '20260811-002' }, error: null });
              }),
            };
          }),
          insert: mockInsert,
        };
      });

      const dossier = {
        customer_name: 'Test Customer',
        rfq_received_date: '2026-08-11',
        customer_deadline: '2026-08-18',
        rfq_code: '20260811-001',
      };
      
      const result = await createRfqDossierWithItems(dossier, [], 'test@test.com');
      
      expect(insertAttempt).toBe(2);
      expect(result).toHaveProperty('rfq_code', '20260811-002');
    });
  });
});
