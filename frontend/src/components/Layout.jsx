import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Project
          </Typography>

          {!user ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="inherit" component={Link} to="/login">
                Вход
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Регистрация
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="inherit" component={Link} to="/files">
                Файлы
              </Button>
              <Typography sx={{ alignSelf: 'center', fontSize: '0.9rem' }}>
                {user?.name || user?.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}