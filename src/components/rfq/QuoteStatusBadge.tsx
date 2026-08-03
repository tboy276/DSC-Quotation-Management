import type { RfqItemStatus, QuoteStatus } from '../../types/quote';

interface QuoteStatusBadgeProps {
  status: RfqItemStatus | QuoteStatus | string;
  size?: 'sm' | 'md';
}

export const QuoteStatusBadge = ({ status, size = 'md' }: QuoteStatusBadgeProps) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let statusText = '';

  switch (status) {
    case 'PENDING_REVIEW':
      colorClasses = 'bg-[#FBF3DB] text-[#956400] border border-[#F5E5B8]';
      statusText = 'Chờ Đánh Giá Kỹ Thuật';
      break;
    case 'CANCELLED_NOT_FEASIBLE':
      colorClasses = 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#FADBDC]';
      statusText = 'Không Khả Thi (Huỷ Ngay)';
      break;
    case 'IN_COSTING':
    case 'DRAFT':
      colorClasses = 'bg-[#F0F0EE] text-[#787774] border border-[#EAEAEA]';
      statusText = 'Đang Tính Giá';
      break;
    case 'READY_FOR_QUOTE':
      colorClasses = 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]';
      statusText = 'Sẵn Sàng Lên Báo Giá';
      break;
    case 'QUOTED_SENT':
    case 'SENT':
      colorClasses = 'bg-[#E1F3FE] text-[#1F6C9F] border border-[#BDE3FD]';
      statusText = 'Đã Gửi Báo Giá';
      break;
    case 'SUCCESSFUL':
    case 'APPROVED':
      colorClasses = 'bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]';
      statusText = 'Thành Công';
      break;
    case 'CANCELLED_AFTER_QUOTE':
    case 'CANCELLED':
    case 'REJECTED':
      colorClasses = 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#FADBDC]';
      statusText = 'Từ Chối Sau Báo Giá';
      break;
    default:
      colorClasses = 'bg-[#F0F0EE] text-[#787774] border border-[#EAEAEA]';
      statusText = status;
  }

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {statusText}
    </span>
  );
};
