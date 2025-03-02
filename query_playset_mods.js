// Script to examine the relationship between playsets and mods
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Path to the Stellaris SQLite database
const dbPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'launcher-v2.sqlite');

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

// Get all playsets
db.all(`SELECT * FROM playsets`, [], (err, playsets) => {
  if (err) {
    console.error(`Error getting playsets: ${err.message}`);
    db.close();
    process.exit(1);
  }
  
  console.log('Available playsets:');
  playsets.forEach(playset => {
    console.log(`- ${playset.id}: ${playset.name} (Active: ${playset.isActive ? 'Yes' : 'No'})`);
  });
  
  // Find the active playset or the one named "Default"
  const activePlayset = playsets.find(p => p.isActive === 1) || 
                        playsets.find(p => p.name === 'Default');
  
  if (activePlayset) {
    console.log(`\nExamining playset: ${activePlayset.name} (${activePlayset.id})`);
    
    // Get mods for this playset
    db.all(
      `SELECT pm.*, m.displayName, m.requiredVersion, m.dirPath, m.gameRegistryId 
       FROM playsets_mods pm 
       JOIN mods m ON pm.modId = m.id 
       WHERE pm.playsetId = ? 
       ORDER BY pm.position`,
      [activePlayset.id],
      (err, mods) => {
        if (err) {
          console.error(`Error getting mods for playset: ${err.message}`);
          db.close();
          process.exit(1);
        }
        
        console.log(`\nMods in playset (${mods.length} total):`);
        mods.forEach((mod, index) => {
          console.log(`${index + 1}. ${mod.displayName}`);
          console.log(`   - Position: ${mod.position}`);
          console.log(`   - Required Game Version: ${mod.requiredVersion}`);
          console.log(`   - Path: ${mod.dirPath}`);
          console.log(`   - Registry ID: ${mod.gameRegistryId}`);
          console.log();
        });
        
        // Look for save game files
        const fs = require('fs');
        const saveGamesPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'save games');
        
        if (fs.existsSync(saveGamesPath)) {
          console.log('Save games directory found.');
          
          try {
            const saveFiles = fs.readdirSync(saveGamesPath)
              .filter(file => file.endsWith('.sav'))
              .map(file => ({
                name: file,
                path: path.join(saveGamesPath, file),
                stats: fs.statSync(path.join(saveGamesPath, file))
              }))
              .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
            
            console.log(`\nFound ${saveFiles.length} save files. Most recent:`);
            saveFiles.slice(0, 5).forEach((save, index) => {
              console.log(`${index + 1}. ${save.name} - Last modified: ${save.stats.mtime.toLocaleString()}`);
            });
          } catch (err) {
            console.error(`Error reading save games directory: ${err.message}`);
          }
        } else {
          console.log('Save games directory not found.');
        }
        
        db.close();
      }
    );
  } else {
    console.log('No active playset found.');
    db.close();
  }
}); 