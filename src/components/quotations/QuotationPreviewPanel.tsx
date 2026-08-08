import React, { useState } from 'react';
import type { QuotationDocument, DocumentDisplayConfig, DocumentRemarkLine } from '../../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../../types/quotation-document';
import { QuotationPdfContent } from './QuotationPdfContent';
import { ArrowLeft, Check, Plus, Trash2, ArrowUp, ArrowDown, Eye, Sliders, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface QuotationPreviewPanelProps {
  document: QuotationDocument;
  initialConfig?: DocumentDisplayConfig;
  readOnly?: boolean;
  onBack?: () => void;
  onSaveAndSend: (config: DocumentDisplayConfig) => void;
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
  const [config, setConfig] = useState<DocumentDisplayConfig>(
    initialConfig || document.display_config || DEFAULT_DISPLAY_CONFIG
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
    const element = window.document.getElementById('quotation-pdf-content');
    if (!element) {
      alert('Không tìm thấy nội dung báo giá để xuất PDF.');
      return;
    }

    setIsExportingPdf(true);
    try {
      // 1. Render DOM sang Canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Tăng nét
        useCORS: true, // Cho phép tải logo Cloudinary
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const isLandscape = config.layoutOrientation === 'landscape';

      // 2. Khởi tạo jsPDF A4
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Căn chỉnh tỷ lệ ảnh vừa A4
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

      // 3. Tải file về máy
      const docId = document?.id || 'DISOCO';
      pdf.save(`DISOCO_Bao_Gia_${docId}.pdf`);
    } catch (err: any) {
      console.error('Lỗi xuất PDF:', err);
      alert(`❌ Không thể tạo file PDF: ${err?.message || err}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Control Settings Panel */}
      <div className="lg:col-span-4 min-w-0 flex flex-col space-y-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[10px] p-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#111111]" />
            <h3 className="font-bold text-sm text-[#111111]">Tùy Chỉnh Hiển Thị Thư Báo Giá</h3>
          </div>
          {readOnly && (
            <span className="px-2 py-0.5 bg-[#EAEAEA] text-[#787774] text-[10px] font-bold rounded">
              Chỉ xem (Đã gửi)
            </span>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[calc(100vh-230px)]">
          {/* Section 1: Language */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider">
              1. Ngôn Ngữ Hiển Thị
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
                { key: 'showWeight', label: 'Trọng lượng phôi' },
                { key: 'showMOQ', label: 'Quy mô lô (MOQ)' },
                { key: 'showFormingCost', label: 'Chi phí tạo phôi' },
                { key: 'showMachiningCost', label: 'Chi phí gia công' },
                { key: 'showPackageCost', label: 'Chi phí bao gói' },
                { key: 'showDeliveryCost', label: 'Chi phí vận chuyển' },
                { key: 'showSgaP', label: 'Quản lý & Lợi nhuận' },
                { key: 'showToolingPrice', label: 'Tiền khuôn / mẫu' },
                { key: 'showToolingUsage', label: 'Tuổi thọ khuôn' },
              ].map((col) => (
                <label
                  key={col.key}
                  className="flex items-center space-x-2 text-[11px] font-medium text-[#111111] cursor-pointer hover:text-black"
                >
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={!!(config as any)[col.key]}
                    onChange={() => toggleColumn(col.key as any)}
                    className="rounded accent-[#111111] w-3.5 h-3.5 cursor-pointer"
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

          {!readOnly ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onSaveAndSend(config)}
              className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer disabled:opacity-40 inline-flex items-center space-x-1.5 shadow-sm text-xs"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>{isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận & Gửi Báo Giá'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm text-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExportingPdf ? 'Đang Tạo File PDF...' : 'Tải File PDF Trực Tiếp'}</span>
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm text-xs"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Đóng</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Document Preview */}
      <div className="lg:col-span-8 min-w-0 border border-[#EAEAEA] rounded-[10px] overflow-hidden flex flex-col bg-slate-100 shadow-inner">
        <div className="px-4 py-2.5 bg-white border-b border-[#EAEAEA] flex items-center justify-between text-[11px] font-bold text-[#787774] shrink-0">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-[#111111]" />
            <span>XEM TRƯỚC BÁO GIÁ THỜI GIAN THỰC (LIVE PREVIEW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {config.layoutOrientation === 'landscape' ? 'Form Ngang (Landscape)' : 'Form Dọc (Portrait)'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] p-4">
          <QuotationPdfContent document={document} config={config} />
        </div>
      </div>
    </div>
  );
};
