import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/authContextValue';
import { getApiErrorMessage } from './file-manager/fileManagerHelpers';
import {
  GuestCta,
  HomeFooter,
  HomeHeader,
  HomeHero,
} from '../components/home/HomeSections';
import AuthenticatedWorkspace from '../components/home/AuthenticatedWorkspace';
import LoadingScreen from '../components/LoadingScreen';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Б';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / (1024 ** unitIndex);
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Только что';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Только что';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function uploadQuickFile({ file, setUploadError, setIsQuickUploading, setQuickUploadProgress, refresh }) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    setUploadError('');
    setIsQuickUploading(true);
    setQuickUploadProgress(0);
    await api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: ({ loaded, total }) => total && setQuickUploadProgress(Math.round((loaded * 100) / total)),
    });
    setQuickUploadProgress(100);
    await refresh();
  } catch (err) {
    console.error('Ошибка быстрой загрузки файла:', err);
    setUploadError(getApiErrorMessage(err, 'Не удалось загрузить файл'));
  } finally {
    setIsQuickUploading(false);
    setTimeout(() => setQuickUploadProgress(0), 800);
  }
}

function useHomePageData(user) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const [quickUploadProgress, setQuickUploadProgress] = useState(0);

  const fetchRecentFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/files/');
      const files = Array.isArray(response.data) ? response.data : response.data.files || [];
      setRecentFiles(files.slice(0, 5));
    } catch (err) {
      console.error('Ошибка загрузки файлов:', err);
      setUploadError(getApiErrorMessage(err, 'Не удалось загрузить недавние файлы'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const response = await api.get('/storage/stats/');
      setStorageStats(response.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
      setUploadError(getApiErrorMessage(err, 'Не удалось загрузить статистику хранилища'));
    }
  };

  useEffect(() => {
    if (user) { fetchRecentFiles(); fetchStorageStats(); }
  }, [user]);

  const refresh = async () => {
    await Promise.all([fetchRecentFiles(), fetchStorageStats()]);
  };

  const processQuickUpload = async (incomingFile) => {
    const file = incomingFile instanceof File ? incomingFile : incomingFile?.[0];
    if (!file) return;
    await uploadQuickFile({ file, setUploadError, setIsQuickUploading, setQuickUploadProgress, refresh });
  };

  return { recentFiles, storageStats, loading, uploadError, setUploadError, isQuickUploading, quickUploadProgress, processQuickUpload };
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const homeData = useHomePageData(user);
  const handleQuickUploadClick = () => document.getElementById('home-quick-upload-input')?.click();

  const handleQuickUploadChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) homeData.processQuickUpload(selectedFile);
    event.target.value = '';
  };

  if (authLoading) return <LoadingScreen />;

  if (user) {
    return (
      <Box className="ep-page" sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <input id="home-quick-upload-input" type="file" style={{ display: 'none' }} onChange={handleQuickUploadChange} />
        <HomeHeader user={user} />
        <AuthenticatedWorkspace
          user={user}
          stats={homeData.storageStats}
          files={homeData.recentFiles}
          loading={homeData.loading}
          uploadError={homeData.uploadError}
          onClearError={() => homeData.setUploadError('')}
          onFileDropped={homeData.processQuickUpload}
          isUploading={homeData.isQuickUploading}
          uploadProgress={homeData.quickUploadProgress}
          onUploadClick={handleQuickUploadClick}
          onOpenFiles={() => navigate('/file-manager')}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      </Box>
    );
  }

  return (
    <Box className="ep-page" sx={{ minHeight: '100vh', backgroundColor: '#0000f2' }}>
      <input id="home-quick-upload-input" type="file" style={{ display: 'none' }} onChange={handleQuickUploadChange} />
      <HomeHeader />
      <HomeHero />
      <Box sx={{ backgroundColor: '#f4f2ec', py: { xs: 2.5, md: 5 } }}>
        <Container className="ep-stagger" maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
          <GuestCta />
        </Container>
      </Box>
      <HomeFooter />
    </Box>
  );
}
