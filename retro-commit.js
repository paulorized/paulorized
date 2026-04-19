const { execSync } = require('child_process');
const cwd = 'C:\\Users\\PVale\\Downloads\\paulorized-main\\paulorized-main';
const opts = { cwd, stdio: 'inherit' };
execSync('git add app/api/scan/route.ts app/api/admin/enrich-terpenes/route.ts', opts);
execSync('git commit -m "feat: retroactive terpene enrichment endpoint + remove debug logs"', opts);
execSync('git push', opts);
console.log('Done!');
