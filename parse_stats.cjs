const fs = require('fs');

try {
    const raw = fs.readFileSync('dist/stats.json', 'utf8');
    const data = JSON.parse(raw);
    
    const tree = data.tree || data;
    const chunks = tree.children || [];
    
    // Find index-*.js chunk
    const indexChunk = chunks.find(c => c.name && c.name.includes('index-'));
    if (!indexChunk) {
        console.log("Could not find index- chunk");
        process.exit(1);
    }
    
    const nodeParts = data.nodeParts || {};
    const modules = [];
    
    function traverse(node, path = '') {
        const name = node.name || '';
        const currentPath = path ? `${path}/${name}` : name;
        
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                traverse(child, currentPath);
            }
        } else {
            // Leaf node, get size from nodeParts if available
            let size = 0;
            if (node.uid && nodeParts[node.uid]) {
                size = nodeParts[node.uid].renderedLength || 0;
            } else {
                size = node.renderedLength || node.size || node.actualSize || 0;
            }
            
            modules.push({
                name: currentPath,
                size: size
            });
        }
    }
    
    if (indexChunk.children) {
        for (const child of indexChunk.children) {
            traverse(child, '');
        }
    }
    
    // sort by size desc
    modules.sort((a, b) => b.size - a.size);
    
    console.log("TOP 10 MODULES IN INDEX BUNDLE:");
    for (let i = 0; i < Math.min(10, modules.length); i++) {
        const mod = modules[i];
        let pName = mod.name.replace(/\\/g, '/');
        const nmIndex = pName.lastIndexOf('node_modules/');
        if (nmIndex !== -1) {
            pName = pName.substring(nmIndex);
        }
        console.log(`${i+1}. ${(mod.size / 1024).toFixed(2)} kB - ${pName}`);
    }
    
} catch(e) {
    console.log("Error processing stats.json", e.message);
}
