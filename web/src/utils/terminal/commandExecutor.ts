import {
  VFSDirectoryNode,
  TerminalOutputLine,
} from '../../types/terminal';
import {
  changeDirectory,
  listDirectory,
  treeDirectory,
  readFile,
  diffFiles,
  findSpellFile,
  resolvePath,
} from './vfs';

export function tokenizeCommand(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if ((char === ' ' || char === '\t') && !inDoubleQuote && !inSingleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export interface CommandContext {
  root: VFSDirectoryNode;
  cwd: string;
  setCwd: (newCwd: string) => void;
  oldPwd: string;
  setOldPwd: (oldPwd: string) => void;
  username: string;
  history: string[];
  castSpell: (spellName: string) => Promise<void>;
  clearScreen: () => void;
}

export async function executeCommand(
  rawInput: string,
  context: CommandContext
): Promise<TerminalOutputLine[]> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return [];
  }

  const tokens = tokenizeCommand(trimmed);
  const cmd = tokens[0];
  const args = tokens.slice(1);

  // Helper to create line
  const makeLine = (
    text: string,
    type: TerminalOutputLine['type'] = 'output'
  ): TerminalOutputLine => ({
    id: `${Date.now()}-${Math.random()}`,
    type,
    text,
  });

  // 1. If user typed only a spell name directly without 'cast', guide them to use cast <nome-da-magia>
  const spellMatch = findSpellFile(context.root, context.cwd, trimmed);
  if (spellMatch && (cmd === trimmed || !['cd', 'ls', 'pwd', 'tree', 'diff', 'cat', 'cast', 'clear', 'help', 'history', 'echo', 'whoami', 'uname', 'find'].includes(cmd))) {
    return [
      makeLine(`bash: ${cmd}: comando não encontrado`, 'error'),
      makeLine(`Para conjurar este feitiço, utilize o comando: cast "${spellMatch.spellName}"`, 'info'),
    ];
  }

  // 2. Direct script or relative execution e.g. ./"Bola de Fogo" or ./Bola_de_Fogo
  if (cmd.startsWith('./') || cmd.startsWith('../') || (cmd.startsWith('/') && !['/bin', '/usr'].some(p => cmd.startsWith(p)))) {
    const resolved = resolvePath(context.root, context.cwd, cmd, true);
    if (!resolved) {
      return [makeLine(`bash: ${cmd}: No such file or directory`, 'error')];
    }
    if (resolved.node.type === 'dir') {
      return [makeLine(`bash: ${cmd}: Is a directory`, 'error')];
    }
    if (resolved.node.type === 'file') {
      const file = resolved.node as any;
      if (file.spellName) {
        return [
          makeLine(`bash: ${cmd}: permissão negada`, 'error'),
          makeLine(`Para conjurar este feitiço, utilize o comando: cast "${file.spellName}"`, 'info'),
        ];
      }
      if (file.isExecutable) {
        return [
          makeLine(`Executando ${file.name}...`, 'info'),
          makeLine(file.content),
        ];
      }
      return [makeLine(`bash: ${cmd}: Permission denied`, 'error')];
    }
  }

  // 3. Built-in shell commands
  switch (cmd) {
    case 'clear': {
      context.clearScreen();
      return [];
    }

    case 'pwd': {
      return [makeLine(context.cwd)];
    }

    case 'whoami': {
      return [makeLine(context.username || 'mage')];
    }

    case 'uname': {
      if (args.includes('-a')) {
        return [makeLine('ShellSpellOS 6.1.0-magus #1 PREEMPT SMP Debian x86_64 GNU/Linux')];
      }
      return [makeLine('ShellSpellOS')];
    }

    case 'echo': {
      return [makeLine(args.join(' '))];
    }

    case 'history': {
      return context.history.map((h, i) => makeLine(`  ${(i + 1).toString().padStart(4, ' ')}  ${h}`));
    }

    case 'help': {
      const lines = [
        '========================================================================',
        '                      SHELLSPELL TERMINAL - AJUDA',
        '========================================================================',
        'COMANDOS DISPONÍVEIS:',
        '  help                     Exibe esta mensagem com todos os comandos.',
        '  cast <nome-da-magia>     Conjura uma magia contra o Cristal.',
        '                           Exemplos:',
        '                             cast "Umbra Flagellum"',
        '                             cast "Carcer Angularis"',
        '                             cast "Spiritus Gelidus"',
        '                             cast "Arcana Mutatio"',
        '  ls [-la] [caminho]       Lista arquivos e diretórios da sala atual.',
        '                           -la: exibe arquivos ocultos, permissões e symlinks.',
        '  cd [caminho]             Navega entre os setores e arquivos.',
        '                           Exemplos: cd /root/setores, cd pesquisa_atual, cd ..',
        '  pwd                      Exibe o caminho do diretório atual.',
        '  tree [-a] [caminho]      Exibe o mapa em árvore de pastas e feitiços.',
        '                           -a: exibe pastas e arquivos secretos.',
        '  diff <arq1> <arq2>       Compara dois arquivos linha por linha.',
        '                           Use em fragmentos e traduções rúnicas para decifrar anomalias!',
        '  cat <arquivo>            Exibe o conteúdo e lore de um registro.',
        '                           Exemplo: cat "mapa_diretorios.txt"',
        '  clear                    Limpa a tela do terminal (ou use Ctrl+L).',
        '  history                  Exibe o histórico de comandos digitados.',
        '',
        'REGRAS E DICAS DE COMBATE:',
        '  • ATENÇÃO: Para conjurar magias, use EXCLUSIVAMENTE: cast <nome-da-magia>',
        '  • Rituais proibidos estão selados em diretórios ocultos (iniciados com .)!',
        '    Use "ls -la" ou "tree -a" para explorar caminhos velados e o sistema.',
        '  • Pressione TAB para autocompletar nomes de comandos e arquivos.',
        '  • Use as setas CIMA / BAIXO para navegar pelo histórico.',
        '========================================================================',
      ];
      return lines.map((l) => makeLine(l, 'info'));
    }

    case 'cd': {
      const target = args[0] || '~';
      const result = changeDirectory(context.root, context.cwd, target, context.oldPwd);
      if (result.error) {
        return [makeLine(result.error, 'error')];
      }
      if (result.newCwd) {
        context.setOldPwd(context.cwd);
        context.setCwd(result.newCwd);
      }
      return [];
    }

    case 'ls': {
      let showAll = false;
      let longFormat = false;
      let humanReadable = false;
      let classify = false;
      const pathArgs: string[] = [];

      for (const arg of args) {
        if (arg.startsWith('-') && arg.length > 1) {
          const flags = arg.slice(1);
          if (flags.includes('a')) showAll = true;
          if (flags.includes('l')) longFormat = true;
          if (flags.includes('h')) humanReadable = true;
          if (flags.includes('F')) classify = true;
        } else {
          pathArgs.push(arg);
        }
      }

      const targetPath = pathArgs[0] || '.';
      const res = listDirectory(context.root, context.cwd, targetPath, {
        showAll,
        longFormat,
        humanReadable,
        classify,
      });

      if (res.error) {
        return [makeLine(res.error, 'error')];
      }

      if (!res.entries || res.entries.length === 0) {
        return [];
      }

      if (longFormat) {
        const lines: TerminalOutputLine[] = [];
        if (!res.isSingleFile && res.totalBlocks !== undefined) {
          lines.push(makeLine(`total ${res.totalBlocks}`));
        }

        for (const entry of res.entries) {
          let suffix = '';
          if (entry.type === 'link' && entry.target) {
            suffix = ` -> ${entry.target}`;
          } else if (classify) {
            if (entry.type === 'dir') suffix = '/';
            else if (entry.isExecutable) suffix = '*';
            else if (entry.type === 'link') suffix = '@';
          }

          const sizeStr = humanReadable
            ? entry.size > 1024
              ? `${(entry.size / 1024).toFixed(1)}K`
              : `${entry.size}B`
            : entry.size.toString().padStart(5, ' ');

          const lineText = `${entry.permissions} 1 ${entry.owner} ${entry.group} ${sizeStr} ${entry.mtime} ${entry.name}${suffix}`;
          
          let lineType: TerminalOutputLine['type'] = 'output';
          if (entry.type === 'dir') lineType = 'info';
          else if (entry.isSpell || entry.isExecutable) lineType = 'success';
          else if (entry.type === 'link') lineType = 'info';

          lines.push(makeLine(lineText, lineType));
        }
        return lines;
      }

      // Short format
      const parts = res.entries.map((e) => {
        let tag = '';
        if (e.type === 'dir') tag = '/';
        else if (e.isExecutable || e.isSpell) tag = '*';
        else if (e.type === 'link') tag = '@';
        return `${e.name}${tag}`;
      });

      return [makeLine(parts.join('    '))];
    }

    case 'tree': {
      let showAll = false;
      const pathArgs: string[] = [];

      for (const arg of args) {
        if (arg === '-a') showAll = true;
        else if (!arg.startsWith('-')) pathArgs.push(arg);
      }

      const targetPath = pathArgs[0] || '.';
      const res = treeDirectory(context.root, context.cwd, targetPath, { showAll });

      if (res.error) {
        return [makeLine(res.error, 'error')];
      }

      const lines: TerminalOutputLine[] = (res.lines || []).map((l) => makeLine(l));
      lines.push(
        makeLine(`\n${res.dirsCount} directories, ${res.filesCount} files`, 'info')
      );
      return lines;
    }

    case 'diff': {
      let fileArgs = args.filter((a) => !a.startsWith('-'));
      if (fileArgs.length < 2) {
        return [makeLine('diff: missing operand. Uso: diff <arquivo1> <arquivo2>', 'error')];
      }

      const res = diffFiles(context.root, context.cwd, fileArgs[0], fileArgs[1]);
      if (res.error) {
        return [makeLine(res.error, 'error')];
      }

      if (res.identical) {
        return [];
      }

      return (res.lines || []).map((l) => makeLine(l.text, l.type));
    }

    case 'cat': {
      if (args.length === 0) {
        return [makeLine('cat: missing operand. Uso: cat <arquivo>', 'error')];
      }

      const lines: TerminalOutputLine[] = [];
      for (const target of args) {
        const res = readFile(context.root, context.cwd, target);
        if (res.error) {
          lines.push(makeLine(res.error, 'error'));
        } else if (res.content !== undefined) {
          lines.push(...res.content.split('\n').map((l) => makeLine(l)));
        }
      }
      return lines;
    }

    case 'cast': {
      if (args.length === 0) {
        return [
          makeLine('cast: comando incompleto.', 'error'),
          makeLine('Uso correto: cast <nome-da-magia>', 'info'),
          makeLine('Exemplo: cast "Sagitta Arcana" ou cast "Ignis Sphaera"', 'info'),
        ];
      }

      const spellArg = args.join(' ').trim();
      const spellMatch = findSpellFile(context.root, context.cwd, spellArg);

      if (spellMatch) {
        await context.castSpell(spellMatch.spellName);
        return [];
      }

      // If not found in VFS, attempt casting directly with the name given
      const cleanName = spellArg.replace(/^['"]|['"]$/g, '');
      await context.castSpell(cleanName);
      return [];
    }

    case 'find': {
      const targetPath = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const nameIndex = args.indexOf('-name');
      const namePattern = nameIndex !== -1 ? args[nameIndex + 1]?.replace(/['"]/g, '') : null;

      const lines: TerminalOutputLine[] = [];
      const resolved = resolvePath(context.root, context.cwd, targetPath, true);

      if (!resolved) {
        return [makeLine(`find: '${targetPath}': No such file or directory`, 'error')];
      }

      function search(node: any, currentPath: string) {
        const displayName = currentPath;
        if (!namePattern || node.name.toLowerCase().includes(namePattern.toLowerCase())) {
          lines.push(makeLine(displayName));
        }

        if (node.type === 'dir' && node.children) {
          for (const key of Object.keys(node.children)) {
            search(node.children[key], `${currentPath}/${key}`);
          }
        }
      }

      search(resolved.node, targetPath);
      return lines;
    }

    default: {
      const fullSpellSearch = findSpellFile(context.root, context.cwd, trimmed);
      if (fullSpellSearch) {
        return [
          makeLine(`bash: ${cmd}: comando não encontrado`, 'error'),
          makeLine(`Para conjurar este feitiço, utilize o comando: cast "${fullSpellSearch.spellName}"`, 'info'),
        ];
      }

      return [
        makeLine(`bash: ${cmd}: comando não encontrado`, 'error'),
        makeLine("Digite 'help' para ver a lista de comandos. Para conjurar, use: cast <nome-da-magia>", 'info'),
      ];
    }
  }
}
