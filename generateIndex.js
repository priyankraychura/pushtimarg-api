const fs = require('fs');
const path = require('path');

const AARTI_DIR = path.join(__dirname, 'aartis');
const OUTPUT_FILE = path.join(__dirname, 'index.json');

// 1. Read all files in the 'aartis' folder
const files = fs.readdirSync(AARTI_DIR);

const masterList = files
  .filter(file => file.endsWith('.json')) // Only JSON files
  .map(filename => {
    // 2. Read the content of each file
    const filePath = path.join(AARTI_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // 3. Extract ONLY what is needed for the list (Metadata)
    // We intentionally EXCLUDE 'content' to keep the list small
    return {
      id: data.id,
      title: data.title,
      artist: data.artist,
      category: data.category,
      subtitle: data.subtitle || "", 
      file: filename // We add the filename so the app knows what to fetch
    };
  });

// 4. Write the Master List
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterList, null, 2));

console.log(`✅ Success! Generated index.json with ${masterList.length} items.`);