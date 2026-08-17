/**
 * UI Conventions Reference
 *
 * 1. ActionButton variants:
 *    - primary (đen): bg-[#111111] hover:bg-[#333333] text-white
 *    - neutral (xám): bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA]
 *    - positive (xanh lá): bg-[#EDF3EC] hover:bg-[#DDF0DC] text-[#346538] border border-[#C6E1C4]
 *    - danger (đỏ): bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC]
 *    - export (xanh dương): bg-blue-600 hover:bg-blue-700 text-white shadow-sm
 *
 * 2. tab-toggle: KHÔNG dùng ActionButton, sử dụng các hằng số bên dưới:
 */

export const TAB_TOGGLE_ACTIVE_CLASS = 'bg-white text-[#111111] shadow-xs';
export const TAB_TOGGLE_INACTIVE_CLASS = 'text-[#787774] hover:text-[#111111]';
