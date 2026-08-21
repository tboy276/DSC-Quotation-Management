import type { QuoteRecord } from '../types/quote';

export function mapQuoteToDisplayCosts(q: QuoteRecord | any, res: any, inp: any) {
  const seg = q.segment;
  const weightChiKg = seg === 'casting' ? res.m_liquid : inp.m_chi;
  const weightPhoiKg = seg === 'casting' ? inp.m_cast : (seg === 'forging' ? res.shipping_weight_kg : (res.m_phoi || inp.m_phoi));
  const weightTinhKg = inp.m_tinh;

  let materialCostVnd = 0;
  let formingCostVnd = 0;
  let machiningCostVnd = 0;
  let heatTreatCostVnd = 0;
  let paintCostVnd = 0;
  let packageCostVnd = 0;
  let deliveryCostVnd = 0;
  let dieAmortizedVnd = 0;
  let fallbackPrice = 0;

  if (seg === 'forging') {
    materialCostVnd = res.C_mat_forging ?? 0;
    formingCostVnd = res.C_ops_forging ?? 0;
    machiningCostVnd = res.C_machining ?? 0;
    heatTreatCostVnd = res.C_heat_treat ?? 0;
    paintCostVnd = res.C_paint ?? 0;
    dieAmortizedVnd = res.C_die_amortized_per_unit ?? 0;
    fallbackPrice = res.P_FORGING ?? 0;
  } else if (seg === 'casting') {
    materialCostVnd = 0;
    formingCostVnd = (res.C_metal_casting ?? 0) + (res.C_ops_casting ?? 0) + (res.C_part_b_total ?? 0);
    machiningCostVnd = res.C_machining_casting ?? 0;
    heatTreatCostVnd = res.C_heat_treat ?? 0;
    paintCostVnd = res.C_paint ?? 0;
    dieAmortizedVnd = res.C_pattern_amortization_per_unit ?? 0;
    fallbackPrice = res.P_CASTING ?? 0;
  } else if (seg === 'sawing') {
    materialCostVnd = res.C_mat_sawing ?? 0;
    formingCostVnd = 0;
    machiningCostVnd = (res.C_ops_sawing ?? 0) + (res.C_machining ?? 0);
    heatTreatCostVnd = res.C_heat_treat ?? 0;
    paintCostVnd = res.C_paint ?? 0;
    fallbackPrice = res.P_SAWING ?? 0;
  } else if (seg === 'machining') {
    materialCostVnd = 0;
    formingCostVnd = 0;
    machiningCostVnd = res.C_machining ?? 0;
    heatTreatCostVnd = res.C_heat_treat ?? 0;
    paintCostVnd = res.C_paint ?? 0;
    fallbackPrice = res.P_MACHINING ?? 0;
  }

  const finalWeight = seg === 'forging' ? (res.shipping_weight_kg || 0) : (inp.m_tinh || weightPhoiKg || weightChiKg || 0);
  packageCostVnd = inp.DG_pack_kg !== undefined && inp.DG_pack_kg > 0 ? (inp.DG_pack_kg * finalWeight) : (inp.C_pack || 0);
  deliveryCostVnd = finalWeight * (inp.DG_trans_kg || 0);

  const unitPriceVnd = q.final_quoted_price ?? fallbackPrice;
  const sgaAndPVnd = unitPriceVnd - (materialCostVnd + formingCostVnd + machiningCostVnd + heatTreatCostVnd + paintCostVnd + packageCostVnd + deliveryCostVnd);

  const isSeparateTooling = (seg === 'forging' || seg === 'casting') && q.die_cost_treatment === 'separate';

  const toolingPriceVnd = seg === 'forging' ? (res.actual_C_die_total || 0) : (seg === 'casting' ? (res.actual_C_pattern_total || inp.C_pattern_total || 0) : 0);
  const toolingLife = seg === 'forging' ? (res.actual_L_die_life || 0) : (seg === 'casting' ? (res.actual_L_pattern_life || inp.L_pattern_life || 0) : 0);

  return {
    weightChiKg,
    weightPhoiKg,
    weightTinhKg,
    finalWeight,
    materialCostVnd,
    formingCostVnd,
    machiningCostVnd,
    heatTreatCostVnd,
    paintCostVnd,
    packageCostVnd,
    deliveryCostVnd,
    dieAmortizedVnd,
    fallbackPrice,
    unitPriceVnd,
    sgaAndPVnd,
    isSeparateTooling,
    toolingPriceVnd,
    toolingLife
  };
}

