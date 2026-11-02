const fs = require('fs');
const m = JSON.parse(fs.readFileSync('.next/app-build-manifest.json', 'utf8'));
for (const [route, files] of Object.entries(m.pages)) {
    const bytes = files.reduce((s, f) => {
        try { return s + fs.statSync('.next/' + f).size; } catch { return s; }
    }, 0);
    console.log((bytes / 1024).toFixed(0).padStart(6), 'KB', route);
}