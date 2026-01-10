
import fs from 'fs';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'frontend/src/lib/data/registry.json');
const BASE_URL = 'http://localhost:5173';

async function checkPages() {
    console.log(`Reading registry from ${REGISTRY_PATH}...`);
    const data = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const registry = JSON.parse(data);

    // Handle array or object structure
    const modules = Array.isArray(registry) ? registry : (registry.default || registry);

    console.log(`Found ${modules.length} modules to check.`);

    let passed = 0;
    let failed = 0;
    const failures = [];

    // Check catalog first
    try {
        const res = await fetch(`${BASE_URL}/catalog`);
        if (res.status === 200) {
            console.log(`[PASS] /catalog`);
        } else {
            console.error(`[FAIL] /catalog - Status: ${res.status}`);
            failures.push({ url: '/catalog', status: res.status });
            failed++;
        }
    } catch (e) {
        console.error(`[ERR] /catalog - ${e.message}`);
        failures.push({ url: '/catalog', error: e.message });
        failed++;
    }

    // Check modules
    for (const mod of modules) {
        const url = `${BASE_URL}/modules/${mod.id}`;
        try {
            const res = await fetch(url);
            if (res.status === 200) {
                // Check if it's the 500 error page disguised as 200 (Next.js does this sometimes, SvelteKit usually returns 500)
                // But we can check text content if needed. For now, status is good enough.
                // console.log(`[PASS] ${mod.id}`); 
                passed++;
                process.stdout.write('.');
            } else {
                console.log(`\n[FAIL] ${mod.id} - Status: ${res.status}`);
                failures.push({ id: mod.id, status: res.status });
                failed++;
            }
        } catch (error) {
            console.log(`\n[ERR] ${mod.id} - ${error.message}`);
            failures.push({ id: mod.id, error: error.message });
            failed++;
        }
    }

    console.log('\n\n--- SUMMARY ---');
    console.log(`Total: ${modules.length + 1}`); // +1 for catalog
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('Failures:');
        console.table(failures);
        process.exit(1);
    } else {
        console.log('All pages passed!');
    }
}

checkPages();
