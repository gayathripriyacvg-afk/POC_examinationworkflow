const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const modelsRoot = path.join(__dirname, '..', '..', 'models');

console.log('Models root path resolved to:', path.resolve(modelsRoot));

function requireModelsFromDir(dir) {
    const absoluteDir = path.join(modelsRoot, dir);
    if (!fs.existsSync(absoluteDir)) {
        console.error(`Directory not found: ${absoluteDir}`);
        return;
    }
    const files = fs.readdirSync(absoluteDir);
    console.log(`\n--- Loading models from: ${dir} ---`);
    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const modelPath = path.join(absoluteDir, file);
                const model = require(modelPath);
                console.log(`[SUCCESS] Loaded model: ${file} (Collection: ${model.collection.name})`);
            } catch (err) {
                console.error(`[ERROR] Failed to load model: ${file}`, err);
            }
        }
    }
}

requireModelsFromDir('admin-models');
requireModelsFromDir('scanner-models');
requireModelsFromDir('osm-models');
requireModelsFromDir('CBT_Schema');

console.log('\nModel load verification complete!');
