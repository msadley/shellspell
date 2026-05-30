import { Box, Button, Card, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions, Stack, Typography } from '@mui/joy';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import HomeLayout from '../HomeLayout';

type ErrorType = 'connection' | 'cancelled' | 'invalid';

interface GameErrorOverlayProps {
  type: ErrorType;
  sessionCode?: string;
  onExit: () => void;
  useHomeLayout?: boolean;
}

export default function GameErrorOverlay({
  type,
  sessionCode,
  onExit,
  useHomeLayout = false,
}: GameErrorOverlayProps) {
  if (type === 'connection') {
    const cardContent = (
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 400, p: 3, borderRadius: 'lg', textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <ShieldAlert size={48} color="#ffa726" />
          <Typography level="h4" sx={{ color: 'white' }}>
            Erro de Conexão
          </Typography>
          <Typography level="body-sm" sx={{ color: 'neutral.400', textAlign: 'center' }}>
            Não foi possível conectar ao servidor. Verifique sua conexão.
          </Typography>
          <Button
            color="primary"
            variant="solid"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </Stack>
      </Card>
    );

    if (useHomeLayout) {
      return <HomeLayout>{cardContent}</HomeLayout>;
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black', p: 3 }}>
        {cardContent}
      </Box>
    );
  }

  if (type === 'cancelled') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'black',
          p: 3,
        }}
      >
        <Modal open={true} disableEscapeKeyDown>
          <ModalDialog
            variant="outlined"
            sx={{
              maxWidth: 400,
              width: '100%',
              borderRadius: 'md',
              boxShadow: 'lg',
            }}
          >
            <DialogTitle sx={{ color: 'white' }}>Sessão Cancelada</DialogTitle>
            <DialogContent sx={{ color: 'neutral.400' }}>
              A sessão foi cancelada pelo administrador. Você foi desconectado.
            </DialogContent>
            <DialogActions>
              <Button
                color="primary"
                variant="solid"
                onClick={onExit}
              >
                Sair
              </Button>
            </DialogActions>
          </ModalDialog>
        </Modal>
      </Box>
    );
  }

  // default 'invalid'
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'black',
        p: 3,
      }}
    >
      <Card
        variant="outlined"
        sx={{ maxWidth: 400, width: '100%', borderRadius: 'lg' }}
      >
        <Stack spacing={2} alignItems="center">
          <AlertCircle size={48} color="#ff4d4f" />
          <Typography level="h4" sx={{ color: 'white' }}>
            {sessionCode ? 'Sala Não Encontrada' : 'Sessão Inválida'}
          </Typography>
          <Typography
            level="body-sm"
            sx={{ color: 'neutral.400', textAlign: 'center' }}
          >
            {sessionCode
              ? `Não foi possível carregar a sessão ${sessionCode}. O código pode estar expirado ou incorreto.`
              : 'Esta sessão de jogo não é válida ou já foi encerrada.'}
          </Typography>
          <Button
            color="neutral"
            variant="soft"
            onClick={onExit}
          >
            {sessionCode ? 'Voltar à Tela Inicial' : 'Voltar'}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
