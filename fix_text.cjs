const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('d:/Downloads/paw-rescue/src');
let changes = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/(?<!dark:)text-white/g, 'text-zinc-800 dark:text-white');
  
  const bgs = ['bg-brand-primary', 'bg-brand-green', 'bg-brand-dark', 'bg-red-', 'bg-amber-', 'bg-emerald-', 'bg-blue-', 'bg-purple-', 'bg-sky-', 'bg-indigo-', 'bg-rose-', 'bg-black', 'bg-gradient', 'bg-green-', 'bg-orange-'];
  
  content = content.replace(/className=(?:\"|\'|\`\{?)(.*?)(?:\"|\'|\}?`)/g, (match, classes) => {
    if (classes.includes('text-zinc-800 dark:text-white')) {
      const hasSolidBg = bgs.some(bg => classes.includes(bg));
      if (hasSolidBg && !classes.includes('dark:bg-')) {
        return match.replace(/text-zinc-800 dark:text-white/g, 'text-white');
      }
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changes++;
    console.log('Modified', path.basename(file));
  }
}
console.log('Total files modified:', changes);
