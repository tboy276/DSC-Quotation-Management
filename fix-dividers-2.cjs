const fs = require('fs');
const file = 'src/components/quotations/QuotationsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the indentation and remove from Tab 1
content = content.replace(/<div className="h-4 w-px bg-\[\#EAEAEA\] mx-1" \/>\s*<ActionButton\s*variant="danger"\s*label="Không phù hợp"\s*disabled=\{!canRejectFeasibility\}/g,
`<ActionButton
                variant="danger"
                label="Không phù hợp"
                disabled={!canRejectFeasibility}`);

// Fix Tab 2 indentation
content = content.replace(/<div className="h-4 w-px bg-\[\#EAEAEA\] mx-1" \/>\s*<ActionButton\s*variant="danger"\s*label="Không phù hợp"\s*disabled=\{!canDeleteSelected\}/g,
`<div className="h-4 w-px bg-[#EAEAEA] mx-1" />
                    <ActionButton
                      variant="danger"
                      label="Không phù hợp"
                      disabled={!canDeleteSelected}`);

fs.writeFileSync(file, content);
