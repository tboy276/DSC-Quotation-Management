import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuotationStore } from '../store/useQuotationStore';
import type { SegmentType } from '../store/useQuotationStore';
import { saveQuoteDraft, updateQuoteStatus, fetchQuoteByItemId } from '../lib/quotation-service';
import type { QuoteRecord, RfqItemRecord, RfqDossier } from '../types/quote';

export function usePricingCalculator(fixedSegment: SegmentType) {
  const navigate = useNavigate();
  const { rfqItemId } = useParams();
  const activeRfqItemId = rfqItemId || null;

  const setRfqField = useQuotationStore((state) => state.setRfqField);
  const setSegment = useQuotationStore((state) => state.setSegment);
  const rfq = useQuotationStore((state) => state.rfq);
  const currency = useQuotationStore((state) => state.currency);
  const exchangeRate = useQuotationStore((state) => state.exchange_rate);
  
  const forgingInput = useQuotationStore((state) => state.forgingInput);
  const castingInput = useQuotationStore((state) => state.castingInput);
  const sawingInput = useQuotationStore((state) => state.sawingInput);
  const machiningInput = useQuotationStore((state) => state.machiningInput);

  const getForgingResult = useQuotationStore((state) => state.getForgingResult);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);
  const getSawingResult = useQuotationStore((state) => state.getSawingResult);
  const getMachiningResult = useQuotationStore((state) => state.getMachiningResult);
  
  const cloneInputsFromQuote = useQuotationStore((state) => state.cloneInputsFromQuote);

  const [activeItemRecord, setActiveItemRecord] = useState<RfqItemRecord | null>(null);
  const [activeDossierRecord, setActiveDossierRecord] = useState<RfqDossier | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | undefined>();
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Load Data
  useEffect(() => {
    // Explicitly set the store segment to the page's fixed segment
    setSegment(fixedSegment);
    
    if (!activeRfqItemId) {
      setMsg({
        type: 'warning',
        text: 'Vui lòng chọn 1 dòng sản phẩm từ Quản Lý RFQ để bắt đầu tính giá.',
      });
      return;
    }

    loadActiveItemDetails(activeRfqItemId);
  }, [activeRfqItemId, fixedSegment, setSegment]);

  const resetSegmentInput = useQuotationStore((state) => state.resetSegmentInput);

  const loadActiveItemDetails = async (itemId: string) => {
    try {
      const target = await fetchQuoteByItemId(itemId);
      if (target) {
        setActiveItemRecord(target.rfqItem || null);
        setActiveDossierRecord(target.rfq || null);
        setCurrentQuoteId(target.id);

        if (target.rfq?.customer_name) setRfqField('customer_name', target.rfq.customer_name);
        if (target.rfqItem?.product_name) setRfqField('product_name', target.rfqItem.product_name);
        if (target.rfqItem?.annual_volume) setRfqField('annual_volume', target.rfqItem.annual_volume);
        if (target.rfqItem?.target_price) setRfqField('target_price', target.rfqItem.target_price);

        if (target.inputs_json && typeof target.inputs_json === 'object' && Object.keys(target.inputs_json).length > 0) {
          cloneInputsFromQuote(target);
          setTimeout(() => {
            const { inp } = getPayloads();
            setInitialSnapshot(JSON.stringify(inp));
          }, 0);
        } else {
          resetSegmentInput(fixedSegment);
          setTimeout(() => {
            const { inp } = getPayloads();
            setInitialSnapshot(JSON.stringify(inp));
          }, 0);
        }

        // CLEAR BANNER LỖI/CẢNH BÁO KHI LOAD THÀNH CÔNG (YÊU CẦU CỦA USER)
        setMsg(null);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: `Lỗi tải dữ liệu báo giá: ${err.message || err}` });
    }
  };

  const getPayloads = () => {
    let inp: any = null;
    let res: any = null;

    if (fixedSegment === 'forging') {
      inp = forgingInput;
      res = getForgingResult();
    } else if (fixedSegment === 'casting') {
      inp = castingInput;
      res = getCastingResult();
    } else if (fixedSegment === 'sawing') {
      inp = sawingInput;
      res = getSawingResult();
    } else if (fixedSegment === 'machining') {
      inp = machiningInput;
      res = getMachiningResult();
    }

    const rfqPayload = {
      id: activeRfqItemId || undefined,
      product_name: activeItemRecord?.product_name || rfq.product_name,
      annual_volume: activeItemRecord?.annual_volume || rfq.annual_volume,
      target_price: activeItemRecord?.target_price || rfq.target_price,
      customer_name: activeDossierRecord?.customer_name || rfq.customer_name,
    };

    return { inp, res, rfqPayload };
  };

  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  // Compute isDirty
  const { inp: currentInp } = getPayloads();
  const isDirty = initialSnapshot !== '' && initialSnapshot !== JSON.stringify(currentInp);

  const handleSaveDraft = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { inp, res, rfqPayload } = getPayloads();
      const record = await saveQuoteDraft(rfqPayload, fixedSegment, currency, exchangeRate, inp, res, currentQuoteId, 'IN_COSTING');
      setCurrentQuoteId(record.id);
      setInitialSnapshot(JSON.stringify(inp)); // Update snapshot after save

      setMsg({
        type: 'success',
        text: `Đã lưu bản nháp tính giá thành công! (Mã quote: #${record.id.substring(0, 8)})`,
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ LỖI LƯU TÍNH GIÁ: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteCosting = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { inp, res, rfqPayload } = getPayloads();
      const record = await saveQuoteDraft(rfqPayload, fixedSegment, currency, exchangeRate, inp, res, currentQuoteId, 'READY_FOR_QUOTE');
      await updateQuoteStatus(record.id, 'READY_FOR_QUOTE');
      setInitialSnapshot(JSON.stringify(inp));

      setMsg({
        type: 'success',
        text: `Đã hoàn thành tính giá! Trạng thái chuyển sang READY_FOR_QUOTE.`,
      });

      setTimeout(() => {
        navigate('/quotations');
      }, 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ LỖI HOÀN THÀNH TÍNH GIÁ: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCloneQuote = (selectedQuote: QuoteRecord) => {
    cloneInputsFromQuote(selectedQuote);
    setShowCloneModal(false);
    // Note: We don't update snapshot here so it becomes dirty immediately
    setMsg({ type: 'success', text: `Đã sao chép cấu hình từ báo giá #${selectedQuote.id.substring(0, 8)}` });
  };

  return {
    activeRfqItemId,
    activeItemRecord,
    activeDossierRecord,
    currentQuoteId,
    saving,
    msg,
    setMsg,
    showCloneModal,
    setShowCloneModal,
    handleSaveDraft,
    handleCompleteCosting,
    handleSelectCloneQuote,
    navigate,
    isDirty
  };
}
