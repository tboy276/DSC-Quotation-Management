import { describe, it, expect } from 'vitest';
import { calculateMachiningPrice } from './machining-calculator';
import type { MachiningInput } from './types';

describe('Machining Calculator Engine', () => {
  it('(a) không có nguyên công nào (mảng rỗng) và (e) m_tinh = 0/undefined không làm crash', () => {
    const input: MachiningInput = {
      m_tinh: undefined,
      machining_operations: [],
      k_mgmt: 10,
      DG_trans_kg: 2000,
      k_profit_machining: 15,
      C_pack: 5000,
    };
    
    const result = calculateMachiningPrice(input);
    expect(result.C_machining).toBe(0);
    expect(result.COGS).toBe(0);
    expect(result.C_mgmt).toBe(0);
    expect(result.pre_profit_price).toBe(5000); // 0 + 0 + 5000 + 0
    expect(result.P_MACHINING).toBe(5750); // 5000 * 1.15
  });

  it('(b) nhiều nguyên công cộng dồn đúng & (f) verify công thức đúng thứ tự cộng dồn', () => {
    const input: MachiningInput = {
      m_tinh: 2,
      machining_operations: [
        { name: 'Op 1', t_prep_min: 5, t_man_min: 10, DG_machine_hour: 120000 }, // 15 min * 2000 = 30000
        { name: 'Op 2', t_prep_min: 0, t_man_min: 30, DG_machine_hour: 180000 }, // 30 min * 3000 = 90000
      ],
      k_mgmt: 10, // 10% of COGS
      DG_trans_kg: 1000, // 2 * 1000 = 2000
      k_profit_machining: 20, // 20% of pre_profit
      C_pack: 3000,
    };

    const result = calculateMachiningPrice(input);
    expect(result.C_machining).toBe(120000); // 30000 + 90000
    expect(result.COGS).toBe(120000);
    expect(result.C_mgmt).toBe(12000); // 10% of 120000
    expect(result.pre_profit_price).toBe(120000 + 12000 + 3000 + 2000); // 137000
    expect(result.C_profit).toBe(27400); // 20% of 137000
    expect(result.P_MACHINING).toBe(164400); // 137000 + 27400
  });

  it('(c) DG_pack_kg > 0 override C_pack', () => {
    const input: MachiningInput = {
      m_tinh: 5,
      k_mgmt: 0,
      DG_trans_kg: 0,
      k_profit_machining: 0,
      C_pack: 10000, // Should be ignored
      DG_pack_kg: 2000, // Should be used: 5 * 2000 = 10000
    };

    const result = calculateMachiningPrice(input);
    expect(result.pre_profit_price).toBe(10000);
  });

  it('(d) DG_pack_kg không set thì dùng C_pack nhập tay', () => {
    const input: MachiningInput = {
      m_tinh: 5,
      k_mgmt: 0,
      DG_trans_kg: 0,
      k_profit_machining: 0,
      C_pack: 15000, // Should be used
      DG_pack_kg: 0, // 0 means ignore
    };

    const result = calculateMachiningPrice(input);
    expect(result.pre_profit_price).toBe(15000);
  });
});
