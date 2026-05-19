const fs = require('fs');
const html = fs.readFileSync('admin_ui.js', 'utf8');

let depth = 0;
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openings = (line.match(/<div/g) || []).length;
  const closings = (line.match(/<\/div>/g) || []).length;
  
  depth += openings;
  depth -= closings;
  
  if (line.includes('page-body')) console.log('[L'+(i+1)+'] page-body. Depth=' + depth);
  if (line.includes('id="main-mysql"')) console.log('[L'+(i+1)+'] main-mysql. Depth=' + depth);
  if (line.includes('id="main-settings"')) console.log('[L'+(i+1)+'] main-settings. Depth=' + depth);
  
  if (depth < 2 && i > 350) console.log('Depth dropped below 2 at line ' + (i+1) + ': ' + line.trim());
}
