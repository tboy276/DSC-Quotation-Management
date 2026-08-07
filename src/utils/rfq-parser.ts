import type { TradeTermType } from '../store/useQuotationStore';
import type { QuantityUnitType, TechnologyRequirementType } from '../types/quote';

export interface ParsedRfqData {
  dossier: {
    customer_name: string;
    customer_address: string;
    customer_contact_person: string;
    rfq_received_date: string;
    customer_deadline: string;
    trade_terms: TradeTermType;
    delivery_address: string;
    special_requirements: string;
    notes: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    part_number: string;
    annual_volume: number;
    quantity_unit: QuantityUnitType;
    target_price: number;
    technology_requirement: TechnologyRequirementType;
  }>;
  warnings: string[];
}

// Convert DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
const parseDateToIso = (raw: string): string | null => {
  if (!raw) return null;
  const clean = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY
  const dmYMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmYMatch) {
    const day = dmYMatch[1].padStart(2, '0');
    const month = dmYMatch[2].padStart(2, '0');
    const year = dmYMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
};

export const parseStructuredRfqText = (rawText: string): ParsedRfqData => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const result: ParsedRfqData = {
    dossier: {
      customer_name: '',
      customer_address: '',
      customer_contact_person: '',
      rfq_received_date: new Date().toISOString().slice(0, 10),
      customer_deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      trade_terms: 'FOB',
      delivery_address: '',
      special_requirements: '',
      notes: '',
    },
    items: [],
    warnings: [],
  };

  let inItemsSection = false;

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    const lower = line.toLowerCase();

    // Check Header Label Matches
    if (lower.startsWith('khách hàng:')) {
      result.dossier.customer_name = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('địa chỉ:')) {
      result.dossier.customer_address = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('người gửi rfq:') || lower.startsWith('người gửi:')) {
      result.dossier.customer_contact_person = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('ngày nhận rfq:') || lower.startsWith('ngày nhận:')) {
      const val = line.substring(line.indexOf(':') + 1).trim();
      const parsedDate = parseDateToIso(val);
      if (parsedDate) result.dossier.rfq_received_date = parsedDate;
    } else if (lower.startsWith('deadline báo giá:') || lower.startsWith('deadline:')) {
      const val = line.substring(line.indexOf(':') + 1).trim();
      const parsedDate = parseDateToIso(val);
      if (parsedDate) result.dossier.customer_deadline = parsedDate;
    } else if (lower.startsWith('trade term:') || lower.startsWith('trade terms:')) {
      const val = line.substring(line.indexOf(':') + 1).trim().toUpperCase();
      if (['EXW', 'FOB', 'CIF', 'DAP'].includes(val)) {
        result.dossier.trade_terms = val as TradeTermType;
      }
    } else if (lower.startsWith('địa chỉ giao hàng:')) {
      result.dossier.delivery_address = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('yêu cầu đặc biệt:')) {
      result.dossier.special_requirements = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('ghi chú:')) {
      result.dossier.notes = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('sản phẩm:')) {
      inItemsSection = true;
    } else if (inItemsSection) {
      // Parsing Product Items
      // Pattern 1: Tên: [text] | Part Number: [text] | Sản lượng: [số] [pcs/năm|pcs/tháng|pcs/lô] | Target Price: [số] | Công nghệ: [1 trong 6 lựa chọn]
      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        let pName = '';
        let pNo = '';
        let vol = 0;
        let unit: QuantityUnitType = 'pcs/năm';
        let target = 0;
        let tech: TechnologyRequirementType = 'Rèn+Gia công';

        let parsedSuccessfully = false;

        // Try Keyed format: Tên: X | Part Number: Y | Sản lượng: Z pcs/năm | Target Price: W | Công nghệ: T
        parts.forEach((part) => {
          const pLower = part.toLowerCase();
          if (pLower.startsWith('tên:')) {
            pName = part.substring(part.indexOf(':') + 1).trim();
          } else if (pLower.startsWith('part number:')) {
            pNo = part.substring(part.indexOf(':') + 1).trim();
          } else if (pLower.startsWith('sản lượng:')) {
            const rawVol = part.substring(part.indexOf(':') + 1).trim();
            const cleanVolStr = rawVol.replace(/[^\d]/g, '');
            vol = cleanVolStr !== '' ? Number(cleanVolStr) : 0;
            if (rawVol.includes('tháng')) unit = 'pcs/tháng';
            else if (rawVol.includes('lô')) unit = 'pcs/lô';
            else unit = 'pcs/năm';
          } else if (pLower.startsWith('target price:') || pLower.startsWith('giá target:')) {
            const rawTarget = part.substring(part.indexOf(':') + 1).trim();
            const cleanTargetStr = rawTarget.replace(/[^\d]/g, '');
            target = cleanTargetStr !== '' ? Number(cleanTargetStr) : 0;
          } else if (pLower.startsWith('công nghệ:')) {
            const rawTech = part.substring(part.indexOf(':') + 1).trim();
            if (['Phôi rèn', 'Phôi đúc', 'Phôi cưa', 'Rèn+Gia công', 'Đúc+Gia công', 'Phôi cưa+Gia công'].includes(rawTech)) {
              tech = rawTech as TechnologyRequirementType;
            }
          }
        });

        if (pName) {
          parsedSuccessfully = true;
        } else {
          // Positional Pipe format fallback: Bánh Răng | PN-01 | 10000 | pcs/năm | 95000 | Rèn+Gia công
          if (parts.length >= 2) {
            pName = parts[0];
            pNo = parts[1] || '';
            if (parts[2]) {
              const cleanVolStr = parts[2].replace(/[^\d]/g, '');
              vol = cleanVolStr !== '' ? Number(cleanVolStr) : 0;
            }
            if (parts[3]) {
              if (parts[3].includes('tháng')) unit = 'pcs/tháng';
              else if (parts[3].includes('lô')) unit = 'pcs/lô';
            }
            if (parts[4]) {
              const cleanTargetStr = parts[4].replace(/[^\d]/g, '');
              target = cleanTargetStr !== '' ? Number(cleanTargetStr) : 0;
            }
            if (parts[5]) {
              const t = parts[5].trim();
              if (['Phôi rèn', 'Phôi đúc', 'Phôi cưa', 'Rèn+Gia công', 'Đúc+Gia công', 'Phôi cưa+Gia công'].includes(t)) {
                tech = t as TechnologyRequirementType;
              }
            }
            parsedSuccessfully = true;
          }
        }

        if (parsedSuccessfully && pName) {
          result.items.push({
            id: String(Date.now() + Math.random()),
            product_name: pName,
            part_number: pNo || `PN-0${result.items.length + 1}`,
            annual_volume: vol,
            quantity_unit: unit,
            target_price: target,
            technology_requirement: tech,
          });
        } else {
          result.warnings.push(`Dòng ${lineNum}: "${line}" không đúng định dạng sản phẩm mẫu.`);
        }
      } else {
        result.warnings.push(`Dòng ${lineNum}: "${line}" thiếu dấu gạch đứng '|' phân cách thông tin sản phẩm.`);
      }
    }
  });

  return result;
};
