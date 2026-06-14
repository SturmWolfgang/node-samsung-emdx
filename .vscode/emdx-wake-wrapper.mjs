#!/usr/bin/env node

import { readFileSync } from 'fs';

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

// Load .env file
const envPath = '.env';
const envVars = parseEnvFile(envPath);

// Get MAC address from env
const mac = envVars.DISPLAY_MAC || process.env.DISPLAY_MAC;

if (mac) {
    console.log(`Using .env MAC address: ${mac}`);
    // Use child_process to spawn the wake command
    import('child_process').then(({ spawn }) => {
        const child = spawn('node', ['bin/index.mjs', 'wake', '--mac', mac], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('exit', (code) => {
            process.exit(code);
        });
    });
} else {
    console.error('No DISPLAY_MAC found in .env file');
    process.exit(1);
}