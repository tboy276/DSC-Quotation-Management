import { useState, useEffect } from 'react';
import type { QuoteRecord } from '../../types/quote';
import { fetchPaginatedQuotes } from '../../lib/quotation-service';
import { formatCurrencyValue } from './RealtimeSummaryPanel';
import { formatDate } from '../../lib/format-date';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { Search, Copy } from 'lucide-react';

interface CloneQuoteModalProps {
  segment: 'forging' | 'casting' | 'sawing' | 'machining';
  onClose: () => void;
  onSelectQuote: (quote: QuoteRecord) => void;
}

export const CloneQuoteModal = ({ segment, onClose, onSelectQuote }: CloneQuoteModalProps) => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadSegmentQuotes();
  }, [segment]);

  const loadSegmentQuotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await fetchPaginatedQuotes({ segment, page: 1, pageSize: 500 });
      setQuotes(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu báo giá.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = searchQuery.trim()
    ? quotes.filter(
        (q) =>
          q.rfq?.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.rfqItem?.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.rfqItem?.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.inputs_json as any)?.selected_material_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.inputs_json as any)?.selected_casting_grade_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quotes;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      icon={<Copy className="w-3.5 h-3.5" />}
      title={`Sao Chép Từ Báo Giá Cũ Tương Tự (${segment === 'forging' ? 'Rèn Dập' : 'Đúc Gang'})`}
      subtitle="Chọn 1 bản ghi báo giá quá khứ để nạp sẵn toàn bộ thông số 5 Section vào form"
      footer={
        <ActionButton
          variant="neutral"
          onClick={onClose}
          label="Đóng"
        />
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[8px] text-sm font-medium flex items-center">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#787774]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, Part Number, tên khách hàng hoặc mác thép/gang..."
            className="w-full pl-9 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#111111]"
          />
        </div>

        {/* List of Previous Quotes */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-center py-6 text-[#787774]">Đang tải lịch sử báo giá...</p>
          ) : filteredQuotes.length === 0 ? (
            <p className="text-center py-6 text-[#787774] italic">
              Không tìm thấy bản ghi báo giá {segment === 'forging' ? 'Rèn Dập' : 'Đúc Gang'} nào phù hợp.
            </p>
          ) : (
            filteredQuotes.map((q) => {
              const item = q.rfqItem;
              const inputs = (q.inputs_json || {}) as any;
              return (
                <div
                  key={q.id}
                  onClick={() => onSelectQuote(q)}
                  className="p-3 border border-[#EAEAEA] rounded-[8px] hover:border-[#111111] hover:shadow-xs transition-all cursor-pointer bg-white group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#111111]">
                          {item?.item_code || `${q.rfq?.rfq_code || 'RFQ'}-01`}
                        </span>
                        <span className="text-[#787774]">|</span>
                        <span className="font-bold text-[#111111]">
                          {item?.product_name || 'Sản phẩm'}
                        </span>
                        <span className="text-[10px] text-[#787774]">
                          (PN: {item?.part_number || 'N/A'})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#787774] mt-0.5">
                        Khách hàng: <strong>{q.rfq?.customer_name || 'N/A'}</strong> | Ngày tính: {formatDate((q as any).updated_at || q.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-extrabold text-[#111111]">
                        {formatCurrencyValue(q.final_quoted_price || 0, 'VND', 1)}
                      </p>
                      <span className="text-[10px] text-[#346538] font-bold">
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#F0F0EE] flex items-center justify-between text-[10px] text-[#787774]">
                    <div className="flex items-center space-x-3">
                      <span>Mác vật tư: <strong className="text-[#111111]">{inputs.selected_material_id || inputs.selected_casting_grade_id || 'N/A'}</strong></span>
                      <span>Trọng lượng: <strong className="text-[#111111] font-mono">{inputs.finished_weight_kg || inputs.casting_weight_kg || 0} kg</strong></span>
                    </div>

                    <ActionButton
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      label="Chọn Nạp"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
