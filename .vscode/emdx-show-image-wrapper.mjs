#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
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

// Function to scan for image files
function findImageFiles() {
    const sampleImagesDir = resolve(process.cwd(), 'sample_images');
    try {
        const files = readdirSync(sampleImagesDir);
        return files.filter(file => {
            const ext = file.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
        });
    } catch (error) {
        return [];
    }
}

// Function to track last uploaded image
function getLastUploadedImage() {
    try {
        const lastUploadPath = resolve(process.cwd(), '.last_uploaded_image');
        if (existsSync(lastUploadPath)) {
            return readFileSync(lastUploadPath, 'utf8').trim();
        }
    } catch (error) {
        // Ignore errors
    }
    return null;
}

function setLastUploadedImage(imagePath) {
    try {
        const lastUploadPath = resolve(process.cwd(), '.last_uploaded_image');
        writeFileSync(lastUploadPath, imagePath);
    } catch (error) {
        console.error('Failed to save last uploaded image:', error.message);
    }
}

// Load .env file
const envPath = '.env';
const envVars = parseEnvFile(envPath);

// Get host, pin, and image path from env
const host = envVars.DISPLAY_HOST || process.env.DISPLAY_HOST;
const pin = envVars.DISPLAY_PIN || process.env.DISPLAY_PIN;
const imageUploadPath = envVars.IMAGE_UPLOAD || process.env.IMAGE_UPLOAD;

if (host && pin) {
    // Find available image files
    const imageFiles = findImageFiles();

    if (imageFiles.length === 0) {
        console.error('No image files found in sample_images folder');
        process.exit(1);
    }

    console.log(`Using .env variables: host=${host}, pin=${pin}`);

    // Use IMAGE_UPLOAD from .env as primary source, fallback to VSCode input
    let imagePath;
    if (imageUploadPath) {
        // Use IMAGE_UPLOAD from .env
        imagePath = resolve(process.cwd(), imageUploadPath);
        console.log(`Using IMAGE_UPLOAD from .env: ${imageUploadPath}`);

        // Check if the image exists
        if (!existsSync(imagePath)) {
            console.error(`Image specified in IMAGE_UPLOAD not found: ${imageUploadPath}`);
            console.error('Available images:', imageFiles.join(', '));
            process.exit(1);
        }

        // Check if this is the same as last uploaded image
        const lastUploaded = getLastUploadedImage();
        if (lastUploaded === imagePath) {
            console.log('⏭️  This image was already uploaded. Skipping upload.');
            process.exit(0);
        }
    } else {
        // Fallback to VSCode input selection
        const selectedImage = process.env.INPUT_IMAGE;

        if (!selectedImage) {
            // If not running in VSCode, provide a simple prompt for testing
            if (!process.env.VSCODE_TASK) {
                console.log('Available images:', imageFiles.join(', '));
                console.log('Please set INPUT_IMAGE environment variable or run through VSCode task');
                process.exit(1);
            } else {
                console.error('No image selected. Please choose an image from the sample_images folder.');
                process.exit(1);
            }
        }

        if (!imageFiles.includes(selectedImage)) {
            console.error(`Selected image ${selectedImage} not found in sample_images folder`);
            console.error('Available images:', imageFiles.join(', '));
            process.exit(1);
        }

        imagePath = resolve(process.cwd(), 'sample_images', selectedImage);
        console.log(`Using selected image: ${selectedImage}`);
    }

    // Use child_process to spawn the show-image command
    import('child_process').then(({ spawn }) => {
        const child = spawn('node', [
            'bin/index.mjs',
            'show-image',
            '--host', host,
            '--pin', pin,
            '--image', imagePath
        ], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        child.on('exit', (code) => {
            if (code === 0) {
                // Save the successfully uploaded image path
                setLastUploadedImage(imagePath);
            }
            process.exit(code);
        });
    });
} else {
    console.error('Missing DISPLAY_HOST or DISPLAY_PIN in .env file');
    process.exit(1);
}
