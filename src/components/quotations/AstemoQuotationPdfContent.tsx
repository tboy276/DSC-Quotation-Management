import React from 'react';
import type { QuotationDocument, DocumentDisplayConfig } from '../../types/quotation-document';

import type { CurrencyType } from '../../types/quote';
import { DISOCO_COMPANY_CONFIG } from '../../config/company-config';
import { mapQuoteToDisplayCosts } from '../../lib/quotation-cost-mapper';



interface AstemoQuotationPdfContentProps {
  document: QuotationDocument;
  config?: DocumentDisplayConfig;
  materialsMap?: Map<string, string>;
  gradesMap?: Map<string, string>;
}



export const AstemoQuotationPdfContent: React.FC<AstemoQuotationPdfContentProps> = ({
  document,
  
  materialsMap = new Map(),
}) => {
  
  const items = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);
  const currency: CurrencyType = document.currency || 'VND';

  const formatNum = (val: number | null | undefined) => {
    if (!val || val === 0) return '-';
    return Math.round(val).toLocaleString('vi-VN');
  };

  return (
    <div className="" style={{ fontFamily: 'Arial, sans-serif' }}>
      {items.map((item, idx) => {
        if (!item.quote) return null;
        
        const q = item.quote;
        const res = q.results_json as any;
        const inp = q.inputs_json as any;
        const materialName = (inp.selected_material_id && materialsMap.get(inp.selected_material_id)) 
          || inp.material_name 
          || 'S45C';

        const {
          weightChiKg,
          weightPhoiKg,
          weightTinhKg,
          materialCostVnd,
          formingCostVnd,
          machiningCostVnd,
          heatTreatCostVnd,
          paintCostVnd,
          packageCostVnd,
          deliveryCostVnd,
          dieAmortizedVnd,
          unitPriceVnd,
          sgaAndPVnd,
          
          
          
        } = mapQuoteToDisplayCosts(q, res, inp);

        const breakdown = res.die_components_breakdown || [];

        return (
          <div key={item.id} className="" style={{ pageBreakAfter: idx < items.length - 1 ? 'always' : 'auto', marginBottom: '40px' }}>
            <div className="" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>QUOTATION SHEET</h1>
                <p>Date: {document.quotation_date}</p>
                <p>To: {document.customer_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>{DISOCO_COMPANY_CONFIG.name}</p>
                <p>{DISOCO_COMPANY_CONFIG.address}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', width: '25%' }}>Part Name</td>
                  <td style={{ border: '1px solid black', padding: '4px', width: '25%' }}>{q.rfqItem?.product_name}</td>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', width: '25%' }}>Part No</td>
                  <td style={{ border: '1px solid black', padding: '4px', width: '25%' }}>{q.rfqItem?.part_number}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>Material</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{materialName}</td>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>Weight (Net/Gross)</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{Number(weightTinhKg || weightPhoiKg).toFixed(2)} / {Number(weightChiKg).toFixed(2)} kg</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>1. Processing Cost Breakdown</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Process</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Cost ({currency})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Shearing</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(res.C_cut || 0)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Heating</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(res.C_heat_induction || 0)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Forging</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(res.C_forging_op || 0)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Shot Blast</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(res.C_clean || 0)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Machining (CNC)</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(machiningCostVnd)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'right' }}>Total Processing Cost</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(formingCostVnd + machiningCostVnd)}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>2. Tooling Amortization Breakdown</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Tool Name</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Cost ({currency})</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Life (pcs)</th>
                  <th style={{ border: '1px solid black', padding: '4px' }}>Amortization ({currency}/pc)</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b: any, i: number) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>{b.name}</td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(b.cost)}</td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(b.life)}</td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(b.amortization_per_unit)}</td>
                  </tr>
                ))}
                {breakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ border: '1px solid black', padding: '4px', fontStyle: 'italic' }}>No tooling breakdown available</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ border: '1px solid black', padding: '4px', textAlign: 'right' }}>Total Tooling Amortization</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(dieAmortizedVnd)}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>3. Agreed Cost</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px', textAlign: 'center' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Material Cost</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(materialCostVnd)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Processing Cost</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(formingCostVnd + machiningCostVnd)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Treatment Cost (Heat/Paint)</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(heatTreatCostVnd + paintCostVnd)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Tooling Amortization</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(dieAmortizedVnd)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>SGA & Profit</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(sgaAndPVnd)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Delivery & Package</td>
                  <td style={{ border: '1px solid black', padding: '4px' }}>{formatNum(deliveryCostVnd + packageCostVnd)}</td>
                </tr>
                <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', fontSize: '14px' }}>
                  <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>Unit Price</td>
                  <td style={{ border: '1px solid black', padding: '4px', color: 'red' }}>{formatNum(unitPriceVnd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

