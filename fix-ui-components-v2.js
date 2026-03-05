import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiComponentsDir = path.join(__dirname, 'frontend', 'src', 'components', 'ui');

function fixJSXSyntax(content) {
    let fixed = content;

    // Fix spread props in JSX: ...props -> {...props}
    // This matches spread props that are standalone on their own line
    fixed = fixed.replace(/\n(\s+)\.\.\.props(\s*\n)/g, '\n$1{...props}$2');

    // Fix malformed destructuring in function parameters: {...props} -> ...props
    // This targets function parameter destructuring
    fixed = fixed.replace(/\(({\s*[\w,\s]+,\s*){(\.\.\.props)}(\s*})/g, '($1...$2$3');

    // Fix indentation of displayName assignments
    fixed = fixed.replace(/\n(\s{4,})(\w+)\.displayName/g, '\n$2.displayName');

    return fixed;
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
