import { getStatusLabel } from './status-labels';
import { supabase } from './supabase';

/**
 * Log an audit event to the audit_log table.
 * This is a fire-and-forget function that will not throw errors to the caller.
 *
 * @param action - The action performed (e.g. 'DELETE_RFQ', 'VOID_DOCUMENT')
 * @param tableName - The main table affected
 * @param recordId - The ID of the affected record (optional)
 * @param details - Additional details as a JSON object (optional)
 */
export const logAudit = async (
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Fallback to 'System' if no user is found, though policies require authenticated user
    const actorEmail = session?.user?.email || 'System';

    if (sessionError) {
      console.warn('AuditLog: Failed to get session', sessionError);
    }

    const { error } = await supabase.from('audit_log').insert({
      actor_email: actorEmail,
      action,
      table_name: tableName,
      record_id: recordId,
      details
    });

    if (error) {
      console.error('AuditLog: Failed to insert audit log', error);
    }
  } catch (err) {
    console.error('AuditLog: Unexpected error logging audit event', err);
  }
};

// Quy ước xuyên suốt: dùng đúng 3 từ theo vòng đời nghiệp vụ, không lẫn lộn:
// - "RFQ" (hỏi hàng): thao tác trên bảng rfqs/rfq_items
// - "Tính giá": thao tác trên bảng quotes (lưu nháp, gửi giá, đổi trạng thái)
// - "Báo giá": thao tác trên bảng quotation_documents (văn bản chính thức gửi khách)

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // RFQ
  CREATE_RFQ: 'Tạo RFQ',
  CREATE_RFQ_INFEASIBLE: 'Tạo RFQ (không khả thi)',
  UPDATE_RFQ_ITEM: 'Sửa RFQ',
  DELETE_RFQ: 'Xóa RFQ',
  // Tính giá
  SAVE_QUOTE_DRAFT: 'Lưu nháp tính giá',
  SEND_QUOTE: 'Gửi giá cho khách',
  UPDATE_QUOTE_STATUS: 'Đổi trạng thái tính giá',
  // Báo giá
  CREATE_DOCUMENT: 'Tạo báo giá',
  VOID_DOCUMENT: 'Thu hồi báo giá',
  UPDATE_DOCUMENT_CONFIG: 'Sửa hiển thị báo giá',
  REPRICE_DOCUMENT: 'Tái báo giá',
  // Vật tư
  CREATE_MATERIAL: 'Thêm vật tư',
  UPDATE_MATERIAL: 'Sửa vật tư',
  DELETE_MATERIAL: 'Xóa vật tư',
  UPDATE_MATERIAL_PRICE: 'Cập nhật giá vật tư',
  DELETE_MATERIAL_PRICE_HISTORY: 'Xóa lịch sử giá',
  CREATE_CASTING_GRADE: 'Thêm mác đúc',
  UPDATE_CASTING_GRADE: 'Sửa mác đúc',
  // BOM & khuôn
  CREATE_BOM: 'Thêm BOM',
  UPDATE_BOM: 'Sửa BOM',
  DELETE_BOM: 'Xóa BOM',
  CREATE_MOLDING_RECIPE: 'Thêm vật tư khuôn',
  UPDATE_MOLDING_RECIPE: 'Sửa vật tư khuôn',
  DELETE_MOLDING_RECIPE: 'Xóa vật tư khuôn',
  // Cước máy / đơn giá
  UPDATE_PRESS_RATE: 'Sửa cước máy dập',
  UPDATE_HAMMER_RATE: 'Sửa cước máy búa',
  UPDATE_SYSTEM_RATE: 'Sửa đơn giá hệ thống',
  UPDATE_CASTING_SETTINGS: 'Sửa cấu hình đúc',
  // Tài khoản
  UPDATE_USER_ROLE: 'Đổi vai trò',
  REVOKE_USER_PROFILE: 'Thu hồi quyền',
  ADD_ALLOWED_EMAIL: 'Thêm email cấp quyền',
  REMOVE_ALLOWED_EMAIL: 'Xóa email cấp quyền',
  // Hệ thống
  RESET_SYSTEM_DATA: '⚠️ Reset dữ liệu hệ thống',
};

export const getActionLabel = (action: string): string =>
  AUDIT_ACTION_LABELS[action] || action;

export const formatAuditDetails = (action: string, details: Record<string, any> | null): string => {
  const d = details || {};
  switch (action) {
    case 'CREATE_RFQ':
      return `Khách "${d.customer_name || ''}" - ${d.item_count || 0} sản phẩm`;
    case 'CREATE_RFQ_INFEASIBLE':
      return `"${d.product_name || ''}" - khách "${d.customer_name || ''}" (lý do: ${d.cancel_reason || 'N/A'})`;
    case 'UPDATE_RFQ_ITEM':
      return `Sản phẩm "${d.product_name || ''}"`;
    case 'DELETE_RFQ':
      return `${d.count || 0} RFQ`;
    case 'SAVE_QUOTE_DRAFT':
      return `Sản phẩm "${d.product_name || ''}"`;
    case 'SEND_QUOTE':
      return `Sản phẩm "${d.product_name || ''}"`;
    case 'UPDATE_QUOTE_STATUS':
      return `"${d.product_name || ''}" → ${d.new_status ? getStatusLabel(d.new_status) : ''}${d.cancel_reason ? ` (${d.cancel_reason})` : ''}`;
    case 'CREATE_DOCUMENT':
      return `RFQ "${d.rfq_code || ''}" - khách "${d.customer_name || ''}"`;
    case 'VOID_DOCUMENT':
      return `${d.document_code || ''} - khách "${d.customer_name || ''}"`;
    case 'UPDATE_DOCUMENT_CONFIG':
      return `Văn bản ${d.document_code || d.document_id || ''}`;
    case 'REPRICE_DOCUMENT':
      return `Từ văn bản ${d.document_code || ''} - khách "${d.customer_name || ''}"`;
    case 'CREATE_MATERIAL':
      return `"${d.name || ''}"`;
    case 'UPDATE_MATERIAL':
      return `"${d.name || ''}"`;
    case 'DELETE_MATERIAL':
      return `${d.count || 0} vật tư${d.names?.length ? `: ${d.names.join(', ')}` : ''}`;
    case 'CREATE_CASTING_GRADE':
      case 'UPDATE_CASTING_GRADE':
        return `"${d.name || ''}"`;
      case 'UPDATE_MATERIAL_PRICE':
      return `"${d.material_name || ''}" → ${Number(d.new_price || 0).toLocaleString('vi-VN')} đ`;
    case 'DELETE_MATERIAL_PRICE_HISTORY':
      return `Vật tư "${d.material_name || ''}"`;
    case 'CREATE_BOM':
      return `"${d.material_name || ''}" vào mác "${d.grade_name || ''}"`;
    case 'UPDATE_BOM':
      return `"${d.material_name || ''}" trong mác "${d.grade_name || ''}"`;
    case 'DELETE_BOM':
      return `${d.count || 0} thành phần khỏi mác "${d.grade_name || ''}"`;
    case 'CREATE_MOLDING_RECIPE':
      return `"${d.material_name || ''}"`;
    case 'UPDATE_MOLDING_RECIPE':
      return `"${d.material_name || ''}"`;
    case 'DELETE_MOLDING_RECIPE':
      return `"${d.material_name || ''}"`;
    case 'UPDATE_PRESS_RATE':
      return `"${d.label || ''}" → ${Number(d.rate_per_hour || 0).toLocaleString('vi-VN')} đ/giờ`;
    case 'UPDATE_HAMMER_RATE':
      return `"${d.label || ''}" → ${Number(d.rate_per_hour || 0).toLocaleString('vi-VN')} đ/giờ`;
    case 'UPDATE_SYSTEM_RATE':
      return `"${d.rate_name || ''}" → ${Number(d.new_value || 0).toLocaleString('vi-VN')}`;
    case 'UPDATE_CASTING_SETTINGS':
      return `Cấu hình xưởng đúc`;
    case 'UPDATE_USER_ROLE':
      return `"${d.target_email || ''}" → ${d.new_role || ''}`;
    case 'REVOKE_USER_PROFILE':
      return `"${d.email || ''}"`;
    case 'ADD_ALLOWED_EMAIL':
      return `"${d.email || ''}" (${d.role || ''})`;
    case 'REMOVE_ALLOWED_EMAIL':
      return `"${d.email || ''}"`;
    case 'RESET_SYSTEM_DATA':
      return `Toàn bộ dữ liệu RFQ/Tính giá/Báo giá`;
    default:
      return JSON.stringify(d);
  }
};
