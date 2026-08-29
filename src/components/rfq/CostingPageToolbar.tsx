import { ArrowLeft, Check, Copy, Save } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { formatDateVerbose } from '../../lib/format-date';

interface CostingPageToolbarProps {
  onBack: () => void;
  onClone: () => void;
  onSaveDraft: () => void;
  onComplete: () => void;
  saving: boolean;
  itemRecord: any;
  dossierRecord: any;
  rfqRecord: any;
  disableSave?: boolean;
  disableSaveReason?: string;
}

export const CostingPageToolbar = ({
  onBack,
  onClone,
  onSaveDraft,
  onComplete,
  saving,
  itemRecord,
  dossierRecord,
  rfqRecord,
  disableSave,
  disableSaveReason,
}: CostingPageToolbarProps) => {
  return (
    <div className="bg-[#FBFBFA] p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left Side: Product Info & Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ActionButton
          variant="neutral"
          icon={ArrowLeft}
          label="Quay lại"
          onClick={onBack}
          title="Quay lại danh sách RFQ"
        />

        <div className="h-4 w-[1px] bg-[#EAEAEA] hidden sm:block" />

        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-mono font-bold text-[#111111] text-xs">
              [{itemRecord?.item_code || 'N/A'}]
            </span>
            <h2 className="text-sm font-bold text-[#111111] tracking-tight">
              {itemRecord?.product_name || rfqRecord?.product_name || 'N/A'}
            </h2>
            <span className="font-mono text-xs text-[#787774]">
              (Part No: {itemRecord?.part_number || 'N/A'})
            </span>
            <QuoteStatusBadge status={itemRecord?.status || 'IN_COSTING'} size="sm" />
          </div>
          <div className="text-[11px] text-[#787774] flex items-center space-x-3">
            <span>Khách hàng: <strong className="text-[#111111]">{dossierRecord?.customer_name || rfqRecord?.customer_name || 'N/A'}</strong></span>
            <span>•</span>
            <span className="font-mono">Ngày nhận: {formatDateVerbose(dossierRecord?.rfq_received_date)}</span>
            <span>•</span>
            <span className="font-mono">Deadline: {dossierRecord?.customer_deadline ? new Date(dossierRecord.customer_deadline).toLocaleDateString('vi-VN') : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Right Side: Action Buttons with Tier grouping */}
      <div className="flex items-center space-x-2">
        <ActionButton
          variant="neutral"
          icon={Copy}
          onClick={onClone}
          title="Sao chép toàn bộ thông số từ báo giá cũ"
        />

        <ActionButton
          variant="neutral"
          icon={Save}
          label="Lưu nháp"
          onClick={onSaveDraft}
          disabled={saving || disableSave}
          title={disableSave ? disableSaveReason : "Lưu bản nháp tính giá (Save Draft)"}
        />

        <ActionButton
          variant="primary"
          icon={Check}
          label="Hoàn thành"
          onClick={onComplete}
          disabled={saving || disableSave}
          title={disableSave ? disableSaveReason : "Hoàn thành tính giá"}
        />
      </div>
    </div>
  );
};
