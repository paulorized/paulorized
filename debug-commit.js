const { execSync } = require('child_process');
const cwd = 'C:\\Users\\PVale\\Downloads\\paulorized-main\\paulorized-main';
const opts = { cwd, stdio: 'inherit' };
execSync('git add app/api/scan/route.ts', opts);
execSync('git commit -m "debug: add terpene pipeline logging to scan route"', opts);
execSync('git push', opts);
console.log('Done!');
