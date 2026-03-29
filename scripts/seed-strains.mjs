#!/usr/bin/env node
/**
 * Seed the strains index by looping through all Leafly pages.
 * Usage: node scripts/seed-strains.mjs
 *
 * Set these env vars before running:
 *   SITE_URL=https://paulorized.vercel.app
 *   STRAIN_IMPORT_SECRET=cannabase2026
 */

const SITE_URL = process.env.SITE_URL || 'https://paulorized.vercel.app';
const SECRET = process.env.STRAIN_IMPORT_SECRET || 'cannabase2026';
const TAKE = 100;
const DELAY_MS = 500; // be polite to Leafly

async function importPage(page) {
  const res = await fetch(`${SITE_URL}/api/strain-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SECRET, page, take: TAKE }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`🌿 Starting strain import from ${SITE_URL}`);
  console.log(`   Pages of ${TAKE} strains each, ${DELAY_MS}ms delay between pages\n`);

  let page = 0;
  let totalImported = 0;

  while (true) {
    process.stdout.write(`  Page ${page}... `);
    try {
      const result = await importPage(page);
      totalImported += result.imported ?? 0;
      console.log(`✓ ${result.imported} strains (${totalImported} total)`);

      if (result.done || result.imported === 0) {
        console.log(`\n✅ Done! Imported ${totalImported} strains total.`);
        break;
      }

      page++;
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`\n❌ Error on page ${page}:`, err.message);
      console.log('Retrying in 3s...');
      await sleep(3000);
      // retry same page once
      try {
        const result = await importPage(page);
        totalImported += result.imported ?? 0;
        console.log(`  Retry ✓ ${result.imported} strains (${totalImported} total)`);
        if (result.done || result.imported === 0) {
          console.log(`\n✅ Done! Imported ${totalImported} strains total.`);
          break;
        }
        page++;
        await sleep(DELAY_MS);
      } catch (retryErr) {
        console.error('❌ Retry failed:', retryErr.message);
        console.log(`Stopping at page ${page}. Run again with page=${page} to resume.`);
        process.exit(1);
      }
    }
  }
}

main();
