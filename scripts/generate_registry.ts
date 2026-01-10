import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Define paths
const YAML_DIR = '/Users/jonathanhollander/AI Code/Notion Template/Analysis_ChatGPT_Build/split_yaml';
const OUT_FILE = '/Users/jonathanhollander/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/frontend/src/lib/data/registry.json';

interface PageDefinition {
    title: string;
    icon?: string;
    description?: string;
    role?: string;
    slug?: string;
    parent?: string;
    cover?: string;
    // Add other fields as needed
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

// Main execution
const modules: any[] = [];

try {
    const files = fs.readdirSync(YAML_DIR);

    // Track unique IDs to prevent duplicates
    const seenIds = new Set<string>();

    files.forEach(file => {
        if (path.extname(file) === '.yaml') {
            const content = fs.readFileSync(path.join(YAML_DIR, file), 'utf8');
            try {
                const doc = yaml.load(content) as any;
                let pages: PageDefinition[] = [];
                // Handle different YAML structures
                if (doc.pages && Array.isArray(doc.pages)) {
                    pages = doc.pages;
                } else if (Array.isArray(doc)) {
                    pages = doc;
                } else if (typeof doc === 'object') {
                    Object.values(doc).forEach(val => {
                        if (Array.isArray(val)) {
                            pages = pages.concat(val as PageDefinition[]);
                        }
                    });
                }

                let fileCount = 0;
                pages.forEach((rawPage: any) => {
                    // Normalize keys (Title -> title, etc)
                    const title = rawPage.title || rawPage.Title;

                    if (title) {
                        // FORCE SAFE SLUG: Ignore provided slug's special chars
                        const rawSlug = rawPage.slug || rawPage.Slug || slugify(title);
                        // Replace / with - and remove other unsafe chars
                        const safeId = rawSlug.toLowerCase()
                            .replace(/\//g, '-')
                            .replace(/[^a-z0-9\-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');

                        if (!seenIds.has(safeId)) {
                            seenIds.add(safeId);

                            const icon = rawPage.icon || rawPage.Icon || '📄';
                            const desc = rawPage.description || rawPage.Description || rawPage.Body || "Module content";
                            const role = rawPage.role || rawPage.Role || "all";
                            const parent = rawPage.parent || rawPage.Parent || "root";
                            const cover = rawPage.cover || rawPage.Cover || "";

                            modules.push({
                                id: safeId,
                                title: title,
                                icon: icon.replace('emoji:', ''),
                                description: desc,
                                role: role,
                                parent: parent,
                                cover: cover
                            });
                            fileCount++;
                        }
                    }
                });
                console.log(`Processed ${file}: ${fileCount} new modules.`);

            } catch (e) {
                console.error(`Error parsing ${file}:`, e);
            }
        }
    });

    // Write Registry
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(modules, null, 2));

    console.log(`Successfully generated registry with ${modules.length} modules.`);

} catch (e) {
    console.error("Critical error:", e);
}
