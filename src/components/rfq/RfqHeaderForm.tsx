import { useState } from 'react';
import { useQuotationStore, type TradeTermType } from '../../store/useQuotationStore';
import { createRfqDossierWithItems } from '../../lib/quotation-service';
import { useAuth } from '../../context/AuthContext';
import { User, Package, Globe, Plus, Trash2, Calendar, Clock, Check } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { NumberTextInput } from '../../components/ui/NumberTextInput';


export const RfqHeaderForm = () => {
  const rfq = useQuotationStore((state) => state.rfq);
  const setRfqField = useQuotationStore((state) => state.setRfqField);
  const { profile, user } = useAuth();
  const userEmail = profile?.email || user?.email || 'sales@disoco.vn';

  // Dossier Header State
  const [rfqReceivedDate, setRfqReceivedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customerDeadline, setCustomerDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );

  // Multi-item Dossier List State
  const [dossierItems, setDossierItems] = useState<
    Array<{
      id: string;
      product_name: string;
      part_number: string;
      annual_volume?: number;
      target_price?: number;
      is_feasible: boolean;
      cancel_reason?: string;
    }>
  >([
    {
      id: 'item-init',
      product_name: rfq.product_name || 'Bánh Răng D450',
      part_number: 'BR-D450-01',
      annual_volume: rfq.annual_volume || 10000,
      target_price: rfq.target_price || 95000,
      is_feasible: true,
    },
  ]);

  const [dossierSuccessMsg, setDossierSuccessMsg] = useState<string | null>(null);
  const [isSubmittingDossier, setIsSubmittingDossier] = useState<boolean>(false);

  const tradeTerms: TradeTermType[] = ['EXW', 'FOB', 'CIF', 'DAP'];

  // Add Item to Dossier Form
  const handleAddItemToDossier = () => {
    setDossierItems([
      ...dossierItems,
      {
        id: `item-${Date.now()}`,
        product_name: `Sản phẩm ${dossierItems.length + 1}`,
        part_number: `PN-0${dossierItems.length + 1}`,
        annual_volume: 5000,
        target_price: 50000,
        is_feasible: true,
      },
    ]);
  };

  // Remove Item from Dossier Form
  const handleRemoveItem = (id: string) => {
    if (dossierItems.length <= 1) return;
    setDossierItems(dossierItems.filter((it) => it.id !== id));
  };

  // Submit Dossier
  const handleSaveDossierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq.customer_name.trim()) return;

    setIsSubmittingDossier(true);
    await createRfqDossierWithItems(
      {
        customer_name: rfq.customer_name.trim(),
        rfq_received_date: rfqReceivedDate,
        customer_deadline: customerDeadline,
        trade_terms: rfq.trade_terms,
      },
      dossierItems,
      userEmail
    );
    setIsSubmittingDossier(false);

    setDossierSuccessMsg(
      `Đã khởi tạo thành công Hồ Sơ RFQ cho "${rfq.customer_name}" gồm ${dossierItems.length} mã sản phẩm!`
    );

    // Sync first feasible product into active calculation store
    const firstFeasible = dossierItems.find((it) => it.is_feasible);
    if (firstFeasible) {
      setRfqField('product_name', firstFeasible.product_name);
      setRfqField('annual_volume', firstFeasible.annual_volume);
      setRfqField('target_price', firstFeasible.target_price);
    }

    setTimeout(() => {
      setDossierSuccessMsg(null);
    }, 3500);
  };

  return (
    <div className="bg-white p-5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EAEAEA] pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Bước 1: Khởi Tạo Hồ Sơ RFQ Khách Hàng (Dossier Header & Multi-Product Items)
          </h3>
        </div>
        <span className="text-[10px] text-[#787774] font-mono">
          Người nhập: {userEmail}
        </span>
      </div>

      {dossierSuccessMsg && (
        <div className="p-3 bg-[#EDF3EC] border border-[#C6E1C4] rounded-[8px] text-[#346538] text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{dossierSuccessMsg}</span>
        </div>
      )}

      {/* 1. Dossier Header Level Inputs */}
      <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-3">
        <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
          1. Thông Tin Hồ Sơ RFQ Khách Hàng (Dossier Header)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Tên khách hàng */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tên Khách Hàng (Customer Company) *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
              <input
                type="text"
                required
                value={rfq.customer_name}
                onChange={(e) => setRfqField('customer_name', e.target.value)}
                placeholder="Nhập tên công ty / đối tác"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-bold text-[#111111] focus:outline-none"
              />
            </div>
          </div>

          {/* Ngày nhận RFQ thực tế */}
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Ngày Nhận RFQ (Customer Email Date)
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
              <input
                type="date"
                required
                value={rfqReceivedDate}
                onChange={(e) => setRfqReceivedDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111]"
              />
            </div>
          </div>

          {/* Deadline trả báo giá */}
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Customer Deadline
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
              <input
                type="date"
                required
                value={customerDeadline}
                onChange={(e) => setCustomerDeadline(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111]"
              />
            </div>
          </div>
        </div>

        {/* Trade Terms Segmented Button */}
        <div>
          <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1 flex items-center">
            <Globe className="w-3 h-3 mr-1" />
            Điều Kiện Giao Hàng (Trade Terms)
          </label>
          <div className="inline-flex p-1 bg-white rounded-[6px] border border-[#EAEAEA]">
            {tradeTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setRfqField('trade_terms', term)}
                className={`px-3 py-0.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  rfq.trade_terms === term
                    ? 'bg-[#111111] text-white'
                    : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. List of Products inside Dossier */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
            2. Danh Sách {dossierItems.length} Mã Sản Phẩm Trong Hồ Sơ (Product Line Items)
          </h4>

          <ActionButton
            type="button"
            onClick={handleAddItemToDossier}
            variant="primary"
            icon={Plus}
            label="+ Thêm Mã Sản Phẩm"
          />
        </div>

        <div className="space-y-3">
          {dossierItems.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 bg-white border border-[#EAEAEA] rounded-[8px] space-y-3 shadow-2xs hover:border-[#111111]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111] text-xs flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#F0F0EE] text-[#111111] font-mono flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>Sản phẩm #{idx + 1}</span>
                </span>

                {dossierItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-[#9F2F2D] hover:bg-[#FDEBEC] rounded cursor-pointer"
                    title="Xoá dòng sản phẩm này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Product Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Tên Sản Phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.product_name}
                    onChange={(e) => {
                      const updated = [...dossierItems];
                      updated[idx].product_name = e.target.value;
                      setDossierItems(updated);
                      if (idx === 0) setRfqField('product_name', e.target.value);
                    }}
                    placeholder="Tên sản phẩm"
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-semibold text-[#111111]"
                  />
                </div>

                {/* Part Number / Code */}
                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Part Number / Kí Hiệu *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.part_number}
                    onChange={(e) => {
                      const updated = [...dossierItems];
                      updated[idx].part_number = e.target.value;
                      setDossierItems(updated);
                    }}
                    placeholder="Ví dụ: K20-CRK-01"
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-mono font-bold text-[#111111]"
                  />
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Sản Lượng (Pcs/năm)
                  </label>
                  <NumberTextInput
                    min="1"
                    value={item.annual_volume}
                    onChange={(e) => {
                        const parsed = Number.isNaN(e) ? undefined : Math.max(1, e);
                        const updated = [...dossierItems];
                        updated[idx].annual_volume = parsed;
                        setDossierItems(updated);
                        if (idx === 0) setRfqField('annual_volume', parsed);
                      }}
                      allowEmpty
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs font-bold text-[#111111]"
                  />
                </div>

                {/* Target Price */}
                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Target Price (VNĐ)
                  </label>
                  <NumberTextInput
                    min="0"
                    step="1000"
                    value={item.target_price}
                    onChange={(e) => {
                        const parsed = Number.isNaN(e) ? undefined : Math.max(0, e);
                        const updated = [...dossierItems];
                        updated[idx].target_price = parsed;
                        setDossierItems(updated);
                        if (idx === 0) setRfqField('target_price', parsed);
                      }}
                      allowEmpty
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs font-extrabold text-[#111111]"
                  />
                </div>
              </div>

              {/* Feasibility Check for Each Item */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F0EE]">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-[10px] font-bold text-[#787774] uppercase">Khả thi:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...dossierItems];
                      updated[idx].is_feasible = true;
                      setDossierItems(updated);
                    }}
                    className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer border ${
                      item.is_feasible
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#787774] border-[#EAEAEA]'
                    }`}
                  >
                    ✓ Có thể tính giá
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...dossierItems];
                      updated[idx].is_feasible = false;
                      setDossierItems(updated);
                    }}
                    className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer border ${
                      !item.is_feasible
                        ? 'bg-[#FDEBEC] text-[#9F2F2D] border-[#FADBDC]'
                        : 'bg-white text-[#787774] border-[#EAEAEA]'
                    }`}
                  >
                    ✕ Huỷ ngay (Không tính giá)
                  </button>
                </div>

                {!item.is_feasible && (
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      required
                      value={item.cancel_reason || ''}
                      onChange={(e) => {
                        const updated = [...dossierItems];
                        updated[idx].cancel_reason = e.target.value;
                        setDossierItems(updated);
                      }}
                      placeholder="Bắt buộc nhập lý do không khả thi / huỷ bỏ..."
                      className="w-full px-2.5 py-1 bg-[#FDEBEC] border border-[#FADBDC] rounded-[4px] text-xs text-[#9F2F2D] font-mono font-medium focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Submit Action Button */}
      <div className="flex justify-end pt-2 border-t border-[#EAEAEA]">
        <ActionButton
          type="button"
          onClick={handleSaveDossierSubmit}
          disabled={isSubmittingDossier || !rfq.customer_name.trim()}
          variant="primary"
          icon={Check}
          label={isSubmittingDossier ? 'Đang Khởi Tạo Hồ Sơ...' : `Khởi Tạo Hồ Sơ RFQ (${dossierItems.length} Sản Phẩm)`}
        />
      </div>
    </div>
  );
};
