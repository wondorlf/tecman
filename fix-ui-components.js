import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiComponentsDir = path.join(__dirname, 'frontend', 'src', 'components', 'ui');

function fixJSXSyntax(content) {
    // Fix spread props syntax: change ...props to {...props}
    return content.replace(/\n(\s+)\.\.\.props(\s*\n)/g, '\n$1{...props}$2');
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixJSXSyntax(content);

    if (content !== fixed) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log(`Fixed ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

if (!fs.existsSync(uiComponentsDir)) {
    console.error('UI components directory not found');
    process.exit(1);
}

const files = fs.readdirSync(uiComponentsDir);
let fixedCount = 0;

files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(uiComponentsDir, file);
        if (processFile(filePath)) {
            fixedCount++;
        }
    }
});

console.log(`\nFixed ${fixedCount} file(s)`);
