import { z } from 'zod';
import { createAiSdkTool } from '../ai-sdk-tool-system';
import { simpleGit, SimpleGit, StatusResult, DiffResult, LogResult } from 'simple-git';
import { resolve } from 'path';

// Common path schema for git operations
const GitPathSchema = z.object({
    repoPath: z.string().min(1, 'Repository path is required').default('.'),
});

// Git Status Tool
const GitStatusInputSchema = GitPathSchema;

async function getGitStatus(input: z.infer<typeof GitStatusInputSchema>) {
    const { repoPath } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        // Check if it's a git repository
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        const status: StatusResult = await git.status();
        
        return {
            path: resolvedPath,
            branch: status.current,
            ahead: status.ahead,
            behind: status.behind,
            staged: status.staged,
            modified: status.modified,
            not_added: status.not_added,
            deleted: status.deleted,
            renamed: status.renamed,
            conflicted: status.conflicted,
            created: status.created,
            isClean: status.isClean()
        };
    } catch (error) {
        throw new Error(`Git status failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Diff Tool
const GitDiffInputSchema = GitPathSchema.extend({
    staged: z.boolean().default(false).describe('Show staged changes instead of working directory changes'),
    file: z.string().optional().describe('Show diff for specific file'),
    commit1: z.string().optional().describe('First commit/branch to compare'),
    commit2: z.string().optional().describe('Second commit/branch to compare'),
});

async function getGitDiff(input: z.infer<typeof GitDiffInputSchema>) {
    const { repoPath, staged, file, commit1, commit2 } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        let diffOptions: string[] = [];
        
        if (staged) {
            diffOptions.push('--cached');
        }
        
        if (file) {
            diffOptions.push('--', file);
        }
        
        let diff: string;
        if (commit1 && commit2) {
            diff = await git.diff([commit1, commit2, ...diffOptions]);
        } else if (commit1) {
            diff = await git.diff([commit1, ...diffOptions]);
        } else {
            diff = await git.diff(diffOptions);
        }
        
        return {
            path: resolvedPath,
            diff: diff,
            staged: staged,
            file: file || 'all files',
            comparison: commit1 && commit2 ? `${commit1}..${commit2}` : commit1 || (staged ? 'staged changes' : 'working directory')
        };
    } catch (error) {
        throw new Error(`Git diff failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Add Tool
const GitAddInputSchema = GitPathSchema.extend({
    files: z.array(z.string()).min(1, 'At least one file must be specified').describe('Files to add to staging area'),
});

async function gitAdd(input: z.infer<typeof GitAddInputSchema>) {
    const { repoPath, files } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        await git.add(files);
        
        return {
            path: resolvedPath,
            addedFiles: files,
            message: `Successfully added ${files.length} file(s) to staging area`
        };
    } catch (error) {
        throw new Error(`Git add failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Commit Tool
const GitCommitInputSchema = GitPathSchema.extend({
    message: z.string().min(1, 'Commit message is required').describe('Commit message'),
    author: z.string().optional().describe('Author in format "Name <email>"'),
    allowEmpty: z.boolean().default(false).describe('Allow empty commit'),
});

async function gitCommit(input: z.infer<typeof GitCommitInputSchema>) {
    const { repoPath, message, author, allowEmpty } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        const options: string[] = ['-m', message];
        
        if (author) {
            options.push('--author', author);
        }
        
        if (allowEmpty) {
            options.push('--allow-empty');
        }
        
        const result = await git.commit(options);
        
        return {
            path: resolvedPath,
            commit: result.commit,
            summary: result.summary,
            branch: result.branch,
            author: result.author,
            message: message
        };
    } catch (error) {
        throw new Error(`Git commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Log Tool
const GitLogInputSchema = GitPathSchema.extend({
    maxCount: z.number().min(1).max(100).default(10).describe('Maximum number of commits to show'),
    from: z.string().optional().describe('Starting commit/branch'),
    to: z.string().optional().describe('Ending commit/branch'),
    author: z.string().optional().describe('Filter by author'),
    since: z.string().optional().describe('Show commits since date (e.g., "2023-01-01")'),
    until: z.string().optional().describe('Show commits until date (e.g., "2023-12-31")'),
    file: z.string().optional().describe('Show commits for specific file'),
});

async function getGitLog(input: z.infer<typeof GitLogInputSchema>) {
    const { repoPath, maxCount, from, to, author, since, until, file } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        const options: any = {
            maxCount,
            format: {
                hash: '%H',
                date: '%ai',
                message: '%s',
                author_name: '%an',
                author_email: '%ae'
            }
        };
        
        if (from && to) {
            options.from = from;
            options.to = to;
        } else if (from) {
            options.from = from;
        }
        
        if (author) {
            options.author = author;
        }
        
        if (since) {
            options.since = since;
        }
        
        if (until) {
            options.until = until;
        }
        
        if (file) {
            options.file = file;
        }
        
        const log = await git.log(options);
        
        return {
            path: resolvedPath,
            total: log.total,
            latest: log.latest,
            commits: log.all.map(commit => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: `${commit.author_name} <${commit.author_email}>`,
                refs: commit.refs
            }))
        };
    } catch (error) {
        throw new Error(`Git log failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Branch Tool
const GitBranchInputSchema = GitPathSchema.extend({
    action: z.enum(['list', 'create', 'delete', 'checkout', 'current']).describe('Branch action to perform'),
    branchName: z.string().optional().describe('Branch name for create/delete/checkout operations'),
    remote: z.boolean().default(false).describe('Show remote branches (for list action)'),
    force: z.boolean().default(false).describe('Force delete branch'),
});

async function gitBranch(input: z.infer<typeof GitBranchInputSchema>) {
    const { repoPath, action, branchName, remote, force } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        switch (action) {
            case 'list':
                const branches = await git.branch(remote ? ['-r'] : []);
                return {
                    path: resolvedPath,
                    current: branches.current,
                    branches: branches.all,
                    remote: remote
                };
                
            case 'create':
                if (!branchName) {
                    throw new Error('Branch name is required for create action');
                }
                await git.checkoutLocalBranch(branchName);
                return {
                    path: resolvedPath,
                    action: 'create',
                    branchName: branchName,
                    message: `Created and switched to branch: ${branchName}`
                };
                
            case 'delete':
                if (!branchName) {
                    throw new Error('Branch name is required for delete action');
                }
                const deleteOptions = force ? ['-D'] : ['-d'];
                await git.deleteLocalBranch(branchName, force);
                return {
                    path: resolvedPath,
                    action: 'delete',
                    branchName: branchName,
                    force: force,
                    message: `Deleted branch: ${branchName}`
                };
                
            case 'checkout':
                if (!branchName) {
                    throw new Error('Branch name is required for checkout action');
                }
                await git.checkout(branchName);
                return {
                    path: resolvedPath,
                    action: 'checkout',
                    branchName: branchName,
                    message: `Switched to branch: ${branchName}`
                };
                
            case 'current':
                const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
                return {
                    path: resolvedPath,
                    action: 'current',
                    currentBranch: currentBranch.trim()
                };
                
            default:
                throw new Error(`Unknown branch action: ${action}`);
        }
    } catch (error) {
        throw new Error(`Git branch ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Remote Tool
const GitRemoteInputSchema = GitPathSchema.extend({
    action: z.enum(['list', 'add', 'remove', 'get-url']).describe('Remote action to perform'),
    name: z.string().optional().describe('Remote name'),
    url: z.string().optional().describe('Remote URL (for add action)'),
});

async function gitRemote(input: z.infer<typeof GitRemoteInputSchema>) {
    const { repoPath, action, name, url } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        switch (action) {
            case 'list':
                const remotes = await git.getRemotes(true);
                return {
                    path: resolvedPath,
                    action: 'list',
                    remotes: remotes.map(remote => ({
                        name: remote.name,
                        fetch: remote.refs.fetch,
                        push: remote.refs.push
                    }))
                };
                
            case 'add':
                if (!name || !url) {
                    throw new Error('Remote name and URL are required for add action');
                }
                await git.addRemote(name, url);
                return {
                    path: resolvedPath,
                    action: 'add',
                    name: name,
                    url: url,
                    message: `Added remote: ${name} -> ${url}`
                };
                
            case 'remove':
                if (!name) {
                    throw new Error('Remote name is required for remove action');
                }
                await git.removeRemote(name);
                return {
                    path: resolvedPath,
                    action: 'remove',
                    name: name,
                    message: `Removed remote: ${name}`
                };
                
            case 'get-url':
                if (!name) {
                    throw new Error('Remote name is required for get-url action');
                }
                const remoteUrl = await git.remote(['get-url', name]);
                if (!remoteUrl) {
                    throw new Error(`Remote '${name}' not found`);
                }
                return {
                    path: resolvedPath,
                    action: 'get-url',
                    name: name,
                    url: remoteUrl.trim()
                };
                
            default:
                throw new Error(`Unknown remote action: ${action}`);
        }
    } catch (error) {
        throw new Error(`Git remote ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Init Tool
const GitInitInputSchema = z.object({
    repoPath: z.string().min(1, 'Repository path is required'),
    bare: z.boolean().default(false).describe('Initialize bare repository'),
    initialBranch: z.string().default('main').describe('Initial branch name'),
});

async function gitInit(input: z.infer<typeof GitInitInputSchema>) {
    const { repoPath, bare, initialBranch } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const options: string[] = [];
        
        if (bare) {
            options.push('--bare');
        }
        
        if (initialBranch !== 'main') {
            options.push('--initial-branch', initialBranch);
        }
        
        await git.init(options);
        
        return {
            path: resolvedPath,
            bare: bare,
            initialBranch: initialBranch,
            message: `Initialized ${bare ? 'bare ' : ''}git repository at ${resolvedPath}`
        };
    } catch (error) {
        throw new Error(`Git init failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Show Tool
const GitShowInputSchema = GitPathSchema.extend({
    revision: z.string().describe('Commit hash, branch, or tag to show'),
    file: z.string().optional().describe('Show specific file from the revision'),
});

async function gitShow(input: z.infer<typeof GitShowInputSchema>) {
    const { repoPath, revision, file } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        const showOptions = [revision];
        if (file) {
            showOptions.push('--', file);
        }
        
        const result = await git.show(showOptions);
        
        return {
            path: resolvedPath,
            revision: revision,
            file: file || 'all files',
            content: result
        };
    } catch (error) {
        throw new Error(`Git show failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Git Reset Tool
const GitResetInputSchema = GitPathSchema.extend({
    mode: z.enum(['soft', 'mixed', 'hard']).default('mixed').describe('Reset mode'),
    commit: z.string().optional().describe('Commit to reset to (defaults to HEAD)'),
    files: z.array(z.string()).optional().describe('Specific files to reset'),
});

async function gitReset(input: z.infer<typeof GitResetInputSchema>) {
    const { repoPath, mode, commit, files } = input;
    const resolvedPath = resolve(repoPath);
    
    try {
        const git: SimpleGit = simpleGit(resolvedPath);
        
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Not a git repository: ${resolvedPath}`);
        }
        
        const resetOptions: string[] = [];
        
        if (mode === 'soft') {
            resetOptions.push('--soft');
        } else if (mode === 'hard') {
            resetOptions.push('--hard');
        } else {
            resetOptions.push('--mixed');
        }
        
        if (commit) {
            resetOptions.push(commit);
        }
        
        if (files && files.length > 0) {
            resetOptions.push('--', ...files);
        }
        
        await git.reset(resetOptions);
        
        return {
            path: resolvedPath,
            mode: mode,
            commit: commit || 'HEAD',
            files: files || [],
            message: `Reset ${mode} to ${commit || 'HEAD'}${files ? ` for files: ${files.join(', ')}` : ''}`
        };
    } catch (error) {
        throw new Error(`Git reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Export AI SDK tools
export const gitStatusTool = createAiSdkTool(
    'git_status',
    'Get the status of a git repository, showing branch info, staged/unstaged changes, and clean status',
    GitStatusInputSchema,
    getGitStatus
);

export const gitDiffTool = createAiSdkTool(
    'git_diff',
    'Show changes between commits, branches, or working directory. Can show staged changes, specific files, or compare commits/branches',
    GitDiffInputSchema,
    getGitDiff
);

export const gitAddTool = createAiSdkTool(
    'git_add',
    'Add files to the staging area for the next commit',
    GitAddInputSchema,
    gitAdd
);

export const gitCommitTool = createAiSdkTool(
    'git_commit',
    'Commit staged changes to the repository with a message',
    GitCommitInputSchema,
    gitCommit
);

export const gitLogTool = createAiSdkTool(
    'git_log',
    'Show commit history with optional filtering by author, date range, file, or commit range',
    GitLogInputSchema,
    getGitLog
);

export const gitBranchTool = createAiSdkTool(
    'git_branch',
    'Manage git branches: list, create, delete, checkout, or get current branch',
    GitBranchInputSchema,
    gitBranch
);

export const gitRemoteTool = createAiSdkTool(
    'git_remote',
    'Manage git remotes: list, add, remove, or get URL of remote repositories',
    GitRemoteInputSchema,
    gitRemote
);

export const gitInitTool = createAiSdkTool(
    'git_init',
    'Initialize a new git repository at the specified path',
    GitInitInputSchema,
    gitInit
);

export const gitShowTool = createAiSdkTool(
    'git_show',
    'Show the contents of a specific commit, branch, or tag',
    GitShowInputSchema,
    gitShow
);

export const gitResetTool = createAiSdkTool(
    'git_reset',
    'Reset the repository to a specific commit with soft, mixed, or hard mode',
    GitResetInputSchema,
    gitReset
); 