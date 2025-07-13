import { z } from 'zod';
import { createTool } from '../tool-system';
import * as path from 'path';

// Input schema for the current working directory tool (no inputs required)
const CwdInputSchema = z.object({});

// Get current working directory implementation
async function getCurrentWorkingDirectory(input: z.infer<typeof CwdInputSchema>) {
    try {
        const cwd = process.cwd();
        const resolvedPath = path.resolve(cwd);

        return {
            cwd: resolvedPath,
            success: true,
            info: {
                platform: process.platform,
                separator: path.sep,
                delimiter: path.delimiter,
            },
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            success: false,
        };
    }
}

export const cwdTool = createTool(
    'get_cwd',
    'Get the current working directory. Returns the absolute path of the current working directory along with platform information.',
    CwdInputSchema,
    getCurrentWorkingDirectory,
);
