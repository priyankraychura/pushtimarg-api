const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const DIRS = {
    AARTI: path.join(__dirname, 'aartis'),
    VARTA_84: path.join(__dirname, 'varta', '84'),
    VARTA_252: path.join(__dirname, 'varta', '252'),
};

const FILES = {
    AARTI_INDEX: path.join(__dirname, 'index.json'),
    INDEX_84: path.join(__dirname, 'index_84.json'),
    INDEX_252: path.join(__dirname, 'index_252.json'),
};

// --- HELPER: SORTING (Natural Sort) ---
// This ensures "v84_2" comes after "v84_1" and "p10" comes after "p2"
const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

// --- FUNCTION 1: GENERATE AARTI LIST (Flat List) ---
const generateAartiList = () => {
    if (!fs.existsSync(DIRS.AARTI)) {
        console.warn("⚠️ 'aartis' folder not found. Skipping Aarti index.");
        return;
    }

    console.log("Processing Aartis...");
    const files = fs.readdirSync(DIRS.AARTI);

    const masterList = files
        .filter(file => file.endsWith('.json'))
        .map(filename => {
            const filePath = path.join(DIRS.AARTI, filename);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (!content.trim()) return null;
                const data = JSON.parse(content);
                
                return {
                    id: data.id,
                    title: data.title,
                    artist: data.artist,
                    category: data.category,
                    subtitle: data.subtitle || "", 
                    file: filename 
                };
            } catch (e) {
                console.error(`❌ Error parsing ${filename}: ${e.message}`);
                return null;
            }
        })
        .filter(Boolean)
        .sort((a, b) => naturalSort(a.id, b.id)); // Optional: Sort by ID

    fs.writeFileSync(FILES.AARTI_INDEX, JSON.stringify(masterList, null, 2));
    console.log(`✅ Generated index.json with ${masterList.length} items.`);
};

// --- FUNCTION 2: GENERATE VARTA LIST (Grouped List) ---
const generateVartaList = (sourceDir, outputFile, folderPrefix) => {
    if (!fs.existsSync(sourceDir)) {
        console.warn(`⚠️ '${folderPrefix}' folder not found at ${sourceDir}. Skipping.`);
        return;
    }

    console.log(`Processing Varta ${folderPrefix}...`);
    const files = fs.readdirSync(sourceDir);
    
    // We use a map to group prasangs by their Vaishnav ID (e.g., "v84_1")
    const vaishnavMap = {};

    files.filter(file => file.endsWith('.json')).forEach(filename => {
        const filePath = path.join(sourceDir, filename);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (!content.trim()) return;
            const data = JSON.parse(content);

            // Parsing Filename to get IDs
            // Expecting format: v84_1_p1.json
            // We split by '_' to extract parts
            const parts = filename.replace('.json', '').split('_'); 
            // parts = ["v84", "1", "p1"]
            
            if (parts.length < 3) {
                console.warn(`⚠️ Skipping incorrectly named file: ${filename}`);
                return;
            }

            const vaishnavId = `${parts[0]}_${parts[1]}`; // e.g., "v84_1"
            
            // If this Vaishnav isn't in our map yet, init it
            if (!vaishnavMap[vaishnavId]) {
                vaishnavMap[vaishnavId] = {
                    id: vaishnavId,
                    // Try to find a Name in the JSON, or fallback to ID (You should add "vaishnavName" to your JSONs)
                    name: data.vaishnavName || `Vaishnav ${parts[1]}`, 
                    bio: data.bio || "", // Optional bio field
                    prasangs: []
                };
            }

            // Add this prasang to the list
            vaishnavMap[vaishnavId].prasangs.push({
                id: parts[2], // "p1"
                title: data.title,
                file: `${folderPrefix}/${filename}` // e.g., "84/v84_1_p1.json"
            });

        } catch (e) {
            console.error(`❌ Error parsing ${filename}: ${e.message}`);
        }
    });

    // Convert Map to Array and Sort
    const finalList = Object.values(vaishnavMap)
        .sort((a, b) => naturalSort(a.id, b.id)) // Sort Vaishnavs (v84_1, v84_2...)
        .map(v => {
            // Sort Prasangs inside each Vaishnav (p1, p2...)
            v.prasangs.sort((a, b) => naturalSort(a.id, b.id));
            return v;
        });

    fs.writeFileSync(outputFile, JSON.stringify(finalList, null, 2));
    console.log(`✅ Generated ${path.basename(outputFile)} with ${finalList.length} Vaishnavs.`);
};

// --- EXECUTION ---
try {
    // 1. Aartis
    generateAartiList();

    // 2. Varta 84
    generateVartaList(DIRS.VARTA_84, FILES.INDEX_84, '84');

    // 3. Varta 252
    generateVartaList(DIRS.VARTA_252, FILES.INDEX_252, '252');

    console.log("\n🎉 All indexes updated successfully!");

} catch (error) {
    console.error("🔥 Critical Error:", error);
    process.exit(1);
}