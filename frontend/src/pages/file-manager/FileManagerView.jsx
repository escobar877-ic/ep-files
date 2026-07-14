import React, { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  ArrowDropDown,
  ArrowDropUp,
  Close,
  CloudUpload,
  Delete,
  DarkMode,
  Download as DownloadIcon,
  Edit,
  Folder as FolderIcon,
  FolderOpen,
  GridView,
  Home,
  LightMode,
  NavigateNext,
  ReportProblem,
  RestoreFromTrash,
  Search,
  Share,
  Star,
  Upload,
  ViewList,
} from '@mui/icons-material';
import AccessControlDialog from '../../components/file-manager/AccessControlDialog';
import AppHeaderGrid from '../../components/AppHeaderGrid';
import BrandWordmark from '../../components/BrandWordmark';
import FileList from '../../components/file-manager/FileList';
import HeaderProfileButton from '../../components/HeaderProfileButton';
import MoveFolderDialog from '../../components/file-manager/MoveFolderDialog';
import TaskStatusItem from '../../components/TaskStatusItem';
import TextFileEditorDialog from '../../components/file-manager/TextFileEditorDialog';
import { hasDraggedSystemFiles } from '../../components/file-manager/dragDrop';
import { useThemeMode } from '../../themeMode';

function FileManagerHeader({ user, searchQuery, setSearchQuery, navigate }) {
  const { mode, toggleMode } = useThemeMode();
  const nextThemeLabel = mode === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
  const headerButtonSx = {
    minWidth: { xs: 0, sm: 150 },
    height: 40,
    whiteSpace: 'nowrap',
    px: { xs: 1.25, sm: 2 },
    fontSize: { xs: '0.78rem', sm: '0.875rem' },
    '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } },
  };

  return (
    <Box sx={{ backgroundColor: (theme) => theme.ep.header, color: '#f8f7f2', position: 'sticky', top: 0, zIndex: 1200 }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: (theme) => theme.ep.headerLine }}>
        <AppHeaderGrid>
          <Button component={RouterLink} to="/" color="inherit" startIcon={<Home />} sx={{ justifySelf: 'start', px: 0 }}>Главная</Button>
          <BrandWordmark inverse />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifySelf: 'end' }}>
            <Button color="inherit" onClick={() => navigate('/trash')} startIcon={<RestoreFromTrash />} sx={{ ...headerButtonSx, minWidth: { xs: 42, sm: 130 }, px: { xs: 0.5, sm: 1.5 }, '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } } }}>Корзина</Button>
            <Tooltip title={nextThemeLabel}>
              <IconButton onClick={toggleMode} aria-label={nextThemeLabel} sx={{ width: 40, height: 40, color: '#f8f7f2', border: '1px solid rgba(248,247,242,0.55)' }}>
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <HeaderProfileButton user={user} onClick={() => navigate('/files')} sx={{ ...headerButtonSx, color: '#f8f7f2', borderColor: 'rgba(248,247,242,0.55)', backgroundColor: 'transparent', minWidth: { xs: 42, sm: 170 }, '&:hover': { backgroundColor: 'rgba(248,247,242,0.1)', borderColor: '#f8f7f2' } }} />
          </Box>
        </AppHeaderGrid>
      </Box>
      <Box sx={{ bgcolor: (theme) => theme.ep.inset, borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1.5, sm: 3 }, py: 1.25 }}>
        <TextField
          fullWidth
          placeholder="ПОИСК ПО ИМЕНИ ФАЙЛА"
          size="small"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'primary.main' }} /></InputAdornment> }}
          sx={{ maxWidth: 1340, mx: 'auto', display: 'block', '& .MuiInputBase-root': { color: 'text.primary', backgroundColor: 'transparent' }, '& fieldset': { borderColor: (theme) => `${theme.palette.divider} !important` }, '& .Mui-focused fieldset': { borderColor: (theme) => `${theme.palette.primary.main} !important` } }}
        />
      </Box>
    </Box>
  );
}

function BreadcrumbBar({ currentFolderId, breadcrumbs, viewMode, setViewMode, onBack, onHome, onBreadcrumbClick }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 1.25, sm: 1.75 }, mb: 0, border: '1px solid', borderColor: 'divider', backgroundColor: (theme) => theme.ep.panel }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <IconButton size="small" onClick={onBack} disabled={currentFolderId === null} sx={{ color: currentFolderId === null ? 'text.disabled' : 'primary.main' }}><ArrowBack /></IconButton>
        <IconButton size="small" onClick={onHome} disabled={currentFolderId === null} sx={{ color: currentFolderId === null ? 'text.disabled' : 'primary.main' }}><Home /></IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, maxWidth: '100%', flexWrap: 'wrap' }}>
          <MuiLink component="button" variant="body1" onClick={() => onBreadcrumbClick(null)} sx={{ textDecoration: 'none', color: 'primary.main', cursor: 'pointer' }}>Корень</MuiLink>
          {breadcrumbs.map((folder) => <BreadcrumbItem key={folder.id} folder={folder} onClick={onBreadcrumbClick} />)}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} sx={{ color: 'primary.main' }}>{viewMode === 'list' ? <GridView /> : <ViewList />}</IconButton>
      </Box>
    </Paper>
  );
}

function BreadcrumbItem({ folder, onClick }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <NavigateNext fontSize="small" sx={{ color: 'text.secondary' }} />
      <MuiLink component="button" variant="body1" onClick={() => onClick(folder.id)} sx={{ textDecoration: 'none', color: 'primary.main', cursor: 'pointer' }}>{folder.name}</MuiLink>
    </Box>
  );
}

function ContentArea({ loading, sortedItems, locationName, listProps }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between', gap: 2, py: { xs: 2.5, md: 4 }, borderBottom: '1px solid', borderColor: 'divider', mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Typography className="ep-display" sx={{ color: 'text.primary', fontSize: { xs: '2.6rem', sm: '4.6rem' }, lineHeight: 0.86, overflowWrap: 'anywhere' }}>{locationName}</Typography>
        <Typography variant="overline" color="text.secondary">{sortedItems.length} ОБЪЕКТОВ</Typography>
      </Box>
      {loading ? <LoadingState /> : sortedItems.length === 0 ? <EmptyState onFileDropped={listProps?.onFileDropped} /> : <FileList files={sortedItems} {...listProps} />}
    </>
  );
}

function LoadingState() {
  return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
}

function EmptyState({ onFileDropped }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const stop = (event) => { event.preventDefault(); event.stopPropagation(); };
  const handleDrop = async (event) => {
    stop(event);
    setIsDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    if (droppedFiles.length > 0) onFileDropped?.(droppedFiles);
  };
  return (
    <Box onDragOver={(e) => { stop(e); setIsDragActive(true); }} onDragLeave={(e) => { stop(e); setIsDragActive(false); }} onDrop={handleDrop} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 7, sm: 12 }, px: 2, textAlign: 'center', border: '1px dashed', borderColor: isDragActive ? 'primary.main' : 'divider', backgroundColor: (theme) => isDragActive ? theme.ep.selected : 'transparent', transition: 'background-color 160ms ease, border-color 160ms ease' }}>
      <Box sx={{ width: { xs: 76, sm: 96 }, height: { xs: 76, sm: 96 }, border: '1px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'epSoftPulse 2.8s ease-in-out infinite' }}>
        <CloudUpload sx={{ fontSize: { xs: 38, sm: 48 }, color: 'primary.main', margin: 'auto' }} />
      </Box>
      <Typography className="ep-display" sx={{ color: 'text.primary', mb: 1.5, fontSize: { xs: '2.2rem', sm: '3rem' } }}>ПУСТО</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, lineHeight: 1.6 }}>Перетащите файлы сюда или используйте кнопку «Создать» справа внизу.</Typography>
    </Box>
  );
}

function CreateFab({ tasks, anchorEl, onCreateClick }) {
  const isOpen = Boolean(anchorEl);
  return (
    <Box sx={{ position: 'fixed', bottom: { xs: tasks.length > 0 ? 96 : 20, sm: tasks.length > 0 ? 108 : 32 }, right: { xs: 20, sm: 32 }, zIndex: 1100, transition: 'bottom 0.3s ease' }}>
      <Tooltip title="Создать или загрузить" placement="left">
        <Fab variant="extended" onClick={onCreateClick} sx={{ width: { xs: 56, sm: 220 }, height: 56, minHeight: 56, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.ep.warm : theme.ep.blue, color: (theme) => theme.palette.mode === 'dark' ? theme.ep.blue : theme.ep.onBlue, border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? theme.ep.warm : theme.ep.onBlue, px: { xs: 0, sm: 2.5 }, gap: { xs: 0, sm: 1.25 }, justifyContent: 'center', '&:hover': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.ep.warmMuted : theme.ep.acid, color: '#0000f2', borderColor: (theme) => theme.palette.mode === 'dark' ? theme.ep.warmMuted : theme.ep.blue } }}>
          <Add sx={{ transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', fontSize: '1.55rem' }} />
          <Typography variant="button" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800, fontSize: '0.88rem' }}>Создать</Typography>
        </Fab>
      </Tooltip>
    </Box>
  );
}

function CreateMenu({ anchorEl, onClose, onCreateFolder, onUpload }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 220, mb: 1, borderColor: 'divider' } } }}
    >
      <MenuItem onClick={onCreateFolder} sx={{ minHeight: 56, px: 2, gap: 1.5 }}><FolderIcon sx={{ color: 'primary.main', fontSize: 21 }} /><Typography variant="button" sx={{ textTransform: 'none' }}>Новая папка</Typography></MenuItem>
      <MenuItem onClick={onUpload} sx={{ minHeight: 56, px: 2, gap: 1.5 }}><Upload sx={{ color: 'primary.main', fontSize: 21 }} /><Typography variant="button" sx={{ textTransform: 'none' }}>Загрузить файл</Typography></MenuItem>
    </Menu>
  );
}

function NameDialog({ open, title, label, value, setValue, onClose, onSubmit, submitLabel, disabled }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField autoFocus margin="dense" label={label} fullWidth value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !disabled && onSubmit()} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onSubmit} variant="contained" disabled={disabled}>{submitLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ open, fileToDelete, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 600 }}>Удалить объект?</DialogTitle>
      <DialogContent><DialogContentText>Вы действительно хотите удалить {fileToDelete?.type === 'folder' ? 'папку' : 'файл'} "{fileToDelete?.name}"? Действие нельзя отменить.</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onConfirm} variant="contained" color="error">Удалить</Button>
      </DialogActions>
    </Dialog>
  );
}

function canReportItem(item, currentUserEmail) {
  return item?.type === 'file' && item.owner_email && item.owner_email !== currentUserEmail;
}

function ReportDialog({ open, file, reason, setReason, message, setMessage, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Жалоба на файл</DialogTitle>
      <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DialogContentText>{file?.name}</DialogContentText>
        <TextField autoFocus label="Причина" value={reason} onChange={(event) => setReason(event.target.value)} required fullWidth />
        <TextField label="Описание" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={4} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" color="warning" disabled={!reason.trim()} onClick={onSubmit}>Отправить</Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemMenu({ anchorEl, anchorPosition, selectedItem, currentUserEmail, canEdit, onClose, actions }) {
  return (
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? 'anchorPosition' : 'anchorEl'}
      anchorPosition={anchorPosition || undefined}
      open={Boolean(anchorEl || anchorPosition)}
      onClose={onClose}
    >
      {selectedItem && canEdit(selectedItem) && <MenuItem onClick={actions.edit}><Edit fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> Редактировать</MenuItem>}
      <MenuItem onClick={actions.rename}><Edit fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> Переименовать</MenuItem>
      <MenuItem onClick={actions.move}><FolderOpen fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />Переместить</MenuItem>
      <MenuItem onClick={actions.favorite}><Star sx={{ fontSize: 18, mr: 1.5, color: selectedItem?.is_favorite ? 'secondary.main' : 'text.secondary' }} />{selectedItem?.is_favorite ? 'Убрать из избранного' : 'В избранное'}</MenuItem>
      <MenuItem onClick={actions.download}><DownloadIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />{selectedItem?.type === 'folder' ? 'Скачать как ZIP' : 'Скачать'}</MenuItem>
      {canReportItem(selectedItem, currentUserEmail) && <MenuItem onClick={actions.report}><ReportProblem fontSize="small" sx={{ mr: 1.5, color: '#ED6C02' }} />Пожаловаться</MenuItem>}
      <MenuItem onClick={actions.access}><Share fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />Доступ и ссылки</MenuItem>
      <Divider sx={{ my: 0.5 }} />
      <MenuItem onClick={actions.delete} sx={{ color: 'error.main' }}><Delete fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /> Удалить</MenuItem>
    </Menu>
  );
}

function TaskWidget({ tasks, isMinimized, setIsMinimized, clearTasks }) {
  if (tasks.length === 0) return null;
  const activeCount = tasks.filter((task) => ['uploading', 'saving', 'downloading', 'deleting'].includes(task.status)).length;
  const errorCount = tasks.filter((task) => task.status === 'error').length;
  return (
    <Paper elevation={4} sx={{ position: 'fixed', bottom: { xs: 12, sm: 24 }, right: { xs: 12, sm: 24 }, left: { xs: 12, sm: 'auto' }, width: { xs: 'auto', sm: 360 }, backgroundColor: (theme) => theme.ep.panel, zIndex: 2000, overflow: 'hidden', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Операции с файлами</Typography>
          <Typography variant="caption" color={errorCount ? 'error.main' : 'text.secondary'}>{errorCount ? `Ошибок: ${errorCount}` : activeCount ? `В процессе: ${activeCount}` : `Задач: ${tasks.length}`}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? <ArrowDropUp /> : <ArrowDropDown />}</IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={clearTasks}><Close fontSize="small" /></IconButton>
        </Box>
      </Box>
      {!isMinimized && <Box sx={{ overflowY: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 360 }}>{tasks.map((task) => <TaskStatusItem key={task.id} task={task} />)}</Box>}
    </Paper>
  );
}

function GlobalDropOverlay({ active, locationName }) {
  if (!active) return null;
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1900,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(9,9,148,0.88)' : 'rgba(0,0,242,0.9)',
        animation: 'epScaleIn 140ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 'min(520px, 100%)',
          p: { xs: 3, sm: 4 },
          border: '2px dashed',
          borderColor: 'primary.main',
          backgroundColor: (theme) => theme.ep.panel,
          boxShadow: (theme) => theme.ep.menuShadow,
          textAlign: 'center',
        }}
      >
        <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2, display: 'grid', placeItems: 'center', border: '1px solid', borderColor: 'primary.main', animation: 'epSoftPulse 2.2s ease-in-out infinite' }}>
          <CloudUpload sx={{ fontSize: 46, color: 'primary.main' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mb: 1 }}>
          Отпустите файл, чтобы загрузить
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          Файл будет добавлен в папку "{locationName}"
        </Typography>
      </Paper>
    </Box>
  );
}

export default function FileManagerView(props) {
  const { user, navigate, searchQuery, setSearchQuery, viewMode, setViewMode, currentFolderId, breadcrumbs, sortedItems, loading, error, success, setError, setSuccess, locationName, handlers, dialogs, tasks, textEditor } = props;
  const [globalDropActive, setGlobalDropActive] = useState(false);
  const globalDragDepth = useRef(0);
  const resetGlobalDrop = () => {
    globalDragDepth.current = 0;
    setGlobalDropActive(false);
  };
  React.useEffect(() => {
    const reset = () => {
      globalDragDepth.current = 0;
      setGlobalDropActive(false);
    };
    const resetWhenHidden = () => {
      if (document.hidden) reset();
    };
    window.addEventListener('drop', reset, true);
    window.addEventListener('dragend', reset, true);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', resetWhenHidden);
    return () => {
      window.removeEventListener('drop', reset, true);
      window.removeEventListener('dragend', reset, true);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', resetWhenHidden);
    };
  }, []);
  const handleGlobalDragEnter = (event) => {
    if (!hasDraggedSystemFiles(event)) return;
    event.preventDefault();
    globalDragDepth.current += 1;
    setGlobalDropActive(true);
  };
  const handleGlobalDragOver = (event) => {
    if (!hasDraggedSystemFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    setGlobalDropActive(true);
  };
  const handleGlobalDragLeave = (event) => {
    if (!hasDraggedSystemFiles(event) && globalDragDepth.current === 0) return;
    event.preventDefault();
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
      resetGlobalDrop();
      return;
    }
    globalDragDepth.current = Math.max(0, globalDragDepth.current - 1);
    if (globalDragDepth.current === 0) setGlobalDropActive(false);
  };
  const handleGlobalDrop = (event) => {
    if (!hasDraggedSystemFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    resetGlobalDrop();
    if (droppedFiles.length > 0) handlers.listProps?.onFileDropped?.(droppedFiles);
  };
  return (
    <Box className="ep-page" onDragEnter={handleGlobalDragEnter} onDragOver={handleGlobalDragOver} onDragLeave={handleGlobalDragLeave} onDrop={handleGlobalDrop} sx={{ minHeight: '100vh', backgroundColor: (theme) => theme.ep.header, position: 'relative' }}>
      <input type="file" id="manual-file-input" onChange={handlers.manualUpload} style={{ display: 'none' }} />
      <FileManagerHeader user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} navigate={navigate} />
      <Container className="ep-stagger" maxWidth="xl" sx={{ minHeight: 'calc(100vh - 130px)', py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 3 }, backgroundColor: 'background.default', borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        <BreadcrumbBar currentFolderId={currentFolderId} breadcrumbs={breadcrumbs} viewMode={viewMode} setViewMode={setViewMode} onBack={handlers.back} onHome={handlers.home} onBreadcrumbClick={handlers.breadcrumbClick} />
        <ContentArea loading={loading} sortedItems={sortedItems} locationName={locationName} listProps={handlers.listProps} />
      </Container>
      <CreateFab tasks={tasks.tasks} anchorEl={dialogs.anchorEl} onCreateClick={dialogs.openCreateMenu} />
      <CreateMenu anchorEl={dialogs.anchorEl} onClose={dialogs.closeCreateMenu} onCreateFolder={dialogs.startCreateFolder} onUpload={dialogs.startManualUpload} />
      <NameDialog open={dialogs.createFolderOpen} title="Создать папку" label="Название папки" value={dialogs.newFolderName} setValue={dialogs.setNewFolderName} onClose={dialogs.closeCreateFolder} onSubmit={dialogs.submitCreateFolder} submitLabel="Создать" disabled={!dialogs.newFolderName.trim()} />
      <NameDialog open={dialogs.renameDialogOpen} title={`Переименовать ${dialogs.selectedItem?.type === 'folder' ? 'папку' : 'файл'}`} label="Новое название" value={dialogs.newName} setValue={dialogs.setNewName} onClose={dialogs.closeRename} onSubmit={dialogs.submitRename} submitLabel="Переименовать" disabled={!dialogs.newName.trim() || dialogs.newName.trim() === dialogs.selectedItem?.name} />
      <MoveFolderDialog open={dialogs.moveDialogOpen} item={dialogs.selectedItem} currentFolderId={currentFolderId} onClose={dialogs.closeMove} onMoved={dialogs.onMoved} />
      <TextFileEditorDialog
        open={textEditor.textEditorOpen}
        file={textEditor.textEditorFile}
        content={textEditor.textEditorContent}
        loading={textEditor.textEditorLoading}
        saving={textEditor.textEditorSaving}
        error={textEditor.textEditorError}
        onChange={textEditor.setTextEditorContent}
        onCancel={textEditor.closeTextEditor}
        onSave={textEditor.handleTextEditorSave}
      />
      <DeleteDialog open={dialogs.deleteDialogOpen} fileToDelete={dialogs.fileToDelete} onClose={dialogs.closeDelete} onConfirm={dialogs.confirmDelete} />
      <ReportDialog open={dialogs.reportDialogOpen} file={dialogs.reportFile} reason={dialogs.reportReason} setReason={dialogs.setReportReason} message={dialogs.reportMessage} setMessage={dialogs.setReportMessage} onClose={dialogs.closeReport} onSubmit={dialogs.submitReport} />
      <AccessControlDialog open={dialogs.accessDialogOpen} item={dialogs.selectedItem} onClose={dialogs.closeAccess} onChanged={dialogs.onAccessChanged} />
      <ItemMenu anchorEl={dialogs.menuAnchor} anchorPosition={dialogs.menuAnchorPosition} selectedItem={dialogs.selectedItem} currentUserEmail={user?.email} canEdit={handlers.canEdit} onClose={dialogs.closeItemMenu} actions={dialogs.itemMenuActions} />
      <TaskWidget tasks={tasks.tasks} isMinimized={tasks.isWidgetMinimized} setIsMinimized={tasks.setIsWidgetMinimized} clearTasks={() => tasks.setTasks([])} />
      <GlobalDropOverlay active={globalDropActive} locationName={locationName} />
    </Box>
  );
}
