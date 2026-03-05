import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiDir = path.join(__dirname, 'frontend', 'src', 'components', 'ui');

// Comprehensive regex-based fix for all JSX syntax issues
function fixAllJSXIssues(content) {
    let fixed = content;

    // 1. Fix spread props in JSX elements (standalone ...props -> {...props})
    fixed = fixed.replace(/(\n\s+)\.\.\.props(\s*\n)/g, '$1{...props}$2');

    // 2. Fix indentation issues with displayName
    fixed = fixed.replace(/(\n)(\s{4,})(\w+\.displayName)/g, '$1$3');

    // 3. Fix malformed destructuring in parameters ({...props} -> ...props)
    fixed = fixed.replace(/\({([^}]+),\s*\{(\.\.\.props)\}([^}]*)\}/g, '({$1, $2$3}');

    // 4. Fix JSX children spacing (remove extra spaces around {children})
    fixed = fixed.replace(/\{\s+children\s+\}/g, '{children}');

    // 5. Fix closing tags with extra spaces
    fixed = fixed.replace(/\s+\u003e$/gm, '>');

    return fixed;
}

function processAllFiles() {
    if (!fs.existsSync(uiDir)) {
        console.error('UI directory not found:', uiDir);
        process.exit(1);
    }

    const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));
    let fixedCount = 0;

    console.log(`Found ${files.length} UI component files\n`);

    files.forEach(file => {
        const filePath = path.join(uiDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const fixed = fixAllJSXIssues(content);

        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`✓ Fixed ${file}`);
            fixedCount++;
        } else {
            console.log(`  ${file} (no changes needed)`);
        }
    });

    console.log(`\n${fixedCount} file(s) fixed successfully`);
    return fixedCount;
}

processAllFiles();
