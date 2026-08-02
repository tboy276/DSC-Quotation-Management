import type { QuoteStatus } from '../../types/quote';

interface QuoteStatusBadgeProps {
  status: QuoteStatus | string;
  size?: 'sm' | 'md';
}

export const QuoteStatusBadge = ({ status, size = 'md' }: QuoteStatusBadgeProps) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let statusText = '';

  switch (status) {
    case 'DRAFT':
    case 'PENDING':
      colorClasses = 'bg-[#F0F0EE] text-[#787774] border border-[#EAEAEA]';
      statusText = 'Đang Tính Toán (DRAFT)';
      break;
    case 'SENT':
      colorClasses = 'bg-[#E1F3FE] text-[#1F6C9F] border border-[#BDE3FD]';
      statusText = 'Đã Gửi Khách (SENT)';
      break;
    case 'SUCCESSFUL':
    case 'APPROVED':
      colorClasses = 'bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]';
      statusText = 'Đã Thành Công (SUCCESSFUL)';
      break;
    case 'CANCELLED':
    case 'REJECTED':
      colorClasses = 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#FADBDC]';
      statusText = 'Đã Huỷ Bỏ (CANCELLED)';
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
