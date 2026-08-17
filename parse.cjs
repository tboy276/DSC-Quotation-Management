const fs = require('fs');

const txt = fs.readFileSync('docs/raw_buttons.txt', 'utf8');
const lines = txt.split('\n');

const results = [];
let currentFile = '';
let currentLine = '';
let block = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^\s*src[\\\/](.+?\.tsx):(\d+):(.*)/);
  if (m) {
    if (block.length > 0) {
      results.push({ file: currentFile, line: currentLine, content: block.join(' ') });
      block = [];
    }
    currentFile = m[1].replace(/\\/g, '/');
    currentLine = m[2];
    block.push(m[3]);
  } else if (line.match(/^\s*src[\\\/](.+?\.tsx)-(\d+)-(.*)/)) {
    const m2 = line.match(/^\s*src[\\\/](.+?\.tsx)-(\d+)-(.*)/);
    block.push(m2[3]);
  } else {
    block.push(line);
  }
}
if (block.length > 0) {
  results.push({ file: currentFile, line: currentLine, content: block.join(' ') });
}

// Clean up results and extract basic info
const cleanResults = results.filter(r => r.file).map(r => {
  let className = '';
  // match className="...", className={'...'}, className={`...`}
  const classMatch = r.content.match(/className=(?:\"([^\"]+)\"|'([^']+)'|{`([^`]+)`})/);
  if (classMatch) {
    className = classMatch[1] || classMatch[2] || classMatch[3] || '';
  }
  
  let icon = 'Không có';
  // match Lucide icons which are usually <IconName ...
  const iconMatch = r.content.match(/<([A-Z][a-zA-Z0-9]+)\s+(?:className|size|w-)/);
  if (iconMatch) icon = iconMatch[1];

  // Try to find button text
  let textMatch = r.content.match(/>([^<]+)<\/button>/);
  let text = textMatch ? textMatch[1].trim() : '';
  if (!text) {
     let actionBtnMatch = r.content.match(/label=\"([^\"]+)\"/);
     if (actionBtnMatch) text = actionBtnMatch[1];
  }

  // Is it ActionButton or regular button?
  const type = r.content.includes('<ActionButton') ? 'ActionButton' : 'button';

  return { file: r.file, line: r.line, type, className, icon, text, raw: r.content.substring(0, 300) };
});

fs.writeFileSync('docs/buttons.json', JSON.stringify(cleanResults, null, 2));
