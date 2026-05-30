import { Box, Button, Modal, ModalDialog, Sheet, Stack, Typography } from '@mui/joy';
import { Award } from 'lucide-react';

interface VictoryOverlayProps {
  showVictory: boolean;
  crystalSummary: string;
  summaryLabel?: string;
  confirmText: string;
  onConfirm: () => void;
}

export default function VictoryOverlay({
  showVictory,
  crystalSummary,
  summaryLabel = 'RESUMO DA PARTIDA',
  confirmText,
  onConfirm,
}: VictoryOverlayProps) {
  return (
    <Modal open={showVictory} onClose={() => {}}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 450,
          width: '100%',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--joy-palette-success-softBg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--joy-shadow-md)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', boxShadow: '0 0 10px var(--joy-palette-success-softBg)' },
                '50%': { transform: 'scale(1.1)', boxShadow: '0 0 20px var(--joy-palette-success-softBg)' },
                '100%': { transform: 'scale(1)', boxShadow: '0 0 10px var(--joy-palette-success-softBg)' },
              }
            }}
          >
            <Award size={48} color="var(--joy-palette-success-solidBg)" />
          </Box>

          <Stack spacing={1}>
            <Typography level="h3" color="success" sx={{ fontWeight: 900, letterSpacing: '0.05em' }}>
              VITÓRIA!
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              {crystalSummary}
            </Typography>
          </Stack>

          <Sheet
            variant="soft"
            color="success"
            sx={{
              p: 2,
              borderRadius: 'md',
              width: '100%',
              border: '1px solid var(--joy-palette-success-outlinedBorder)'
            }}
          >
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1 }}>
              {summaryLabel.toUpperCase()}:
            </Typography>
            <Typography level="title-md" sx={{ fontWeight: 700 }}>
              Vitória da equipe!
            </Typography>
            <Typography level="body-sm" color="success" sx={{ fontWeight: 600 }}>
              O cristal foi destruído!
            </Typography>
          </Sheet>

          <Button
            variant="solid"
            color="success"
            onClick={onConfirm}
            sx={{
              width: '100%',
              fontWeight: 700,
            }}
          >
            {confirmText}
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
