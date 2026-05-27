const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function run() {
    for (const file of files) {
        const dataBuffer = fs.readFileSync(path.join(dir, file));
        try {
            const data = await pdf(dataBuffer);
            fs.writeFileSync(path.join(__dirname, file + '.txt'), data.text);
            console.log(`Extracted text from ${file}`);
        } catch (err) {
            console.error(`Error reading ${file}:`, err);
        }
    }
}

console.log("pdf is", typeof pdf);
run();
