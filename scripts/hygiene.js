
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LEGACY_EXTENSIONS = ['.c', '.h', '.o', '.obj', '.exe', '.dll', '.tmp'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build'];

console.log('--- Repository Hygiene Check ---');
console.log(`Scanning: ${ROOT_DIR}`);

function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                scanDir(fullPath);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (LEGACY_EXTENSIONS.includes(ext)) {
                console.warn(`[LEGACY ARTIFACT] Found: ${path.relative(ROOT_DIR, fullPath)}`);
            }
        }
    });
}

scanDir(ROOT_DIR);

console.log('\n--- Recommended .gitignore Updates ---');
console.log(`
# Build Artifacts
*.o
*.obj
*.exe
*.dll
*.so
*.dylib

# C Source (if strictly TypeScript repo)
*.c
*.h

# Temporary Test Data
temp_*
*_out.txt
`);
