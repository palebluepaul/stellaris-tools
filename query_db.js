// Script to examine Stellaris launcher SQLite database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Path to the Stellaris SQLite database
const dbPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'launcher-v2.sqlite');

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at: ${dbPath}`);
  process.exit(1);
}

console.log(`Database found at: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log('Connected to the Stellaris launcher database.');
});

// Get all table names
db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
  if (err) {
    console.error(`Error getting tables: ${err.message}`);
    db.close();
    process.exit(1);
  }
  
  console.log('Tables in the database:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // If there's a mods table, let's examine it
  const modsTable = tables.find(t => t.name.toLowerCase().includes('mod'));
  if (modsTable) {
    console.log(`\nExamining table: ${modsTable.name}`);
    db.all(`PRAGMA table_info(${modsTable.name})`, [], (err, columns) => {
      if (err) {
        console.error(`Error getting columns: ${err.message}`);
      } else {
        console.log('Columns:');
        columns.forEach(col => {
          console.log(`- ${col.name} (${col.type})`);
        });
        
        // Get a sample of data
        db.all(`SELECT * FROM ${modsTable.name} LIMIT 3`, [], (err, rows) => {
          if (err) {
            console.error(`Error getting data: ${err.message}`);
          } else {
            console.log('\nSample data:');
            console.log(JSON.stringify(rows, null, 2));
          }
          
          // Look for playset information
          const playsetTable = tables.find(t => t.name.toLowerCase().includes('playset'));
          if (playsetTable) {
            console.log(`\nExamining table: ${playsetTable.name}`);
            db.all(`PRAGMA table_info(${playsetTable.name})`, [], (err, columns) => {
              if (err) {
                console.error(`Error getting columns: ${err.message}`);
              } else {
                console.log('Columns:');
                columns.forEach(col => {
                  console.log(`- ${col.name} (${col.type})`);
                });
                
                // Get a sample of playset data
                db.all(`SELECT * FROM ${playsetTable.name} LIMIT 3`, [], (err, rows) => {
                  if (err) {
                    console.error(`Error getting data: ${err.message}`);
                  } else {
                    console.log('\nSample playset data:');
                    console.log(JSON.stringify(rows, null, 2));
                  }
                  db.close();
                });
              }
            });
          } else {
            db.close();
          }
        });
      }
    });
  } else {
    db.close();
  }
}); 