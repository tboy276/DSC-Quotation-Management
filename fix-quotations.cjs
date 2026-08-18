const fs = require('fs');

const file = 'src/components/quotations/QuotationsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Group the "Chuyển tính giá" and "Không phù hợp" buttons.
// Wait, they are ALREADY in `<div className="flex items-center space-x-2 px-2.5 py-1 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px]">`
// I'll leave them as is, but add the divider AFTER them.
// Let's find: {/* Right Side: CONTEXTUAL STAGE ACTION BUTTONS */}
content = content.replace(/\{\/\* Right Side: CONTEXTUAL STAGE ACTION BUTTONS \*\/\}\s*<div className="flex items-center space-x-1\.5">/g, 
`{/* Right Side: CONTEXTUAL STAGE ACTION BUTTONS */}
          <div className="flex items-center space-x-1.5">
            <div className="h-4 w-px bg-[#EAEAEA] mx-1" />`);

// 2. Put Export Excel and Columns into MoreHorizontal menu
// Find Export Excel ActionButton and replace with Dropdown structure
content = content.replace(/\{\/\* Global Action 3: Export Excel \*\/\}\s*<ActionButton\s*variant="neutral"\s*icon=\{FileSpreadsheet\}\s*onClick=\{handleExportExcel\}\s*title=".*?"\s*className="text-emerald-600"\s*\/>\s*\{\/\* Column Visibility Menu \*\/\}\s*<div className="relative">\s*<ActionButton\s*variant="neutral"\s*icon=\{Columns\}\s*onClick=\{\(\) => setShowColMenu\(!showColMenu\)\}\s*title="Cấu hình ẩn\/hiện cột bảng"\s*\/>/gs, 
`{/* More Actions Menu */}
            <div className="relative">
              <ActionButton
                variant="neutral"
                icon={MoreHorizontal}
                onClick={() => setShowColMenu(!showColMenu)}
                title="Khác (Export, Cấu hình cột)"
              />`);

// Then add the Export Excel inside the Dropdown:
content = content.replace(/<div className="flex items-center justify-between border-b border-\[\#EAEAEA\] pb-2 font-bold">\s*<span>Ẩn\/Hiện Cột Bảng<\/span>\s*<X\s*className="w-4 h-4 cursor-pointer text-\[\#787774\] hover:text-\[\#111111\]"\s*onClick=\{\(\) => setShowColMenu\(false\)\}\s*\/>\s*<\/div>/g,
`<div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                    <span>Thao tác bảng</span>
                    <X
                      className="w-4 h-4 cursor-pointer text-[#787774] hover:text-[#111111]"
                      onClick={() => setShowColMenu(false)}
                    />
                  </div>
                  <div className="border-b border-[#EAEAEA] pb-2 mb-2">
                    <ActionButton
                      variant="neutral"
                      icon={FileSpreadsheet}
                      onClick={handleExportExcel}
                      label="Xuất Excel danh sách RFQ"
                      className="w-full justify-start text-emerald-600 border-none hover:bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-[#787774] uppercase mb-2">Ẩn/Hiện Cột</div>`);

// Replace icon=Pencil with icon=Edit2 inside QuotationsManager.tsx
content = content.replace(/icon=\{Pencil\}/g, 'icon={Edit2}');

// Add Edit2 and MoreHorizontal to lucide-react import
content = content.replace(/import \{.*?\} from 'lucide-react';/g, (match) => {
  if (!match.includes('MoreHorizontal')) match = match.replace('}', ', MoreHorizontal }');
  if (!match.includes('Edit2')) match = match.replace('}', ', Edit2 }');
  return match;
});

fs.writeFileSync(file, content);
console.log('Fixed QuotationsManager toolbar layout');
