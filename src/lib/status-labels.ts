export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'Chờ Đánh Giá Kỹ Thuật';
    case 'CANCELLED_NOT_FEASIBLE':
      return 'Không Khả Thi (Huỷ Ngay)';
    case 'IN_COSTING':
    case 'DRAFT':
      return 'Đang Tính Giá';
    case 'READY_FOR_QUOTE':
      return 'Sẵn Sàng Lên Báo Giá';
    case 'QUOTED_SENT':
    case 'SENT':
      return 'Đã Gửi Báo Giá';
    case 'SUCCESSFUL':
    case 'APPROVED':
      return 'Thành Công';
    case 'CANCELLED_AFTER_QUOTE':
    case 'CANCELLED':
    case 'REJECTED':
      return 'Từ Chối Sau Báo Giá';
    default:
      return status;
  }
};
