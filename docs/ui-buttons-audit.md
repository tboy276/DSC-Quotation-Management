# Phân Tích Các Nút Bấm (UI Buttons Audit)

| Tên nút | File/Component | Nhóm | Vị trí | Màu/Style hiện tại | Icon |
| --- | --- | --- | --- | --- | --- |
| Tất Cả | src/components/analytics/RfqAnalyticsReport.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ periodPreset === 'ALL' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| Tháng Này | src/components/analytics/RfqAnalyticsReport.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ periodPreset === 'MONTH' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| Quý Này | src/components/analytics/RfqAnalyticsReport.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ periodPreset === 'QUARTER' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| Năm Này | src/components/analytics/RfqAnalyticsReport.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ periodPreset === 'YEAR' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| {loading ? 'Đang Kiểm Tra...' | src/components/analytics/SystemHealthCheck.tsx | Khác (Chưa rõ) | Row-level | `px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50` | RefreshCw |
| Tải Lại Trang | src/components/ErrorBoundary.tsx | Khác | Row-level | `w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all cursor-pointer` | RefreshCw |
| Hủy | src/components/master-data/CastingBomManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Thêm Vào BOM | src/components/master-data/CastingBomManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| Hủy | src/components/master-data/CastingBomManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Cập Nhật Khối Lượng | src/components/master-data/CastingBomManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Toolbar | `savedSuccess ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : ''` | Không có |
| Thêm Vật Tư Khuôn | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| handleOpenEditRecipe(item)} ic | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Row-level | `p-1.5` | Không có |
| handleDeleteRecipe(item.id, it | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Row-level | `p-1.5` | Không có |
| Hủy | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/master-data/CastingOperationsRatesManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/master-data/CastingSettingsManager.tsx | CRUD cố định | Toolbar | `savedSuccess ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : ''` | Không có |
| Tất Cả () | src/components/master-data/EquipmentRatesManager.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 rounded-[4px] transition-colors ${ activeTab === 'all' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| Rèn & Cắt Phôi (6) | src/components/master-data/EquipmentRatesManager.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${ activeTab === 'forging' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]' }` | Hammer |
| Gia Công CNC (4) | src/components/master-data/EquipmentRatesManager.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${ activeTab === 'cnc' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]' }` | Cpu |
| Thiết Bị Đúc (0) | src/components/master-data/EquipmentRatesManager.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${ activeTab === 'casting' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]' }` | Factory |
| Sửa giá | src/components/master-data/EquipmentRatesManager.tsx | CRUD cố định | Row-level | `px-2.5 py-1` | Không có |
| Hủy | src/components/master-data/EquipmentRatesManager.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/master-data/EquipmentRatesManager.tsx | CRUD cố định | Toolbar | `saveSuccess ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : ''` | Không có |
| setActiveSubTab('press')} clas | src/components/master-data/ForgingRatesManager.tsx | Khác (Chưa rõ) | Row-level | `flex items-center space-x-1.5 px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ activeSubTab === 'press' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Shield |
| setActiveSubTab('hammer')} cla | src/components/master-data/ForgingRatesManager.tsx | Khác (Chưa rõ) | Row-level | `flex items-center space-x-1.5 px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ activeSubTab === 'hammer' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Hammer |
| Hủy | src/components/master-data/ForgingRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Dải Cước | src/components/master-data/ForgingRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Hủy | src/components/master-data/ForgingRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Dải Cước | src/components/master-data/ForgingRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| setActiveSubTab(tab.id as any) | src/components/master-data/MasterDataContainer.tsx | Khác (Chưa rõ) | Row-level | `flex items-center space-x-2 px-3.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${ isActive ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F0F0EE] text-[#787774] hover:bg-[#E0E0DE] hover:text-[#111111]' }` | Icon |
| Hủy | src/components/master-data/MaterialsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Thông Tin | src/components/master-data/MaterialsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Hủy | src/components/master-data/MaterialsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Giá Mới | src/components/master-data/MaterialsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Đóng | src/components/master-data/MaterialsManager.tsx | Khác | Modal | `(Không có class)` | Không có |
| handleDeleteHistoryRow(h.id)} | src/components/master-data/MaterialsManager.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| Thêm Dòng Vật Tư | src/components/master-data/MoldingRecipeManager.tsx | CRUD cố định | Toolbar | `px-3 py-2` | Không có |
| handleOpenEdit(item)} icon={Ed | src/components/master-data/MoldingRecipeManager.tsx | CRUD cố định | Row-level | `p-1.5` | Không có |
| handleDelete(item.id, item.mat | src/components/master-data/MoldingRecipeManager.tsx | CRUD cố định | Row-level | `p-1.5` | Không có |
| Hủy | src/components/master-data/MoldingRecipeManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/master-data/MoldingRecipeManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| Hủy | src/components/master-data/SystemRatesManager.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| Lưu Đơn Giá Mới | src/components/master-data/SystemRatesManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Đăng xuất | src/components/Navbar.tsx | Khác | Row-level | `flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 cursor-pointer` | LogOut |
| (Chỉ có icon/Tooltip) | src/components/PageHeader.tsx | Khác | Row-level | `p-1.5 rounded-[5px] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors cursor-pointer` | Search |
| (Chỉ có icon/Tooltip) | src/components/PageHeader.tsx | Khác (Chưa rõ) | Row-level | `p-1.5 rounded-[5px] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors relative cursor-pointer` | Bell |
| setShowResetModal(true)} class | src/components/PageHeader.tsx | Khác (Chưa rõ) | Modal | `px-2.5 py-1.5 flex items-center space-x-1.5 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm` | RotateCcw |
| setDropdownOpen(!dropdownOpen) | src/components/PageHeader.tsx | Khác (Chưa rõ) | Row-level | `flex items-center space-x-2 p-1 rounded-[6px] hover:bg-[#F7F6F3] transition-colors cursor-pointer` | ChevronDown |
| { setDropdownOpen(false); sign | src/components/PageHeader.tsx | Khác (Chưa rõ) | Row-level | `w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] transition-colors text-left cursor-pointer` | LogOut |
| Hủy | src/components/PageHeader.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/PageHeader.tsx | Khác (Chưa rõ) | Toolbar | `(Không có class)` | Không có |
| Hủy | src/components/quotations/CreateDocumentModal.tsx | CRUD cố định | Modal | `px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer` | Không có |
| {submitting ? 'Đang Phát Hành. | src/components/quotations/CreateDocumentModal.tsx | Khác (Chưa rõ) | Modal | `px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer disabled:opacity-40` | Check |
| Thu hồi để sửa | src/components/quotations/DocumentDetailModal.tsx | CRUD cố định | Modal | `px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-[6px] text-xs transition-colors cursor-pointer inline-flex items-center space-x-1 border border-red-200` | RotateCcw |
| setShowCustomizeModal(true)} c | src/components/quotations/DocumentDetailModal.tsx | Khác | Modal | `px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] text-xs transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs` | Download |
| { try { await exportDocumentTo | src/components/quotations/DocumentDetailModal.tsx | Khác | Modal | `px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-bold rounded-[6px] text-xs transition-colors cursor-pointer inline-flex items-center space-x-1 border border-[#EAEAEA]` | FileSpreadsheet |
| Đóng Cửa Sổ | src/components/quotations/DocumentDetailModal.tsx | Khác | Modal | `(Không có class)` | Không có |
| handleMoveItem(index, 'up')} c | src/components/quotations/DocumentDetailModal.tsx | Khác (Chưa rõ) | Modal | `p-0.5 rounded bg-[#F0F0EE] hover:bg-[#E0E0DE] disabled:opacity-30 cursor-pointer` | ArrowUp |
| handleMoveItem(index, 'down')} | src/components/quotations/DocumentDetailModal.tsx | Khác (Chưa rõ) | Modal | `p-0.5 rounded bg-[#F0F0EE] hover:bg-[#E0E0DE] disabled:opacity-30 cursor-pointer` | ArrowDown |
| handleItemStatusChange(q.id, ' | src/components/quotations/DocumentDetailModal.tsx | Khác (Chưa rõ) | Modal | `p-1 bg-[#EDF3EC] border border-[#C6E1C4] hover:bg-[#DDF0DC] text-[#346538] rounded cursor-pointer` | CheckCircle |
| handleItemStatusChange(q.id, ' | src/components/quotations/DocumentDetailModal.tsx | CRUD cố định | Modal | `p-1 bg-[#FDEBEC] border border-[#FADBDC] hover:bg-[#F8C9CA] text-[#9F2F2D] rounded cursor-pointer` | XCircle |
| setErrorMsg(null)} className=" | src/components/quotations/QuotationDocumentsManager.tsx | Khác (Chưa rõ) | Toolbar | `text-red-500 hover:text-red-900 cursor-pointer` | Không có |
| (Chỉ có icon/Tooltip) | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `py-1.5 px-2 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all ${ config.language === opt.key ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]' }` | Không có |
| setConfig((prev) => ({ ...prev | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `py-2 px-3 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${ (config.layoutOrientation || 'portrait') === 'portrait' ? 'bg-[#111111] text-white border-[#111111] shadow-xs' : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]' }` | Không có |
| setConfig((prev) => ({ ...prev | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `py-2 px-3 rounded-[6px] border text-[11px] font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${ config.layoutOrientation === 'landscape' ? 'bg-[#111111] text-white border-[#111111] shadow-xs' : 'bg-white text-[#111111] border-[#EAEAEA] hover:border-[#CCCCCC]' }` | Không có |
| Thêm dòng | src/components/quotations/QuotationPreviewPanel.tsx | CRUD cố định | Toolbar | `text-[10px] font-bold text-[#111111] hover:underline inline-flex items-center space-x-1 cursor-pointer` | Plus |
| handleMoveRemark(idx, 'up')} c | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `p-0.5 text-[#787774] hover:text-[#111111] disabled:opacity-30 cursor-pointer` | ArrowUp |
| handleMoveRemark(idx, 'down')} | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `p-0.5 text-[#787774] hover:text-[#111111] disabled:opacity-30 cursor-pointer` | ArrowDown |
| handleRemoveRemark(r.id)} clas | src/components/quotations/QuotationPreviewPanel.tsx | CRUD cố định | Row-level | `p-0.5 text-red-500 hover:text-red-700 cursor-pointer ml-1` | Trash2 |
| Quay lại | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 border border-[#EAEAEA] bg-white hover:bg-[#F0F0EE] text-[#111111] font-semibold rounded-[6px] inline-flex items-center space-x-1.5 cursor-pointer text-xs` | ArrowLeft |
| onSaveAndSend(config, docField | src/components/quotations/QuotationPreviewPanel.tsx | CRUD cố định | Row-level | `px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[8px] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 text-xs` | Check |
| {isExportingPdf ? 'Đang Tạo Fi | src/components/quotations/QuotationPreviewPanel.tsx | CRUD cố định | Row-level | `px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm text-xs disabled:opacity-50` | Download |
| Quay Lại | src/components/quotations/QuotationPreviewPanel.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-1.5 bg-white hover:bg-[#F0F0EE] border border-[#EAEAEA] text-[#111111] font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm text-xs` | ArrowLeft |
| setErrorMsg(null)} className=" | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Toolbar | `text-red-500 hover:text-red-900` | Không có |
| { handleStageChange(msg.target | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] transition-colors cursor-pointer inline-flex items-center space-x-1` | ArrowRight |
| setMsg(null)} className="text- | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Toolbar | `text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer` | Không có |
| handleStageChange('new')} clas | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${ activeStage === 'new' ? 'border-[#111111] text-[#111111] bg-white' : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]' }` | Inbox |
| handleStageChange('internal')} | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${ activeStage === 'internal' ? 'border-[#111111] text-[#111111] bg-white' : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]' }` | SlidersHorizontal |
| handleStageChange('sent')} cla | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${ activeStage === 'sent' ? 'border-[#111111] text-[#111111] bg-white' : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]' }` | Send |
| setShowAdvancedFilters(!showAd | src/components/quotations/QuotationsManager.tsx | Khác | Row-level | `p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer` | Filter |
| Chuyển tính giá | src/components/quotations/QuotationsManager.tsx | Hành động nghiệp vụ | Toolbar | `(Không có class)` | Không có |
| Không phù hợp | src/components/quotations/QuotationsManager.tsx | Hành động nghiệp vụ | Modal | `(Không có class)` | Không có |
| { if (selectedSingleQuote) set | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| { if (selectedSingleQuote) han | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| { if (selectedSingleQuote) han | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Toolbar | `(Không có class)` | Không có |
| Không phù hợp | src/components/quotations/QuotationsManager.tsx | Hành động nghiệp vụ | Modal | `(Không có class)` | Không có |
| { if (selectedSingleQuote) han | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Toolbar | `(Không có class)` | Không có |
| handleOpenItemCancelModal('CAN | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| setShowNewRfqModal(true)} titl | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/quotations/QuotationsManager.tsx | Khác | Row-level | `text-emerald-600` | Không có |
| setShowColMenu(!showColMenu)} | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| Trang Trước | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-2.5 py-1 border border-[#EAEAEA] bg-white rounded-[4px] hover:bg-slate-50 disabled:opacity-30 cursor-pointer` | Không có |
| Trang Sau | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Row-level | `px-2.5 py-1 border border-[#EAEAEA] bg-white rounded-[4px] hover:bg-slate-50 disabled:opacity-30 cursor-pointer` | Không có |
| Hủy | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Thay Đổi | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Hủy | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Xác Nhận Hủy | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Toolbar | `(Không có class)` | Không có |
| setShowPasteModal(true)} class | src/components/quotations/QuotationsManager.tsx | Khác (Chưa rõ) | Modal | `px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[6px] text-xs shadow-sm transition-colors cursor-pointer inline-flex items-center space-x-1.5` | Clipboard |
| Thêm Dòng Sản Phẩm | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Row-level | `px-2.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-bold rounded-[6px] text-xs inline-flex items-center space-x-1 cursor-pointer transition-colors border border-[#EAEAEA]` | Plus |
| handleRemoveRowFromNewDossier( | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Row-level | `p-1 text-slate-400 hover:text-[#9F2F2D] hover:bg-[#FDEBEC] rounded transition-colors cursor-pointer` | Không có |
| Hủy | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Lưu Hồ Sơ RFQ | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Hủy | src/components/quotations/QuotationsManager.tsx | CRUD cố định | Modal | `(Không có class)` | Không có |
| Trích Xuất & Điền Vào Form | src/components/quotations/QuotationsManager.tsx | Khác | Row-level | `(Không có class)` | Không có |
| setShowRecipeModal(true)} clas | src/components/rfq/CastingCalculatorForm.tsx | Khác (Chưa rõ) | Modal | `px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white rounded-[4px] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors` | Eye |
| Đóng Màn Hình | src/components/rfq/CastingCalculatorForm.tsx | Khác | Modal | `(Không có class)` | Không có |
| Đóng | src/components/rfq/CloneQuoteModal.tsx | Khác | Modal | `(Không có class)` | Không có |
| Chọn Nạp → | src/components/rfq/CloneQuoteModal.tsx | Khác (Chưa rõ) | Modal | `px-2.5 py-1 bg-[#111111] text-white text-[10px] font-bold rounded group-hover:bg-[#333333] cursor-pointer` | Không có |
| (Chỉ có icon/Tooltip) | src/components/rfq/MachiningOpsList.tsx | Khác (Chưa rõ) | Row-level | `p-1.5 text-[#787774] cursor-not-allowed rounded opacity-50 self-end mb-0.5` | Lock |
| onRemoveOp(idx)} className="p- | src/components/rfq/MachiningOpsList.tsx | CRUD cố định | Row-level | `p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end mb-0.5 cursor-pointer` | Trash2 |
| Thêm nguyên công | src/components/rfq/MachiningOpsList.tsx | CRUD cố định | Row-level | `flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-sm` | Plus |
| setActiveSubTab('summary')} cl | src/components/rfq/QuoteDetailModal.tsx | Khác (Chưa rõ) | Modal | `px-3 py-1 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${ activeSubTab === 'summary' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Layers |
| setActiveSubTab('breakdown')} | src/components/rfq/QuoteDetailModal.tsx | Khác | Modal | `px-3 py-1 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${ activeSubTab === 'breakdown' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | ListFilter |
| Đóng Cửa Sổ | src/components/rfq/QuoteDetailModal.tsx | Khác | Modal | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/rfq/RealtimeSummaryPanel.tsx | Khác (Chưa rõ) | Row-level | `px-2.5 py-0.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer ${ currency === c ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| (Chỉ có icon/Tooltip) | src/components/rfq/RfqHeaderForm.tsx | Khác (Chưa rõ) | Row-level | `px-3 py-0.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${ rfq.trade_terms === term ? 'bg-[#111111] text-white' : 'text-[#787774] hover:text-[#111111]' }` | Không có |
| + Thêm Mã Sản Phẩm | src/components/rfq/RfqHeaderForm.tsx | CRUD cố định | Toolbar | `px-3 py-1 bg-[#111111] hover:bg-[#333333] text-white text-xs font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer shadow-xs` | Plus |
| handleRemoveItem(item.id)} cla | src/components/rfq/RfqHeaderForm.tsx | CRUD cố định | Row-level | `p-1 text-[#9F2F2D] hover:bg-[#FDEBEC] rounded cursor-pointer` | Trash2 |
| ✓ Có thể tính giá | src/components/rfq/RfqHeaderForm.tsx | Hành động nghiệp vụ | Row-level | `px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer border ${ item.is_feasible ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#787774] border-[#EAEAEA]' }` | Không có |
| ✕ Huỷ ngay (Không tính giá) | src/components/rfq/RfqHeaderForm.tsx | CRUD cố định | Row-level | `px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer border ${ !item.is_feasible ? 'bg-[#FDEBEC] text-[#9F2F2D] border-[#FADBDC]' : 'bg-white text-[#787774] border-[#EAEAEA]' }` | Không có |
| {isSubmittingDossier ? 'Đang K | src/components/rfq/RfqHeaderForm.tsx | CRUD cố định | Row-level | `px-5 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm disabled:opacity-40` | Check |
| (Lấy theo tuổi thọ:  SP) | src/components/rfq/ToolingAmortizationSection.tsx | Khác (Chưa rõ) | Row-level | `text-[10px] text-[#38517A] hover:underline font-semibold ml-1 cursor-pointer` | Không có |
| Thêm chi tiết {isForging ? 'kh | src/components/rfq/ToolingOpsList.tsx | CRUD cố định | Row-level | `flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-xs` | Plus |
| onRemoveComp(idx)} className=" | src/components/rfq/ToolingOpsList.tsx | CRUD cố định | Row-level | `text-red-500 hover:text-red-700 p-1 cursor-pointer` | Trash2 |
| )} | src/components/Sidebar.tsx | Khác (Chưa rõ) | Row-level | `w-full flex items-center h-10 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${ isActive ? 'bg-[#1E293B] text-white font-bold border-l-2 border-blue-500 shadow-xs' : 'text-slate-300 hover:bg-[#1E293B]/70 hover:text-white font-medium' }` | Icon |
| )} | src/components/Sidebar.tsx | Khác (Chưa rõ) | Row-level | `w-full flex items-center h-10 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${ isActive ? 'bg-[#1E293B] text-white font-bold border-l-2 border-blue-500 shadow-xs' : 'text-slate-300 hover:bg-[#1E293B]/70 hover:text-white font-medium' }` | Icon |
| } | src/components/ui/ActionButton.tsx | CRUD cố định | Row-level | `${baseClasses} ${className}` | Không có |
| } | src/components/ui/ActionButton.tsx | Khác (Chưa rõ) | Toolbar | `${baseClasses} ${className}` | Không có |
| action.onClick(selectedRows)} | src/components/ui/DataTable.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| setShowColSettings(!showColSet | src/components/ui/DataTable.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| (Chỉ có icon/Tooltip) | src/components/ui/Modal.tsx | Khác | Modal | `text-[#787774] hover:text-[#111111] p-1 rounded-md cursor-pointer transition-colors` | Không có |
| (Chỉ có icon/Tooltip) | src/context/ConfirmDialogContext.tsx | CRUD cố định | Toolbar | `px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer` | Không có |
| {options.confirmLabel || 'Xác | src/context/ConfirmDialogContext.tsx | Khác (Chưa rõ) | Toolbar | `px-4 py-1.5 font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer ${ options.variant === 'danger' ? 'bg-[#9F2F2D] hover:bg-[#7A2422] text-white' : 'bg-[#111111] hover:bg-[#333333] text-white' }` | Không có |
| (Chỉ có icon/Tooltip) | src/context/ToastContext.tsx | CRUD cố định | Row-level | `mt-0.5 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity` | Không có |
| )} | src/pages/AuthPage.tsx | Khác (Chưa rõ) | Row-level | `w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3` | Loader2 |
| Lần đầu sử dụng? Thiết lập mật khẩu | src/pages/AuthPage.tsx | Khác (Chưa rõ) | Toolbar | `text-[#787774] hover:text-[#111111] font-medium block w-full cursor-pointer` | Không có |
| Quên mật khẩu? | src/pages/AuthPage.tsx | Khác (Chưa rõ) | Toolbar | `text-[#787774] hover:text-[#111111] font-medium block w-full cursor-pointer` | Không có |
| Quay lại Đăng nhập | src/pages/AuthPage.tsx | Khác (Chưa rõ) | Toolbar | `text-[#111111] font-bold block w-full cursor-pointer pt-2` | Không có |
| Quay Lại Màn Hình Quản Lý RFQ | src/pages/CastingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]` | Không có |
| Quay lại | src/pages/CastingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| Sao chép | src/pages/CastingCostingPage.tsx | Khác (Chưa rõ) | Modal | `(Không có class)` | Không có |
| Lưu nháp | src/pages/CastingCostingPage.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| } | src/pages/CastingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `text-emerald-400 stroke-[2.5]` | Check |
| Đồng bộ dữ liệu | src/pages/DashboardPage.tsx | Khác (Chưa rõ) | Row-level | `inline-flex items-center space-x-2 bg-white border border-[#EAEAEA] text-[#111111] px-3 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#F9F9F8] transition-colors` | RefreshCw |
| Thu hồi quyền | src/pages/DashboardPage.tsx | Hành động nghiệp vụ | Toolbar | `text-[11px] font-bold text-[#9F2F2D] hover:underline disabled:opacity-50` | Không có |
| Thêm vào Allowlist | src/pages/DashboardPage.tsx | CRUD cố định | Row-level | `inline-flex items-center space-x-1.5 bg-[#111111] text-white px-4 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#333333] transition-colors disabled:opacity-50` | Plus |
| handleRemoveAllowedUser(user.e | src/pages/DashboardPage.tsx | CRUD cố định | Row-level | `p-1 text-[#9F2F2D] hover:bg-[#FDEBEC] rounded cursor-pointer transition-colors inline-flex` | Trash2 |
| Quay Lại Màn Hình Quản Lý RFQ | src/pages/ForgingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]` | Không có |
| Quay lại | src/pages/ForgingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| Sao chép | src/pages/ForgingCostingPage.tsx | Khác (Chưa rõ) | Modal | `(Không có class)` | Không có |
| Lưu nháp | src/pages/ForgingCostingPage.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| } | src/pages/ForgingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `text-emerald-400 stroke-[2.5]` | Check |
| Quay Lại Màn Hình Quản Lý RFQ | src/pages/MachiningCostingPage.tsx | Khác (Chưa rõ) | Row-level | `mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]` | Không có |
| Quay lại | src/pages/MachiningCostingPage.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| Sao chép | src/pages/MachiningCostingPage.tsx | Khác (Chưa rõ) | Modal | `(Không có class)` | Không có |
| Lưu nháp | src/pages/MachiningCostingPage.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| } | src/pages/MachiningCostingPage.tsx | Khác (Chưa rõ) | Row-level | `text-emerald-400 stroke-[2.5]` | Check |
| handleTabClick(tab.id)} disabl | src/pages/PricingToolsPage.tsx | Khác (Chưa rõ) | Row-level | `flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${ isLocked ? 'opacity-40 cursor-not-allowed text-[#787774] hover:bg-transparent' : isActive ? 'bg-white text-[#111111] shadow-sm' : 'text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA] cursor-pointer' }` | Icon |
| )} | src/pages/ResetPasswordPage.tsx | Khác (Chưa rõ) | Row-level | `w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3` | Loader2 |
| Quay lại Đăng nhập | src/pages/ResetPasswordPage.tsx | Khác (Chưa rõ) | Toolbar | `text-[#787774] hover:text-[#111111] text-xs font-medium cursor-pointer` | Không có |
| Quay Lại Màn Hình Quản Lý RFQ | src/pages/SawingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]` | Không có |
| Quay lại | src/pages/SawingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `(Không có class)` | Không có |
| Sao chép | src/pages/SawingCostingPage.tsx | Khác (Chưa rõ) | Modal | `(Không có class)` | Không có |
| Lưu nháp | src/pages/SawingCostingPage.tsx | CRUD cố định | Row-level | `(Không có class)` | Không có |
| } | src/pages/SawingCostingPage.tsx | Khác (Chưa rõ) | Row-level | `text-emerald-400 stroke-[2.5]` | Check |
