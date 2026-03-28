import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Files from './pages/Files';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Защищённые маршруты */}
        <Route element={<ProtectedRoute />}>
          <Route path="files" element={<Files />} />
        </Route>

        {/* Редирект с главной на login */}
        <Route index element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;