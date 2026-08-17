const fs = require('fs');

const html = fs.readFileSync('dist/stats.html', 'utf8');
// The default visualizer template output for rollup
// usually defines an array called `nodeData` or `drawData` or `nodes`

let jsonStr = '';

// Regex to extract the data array from the <script> block
const scriptMatch = html.match(/<script[^>]*>(.*?)<\/script>/s);
if (scriptMatch) {
    const code = scriptMatch[1];
    
    // Attempt 1: window.nodesData
    const nodesDataMatch = code.match(/nodesData\s*=\s*(\[.*\]);\s*const/s) || code.match(/(?:const|var|let)?\s*nodesData\s*=\s*(\[.*\])/s);
    
    // Attempt 2: default
    const defaultDataMatch = code.match(/(?:const|var|let)?\s*data\s*=\s*(\[.*\])/s) || code.match(/drawData\s*=\s*(\{.*?\});/s) || code.match(/<script.*?>\s*(?:window\.)?defaultNodes\s*=\s*(\[.*?\]);/s) || code.match(/window\.defaultNodes\s*=\s*(\[.*?\]);/s);

    if (nodesDataMatch) {
        jsonStr = nodesDataMatch[1];
    } else if (defaultDataMatch) {
        jsonStr = defaultDataMatch[1];
    } else {
        // Last resort: find the largest array
        const allArrays = code.match(/\[.*?\]/gs);
        if (allArrays) {
            jsonStr = allArrays.sort((a, b) => b.length - a.length)[0];
        }
    }
}

if (!jsonStr) {
   // Let's just find anything that looks like JSON and has "renderedLength"
   const anyJson = html.match(/\[\{.*"renderedLength".*\}\]/s);
   if (anyJson) {
       jsonStr = anyJson[0];
   }
}

if (!jsonStr) {
    console.log("Could not extract data from stats.html");
    // Just try to read it manually with another node script
    process.exit(1);
}

try {
    const data = JSON.parse(jsonStr);
    
    // Visualizer output: data is usually an array of nodes (the chunks)
    let indexChunk;
    
    if (Array.isArray(data)) {
        indexChunk = data.find(c => c.name && c.name.includes('index-'));
    } else {
        indexChunk = data;
    }
    
    if (!indexChunk) {
        console.log("Could not find index- chunk");
        process.exit(1);
    }
    
    const allModules = [];
    function traverse(node, path = '') {
        // clean name
        let cleanName = node.name || '';
        // handle cases where name is an object
        if (typeof cleanName === 'object') cleanName = JSON.stringify(cleanName);
        
        const currentPath = path ? `${path}/${cleanName}` : cleanName;
        
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                traverse(child, currentPath);
            }
        } else {
            // Leaf node is a module
            // Size might be in node.renderedLength, node.size, node.actualSize
            allModules.push({
                name: currentPath,
                size: node.renderedLength || node.size || node.actualSize || 0
            });
        }
    }
    
    if (indexChunk.children) {
        for (const child of indexChunk.children) {
            traverse(child, '');
        }
    } else {
        traverse(indexChunk, '');
    }
    
    // Sort by size
    allModules.sort((a, b) => b.size - a.size);
    
    console.log("TOP 10 MODULES IN INDEX-*.JS:");
    console.log("===============================");
    
    for (let i = 0; i < Math.min(10, allModules.length); i++) {
        const mod = allModules[i];
        const sizeKB = (mod.size / 1024).toFixed(2);
        // Clean up paths for readability
        let name = mod.name.replace(/\\/g, '/');
        // Extract just the part after node_modules if present
        const nmIndex = name.lastIndexOf('node_modules/');
        if (nmIndex !== -1) {
            name = name.substring(nmIndex);
        }
        console.log(`${i+1}. ${sizeKB} kB - ${name}`);
    }

} catch (e) {
    console.error("Error parsing JSON", e.message);
    console.log("Preview of jsonStr: ", jsonStr.substring(0, 100));
}
