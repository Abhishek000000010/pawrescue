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

  content = content.replace(/(?<!dark:)bg-slate-900(?!\/)/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/(?<!dark:)bg-slate-800(?!\/)/g, 'bg-slate-50 dark:bg-slate-800');
  content = content.replace(/(?<!dark:)bg-slate-800\/50/g, 'bg-slate-100/50 dark:bg-slate-800/50');
  content = content.replace(/(?<!dark:)bg-slate-900\/60/g, 'bg-white/60 dark:bg-slate-900/60');
  
  content = content.replace(/(?<!dark:)bg-zinc-900(?!\/)/g, 'bg-white dark:bg-zinc-900');
  content = content.replace(/(?<!dark:)bg-zinc-800(?!\/)/g, 'bg-zinc-50 dark:bg-zinc-800');
  content = content.replace(/(?<!dark:)bg-zinc-900\/95/g, 'bg-white/95 dark:bg-zinc-900/95');
  content = content.replace(/(?<!dark:)bg-zinc-800\/85/g, 'bg-zinc-100/85 dark:bg-zinc-800/85');

  // For text-white, we want to change it to text-zinc-900 dark:text-white but only in non-button elements.
  // Actually, replacing all text-white might turn buttons like bg-brand-primary text-zinc-900 dark:text-white
  // Wait, if it has bg-brand-primary, text should remain white.
  // We can look for bg-brand-primary text-white or bg-red-500 text-white and leave them alone.
  // A safer approach: Only replace text-white on things that we just replaced the bg for!
  // But regex is limited here.
  
  content = content.replace(/(?<!dark:)text-slate-300/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/(?<!dark:)text-slate-400/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/(?<!dark:)border-slate-700/g, 'border-slate-200 dark:border-slate-700');
  content = content.replace(/(?<!dark:)border-slate-600/g, 'border-slate-300 dark:border-slate-600');
  
  // Replace text-white if it's accompanied by text-center or similar typography without button classes.
  // Or just let's not touch text-white globally, but look for specific components like Login.tsx
  // We already fixed Login/Register in a way that works for dark mode, but wait, they have hardcoded text-white.
  // Let's replace text-white with text-zinc-900 dark:text-white ONLY when it's not preceded by bg-brand, bg-red, etc.
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changes++;
    console.log('Modified', path.basename(file));
  }
}
console.log('Total files modified:', changes);
