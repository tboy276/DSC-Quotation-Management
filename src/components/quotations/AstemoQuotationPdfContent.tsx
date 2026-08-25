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
  config,
  materialsMap = new Map(),
}) => {
  const items = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);
  const currency: CurrencyType = document.currency || 'VND';

  const formatNum = (val: number | null | undefined, locale = 'vi-VN', decimals = 0) => {
    if (!val || val === 0) return '';
    return Number(val).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  
  const formatCycleTime = (val: number | null | undefined) => {
    if (!val || val === 0) return '';
    return Number(val).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="astemo-pdf-container" style={{ fontFamily: 'Arial, sans-serif', width: '210mm', margin: '0 auto', backgroundColor: 'white' }}>
      <style>{`
        .astemo-pdf-page td,
        .astemo-pdf-page th {
          vertical-align: middle !important;
        }
      `}</style>
      {items.map((item, idx) => {
        if (!item.quote) return null;
        
        const q = item.quote;
        const res = q.results_json as any;
        const inp = q.inputs_json as any;
        const materialName = (inp.selected_material_id && materialsMap.get(inp.selected_material_id)) 
          || inp.material_name 
          || 'S45C';

        const {
          materialCostVnd,
          formingCostVnd,
          machiningCostVnd,
          packageCostVnd,
          deliveryCostVnd,
          dieAmortizedVnd,
          unitPriceVnd,
          sgaAndPVnd,
        } = mapQuoteToDisplayCosts(q, res, inp);

        const breakdown = res.die_components_breakdown || [];
        const itemId = item.id || item.quote?.id || '';
        const origin = config?.astemoMaterialOrigin?.[itemId] || '';

        return (
          <div key={itemId} className="astemo-pdf-page" style={{ 
            width: '210mm', 
            minHeight: '297mm',
            padding: '10mm',
            boxSizing: 'border-box',
            pageBreakAfter: idx < items.length - 1 ? 'always' : 'auto', 
            position: 'relative',
            fontSize: '12px'
          }}>
                        {/* 1. HEADER 3 CỘT */}
            <div style={{ display: config?.astemoShowLogo !== false ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '30%' }}>
                <span style={{ color: '#D31145', fontSize: '32px', fontWeight: 'bold', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '-1px' }}>Astemo</span>
              </div>
              <div style={{ width: '40%', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ASTEMO HANOI CO., LTD</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>QUOTATION</div>
              </div>
              <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end' }}>
                <table style={{ borderCollapse: 'collapse', width: '120px', border: '2px solid red', textAlign: 'center' }}>
                  <tbody>
                    <tr><td style={{ borderBottom: '1px solid red', color: 'red', fontWeight: 'bold', padding: '4px' }}>CONFIDENTIAL</td></tr>
                    <tr><td style={{ color: 'red', fontWeight: 'bold', padding: '4px' }}>MẬT</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. HÀNG 3 KHỐI: MAKER NAME | EXCHANGE RATE | DATE/SIGNATURE */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {/* Maker Name */}
              <table style={{ flex: '1', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px' }}>MAKER NAME</td></tr>
                  <tr><td style={{ fontWeight: 'bold', padding: '20px 4px', fontSize: '13px' }}>{DISOCO_COMPANY_CONFIG.name}</td></tr>
                </tbody>
              </table>

              {/* Exchange Rate */}
              <table style={{ width: '150px', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td rowSpan={3} style={{ borderRight: '1px solid black', padding: '2px', width: '50px' }}>EXCHANGE<br/>RATE</td>
                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '2px', textAlign: 'left' }}>$/VND</td>
                    <td style={{ borderBottom: '1px solid black', padding: '2px' }}>{currency === 'USD' ? document.exchange_rate : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '2px', textAlign: 'left' }}>$/YEN</td>
                    <td style={{ borderBottom: '1px solid black', padding: '2px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ borderRight: '1px solid black', padding: '2px', textAlign: 'left' }}>Other<br/>(.........)</td>
                    <td style={{ padding: '2px' }}></td>
                  </tr>
                </tbody>
              </table>

              {/* Date & Signature */}
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderRight: '1px solid black', padding: '4px', width: '50%' }}>DATE OF ISSUE</td>
                      <td style={{ padding: '4px', width: '50%' }}>{document.quotation_date}</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: '100%', flex: '1', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td rowSpan={2} style={{ borderRight: '1px solid black', padding: '4px', width: '30%' }}>SIGNATURE<br/>QUOTED</td>
                      <td rowSpan={2} style={{ padding: '4px', width: '70%' }}>SIGNATURED<br/>CONCLUDED</td>
                    </tr>
                    <tr></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. PART NAME | PART NO | DESIGN CHANGE NO */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
              <table style={{ flex: '2', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px' }}>PART NAME</td></tr>
                  <tr><td style={{ padding: '4px', fontSize: '13px' }}>{q.rfqItem?.product_name}</td></tr>
                </tbody>
              </table>
              <table style={{ flex: '2', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px' }}>PART NO</td></tr>
                  <tr><td style={{ padding: '4px', fontSize: '13px' }}>{q.rfqItem?.part_number}</td></tr>
                </tbody>
              </table>
              <table style={{ flex: '1.5', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px' }}>DESIGN CHANGE NO</td></tr>
                  <tr><td style={{ padding: '4px', fontSize: '13px' }}></td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px', marginBottom: '4px' }}>* CURRENCY UNIT: {currency}</div>

            {/* 4. MATERIAL COST */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th colSpan={10} style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>MATERIAL COST</th>
                </tr>
                <tr>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>MATERIAL<br/>NAME</th>
                  <th colSpan={3} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>MANUFACTURER INFORMATION</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>INPUT<br/>WT(g)</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>OUTPUT<br/>WT(g)</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>SCRAP<br/>WT(g)</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>@/KG</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>SCRAP<br/>@/KG</th>
                  <th rowSpan={2} style={{ borderBottom: '1px solid black', padding: '4px' }}>MATERIAL COST</th>
                </tr>
                <tr>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>NAME</th>
                  <th colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>STATUS<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>CURRENT &nbsp; NEW</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{materialName}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{origin}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(Number(inp.m_chi) * 1000, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(Number(inp.m_phoi) * 1000, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(Number(res.m_bavia_forging) * 1000, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(inp.DG_steel, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(inp.DG_scrap, 'vi-VN', 0)}</td>
                  <td style={{ borderBottom: '1px solid black', padding: '4px' }}>{formatNum(materialCostVnd, 'vi-VN', 0)}</td>
                </tr>
                <tr>
                  <td colSpan={9} style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>MATERIAL COST TOTAL</td>
                  <td style={{ borderBottom: '2px solid black', padding: '4px', fontWeight: 'bold' }}>{formatNum(materialCostVnd, 'vi-VN', 0)}</td>
                </tr>
              </tbody>
            </table>

            {/* 5. OUT-SOURCE PARTS COST */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th colSpan={7} style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold', width: '35%' }}>OUT-SOURCE PARTS COST</th>
                  <th colSpan={5} style={{ borderBottom: '1px solid black', padding: '4px', width: '65%' }}></th>
                </tr>
                <tr>
                  <th rowSpan={2} colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>PART NO</th>
                  <th rowSpan={2} colSpan={3} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>PART NAME</th>
                  <th colSpan={4} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>MANUFACTURER INFORMATION</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>Q'TY</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>PURCHASE<br/>PART COST</th>
                  <th rowSpan={2} style={{ borderBottom: '1px solid black', padding: '4px' }}>OUT SOURCE PART<br/>COST</th>
                </tr>
                <tr>
                  <th colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>NAME</th>
                  <th colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>STATUS<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>CURRENT &nbsp; NEW</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={3} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={1} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={1} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderBottom: '1px solid black', padding: '8px' }}></td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={3} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={2} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={1} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td colSpan={1} style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '8px' }}></td>
                  <td style={{ borderBottom: '1px solid black', padding: '8px' }}></td>
                </tr>
                <tr>
                  <td colSpan={11} style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>OUT-SOURCE PARTS  COST TOTAL</td>
                  <td style={{ borderBottom: '2px solid black', padding: '4px', fontWeight: 'bold' }}></td>
                </tr>
              </tbody>
            </table>

            {/* 6. PROCESSING COST */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold', width: '35%' }}>PROCESSING COST</th>
                  <th colSpan={3} style={{ borderBottom: '1px solid black', padding: '4px', width: '65%' }}></th>
                </tr>
                <tr>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '30%' }}>PROCESS NAME</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '35%' }}>MACHINE NAME</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '10%' }}>CYCLE<br/>TIME (S)</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '10%' }}>COST/<br/>MINUTE</th>
                  <th style={{ borderBottom: '1px solid black', padding: '4px', width: '15%' }}>PROCESS COST</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const forgingSec = inp.expected_productivity ? (8 * 3600) / inp.expected_productivity : 0;
                  const machiningMin = (inp.machining_ops || []).reduce((sum: number, op: any) => sum + (Number(op.t_prep_min) || 0) + (Number(op.t_man_min) || 0), 0);
                  const heatMin = res.C_heat_induction ? ((res.C_heat_induction) / 64104) * 60 : 0; // approximate
                  const cleanMin = res.C_clean ? ((res.C_clean) / 11429) * 60 : 0; // approximate

                  const rows = [
                    { name: 'Shearing (Cắt phôi)', machine: 'Shearing machine RF750i', cSec: Number(inp.t_cut_sec) || 0, cost: res.C_cut || 0 },
                    { name: 'Heating (Nung phôi)', machine: 'Induction Heater 400KW', cSec: heatMin * 60, cost: res.C_heat_induction || 0 },
                    { name: 'Forging (Rèn phôi: bao gồm dập uốn, dập thô, dập tinh, Cắt ba via)', machine: 'Hydraulic Hammer 63KJ', cSec: forgingSec, cost: res.C_forging_op || 0 },
                    { name: 'Coining (Nắn phẳng)', machine: 'Pressing Machine 260T', cSec: 0, cost: res.C_coining || 0 },
                    { name: 'Shot blast (Phun bi)', machine: 'TR.900.W2', cSec: cleanMin * 60, cost: res.C_clean || 0 },
                    { name: 'Rough Machining (Gia công thô)', machine: 'CNC Machine', cSec: machiningMin * 60, cost: machiningCostVnd },
                  ];

                  return rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'left' }}>{r.name}</td>
                      <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'left' }}>{r.machine}</td>
                      <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{formatCycleTime(r.cSec)}</td>
                      <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{r.cSec > 0 ? formatNum((r.cost) / (r.cSec / 60), 'vi-VN', 0) : ''}</td>
                      <td style={{ borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{formatNum(r.cost, 'vi-VN', 0)}</td>
                    </tr>
                  ));
                })()}
                <tr>
                  <td colSpan={4} style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>PROCESSING COST TOTAL</td>
                  <td style={{ borderBottom: '2px solid black', padding: '4px', fontWeight: 'bold', textAlign: 'right' }}>{formatNum(formingCostVnd + machiningCostVnd, 'vi-VN', 0)}</td>
                </tr>
              </tbody>
            </table>

            {/* 7. TOOLING COST */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold', width: '35%' }}>TOOLING COST</th>
                  <th colSpan={3} style={{ borderBottom: '1px solid black', padding: '4px', width: '65%' }}></th>
                </tr>
                <tr>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>TOOL/ DIE NAME</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>Q'TY</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>PRICE</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>DEPRECIATION Q'TY</th>
                  <th style={{ borderBottom: '1px solid black', padding: '4px' }}>COST/UNIT</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b: any, i: number) => (
                  <tr key={i}>
                    <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'left' }}>{b.name}</td>
                    <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>1</td>
                    <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{formatNum(b.lineItemCost, 'vi-VN', 0)}</td>
                    <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{formatNum(b.trueDepreciationQty || b.depreciationQty, 'vi-VN', 0)}</td>
                    <td style={{ borderBottom: '1px solid black', padding: '4px', textAlign: 'right' }}>{formatNum(b.costPerUnit, 'vi-VN', 0)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>TOOLING COST/UNIT TOTAL</td>
                  <td style={{ borderBottom: '2px solid black', padding: '4px', fontWeight: 'bold', textAlign: 'right' }}>{formatNum(dieAmortizedVnd, 'vi-VN', 0)}</td>
                </tr>
              </tbody>
            </table>

            {/* 8. AGREED COST */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', width: '20%', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '2px', fontSize: '11px' }}>AGREED COST</div>
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                    </svg>
                  </th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '11%' }}>MATERIAL<br/>COST</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '11%' }}>OUT-SOURCE<br/>COST</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '11%' }}>PROCESSING<br/>COST</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '11%' }}>TOOLING<br/>COST</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '11%' }}>S.G.A.T&P</th>
                  <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', width: '12%' }}>FREIGHT &<br/>INSURANCE</th>
                  <th style={{ borderBottom: '1px solid black', padding: '4px', width: '13%' }}>TOTAL COST</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'left' }}>BASE COST</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderBottom: '1px solid black', padding: '4px' }}></td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', textAlign: 'left' }}>QUOTATION COST</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(materialCostVnd, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(formingCostVnd + machiningCostVnd, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(dieAmortizedVnd, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(sgaAndPVnd, 'vi-VN', 0)}</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px' }}>{formatNum(deliveryCostVnd + packageCostVnd, 'vi-VN', 0)}</td>
                  <td style={{ borderBottom: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{formatNum(unitPriceVnd, 'vi-VN', 0)}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px', textAlign: 'left' }}>AGREED COST</td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', padding: '4px' }}></td>
                  <td style={{ borderBottom: '2px solid black', padding: '4px' }}></td>
                </tr>
              </tbody>
            </table>

            {/* 9. EFFECTIVE DATE | TRADE TERM | LEAD TIME */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {/* Effective Date */}
              <table style={{ width: '150px', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px' }}>EFFECTIVE DATE</td></tr>
                  <tr><td style={{ padding: '8px' }}></td></tr>
                </tbody>
              </table>
              {/* Trade Term */}
              <table style={{ flex: '1', borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr><td colSpan={2} style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px', textAlign: 'center' }}>TRADE TERM</td></tr>
                  <tr>
                    <td style={{ padding: '4px', borderRight: '1px solid black', width: '50%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{document.trade_terms === 'FOB' ? '☑' : '☐'}</span> FOB (PORT NAME)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{document.trade_terms === 'CIF' ? '☑' : '☐'}</span> CIF HAI PHONG
                      </div>
                    </td>
                    <td style={{ padding: '4px', width: '50%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{document.trade_terms === 'DAP' ? '☑' : '☐'}</span> VNHN's WAREHOUSE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{!['FOB', 'CIF', 'DAP'].includes(document.trade_terms) ? '☑' : '☐'}</span> OTHERS
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Lead Time Condition */}
              <table style={{ width: '220px', borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr><td colSpan={2} style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', fontSize: '13px', textAlign: 'center' }}>LEAD TIME CONDITION</td></tr>
                  <tr>
                    <td style={{ padding: '4px 4px 4px 8px', width: '100%', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>SAMPLE ORDER:</span>
                        <span>{config?.astemoLeadTimeSampleDays ?? ''} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>MP ORDER:</span>
                        <span>{config?.astemoLeadTimeMpDays ?? ''} days</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 10. OTHER CONDITIONS | VNHN'S CONFIRMATION */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: '1', border: '2px solid black', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>OTHER CONDITIONS:</div>
                <div style={{ lineHeight: '1.4' }}>
                  {(config?.remarks || []).map((remark: any, rIdx: number) => (
                    <div key={remark.id}>
                      {rIdx + 1}. {remark.vi}
                    </div>
                  ))}
                  {(!config?.remarks || config.remarks.length === 0) && (
                    <div style={{ visibility: 'hidden' }}>-</div>
                  )}
                </div>
              </div>
              <div style={{ width: '320px', border: '2px solid black', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', padding: '4px', textAlign: 'center' }}>VNHN'S CONFIRMATION</div>
                <table style={{ width: '100%', flex: '1', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', fontWeight: 'normal' }}>APPLIED BY</th>
                      <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', fontWeight: 'normal' }}>MANAGER</th>
                      <th style={{ borderRight: '1px solid black', borderBottom: '1px solid black', padding: '4px', fontWeight: 'normal' }}>G.MANAGER</th>
                      <th style={{ borderBottom: '1px solid black', padding: '4px', fontWeight: 'normal' }}>G.DIRECTOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ borderRight: '1px solid black', height: '40px' }}></td>
                      <td style={{ borderRight: '1px solid black' }}></td>
                      <td style={{ borderRight: '1px solid black' }}></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
