const fs = require('fs');

const file = 'src/components/quotations/QuotationsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the static divider
content = content.replace(/\{\/\* Right Side: CONTEXTUAL STAGE ACTION BUTTONS \*\/\}\s*<div className="flex items-center space-x-1\.5">\s*<div className="h-4 w-px bg-\[\#EAEAEA\] mx-1" \/>/g, 
`{/* Right Side: CONTEXTUAL STAGE ACTION BUTTONS */}
          <div className="flex items-center space-x-1.5">`);

// 2. Add divider before Không phù hợp in Tab 2
content = content.replace(/<ActionButton\s*variant="danger"\s*label="Không phù hợp"/g, 
`<div className="h-4 w-px bg-[#EAEAEA] mx-1" />
                    <ActionButton
                      variant="danger"
                      label="Không phù hợp"`);

fs.writeFileSync(file, content);
console.log('Fixed QuotationsManager dividers');
