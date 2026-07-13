import { useState } from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { Download as DownloadIcon, Edit, MoreVert, Star } from '@mui/icons-material';
import FileTypeIcon from '../FileTypeIcon';
import { getFileExtension } from '../fileTypeConfig';
import FileRow from './FileRow';
import { getDraggedManagerItem, hasDraggedManagerItem, hasDraggedSystemFiles, setDraggedManagerItem } from './dragDrop';

function isEditableTextFile(file) {
  if (file?.can_write === false) return false;
  return file?.type === 'file' && ['txt', 'md', 'json', 'csv', 'log', 'xml', 'html', 'js', 'py'].includes(getFileExtension(file));
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${parseFloat((bytes / (1024 ** index)).toFixed(1))} ${sizes[index]}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function canReportFile(file, currentUserEmail) {
  return file.type === 'file' && file.owner_email && file.owner_email !== currentUserEmail;
}

function GridActionButtons({ file, onFavoriteClick, onDownloadClick, onEditClick, onMenuOpen }) {
  const buttonSx = { opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s', zIndex: 30 };
  return (
    <>
      <Tooltip title={file.is_favorite ? 'Убрать из избранного' : 'Добавить в избранное'}><IconButton className="favorite-btn" onClick={(event) => { event.stopPropagation(); onFavoriteClick?.(file); }} sx={{ ...buttonSx, position: 'absolute', top: 8, right: 104, color: file.is_favorite ? 'secondary.main' : 'primary.main' }} size="small"><Star fontSize="small" /></IconButton></Tooltip>
      {isEditableTextFile(file) && onEditClick && <Tooltip title="Редактировать"><IconButton className="edit-btn" onClick={(event) => { event.stopPropagation(); onEditClick(file); }} sx={{ ...buttonSx, position: 'absolute', top: 8, right: 72, color: 'primary.main' }} size="small"><Edit fontSize="small" /></IconButton></Tooltip>}
      <Tooltip title="Скачать"><IconButton className="download-btn" onClick={(event) => { event.stopPropagation(); onDownloadClick?.(file.id, file.name, file.type); }} sx={{ ...buttonSx, position: 'absolute', top: 8, right: 40, color: 'primary.main' }} size="small"><DownloadIcon fontSize="small" /></IconButton></Tooltip>
      <IconButton className="grid-menu-btn" onClick={(event) => { event.stopPropagation(); onMenuOpen?.(event, file, file.type); }} sx={{ ...buttonSx, position: 'absolute', top: 8, right: 8, color: 'text.secondary' }} size="small"><MoreVert fontSize="small" /></IconButton>
    </>
  );
}

function GridCard({ file, handlers }) {
  const isFolder = file.type === 'folder';
  const isDraggableFile = file.type === 'file' && file.can_write !== false;
  const [isDragOver, setIsDragOver] = useState(false);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDropOnCard = (e) => {
    stop(e);
    setIsDragOver(false);
    const movedItem = getDraggedManagerItem(e);
    if (movedItem && isFolder) {
      handlers.onMoveFileToFolder?.(movedItem, file);
      return;
    }
    if (movedItem) return;
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length === 0) return;
    if (isFolder) handlers.onFileDropped?.(droppedFiles, file.id);
    else handlers.onFileDropped?.(droppedFiles);
  };
  const handleDragOver = (e) => {
    if (hasDraggedManagerItem(e) && !isFolder) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = hasDraggedManagerItem(e) ? 'move' : 'copy';
    setIsDragOver(true);
  };
  const open = () => (isFolder ? handlers.onFolderClick?.(file.id) : handlers.onPreviewClick?.(file));
  const openContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onMenuOpen?.(event, file, file.type);
  };
  const uploaderText = canReportFile(file, handlers.currentUserEmail) ? `Загрузил: ${file.owner_email}` : '';
  return (
    <Paper elevation={0} draggable={isDraggableFile} onDragStart={(event) => setDraggedManagerItem(event, file)} onClick={open} onContextMenu={openContextMenu} onDragOver={handleDragOver} onDragLeave={() => setIsDragOver(false)} onDrop={handleDropOnCard} sx={{ p: 2, minHeight: 148, border: '1px solid', borderColor: isDragOver ? 'secondary.main' : 'divider', position: 'relative', cursor: isDraggableFile ? 'grab' : 'pointer', backgroundColor: (theme) => (isDragOver ? 'rgba(237,255,69,0.18)' : theme.ep.panel), transition: 'background-color 150ms ease, border-color 150ms ease', '&:hover': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.ep.hover : 'rgba(0,0,242,0.045)', borderColor: 'primary.main', '& .grid-menu-btn,.download-btn,.favorite-btn,.edit-btn': { opacity: 1 } }, '&:active': { cursor: isDraggableFile ? 'grabbing' : 'pointer' } }}>
      {isFolder ? <FolderActions folder={file} handlers={handlers} /> : <GridActionButtons file={file} {...handlers} />}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><FileTypeIcon file={file} size={48} /></Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: { xs: 0, sm: 6 } }}>{file.name}</Typography>
      {uploaderText && <Tooltip title={uploaderText}><Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}>{uploaderText}</Typography></Tooltip>}
      <Typography variant="caption" color="text.secondary">{formatDate(file.created_at || file.updated_at || file.date || new Date().toISOString())}{file.size && ` • ${formatFileSize(file.size)}`}</Typography>
    </Paper>
  );
}

function FolderActions({ folder, handlers }) {
  return (
    <>
      <Tooltip title="Скачать как ZIP"><IconButton className="download-btn" onClick={(event) => { event.stopPropagation(); handlers.onDownloadClick?.(folder.id, folder.name, 'folder'); }} sx={{ position: 'absolute', top: 8, right: 40, opacity: { xs: 1, sm: 0 }, color: 'primary.main', zIndex: 30 }} size="small"><DownloadIcon fontSize="small" /></IconButton></Tooltip>
      <IconButton className="grid-menu-btn" onClick={(event) => { event.stopPropagation(); handlers.onMenuOpen?.(event, folder, 'folder'); }} sx={{ position: 'absolute', top: 8, right: 8, opacity: { xs: 1, sm: 0 }, color: 'text.secondary', zIndex: 30 }} size="small"><MoreVert fontSize="small" /></IconButton>
    </>
  );
}

async function getDroppedFiles(event) {
  return Array.from(event.dataTransfer.files || []);
}

export default function FileList({ files, viewMode, onFileDropped, ...handlers }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (hasDraggedManagerItem(event)) return;
    const droppedFiles = await getDroppedFiles(event);
    if (droppedFiles.length > 0) onFileDropped?.(droppedFiles);
  };
  const wrapperSx = {
    position: 'relative', width: '100%', minHeight: '300px',
    outline: isDragActive ? '3px solid rgba(237,255,69,0.8)' : 'none',
  };
  return (
    <Box onDragOver={(event) => { if (!hasDraggedSystemFiles(event)) return; event.preventDefault(); event.stopPropagation(); setIsDragActive(true); }} onDragLeave={() => setIsDragActive(false)} onDrop={handleDrop} sx={wrapperSx}>
      {viewMode === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
          {files.map((file) => <GridCard key={`${file.type}-${file.id}`} file={file} handlers={handlers} />)}
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: (theme) => theme.ep.panel }}>
          {files.map((file) => <FileRow key={`${file.type}-${file.id}`} file={file} getFileIcon={(item, size) => <FileTypeIcon file={item} size={size} />} formatFileSize={formatFileSize} formatDate={formatDate} onFileDropped={onFileDropped} {...handlers} />)}
        </Paper>
      )}
    </Box>
  );
}
