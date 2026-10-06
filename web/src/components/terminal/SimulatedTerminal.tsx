import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, Typography, Input, IconButton } from '@mui/joy';
import { keyframes } from '@emotion/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  TerminalOutputLine,
  VFSDirectoryNode,
} from '../../types/terminal';
import {
  createInitialVFS,
  getDisplayPath,
  getAutocompleteSuggestions,
  DEFAULT_CWD,
} from '../../utils/terminal/vfs';
import {
  executeCommand,
  CommandContext,
} from '../../utils/terminal/commandExecutor';
import { useCastSpell } from '../../hooks/useSession';

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-4px); }
  30%, 60%, 90% { transform: translateX(4px); }
`;

interface SimulatedTerminalProps {
  sessionCode?: string;
  username?: string | null;
  isCrystalDefeated: boolean;
  onVictory: () => void;
  onFeedback?: (feedback: { success: boolean; text: string }) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function SimulatedTerminal({
  sessionCode,
  username,
  isCrystalDefeated,
  onVictory,
  onFeedback,
  isMaximized = false,
  onToggleMaximize,
}: SimulatedTerminalProps) {
  const [rootVFS] = useState<VFSDirectoryNode>(() => createInitialVFS());
  const [cwd, setCwd] = useState(DEFAULT_CWD);
  const [oldPwd, setOldPwd] = useState(DEFAULT_CWD);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tempInput, setTempInput] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const castSpellMutation = useCastSpell();
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUser = username || 'mage';
  const displayPath = getDisplayPath(cwd);

  const initialBanner: TerminalOutputLine[] = [
    {
      id: 'banner-1',
      type: 'system',
      text: '╔═══════════════════════════════════════════════════════════════════════╗',
    },
    {
      id: 'banner-2',
      type: 'system',
      text: '║      ✦ SHELLSPELL TERMINAL v1.0 — CONSOLE DE COMBATE MÁGICO ✦        ║',
    },
    {
      id: 'banner-3',
      type: 'info',
      text: '║  Navegue e descubra magias com: ls, ls -la, cd, tree, diff, cat       ║',
    },
    {
      id: 'banner-4',
      type: 'info',
      text: '║  Para conjurar: execute cast <nome-da-magia> (ex: cast "Umbra Flagellum")║',
    },
    {
      id: 'banner-5',
      type: 'system',
      text: '║  Investigue arquivos ocultos e setores arcanos com ls -la e tree -a   ║',
    },
    {
      id: 'banner-6',
      type: 'system',
      text: '╚═══════════════════════════════════════════════════════════════════════╝',
    },
    {
      id: 'banner-7',
      type: 'output',
      text: "Digite 'help' para comandos ou 'cat mapa_diretorios.txt' para introdução.",
    },
  ];

  const [outputLines, setOutputLines] = useState<TerminalOutputLine[]>(initialBanner);

  // Auto-scroll on output change
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [outputLines, currentInput]);

  const addLine = (line: TerminalOutputLine) => {
    setOutputLines((prev) => [...prev, line]);
  };

  const handleCastSpellInternal = async (spellName: string) => {
    if (!sessionCode) {
      addLine({
        id: `${Date.now()}-err`,
        type: 'error',
        text: '[ERRO] Sessão inválida ou não conectada.',
      });
      return;
    }

    if (isCrystalDefeated) {
      addLine({
        id: `${Date.now()}-err`,
        type: 'error',
        text: '[AVISO] O Cristal já foi destruído! Batalha finalizada.',
      });
      return;
    }

    addLine({
      id: `${Date.now()}-cast`,
      type: 'system',
      text: `[CONJURAÇÃO] Invocando energias mágicas de '${spellName}' contra o Cristal...`,
    });

    try {
      const res = await castSpellMutation.mutateAsync({
        code: sessionCode,
        spellName,
      });

      addLine({
        id: `${Date.now()}-ok`,
        type: 'success',
        text: `✨ [SUCESSO] Você lançou '${res.spellName}' causando ${res.damageDealt} de dano!`,
      });
      addLine({
        id: `${Date.now()}-hp`,
        type: 'info',
        text: `💎 Integridade restante do Cristal: ${res.remainingCrystalHealth} HP`,
      });

      if (onFeedback) {
        onFeedback({
          success: true,
          text: `Sucesso! Você lançou ${res.spellName} e causou ${res.damageDealt} de dano!`,
        });
      }

      if (res.remainingCrystalHealth <= 0) {
        addLine({
          id: `${Date.now()}-win`,
          type: 'success',
          text: '💥 [VITÓRIA] O Cristal foi completamente aniquilado!',
        });
        onVictory();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao lançar feitiço.';
      addLine({
        id: `${Date.now()}-fail`,
        type: 'error',
        text: `❌ [FALHA] ${msg}`,
      });

      if (onFeedback) {
        onFeedback({ success: false, text: msg });
      }

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    }
  };

  const runCommandString = async (commandToRun: string) => {
    const trimmed = commandToRun.trim();
    if (!trimmed) return;

    // 1. Append user prompt line
    const promptLine: TerminalOutputLine = {
      id: `${Date.now()}-p`,
      type: 'prompt',
      text: trimmed,
      promptInfo: {
        user: displayUser,
        host: 'shellspell',
        cwd: displayPath,
        command: trimmed,
      },
    };

    setOutputLines((prev) => [...prev, promptLine]);

    // 2. Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setCurrentInput('');
    setTempInput('');

    // 3. Execution context
    const context: CommandContext = {
      root: rootVFS,
      cwd,
      setCwd,
      oldPwd,
      setOldPwd,
      username: displayUser,
      history: [...history, trimmed],
      castSpell: handleCastSpellInternal,
      clearScreen: () => setOutputLines([]),
    };

    // 4. Run command
    const resultLines = await executeCommand(trimmed, context);
    if (resultLines.length > 0) {
      setOutputLines((prev) => [...prev, ...resultLines]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runCommandString(currentInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Autocomplete on Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const res = getAutocompleteSuggestions(rootVFS, cwd, currentInput);
      if (res.completedText !== currentInput) {
        setCurrentInput(res.completedText);
      } else if (res.suggestions.length > 1) {
        // Show available suggestions
        addLine({
          id: `${Date.now()}-tab`,
          type: 'info',
          text: res.suggestions.join('    '),
        });
      }
      return;
    }

    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;

      if (historyIndex === -1) {
        setTempInput(currentInput);
        const newIdx = history.length - 1;
        setHistoryIndex(newIdx);
        setCurrentInput(history[newIdx]);
      } else if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setCurrentInput(history[newIdx]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;

      if (historyIndex < history.length - 1) {
        const newIdx = historyIndex + 1;
        setHistoryIndex(newIdx);
        setCurrentInput(history[newIdx]);
      } else {
        setHistoryIndex(-1);
        setCurrentInput(tempInput);
      }
      return;
    }

    // Ctrl+L to clear screen
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setOutputLines([]);
      return;
    }

    // Ctrl+C to abort current input
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      addLine({
        id: `${Date.now()}-abort`,
        type: 'output',
        text: `> ${currentInput}^C`,
      });
      setCurrentInput('');
      setHistoryIndex(-1);
      return;
    }
  };

  const handleTerminalClick = () => {
    // If not selecting text, focus the input
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      inputRef.current?.focus();
    }
  };

  const renderLineContent = (line: TerminalOutputLine) => {
    if (line.type === 'prompt') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ color: '#a855f7', fontWeight: 800, fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace", fontSize: '0.9rem', lineHeight: 1 }}>
            &gt;
          </Typography>
          <Typography sx={{ color: '#f8fafc', fontWeight: 500, fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace", fontSize: '0.85rem' }}>
            {line.text}
          </Typography>
        </Box>
      );
    }

    let color = '#cbd5e1';
    let fontWeight = 400;
    let bg = 'transparent';

    if (line.type === 'error') {
      color = '#f87171';
    } else if (line.type === 'success') {
      color = '#4ade80';
      fontWeight = 600;
    } else if (line.type === 'system') {
      color = '#c084fc';
      fontWeight = 600;
    } else if (line.type === 'info') {
      color = '#38bdf8';
    } else if (line.type === 'diff-add') {
      color = '#4ade80';
      bg = 'rgba(74, 222, 128, 0.12)';
    } else if (line.type === 'diff-del') {
      color = '#f87171';
      bg = 'rgba(248, 113, 113, 0.12)';
    } else if (line.type === 'diff-header') {
      color = '#e879f9';
      fontWeight = 700;
    }

    return (
      <Typography
        sx={{
          color,
          fontWeight,
          bgcolor: bg,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          fontSize: '0.85rem',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          px: bg !== 'transparent' ? 0.5 : 0,
          borderRadius: 'xs',
        }}
      >
        {line.text}
      </Typography>
    );
  };

  return (
    <Card
      variant="outlined"
      onClick={handleTerminalClick}
      sx={{
        gridArea: 'input',
        p: 0,
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'lg',
        bgcolor: 'rgba(10, 12, 18, 0.94)',
        borderColor: 'rgba(168, 85, 247, 0.35)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(147, 51, 234, 0.15)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        ...(isShaking && {
          animation: `${shakeAnimation} 0.3s ease-in-out`,
          borderColor: '#ef4444 !important',
        }),
      }}
    >
      {/* TERMINAL HEADER BAR */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          bgcolor: 'rgba(18, 22, 34, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <Typography
          level="body-xs"
          sx={{
            color: '#94a3b8',
            fontFamily: 'monospace',
            fontWeight: 600,
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          terminal
        </Typography>

        {/* Maximize / Restore Button - The only button on the terminal */}
        {onToggleMaximize && (
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            title={isMaximized ? 'Restaurar cristal' : 'Maximizar terminal (esconder cristal)'}
            sx={{
              color: '#94a3b8',
              p: 0.25,
              minWidth: 24,
              minHeight: 24,
              borderRadius: 'sm',
              '&:hover': {
                color: '#a855f7',
                bgcolor: 'rgba(168, 85, 247, 0.15)',
              },
            }}
          >
            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>
        )}
      </Box>

      {/* TERMINAL OUTPUT & INLINE PROMPT BUFFER */}
      <Box
        ref={terminalScrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          p: 1.5,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.4,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          cursor: 'text',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(168, 85, 247, 0.2)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(168, 85, 247, 0.4)',
          },
        }}
      >
        {outputLines.map((line) => (
          <Box key={line.id}>{renderLineContent(line)}</Box>
        ))}

        {/* ACTIVE PROMPT INPUT LINE - Directly on the next line */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mt: 0.25,
            width: '100%',
          }}
        >
          {/* Prompt prefix: ">" */}
          <Typography
            sx={{
              color: '#a855f7',
              fontWeight: 800,
              fontSize: '0.9rem',
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              userSelect: 'none',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            &gt;
          </Typography>

          {/* Inline Input Field */}
          <Input
            slotProps={{
              input: {
                ref: inputRef,
                autoFocus: true,
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: false,
              },
            }}
            placeholder={isCrystalDefeated ? 'Cristal destruído!' : ''}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isCrystalDefeated || castSpellMutation.isPending}
            variant="plain"
            size="sm"
            sx={{
              flex: 1,
              bgcolor: 'transparent',
              color: '#f8fafc',
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              fontSize: '0.85rem',
              p: 0,
              minHeight: 'unset',
              border: 'none',
              boxShadow: 'none',
              '&::before': { display: 'none !important' },
              '&:focus-within': {
                boxShadow: 'none !important',
                borderColor: 'transparent !important',
              },
              '& input': {
                color: '#f8fafc',
                p: 0,
                border: 'none',
                outline: 'none',
                caretColor: '#a855f7',
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                fontSize: '0.85rem',
                lineHeight: 1.45,
                '&::placeholder': {
                  color: 'rgba(148, 163, 184, 0.45)',
                },
              },
            }}
          />

          {/* Hidden submit button to support Enter key form submission */}
          <button
            type="submit"
            style={{ display: 'none' }}
            disabled={isCrystalDefeated || castSpellMutation.isPending}
          />
        </Box>
      </Box>
    </Card>
  );
}
