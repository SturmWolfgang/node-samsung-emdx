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

// Get host and pin from env
const host = envVars.DISPLAY_HOST || process.env.DISPLAY_HOST;
const pin = envVars.DISPLAY_PIN || process.env.DISPLAY_PIN;

if (host && pin) {
    console.log(`Using .env variables: host=${host}, pin=${pin}`);
    // Use child_process to spawn the sleep command
    import('child_process').then(({ spawn }) => {
        const child = spawn('node', ['bin/index.mjs', 'sleep', '--host', host, '--pin', pin], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('exit', (code) => {
            process.exit(code);
        });
    });
} else {
    console.error('Missing DISPLAY_HOST or DISPLAY_PIN in .env file');
    process.exit(1);
}