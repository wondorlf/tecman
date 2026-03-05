import fs from 'fs';
import path from 'path';

const srcDir = './backend/src';

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Replace relative imports/exports that don't have an extension
            // We look for patterns like from './something' and turn them into from './something.js'
            const updated = content.replace(/(from\s+['"])(\.\.?\/[^'"]+)(?<!\.js)(?<!\.css)(?<!\.json)(['"])/g, '$1$2.js$3');
            if (content !== updated) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

walk(srcDir);
console.log('Done.');
