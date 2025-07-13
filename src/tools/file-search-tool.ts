import { z } from 'zod';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import * as fs from 'fs/promises';
import * as path from 'path';

// Input schema for the file search tool
const FileSearchInputSchema = z.object({
    pattern: z.string().min(1, 'Search pattern is required'),
    directory: z.string().default('.'),
    maxResults: z.number().min(1).max(100).default(20),
    includeHidden: z.boolean().default(false),
});

// File search implementation
async function searchFiles(input: z.infer<typeof FileSearchInputSchema>) {
    const { pattern, directory, maxResults, includeHidden } = input;

    try {
        // Convert glob pattern to regex
        const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

        const regex = new RegExp(regexPattern, 'i');
        const results: Array<{
            name: string;
            path: string;
            size: number;
            isDirectory: boolean;
            modified: string;
        }> = [];

        // Recursive search function
        async function searchDirectory(dir: string, currentDepth: number = 0): Promise<void> {
            // Limit recursion depth to prevent infinite loops
            if (currentDepth > 5) return;

            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (results.length >= maxResults) break;

                    // Skip hidden files/directories unless explicitly included
                    if (!includeHidden && entry.name.startsWith('.')) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (regex.test(entry.name)) {
                        try {
                            const stats = await fs.stat(fullPath);
                            results.push({
                                name: entry.name,
                                path: fullPath,
                                size: stats.size,
                                isDirectory: entry.isDirectory(),
                                modified: stats.mtime.toISOString(),
                            });
                        } catch (error) {
                            // Skip files that can't be accessed
                            continue;
                        }
                    }

                    // Recursively search subdirectories
                    if (entry.isDirectory()) {
                        await searchDirectory(fullPath, currentDepth + 1);
                    }
                }
            } catch (error) {
                // Skip directories that can't be accessed
                return;
            }
        }

        await searchDirectory(directory);

        return {
            pattern: pattern,
            directory: directory,
            matchesFound: results.length,
            files: results.slice(0, maxResults),
            truncated: results.length > maxResults,
        };
    } catch (error) {
        return {
            pattern: pattern,
            directory: directory,
            error: error instanceof Error ? error.message : 'Unknown search error',
            matchesFound: 0,
            files: [],
        };
    }
}

export const fileSearchTool = createAiSdkTool(
    'search_files',
    'Search for files matching a pattern in the specified directory. Supports glob-style patterns with * and ? wildcards.',
    FileSearchInputSchema,
    searchFiles,
);
