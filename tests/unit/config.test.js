const config = require('../../src/config');
const path = require('path');
const os = require('os');

describe('Configuration Module', () => {
  test('should have homedir property', () => {
    expect(config.homedir).toBe(os.homedir());
  });

  test('should have documentsPath property', () => {
    let expectedPath;
    switch (process.platform) {
    case 'win32':
      expectedPath = path.join(os.homedir(), 'Documents');
      break;
    case 'darwin':
      expectedPath = path.join(os.homedir(), 'Documents');
      break;
    default:
      expectedPath = path.join(os.homedir(), '.local', 'share');
    }
    expect(config.documentsPath).toBe(expectedPath);
  });

  test('should have stellarisUserDataPath property', () => {
    const expectedPath = path.join(config.documentsPath, 'Paradox Interactive', 'Stellaris');
    expect(config.stellarisUserDataPath).toBe(expectedPath);
  });

  test('should have launcherDbPath property', () => {
    const expectedPath = path.join(config.stellarisUserDataPath, 'launcher-v2.sqlite');
    expect(config.launcherDbPath).toBe(expectedPath);
  });

  test('should have saveGamesPath property', () => {
    const expectedPath = path.join(config.stellarisUserDataPath, 'save games');
    expect(config.saveGamesPath).toBe(expectedPath);
  });
}); 