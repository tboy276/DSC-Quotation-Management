const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const dir = 'src/components/master-data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add `group` to row
  content = content.replace(/<tr\s+key=\{item\.id\}\s+className="hover:bg-\[\#F9F9F8\] transition-colors">/g, 
  '<tr key={item.id} className="group hover:bg-[#F9F9F8] transition-colors">');
  
  content = content.replace(/<tr\s+key=\{index\}\s+className="hover:bg-\[\#F9F9F8\] transition-colors">/g, 
  '<tr key={index} className="group hover:bg-[#F9F9F8] transition-colors">');

  // Add hover reveal to action buttons container
  content = content.replace(/<div className="flex items-center justify-center space-x-1">/g, 
  '<div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">');

  // In case someone used justify-end
  content = content.replace(/<div className="flex items-center justify-end space-x-1">/g, 
  '<div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">');

  fs.writeFileSync(file, content);
});

console.log('Fixed hover reveal for manual tables');
