import { z } from 'zod';
import { createTool } from '../tool-system';
import * as fs from 'fs/promises';
import * as path from 'path';

// Input schema for the file read tool
const FileReadInputSchema = z.object({
    filePath: z.string().min(1, 'File path is required'),
    encoding: z.enum(['utf8', 'utf16le', 'latin1', 'base64', 'hex']).optional().default('utf8'),
    maxSize: z
        .number()
        .min(1)
        .max(10 * 1024 * 1024)
        .optional()
        .default(1024 * 1024), // Default 1MB limit
});

// File read implementation
async function readFile(input: z.infer<typeof FileReadInputSchema>) {
    const { filePath, encoding = 'utf8', maxSize } = input;

    try {
        // Resolve the file path
        const resolvedPath = path.resolve(filePath);

        // Check if file exists and get stats
        const stats = await fs.stat(resolvedPath);

        if (!stats.isFile()) {
            return {
                error: `Path '${filePath}' is not a file`,
                filePath: resolvedPath,
                exists: false,
            };
        }

        // Check file size
        if (stats.size > maxSize) {
            return {
                error: `File is too large (${stats.size} bytes). Maximum allowed size is ${maxSize} bytes`,
                filePath: resolvedPath,
                size: stats.size,
                maxSize,
            };
        }

        // Read file content
        const content = await fs.readFile(resolvedPath, encoding);

        return {
            filePath: resolvedPath,
            content,
            size: stats.size,
            encoding,
            lastModified: stats.mtime.toISOString(),
            success: true,
        };
    } catch (error) {
        if (error instanceof Error) {
            // Handle specific error types
            if (error.message.includes('ENOENT')) {
                return {
                    error: `File not found: ${filePath}`,
                    filePath: path.resolve(filePath),
                    exists: false,
                };
            }

            if (error.message.includes('EACCES')) {
                return {
                    error: `Permission denied: ${filePath}`,
                    filePath: path.resolve(filePath),
                    hasPermission: false,
                };
            }

            if (error.message.includes('EISDIR')) {
                return {
                    error: `Path is a directory, not a file: ${filePath}`,
                    filePath: path.resolve(filePath),
                    isDirectory: true,
                };
            }

            return {
                error: `Failed to read file: ${error.message}`,
                filePath: path.resolve(filePath),
            };
        }

        return {
            error: `Unknown error occurred while reading file: ${filePath}`,
            filePath: path.resolve(filePath),
        };
    }
}

export const fileReadTool = createTool(
    'read_file',
    'Read the contents of a file. Supports various encodings and includes safety checks for file size and permissions.',
    FileReadInputSchema,
    readFile,
);
