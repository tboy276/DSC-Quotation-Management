const fs = require('fs');

let content = fs.readFileSync('src/components/quotations/QuotationsManager.tsx', 'utf8');

const injection = \
            <details className="group border border-emerald-200 bg-emerald-50/50 rounded-md overflow-hidden mb-3">
              <summary className="px-3 py-2 text-emerald-800 font-medium cursor-pointer hover:bg-emerald-100/50 transition-colors list-none flex items-center justify-between">
                <span>📋 Prompt AI để trích xuất email RFQ (bấm để xem & copy)</span>
                <span className="text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 border-t border-emerald-100 bg-white">
                <p className="text-slate-600 mb-2">
                  Copy đoạn prompt này, dán vào ChatGPT/Claude cùng với nội dung email RFQ khách gửi, AI sẽ tự trả về đúng định dạng để bạn dán tiếp vào ô bên dưới.
                </p>
                <div className="relative">
                  <textarea 
                    readOnly
                    value={RFQ_EXTRACTION_PROMPT}
                    className="w-full h-48 p-2 text-[10px] font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(RFQ_EXTRACTION_PROMPT);
                        toast.success('Đã copy prompt vào clipboard');
                      } catch (err) {
                        toast.error('Lỗi khi copy prompt');
                      }
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Copy Prompt
                  </button>
                </div>
              </div>
            </details>
            <textarea\;

content = content.replace(/<textarea/, injection);

fs.writeFileSync('src/components/quotations/QuotationsManager.tsx', content, 'utf8');
