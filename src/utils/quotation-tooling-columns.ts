import type { QuotationDocumentItem, DocumentDisplayConfig } from '../types/quotation-document';

export interface ToolingColumnFlags {
  showDieAmortizedCost: boolean;
  showToolingPrice: boolean;
  showToolingUsage: boolean;
  hasSeparateDieItem: boolean;
}

export function getToolingColumnFlags(
  items: QuotationDocumentItem[] | undefined,
  config: DocumentDisplayConfig
): ToolingColumnFlags {
  const list = items || [];

  const hasAmortizedDieItem = list.some(item => {
    const seg = item.quote?.segment;
    return (seg === 'forging' || seg === 'casting') && item.quote?.die_cost_treatment === 'amortized';
  });

  const hasSeparateDieItem = list.some(item => {
    const seg = item.quote?.segment;
    return (seg === 'forging' || seg === 'casting') && item.quote?.die_cost_treatment === 'separate';
  });

  return {
    showDieAmortizedCost: hasAmortizedDieItem,
    showToolingPrice: hasSeparateDieItem && !!config.showToolingPrice,
    showToolingUsage: hasSeparateDieItem && !!config.showToolingUsage,
    hasSeparateDieItem, // Expose this for UI disabling logic
  };
}
