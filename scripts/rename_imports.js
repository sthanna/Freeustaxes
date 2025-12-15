
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(TARGET_DIR);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace imports: from 'ustaxes/...' -> from 'freeustaxes/...'
    if (content.includes("from 'ustaxes/")) {
        content = content.replace(/from 'ustaxes\//g, "from 'freeustaxes/");
        changed = true;
    }
    // Handle require or import "..."
    if (content.includes("import 'ustaxes/")) {
        content = content.replace(/import 'ustaxes\//g, "import 'freeustaxes/");
        changed = true;
    }

    // Also replacing "UsTaxes" in UI text if safe?
    // User asked "rename every where".
    // But be careful of URLs.
    // Let's stick to imports first to ensure build safety.

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
        count++;
    }
});

console.log(`Rename complete. Modified ${count} files.`);
