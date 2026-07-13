import { Paper } from '@mui/material';
import FileRow from './FileRow';
import FileTypeIcon from '../FileTypeIcon';

function formatFileSize(bytes) {
  if (!bytes) return '';
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${parseFloat((bytes / (1024 ** index)).toFixed(1))} ${sizes[index]}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FilesTable({ files = [], ...handlers }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', backgroundColor: (theme) => theme.ep.panel }}>
      {files.map((file) => (
        <FileRow
          key={`${file.type || 'file'}-${file.id}`}
          file={file}
          getFileIcon={(item, size) => <FileTypeIcon file={item} size={size} />}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          {...handlers}
        />
      ))}
    </Paper>
  );
}
