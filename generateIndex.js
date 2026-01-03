const fs = require('fs');
const path = require('path');

const AARTI_DIR = path.join(__dirname, 'aartis');
const OUTPUT_FILE = path.join(__dirname, 'index.json');

// Check if aartis folder exists
if (!fs.existsSync(AARTI_DIR)) {
  console.error("❌ Error: 'aartis' folder not found!");
  process.exit(1);
}

// 1. Read all files in the 'aartis' folder
const files = fs.readdirSync(AARTI_DIR);

const masterList = files
  .filter(file => file.endsWith('.json')) // Only process .json files
  .map(filename => {
    const filePath = path.join(AARTI_DIR, filename);
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Check for empty files
        if (!fileContent.trim()) {
            console.warn(`⚠️ Skipping empty file: ${filename}`);
            return null;
        }

        const data = JSON.parse(fileContent);

        // 3. Extract ONLY metadata
        return {
          id: data.id,
          title: data.title,
          artist: data.artist,
          category: data.category,
          subtitle: data.subtitle || "", 
          file: filename // Add filename so App knows what to fetch
        };

    } catch (error) {
        console.error(`❌ Error parsing ${filename}: ${error.message}`);
        return null; // Return null so we can filter it out later
    }
  })
  .filter(item => item !== null); // Remove the nulls (failed files)

// 4. Write the Master List
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterList, null, 2));

console.log(`✅ Success! Generated index.json with ${masterList.length} items.`);