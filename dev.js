#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Store process references
let backendProcess = null;
let frontendProcess = null;

// Function to start the backend
function startBackend() {
  console.log('\n🚀 Starting backend...');
  
  backendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`\x1b[36m[Backend]\x1b[0m ${data.toString().trim()}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`\x1b[31m[Backend Error]\x1b[0m ${data.toString().trim()}`);
  });
  
  backendProcess.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log(`\x1b[31m[Backend] Process exited with code ${code}\x1b[0m`);
    }
  });
  
  return backendProcess;
}

// Function to start the frontend
function startFrontend() {
  console.log('\n🚀 Starting frontend...');
  
  frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(process.cwd(), 'frontend')
  });
  
  frontendProcess.stdout.on('data', (data) => {
    console.log(`\x1b[35m[Frontend]\x1b[0m ${data.toString().trim()}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    console.error(`\x1b[31m[Frontend Error]\x1b[0m ${data.toString().trim()}`);
  });
  
  frontendProcess.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log(`\x1b[31m[Frontend] Process exited with code ${code}\x1b[0m`);
    }
  });
  
  return frontendProcess;
}

// Function to stop processes
function stopProcesses() {
  return new Promise((resolve) => {
    console.log('\n🛑 Stopping all processes...');
    
    const killProcess = (process, name) => {
      return new Promise((resolveKill) => {
        if (!process) {
          resolveKill();
          return;
        }
        
        process.on('close', () => {
          console.log(`\x1b[33m[${name}] Stopped\x1b[0m`);
          resolveKill();
        });
        
        // Kill the process
        if (process.pid) {
          process.kill('SIGTERM');
          // Fallback if SIGTERM doesn't work
          setTimeout(() => {
            if (!process.killed) {
              process.kill('SIGKILL');
            }
          }, 1000);
        }
      });
    };
    
    Promise.all([
      killProcess(backendProcess, 'Backend'),
      killProcess(frontendProcess, 'Frontend')
    ]).then(() => {
      backendProcess = null;
      frontendProcess = null;
      resolve();
    });
  });
}

// Function to restart processes
async function restartProcesses() {
  await stopProcesses();
  startBackend();
  startFrontend();
  console.log('\n✅ All processes restarted');
  showCommands();
}

// Show available commands
function showCommands() {
  console.log('\n\x1b[33m=== Available Commands ===\x1b[0m');
  console.log('\x1b[33mr\x1b[0m: Restart both frontend and backend');
  console.log('\x1b[33mrf\x1b[0m: Restart frontend only');
  console.log('\x1b[33mrb\x1b[0m: Restart backend only');
  console.log('\x1b[33mq\x1b[0m: Quit');
  console.log('\x1b[33mh\x1b[0m: Show this help message');
}

// Handle user input
function setupInputHandling() {
  rl.on('line', async (input) => {
    const command = input.trim().toLowerCase();
    
    switch (command) {
      case 'r':
        await restartProcesses();
        break;
      case 'rf':
        if (frontendProcess) {
          await new Promise((resolve) => {
            console.log('\n🛑 Stopping frontend...');
            frontendProcess.on('close', () => {
              console.log('\x1b[33m[Frontend] Stopped\x1b[0m');
              frontendProcess = null;
              resolve();
            });
            frontendProcess.kill('SIGTERM');
          });
        }
        frontendProcess = startFrontend();
        console.log('\n✅ Frontend restarted');
        showCommands();
        break;
      case 'rb':
        if (backendProcess) {
          await new Promise((resolve) => {
            console.log('\n🛑 Stopping backend...');
            backendProcess.on('close', () => {
              console.log('\x1b[33m[Backend] Stopped\x1b[0m');
              backendProcess = null;
              resolve();
            });
            backendProcess.kill('SIGTERM');
          });
        }
        backendProcess = startBackend();
        console.log('\n✅ Backend restarted');
        showCommands();
        break;
      case 'q':
        await stopProcesses();
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      case 'h':
        showCommands();
        break;
      default:
        console.log('\n❓ Unknown command. Type "h" for help.');
    }
  });
  
  // Handle CTRL+C
  rl.on('SIGINT', async () => {
    await stopProcesses();
    console.log('\n👋 Goodbye!');
    rl.close();
    process.exit(0);
  });
}

// Main function
async function main() {
  console.log('\n🔧 Stellaris Tools Development Environment');
  console.log('Starting both frontend and backend services...');
  
  // Start processes
  startBackend();
  startFrontend();
  
  // Setup input handling
  setupInputHandling();
  
  // Show available commands
  showCommands();
}

// Run the main function
main().catch(err => {
  console.error('Error in main process:', err);
  process.exit(1);
}); 