// Comprehensive exploration of Stellaris files
const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

// Common locations for Stellaris
const possiblePaths = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stellaris',
  'D:\\Steam\\steamapps\\common\\Stellaris',
  'E:\\Steam\\steamapps\\common\\Stellaris'
];

// Try to find the Stellaris installation
let stellarisPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    stellarisPath = testPath;
    break;
  }
}

if (!stellarisPath) {
  console.error('Could not find Stellaris installation. Please check the paths.');
  process.exit(1);
}

console.log(`Found Stellaris installation at: ${stellarisPath}`);

// Function to recursively list files
function listFiles(dir, fileList = [], filter = /\.txt$/) {
  try {
    if (!fs.existsSync(dir)) {
      return fileList;
    }
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          listFiles(filePath, fileList, filter);
        } else if (filter.test(file)) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip files we can't access
      }
    });
    
    return fileList;
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return fileList;
  }
}

// Look for key game directories
console.log('\nExploring key game directories:');
const gameDirectories = [
  { name: 'Technology', path: path.join(stellarisPath, 'common', 'technology') },
  { name: 'Events', path: path.join(stellarisPath, 'events') },
  { name: 'Localisation', path: path.join(stellarisPath, 'localisation', 'english') }
];

gameDirectories.forEach(dir => {
  if (fs.existsSync(dir.path)) {
    console.log(`- ${dir.name} directory: ${dir.path}`);
    const files = listFiles(dir.path);
    console.log(`  Found ${files.length} files`);
  } else {
    console.log(`- ${dir.name} directory not found at expected path: ${dir.path}`);
  }
});

// Function to examine a sample text file
function examineTextFile(filePath, maxChars = 1000) {
  try {
    console.log(`\nExamining file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`First ${maxChars} characters:`);
    console.log(content.substring(0, maxChars) + '...');
    return content;
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err.message}`);
    return null;
  }
}

// Examine a sample technology file if available
const techFiles = listFiles(path.join(stellarisPath, 'common', 'technology'));
if (techFiles.length > 0) {
  const sampleTechContent = examineTextFile(techFiles[0]);
  
  if (sampleTechContent) {
    // Try to extract tech entries using a simple regex
    const techEntries = sampleTechContent.match(/\w+\s*=\s*\{[^{]*\}/g);
    if (techEntries && techEntries.length > 0) {
      console.log(`\nFound approximately ${techEntries.length} technology entries in the sample file.`);
      console.log('First technology entry:');
      console.log(techEntries[0].substring(0, 500) + '...');
    }
  }
}

// Get information about mods from the database
const dbPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'launcher-v2.sqlite');

if (fs.existsSync(dbPath)) {
  console.log('\nExamining mod information from database...');
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(`Error opening database: ${err.message}`);
      return;
    }
    
    // Get active playset
    db.get('SELECT * FROM playsets WHERE isActive = 1', [], (err, activePlayset) => {
      if (err || !activePlayset) {
        console.error('Could not find active playset.');
        db.close();
        return;
      }
      
      console.log(`Active playset: ${activePlayset.name}`);
      
      // Get mods in the active playset
      db.all(
        `SELECT m.* FROM mods m 
         JOIN playsets_mods pm ON m.id = pm.modId 
         WHERE pm.playsetId = ? 
         ORDER BY pm.position`,
        [activePlayset.id],
        (err, mods) => {
          if (err) {
            console.error(`Error getting mods: ${err.message}`);
            db.close();
            return;
          }
          
          console.log(`Found ${mods.length} mods in the active playset.`);
          
          // Check each mod for technology files
          let modTechFiles = [];
          mods.forEach(mod => {
            if (mod.dirPath && fs.existsSync(mod.dirPath)) {
              const techPath = path.join(mod.dirPath, 'common', 'technology');
              if (fs.existsSync(techPath)) {
                const files = listFiles(techPath);
                console.log(`Mod "${mod.displayName}" contains ${files.length} technology files.`);
                modTechFiles = modTechFiles.concat(files);
              }
            }
          });
          
          console.log(`Found ${modTechFiles.length} technology files in mods.`);
          
          // Examine a sample mod tech file if available
          if (modTechFiles.length > 0) {
            examineTextFile(modTechFiles[0]);
          }
          
          // Check for save games
          const saveGamesPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'save games');
          if (fs.existsSync(saveGamesPath)) {
            const saveFiles = fs.readdirSync(saveGamesPath)
              .filter(file => file.endsWith('.sav'))
              .map(file => ({
                name: file,
                path: path.join(saveGamesPath, file),
                stats: fs.statSync(path.join(saveGamesPath, file))
              }))
              .sort((a, b) => b.stats.mtime - a.stats.mtime);
            
            console.log(`\nFound ${saveFiles.length} save game files.`);
            
            if (saveFiles.length > 0) {
              const latestSave = saveFiles[0];
              console.log(`Latest save: ${latestSave.name} (${latestSave.stats.size} bytes)`);
              
              // Examine beginning of the save file
              try {
                const fd = fs.openSync(latestSave.path, 'r');
                const buffer = Buffer.alloc(200);
                fs.readSync(fd, buffer, 0, 200, 0);
                fs.closeSync(fd);
                
                console.log('\nSave file format (first 200 bytes):');
                console.log(buffer.toString().replace(/[\x00-\x1F]/g, '.'));
                
                // Determine if it's compressed
                const isCompressed = buffer.slice(0, 4).toString() === 'PK\x03\x04' || 
                                    buffer.slice(0, 2).toString() === '\x1F\x8B';
                console.log(`Save appears to be ${isCompressed ? 'compressed' : 'uncompressed'}`);
                
              } catch (err) {
                console.error(`Error examining save file: ${err.message}`);
              }
            }
          }
          
          db.close();
          console.log('\nExploration complete!');
        }
      );
    });
  });
} else {
  console.log('SQLite database not found. Cannot examine mod information.');
} 