export interface VFSNodeBase {
  name: string;
  permissions: string;
  owner: string;
  group: string;
  size: number;
  mtime: string;
}

export interface VFSFileNode extends VFSNodeBase {
  type: 'file';
  content: string;
  isExecutable?: boolean;
  spellName?: string;
  category?: string;
  damage?: number;
}

export interface VFSDirectoryNode extends VFSNodeBase {
  type: 'dir';
  children: Record<string, VFSNode>;
}

export interface VFSSymlinkNode extends VFSNodeBase {
  type: 'link';
  target: string;
}

export type VFSNode = VFSFileNode | VFSDirectoryNode | VFSSymlinkNode;

export interface TerminalOutputLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'success' | 'info' | 'system' | 'diff-add' | 'diff-del' | 'diff-header';
  text: string;
  promptInfo?: {
    user: string;
    host: string;
    cwd: string;
    command: string;
  };
}

export interface AutocompleteResult {
  completedText: string;
  suggestions: string[];
}
