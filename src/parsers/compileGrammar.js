const nearley = require('nearley');
const compile = require('nearley/lib/compile');
const generate = require('nearley/lib/generate');
const nearleyGrammar = require('nearley/lib/nearley-language-bootstrapped');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Compiles a Nearley grammar file into a JavaScript module
 * @param {string} grammarPath - Path to the grammar file
 * @param {string} outputPath - Path to save the compiled grammar
 * @returns {Promise<void>}
 */
async function compileGrammar(grammarPath, outputPath) {
  try {
    logger.info(`Compiling grammar from ${grammarPath} to ${outputPath}`);
    
    // Read the grammar file
    const grammarContent = await fs.promises.readFile(grammarPath, 'utf8');
    
    // Parse the grammar with the Nearley parser
    const parser = new nearley.Parser(nearleyGrammar);
    parser.feed(grammarContent);
    
    // Compile the parsed grammar
    const compilation = compile(parser.results[0], {});
    
    // Generate JavaScript code
    const jsCode = generate(compilation, 'grammar');
    
    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Write the compiled grammar to the output file
    await fs.promises.writeFile(
      outputPath,
      `// Generated automatically by nearley, do not edit by hand
// Original grammar: ${path.basename(grammarPath)}

// eslint-disable-next-line no-unused-vars
const moo = require('moo');

// Define the grammar
${jsCode}

// Export the grammar
module.exports = { grammar: grammar };
`
    );
    
    logger.info(`Grammar compiled successfully to ${outputPath}`);
  } catch (error) {
    logger.error(`Error compiling grammar: ${error.message}`);
    throw error;
  }
}

// If this script is run directly, compile the grammar
if (require.main === module) {
  const grammarPath = path.resolve(__dirname, 'grammar', 'stellaris.ne');
  const outputPath = path.resolve(__dirname, 'grammar', 'stellaris.js');
  
  compileGrammar(grammarPath, outputPath)
    .then(() => {
      logger.info('Grammar compilation completed');
    })
    .catch((error) => {
      logger.error(`Grammar compilation failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = compileGrammar; 