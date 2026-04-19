const { execSync } = require('child_process');
const cwd = 'C:\\Users\\PVale\\Downloads\\paulorized-main\\paulorized-main';
const opts = { cwd, stdio: 'inherit' };
execSync('git add app/history/page.tsx', opts);
execSync('git commit -m "fix: add terpenes to history page select query and type"', opts);
execSync('git push', opts);
console.log('Done!');
