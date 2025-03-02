// Script to find and examine technology files in Stellaris
const fs = require('fs');
const path = require('path');
const os = require('os');

// Common locations for Stellaris
const possiblePaths = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stellaris',
  'D:\\Steam\\steamapps\\common\\Stellaris',
  'E:\\Steam\\steamapps\\common\\Stellaris'
];

// Try to find the Stellaris installation
let stellarisPath = null;
for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    stellarisPath = path;
    break;
  }
}

if (!stellarisPath) {
  console.error('Could not find Stellaris installation. Please check the paths.');
  process.exit(1);
}

console.log(`Found Stellaris installation at: ${stellarisPath}`);

// Look for technology files in the vanilla game
const techFolders = [
  path.join(stellarisPath, 'common', 'technology'),
];

console.log('\nExamining technology files:');

// Function to recursively list files
function listFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        listFiles(filePath, fileList);
      } else if (file.endsWith('.txt')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return fileList;
  }
}

// Find all technology files
let techFiles = [];
techFolders.forEach(folder => {
  if (fs.existsSync(folder)) {
    const files = listFiles(folder);
    techFiles = techFiles.concat(files);
  }
});

console.log(`Found ${techFiles.length} technology files in the base game.`);

// Examine one tech file as an example
if (techFiles.length > 0) {
  const sampleFile = techFiles[0];
  console.log(`\nSample technology file: ${sampleFile}`);
  
  try {
    const content = fs.readFileSync(sampleFile, 'utf8');
    console.log('\nFirst 1000 characters of the file:');
    console.log(content.substring(0, 1000) + '...');
    
    // Try to identify the format of tech files
    console.log('\nTrying to identify the tech file format:');
    
    // Look for patterns of tech definitions
    const techRegex = /^(\w+)\s*=\s*\{([^}]*)\}/gm;
    const matches = [...content.matchAll(techRegex)];
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} potential technology definitions.`);
      
      // Print the first tech as an example
      if (matches.length > 0) {
        console.log('\nExample technology definition:');
        console.log(matches[0][0].substring(0, 500) + '...');
      }
      
      // Look for common properties in technology definitions
      const propertyRegex = /(\w+)\s*=\s*([^{\n]+)/g;
      const firstTech = matches[0][0];
      const properties = [...firstTech.matchAll(propertyRegex)];
      
      console.log('\nCommon properties in tech definitions:');
      properties.forEach(prop => {
        console.log(`- ${prop[1].trim()}: ${prop[2].trim()}`);
      });
    } else {
      console.log('Could not identify technology definitions in the expected format.');
    }
  } catch (err) {
    console.error(`Error reading file ${sampleFile}: ${err.message}`);
  }
}

// Also look for save game format
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

  if (saveFiles.length > 0) {
    const latestSave = saveFiles[0];
    console.log(`\nLatest save game: ${latestSave.name}`);
    
    try {
      // Read just the beginning of the file to identify the format (save files can be large)
      const fd = fs.openSync(latestSave.path, 'r');
      const buffer = Buffer.alloc(1024);
      fs.readSync(fd, buffer, 0, 1024, 0);
      fs.closeSync(fd);
      
      console.log('\nSave game file format (first 200 bytes):');
      console.log(buffer.slice(0, 200).toString('hex'));
      
      // Check if it's a binary or text file
      const isBinary = buffer.slice(0, 20).some(byte => byte < 9 && byte !== 0);
      console.log(`\nSave file appears to be: ${isBinary ? 'Binary' : 'Text-based'}`);
    } catch (err) {
      console.error(`Error reading save file ${latestSave.path}: ${err.message}`);
    }
  }
} 