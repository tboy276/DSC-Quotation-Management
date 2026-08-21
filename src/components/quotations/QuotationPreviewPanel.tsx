import React, { useState, useEffect } from 'react';
import type { QuotationDocument, DocumentDisplayConfig, DocumentRemarkLine } from '../../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../../types/quotation-document';
import type { CurrencyType } from '../../types/quote';
import type { TradeTermType } from '../../store/useQuotationStore';
import { useToast } from '../../context/ToastContext';
import { QuotationPdfContent } from './QuotationPdfContent';
import { AstemoQuotationPdfContent } from './AstemoQuotationPdfContent';
import { ActionButton } from '../ui/ActionButton';
import { ArrowLeft, Check, Plus, Trash2, ArrowUp, ArrowDown, Eye, Sliders, Download } from 'lucide-react';
import { generateQuotationPdf } from '../../utils/generateQuotationPdf';
import { generateAstemoQuotationPdf } from '../../utils/generateAstemoQuotationPdf';
import { getToolingColumnFlags } from '../../utils/quotation-tooling-columns';
import { fetchMaterials, fetchCastingGrades, INITIAL_MATERIALS, INITIAL_CASTING_GRADES } from '../../lib/master-data-service';

export interface DocFields {
  contact_person: string;
  quotation_date: string;
  trade_terms: TradeTermType;
  currency: CurrencyType;
  exchange_rate: number;
}

interface QuotationPreviewPanelProps {
  document: QuotationDocument;
  initialConfig?: DocumentDisplayConfig;
  readOnly?: boolean;
  onBack?: () => void;
  onSaveAndSend: (config: DocumentDisplayConfig, docFields?: DocFields) => void;
  isSubmitting?: boolean;
}

export const QuotationPreviewPanel: React.FC<QuotationPreviewPanelProps> = ({
  document,
  initialConfig,
  readOnly = false,
  onBack,
  onSaveAndSend,
  isSubmitting = false,
}) => {
  const toast = useToast();
  const [config, setConfig] = useState<DocumentDisplayConfig>(
    initialConfig || document.display_config || DEFAULT_DISPLAY_CONFIG
  );

  const [docFields, setDocFields] = useState<DocFields>({
    contact_person: document.contact_person || '',
    quotation_date: document.quotation_date || '',
    trade_terms: (document.trade_terms as TradeTermType) || 'EXW',
    currency: (document.currency as CurrencyType) || 'VND',
    exchange_rate: document.exchange_rate || 1,
  });

  const liveDocument = { ...document, ...docFields };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [materialsMap, setMaterialsMap] = useState<Map<string, string>>(() => new Map(INITIAL_MATERIALS.map(m => [m.id, m.name])));
  const [gradesMap, setGradesMap] = useState<Map<string, string>>(() => new Map(INITIAL_CASTING_GRADES.map(g => [g.id, g.name])));

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchMaterials().catch(() => INITIAL_MATERIALS),
      fetchCastingGrades().catch(() => INITIAL_CASTING_GRADES),
    ]).then(([materials, grades]) => {
      if (isMounted) {
        setMaterialsMap(new Map(materials.map((m) => [m.id, m.name])));
        setGradesMap(new Map(grades.map((g) => [g.id, g.name])));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isAllForging = (document.items && document.items.length > 0) ? document.items.every(item => item.quote?.segment === 'forging') : false;

  useEffect(() => {
    if (config.templateType === 'astemo_detail' && !isAllForging) {
      setConfig((prev) => ({ ...prev, templateType: 'disoco_standard' }));
    }
  }, [document.items, config.templateType, isAllForging]);

  const { hasSeparateDieItem } = getToolingColumnFlags(document.items, config);

  const toggleColumn = (key: keyof Omit<DocumentDisplayConfig, 'language' | 'remarks'>) => {
    if (readOnly) return;
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLanguageChange = (lang: 'vi' | 'en' | 'both') => {
    if (readOnly) return;
    setConfig((prev) => ({
      ...prev,
      language: lang,
    }));
  };

  const handleRemarkChange = (id: string, field: 'vi' | 'en', value: string) => {
    if (readOnly) return;
    setConfig((prev) => ({
      ...prev,
      remarks: prev.remarks.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  };

  const handleAddRemark = () => {
    if (readOnly) return;
    const newRemark: DocumentRemarkLine = {
      id: `remark-${Date.now()}`,
      vi: '',
      en: '',
    };
    setConfig((prev) => ({
      ...prev,
      remarks: [...prev.remarks, newRemark],
    }));
  };

  const handleRemoveRemark = (id: string) => {
    if (readOnly) return;
    setConfig((prev) => ({
      ...prev,
      remarks: prev.remarks.filter((r) => r.id !== id),
    }));
  };

  const handleMoveRemark = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const newRemarks = [...config.remarks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRemarks.length) return;

    const temp = newRemarks[index];
    newRemarks[index] = newRemarks[targetIndex];
    newRemarks[targetIndex] = temp;

    setConfig((prev) => ({
      ...prev,
      remarks: newRemarks,
    }));
  };

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      if (config.templateType === 'astemo_detail') {
        await generateAstemoQuotationPdf(liveDocument, materialsMap, gradesMap);
      } else {
        await generateQuotationPdf(liveDocument, materialsMap, gradesMap);
      }
    } catch (err: any) {
      console.error('Lỗi xuất PDF:', err);
      toast.error(`❌ Không thể tạo file PDF: ${err?.message || err}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className={`w-full min-w-0 grid grid-cols-1 ${!readOnly ? 'lg:grid-cols-12 gap-6' : 'gap-0'}`}>
      {/* Left Column: Control Settings Panel */}
      {!readOnly && (
        <div className="lg:col-span-4 min-w-0 flex flex-col space-y-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[10px] p-4 text-xs">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#111111]" />
              <h3 className="font-bold text-sm text-[#111111]">Tùy Chỉnh Hiển Thị Thư Báo Giá</h3>
            </div>
          </div>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[calc(100vh-230px)]">
          {/* Section 0: Thông Tin Văn Bản & Điều Khoản Thương Mại */}
          <div className="space-y-1.5 bg-white p-3 border border-[#EAEAEA] rounded-[8px]">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-2">
              0. Thông Tin Văn Bản & Điều Khoản
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-[#787774] uppercase mb-1">Attn *</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={docFields.contact_person}
                    onChange={(e) => setDocFields(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full p-1.5 border border-[#EAEAEA] bg-white rounded-[4px] text-[11px] text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#787774] uppercase mb-1">Ngày lập văn bản *</label>
                  <input
                    type="date"
                    disabled={readOnly}
                    value={docFields.quotation_date}
                    onChange={(e) => setDocFields(prev => ({ ...prev, quotation_date: e.target.value }))}
                    className="w-full p-1.5 border border-[#EAEAEA] bg-white rounded-[4px] text-[11px] font-mono text-[#111111]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-[#787774] uppercase mb-1">Trade Terms</label>
                  <select
                    disabled={readOnly}
                    value={docFields.trade_terms}
                    onChange={(e) => setDocFields(prev => ({ ...prev, trade_terms: e.target.value as TradeTermType }))}
                    className="w-full p-1.5 border border-[#EAEAEA] bg-white rounded-[4px] text-[11px] font-bold text-[#111111]"
                  >
                    {['EXW', 'FOB', 'CIF', 'DAP'].map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#787774] uppercase mb-1">Tiền tệ & Tỷ giá</label>
                  <div className="flex space-x-2">
                    <select
                      disabled={readOnly}
                      value={docFields.currency}
                      onChange={(e) => setDocFields(prev => ({ ...prev, currency: e.target.value as CurrencyType }))}
                      className="w-1/3 p-1.5 border border-[#EAEAEA] bg-white rounded-[4px] text-[11px] font-bold text-[#111111]"
                    >
                      {['VND', 'USD', 'EUR', 'JPY'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {docFields.currency !== 'VND' && (
                      <input
                        type="number"
                        min="1"
                        disabled={readOnly}
                        value={docFields.exchange_rate}
                        onChange={(e) => setDocFields(prev => ({ ...prev, exchange_rate: Number(e.target.value) }))}
                        className="w-2/3 p-1.5 border border-[#EAEAEA] bg-white rounded-[4px] font-mono text-[11px] text-[#111111]"
                        placeholder="Tỷ giá"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Mẫu Báo Giá */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
              1. Mẫu Báo Giá
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, templateType: 'disoco_standard' }))}
                className={`py-1.5 px-2 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all ${
                  (config.templateType || 'disoco_standard') === 'disoco_standard'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]'
                }`}
              >
                DISOCO (Chuẩn)
              </button>
              
              <div 
                className="relative w-full"
                title={isAllForging ? '' : 'Mẫu Astemo hiện tại chỉ hỗ trợ báo giá Rèn Dập (100% các mặt hàng trong báo giá phải là Rèn Dập).'}
              >
                <button
                  type="button"
                  disabled={!isAllForging}
                  onClick={() => setConfig((prev) => ({ ...prev, templateType: 'astemo_detail' }))}
                  className={`w-full py-1.5 px-2 rounded-[6px] border text-[11px] font-semibold transition-all ${
                    !isAllForging
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : config.templateType === 'astemo_detail'
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]'
                  }`}
                >
                  Astemo (Chi tiết công đoạn)
                </button>
              </div>
            </div>
          </div>

          {/* Section 1b: Language */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
              2. Ngôn Ngữ Hiển Thị
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'both', label: 'Song Ngữ (VI/EN)' },
                { key: 'vi', label: 'Tiếng Việt' },
                { key: 'en', label: 'Tiếng Anh' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleLanguageChange(opt.key as any)}
                  className={`py-1.5 px-2 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all ${
                    config.language === opt.key
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Form Layout Orientation (Dọc vs Ngang) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
              2. Định Dạng Form Báo Giá (Dọc / Ngang)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setConfig((prev) => ({ ...prev, layoutOrientation: 'portrait' }))}
                className={`py-2 px-3 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
                  (config.layoutOrientation || 'portrait') === 'portrait'
                    ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                    : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]'
                }`}
              >
                <span>📄 Form Dọc (Portrait)</span>
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setConfig((prev) => ({ ...prev, layoutOrientation: 'landscape' }))}
                className={`py-2 px-3 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
                  config.layoutOrientation === 'landscape'
                    ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                    : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]'
                }`}
              >
                <span>🖼️ Form Ngang (Landscape)</span>
              </button>
            </div>
          </div>

          {/* Section 3: Columns Visibility */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
              3. Ẩn / Hiện Cột Trong Bảng Chi Phí
            </label>
            <div className="grid grid-cols-2 gap-2 bg-white p-3 border border-[#EAEAEA] rounded-[8px]">
              {[
                { key: 'showWeightChi', label: 'Trọng lượng chi' },
                { key: 'showWeightPhoi', label: 'Trọng lượng phôi' },
                { key: 'showWeightTinh', label: 'Trọng lượng tinh' },
                { key: 'showMOQ', label: 'Quy mô lô (MOQ)' },
                { key: 'showMaterialCost', label: 'Chi phí Vật tư' },
                { key: 'showFormingCost', label: 'Phí chế tạo' },
                { key: 'showMachiningCost', label: 'Phí gia công CNC' },
                { key: 'showHeatTreatCost', label: 'Phí nhiệt luyện' },
                { key: 'showPaintCost', label: 'Phí sơn/bề mặt' },
                { key: 'showPackageCost', label: 'Phí bao gói' },
                { key: 'showDeliveryCost', label: 'Phí vận chuyển' },
                { key: 'showSgaP', label: 'Quản lý & Lợi nhuận' },
                { key: 'showToolingPrice', label: 'Tiền khuôn / mẫu' },
                { key: 'showToolingUsage', label: 'Tuổi thọ khuôn' },
              ].map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center space-x-2 text-[11px] font-medium text-[#111111] cursor-pointer hover:text-black ${(!hasSeparateDieItem && (col.key === 'showToolingPrice' || col.key === 'showToolingUsage')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    disabled={readOnly || (!hasSeparateDieItem && (col.key === 'showToolingPrice' || col.key === 'showToolingUsage'))}
                    checked={!!(config as any)[col.key]}
                    onChange={() => toggleColumn(col.key as any)}
                    className="rounded accent-[#111111] w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Custom Remarks / Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
                4. Ghi Chú & Điều Khoản (Remarks)
              </label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddRemark}
                  className="text-[10px] font-bold text-[#111111] hover:underline inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm dòng</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {config.remarks.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="p-2.5 bg-white border border-[#EAEAEA] rounded-[8px] space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#787774]">
                      Dòng {idx + 1}
                    </span>
                    {!readOnly && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveRemark(idx, 'up')}
                          className="p-0.5 text-[#787774] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                          title="Chuyển lên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === config.remarks.length - 1}
                          onClick={() => handleMoveRemark(idx, 'down')}
                          className="p-0.5 text-[#787774] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                          title="Chuyển xuống"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRemark(r.id)}
                          className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer ml-1"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      disabled={readOnly}
                      value={r.vi}
                      onChange={(e) => handleRemarkChange(r.id, 'vi', e.target.value)}
                      placeholder="Nội dung Tiếng Việt..."
                      className="w-full p-1.5 border border-[#EAEAEA] rounded text-[11px] text-[#111111] bg-[#FBFBFA] focus:bg-white"
                    />
                    <input
                      type="text"
                      disabled={readOnly}
                      value={r.en}
                      onChange={(e) => handleRemarkChange(r.id, 'en', e.target.value)}
                      placeholder="English description..."
                      className="w-full p-1.5 border border-[#EAEAEA] rounded text-[11px] text-[#111111] bg-[#FBFBFA] focus:bg-white font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Footer Controls */}
        <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 border border-[#EAEAEA] bg-white hover:bg-[#F0F0EE] text-[#111111] font-semibold rounded-[6px] inline-flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <div />
          )}

            <ActionButton
              type="button"
              disabled={isSubmitting || !docFields.contact_person.trim() || !docFields.quotation_date}
              onClick={() => onSaveAndSend(config, docFields)}
              variant="primary"
              icon={<Check className="text-emerald-400 stroke-[2.5]" />}
              label={isSubmitting ? 'Đang Phát Hành...' : 'Xác Nhận & Gửi Báo Giá'}
            />
        </div>
      </div>
      )}

      {/* Right Column: Live Document Preview */}
      <div className={`${!readOnly ? 'lg:col-span-8' : ''} min-w-0 border border-[#EAEAEA] rounded-[10px] overflow-hidden flex flex-col bg-slate-100 shadow-inner`}>
        <div className="px-4 py-2.5 bg-white border-b border-[#EAEAEA] flex items-center justify-between text-[11px] font-bold text-[#787774] shrink-0">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-[#111111]" />
            <span>XEM TRƯỚC BÁO GIÁ THỜI GIAN THỰC (LIVE PREVIEW)</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {config.layoutOrientation === 'landscape' ? 'Form Ngang (Landscape)' : 'Form Dọc (Portrait)'}
            </span>
            {readOnly && (
              <div className="flex items-center space-x-2 border-l border-[#EAEAEA] pl-3">
                  <ActionButton
                    disabled={isExportingPdf}
                    onClick={handleDownloadPDF}
                    variant="neutral"
                    icon={Download}
                    label={isExportingPdf ? 'Đang Tạo File PDF...' : 'Tải File PDF Trực Tiếp'}
                  />
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-3 py-1.5 bg-white hover:bg-[#F0F0EE] border border-[#EAEAEA] text-[#111111] font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay Lại</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] p-4">
          {config.templateType === 'astemo_detail' ? (
            <AstemoQuotationPdfContent document={liveDocument} config={config} materialsMap={materialsMap} gradesMap={gradesMap} />
          ) : (
            <QuotationPdfContent document={liveDocument} config={config} materialsMap={materialsMap} gradesMap={gradesMap} />
          )}
        </div>
      </div>
    </div>
  );
};
