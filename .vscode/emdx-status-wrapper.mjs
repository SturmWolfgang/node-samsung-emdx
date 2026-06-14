#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Simple .env parser
function parseEnvFile(envPath) {
    try {
        const envContent = readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=', 2);
                if (key && value !== undefined) {
                    envVars[key.trim()] = value.trim();
                }
            }
        });
        return envVars;
    } catch (error) {
        return {};
    }
}

// Load .env file - use current working directory
const envPath = '.env';
const envVars = parseEnvFile(envPath);

// Get host and pin from env or prompts
const host = envVars.DISPLAY_HOST || process.env.DISPLAY_HOST;
const pin = envVars.DISPLAY_PIN || process.env.DISPLAY_PIN;

// If env vars are available, use them directly
if (host && pin) {
    console.log(`Using .env variables: host=${host}, pin=${pin}`);
    // Use child_process to spawn the main module with the right arguments
    import('child_process').then(({ spawn }) => {
        const child = spawn('node', ['bin/index.mjs', 'status', '--host', host, '--pin', pin], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('exit', (code) => {
            process.exit(code);
        });
    });
} else {
    // Fallback to prompts
    console.log('No .env variables found, will use prompts');
    // This will trigger the original prompt behavior
    process.exit(1);
}
