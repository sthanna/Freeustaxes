
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Configuration ---
const ROOT_DIR = path.resolve(__dirname, '..');
// Files to explicitly remove (Extensions or Filenames)
const TO_REMOVE_EXTS = ['.c', '.h', '.o', '.obj', '.exe', '.dll', '.tmp'];
const TO_REMOVE_FILES = ['Makefile', 'configure', 'config.log', 'config.status'];
// Directories to skip
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.vscode', '.idea'];
// Directories to explicitly remove if empty or legacy-only
const LEGACY_DIRS = ['temp_test_artifacts'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const filesToDelete = [];

function scanDir(directory) {
    if (!fs.existsSync(directory)) return;

    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(item)) continue;
            scanDir(fullPath);
        } else {
            const ext = path.extname(item).toLowerCase();
            if (TO_REMOVE_EXTS.includes(ext) || TO_REMOVE_FILES.includes(item)) {
                filesToDelete.push(fullPath);
            }
        }
    }
}

function run() {
    console.log(`Scanning for legacy C artifacts in ${ROOT_DIR}...`);
    scanDir(ROOT_DIR);

    // Also check for legacy directories
    LEGACY_DIRS.forEach(d => {
        const fullPath = path.join(ROOT_DIR, d);
        if (fs.existsSync(fullPath)) {
            // We'll just mark all files inside for deletion, or the dir itself
            // For simplicity, let's just add the dir to a separate list or handle it
        }
    });

    if (filesToDelete.length === 0) {
        console.log("No legacy artifacts found.");
        rl.close();
        return;
    }

    console.log("\nFound the following files to DELETE:");
    filesToDelete.forEach(f => console.log(` - ${path.relative(ROOT_DIR, f)}`));

    rl.question('\nAre you sure you want to delete these files? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            let deletedCount = 0;
            filesToDelete.forEach(f => {
                try {
                    fs.unlinkSync(f);
                    console.log(`Deleted: ${path.relative(ROOT_DIR, f)}`);
                    deletedCount++;
                } catch (e) {
                    console.error(`Failed to delete ${f}: ${e.message}`);
                }
            });

            // Clean legacy dirs if empty or requested
            LEGACY_DIRS.forEach(d => {
                const legacyPath = path.join(ROOT_DIR, 'src', 'tests', 'temp_test_artifacts'); // Adjust path as needed based on where it was created
                // The test creates it at ../../temp_test_artifacts from src/tests, so that's src/temp_test_artifacts or similar?
                // Actually the test used path.resolve(__dirname, '../../temp_test_artifacts') from src/tests
                // So it is in src/../temp_test_artifacts which is project root/temp_test_artifacts
                const rootLegacyvar = path.join(ROOT_DIR, 'temp_test_artifacts');
                if (fs.existsSync(rootLegacyvar)) {
                    try {
                        fs.rmSync(rootLegacyvar, { recursive: true, force: true });
                        console.log(`Deleted Directory: temp_test_artifacts`);
                    } catch (e) { }
                }
            });

            console.log(`\nCleanup complete. Removed ${deletedCount} files.`);
        } else {
            console.log("Operation cancelled.");
        }
        rl.close();
    });
}

run();
