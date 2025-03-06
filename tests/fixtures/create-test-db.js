/**
 * Script to create a test SQLite database for testing
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const TEST_DB_PATH = path.join(__dirname, 'test-launcher.sqlite');

async function createTestDatabase() {
  console.log(`Creating test database at ${TEST_DB_PATH}`);
  
  // Remove existing database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  
  // Create and open the database
  const db = await open({
    filename: TEST_DB_PATH,
    driver: sqlite3.verbose().Database
  });
  
  // Create tables
  await db.exec(`
    CREATE TABLE playsets (
      id char(36) not null,
      name varchar(255) not null,
      isActive boolean,
      loadOrder varchar(255),
      pdxId int,
      pdxUserId char(36),
      createdOn datetime not null,
      updatedOn datetime,
      syncedOn datetime,
      lastServerChecksum text,
      isRemoved boolean not null default false,
      hasNotApprovedChanges boolean not null default '0',
      syncState varchar(255),
      primary key (id),
      constraint uq_pdxId unique (pdxId)
    );
    
    CREATE TABLE mods (
      id char(36) not null,
      pdxId varchar(255),
      steamId varchar(255),
      gameRegistryId text,
      name varchar(255),
      displayName varchar(255),
      thumbnailUrl text,
      thumbnailPath text,
      version varchar(255),
      tags json default '[]',
      requiredVersion varchar(255),
      arch text,
      os text,
      repositoryPath text,
      dirPath text,
      archivePath text,
      status text not null,
      source text not null,
      primary key (id)
    );
    
    CREATE TABLE playsets_mods (
      playsetId char(36) not null,
      modId char(36) not null,
      enabled boolean default '1',
      position integer,
      foreign key(playsetId) references playsets(id) on delete CASCADE,
      foreign key(modId) references mods(id) on delete CASCADE
    );
  `);
  
  // Insert test data
  
  // Playsets
  await db.exec(`
    INSERT INTO playsets (id, name, isActive, createdOn, isRemoved)
    VALUES 
      ('playset-1', 'Test Playset 1', 1, '2023-01-01', 0),
      ('playset-2', 'Test Playset 2', 0, '2023-01-02', 0),
      ('playset-3', 'Removed Playset', 0, '2023-01-03', 1);
  `);
  
  // Mods
  await db.exec(`
    INSERT INTO mods (id, name, displayName, dirPath, tags, status, source)
    VALUES 
      ('mod-1', 'test_mod_1', 'Test Mod 1', '/path/to/mod1', '["gameplay", "balance"]', 'available', 'local'),
      ('mod-2', 'test_mod_2', 'Test Mod 2', '/path/to/mod2', '["graphics", "visual"]', 'available', 'workshop'),
      ('mod-3', 'test_mod_3', 'Test Mod 3', '/path/to/mod3', '["total conversion"]', 'available', 'workshop'),
      ('mod-4', 'test_mod_4', 'Test Mod 4', '/path/to/mod4', '[]', 'available', 'local');
  `);
  
  // Playset mods
  await db.exec(`
    INSERT INTO playsets_mods (playsetId, modId, enabled, position)
    VALUES 
      ('playset-1', 'mod-1', 1, 0),
      ('playset-1', 'mod-2', 1, 1),
      ('playset-1', 'mod-3', 0, 2),
      ('playset-1', 'mod-4', 1, 3),
      ('playset-2', 'mod-1', 1, 0),
      ('playset-2', 'mod-3', 1, 1);
  `);
  
  await db.close();
  console.log('Test database created successfully');
}

// Run the function if this script is executed directly
if (require.main === module) {
  createTestDatabase().catch(error => {
    console.error(`Error creating test database: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { createTestDatabase, TEST_DB_PATH }; 