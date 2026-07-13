import {
  Archive,
  Article,
  Code,
  DataObject,
  Description,
  Folder,
  FontDownload,
  Image,
  MenuBook,
  Movie,
  MusicNote,
  PictureAsPdf,
  Slideshow,
  Storage,
  TableChart,
  ViewInAr,
} from '@mui/icons-material';

const FILE_TYPES = [
  { type: 'image', label: 'Изображение', badge: 'IMG', icon: Image, accent: '#67d7ff', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'avif', 'heic', 'heif', 'tif', 'tiff', 'ico', 'raw', 'psd', 'ai', 'sketch'] },
  { type: 'video', label: 'Видео', badge: 'VID', icon: Movie, accent: '#edff45', extensions: ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mpeg', 'mpg', 'avi', 'mkv', 'flv', 'wmv', '3gp'] },
  { type: 'audio', label: 'Аудио', badge: 'AUD', icon: MusicNote, accent: '#ff9f8d', extensions: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'wma', 'aiff', 'opus'] },
  { type: 'pdf', label: 'PDF-документ', badge: 'PDF', icon: PictureAsPdf, accent: '#ff6f61', extensions: ['pdf'] },
  { type: 'spreadsheet', label: 'Таблица', badge: 'XLS', icon: TableChart, accent: '#82e6a8', extensions: ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'tsv', 'ods', 'numbers'] },
  { type: 'presentation', label: 'Презентация', badge: 'PPT', icon: Slideshow, accent: '#ffc45e', extensions: ['ppt', 'pptx', 'pptm', 'potx', 'potm', 'ppsx', 'ppsm', 'odp', 'key'] },
  { type: 'document', label: 'Документ', badge: 'DOC', icon: Description, accent: '#aab8ff', extensions: ['doc', 'docx', 'docm', 'odt', 'rtf', 'pages'] },
  { type: 'text', label: 'Текст', badge: 'TXT', icon: Article, accent: '#d9d7cf', extensions: ['txt', 'md', 'markdown', 'log'] },
  { type: 'code', label: 'Исходный код', badge: 'CODE', icon: Code, accent: '#62e3cf', extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'kts', 'sql', 'sh', 'bash', 'zsh', 'ps1', 'vue', 'svelte'] },
  { type: 'data', label: 'Данные', badge: 'DATA', icon: DataObject, accent: '#8fd6a7', extensions: ['json', 'jsonl', 'ndjson', 'parquet', 'avro', 'toml'] },
  { type: 'archive', label: 'Архив', badge: 'ZIP', icon: Archive, accent: '#b8a1ff', extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'iso'] },
  { type: 'ebook', label: 'Электронная книга', badge: 'BOOK', icon: MenuBook, accent: '#ffb3d1', extensions: ['epub', 'mobi', 'azw', 'azw3', 'fb2'] },
  { type: 'font', label: 'Шрифт', badge: 'FONT', icon: FontDownload, accent: '#f6a6ff', extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'] },
  { type: 'database', label: 'База данных', badge: 'DB', icon: Storage, accent: '#7cc5ff', extensions: ['db', 'sqlite', 'sqlite3', 'mdb', 'accdb'] },
  { type: 'model', label: '3D-модель', badge: '3D', icon: ViewInAr, accent: '#ffad66', extensions: ['obj', 'fbx', 'glb', 'gltf', 'stl', 'step', 'stp', 'dwg', 'dxf'] },
];

const FOLDER_TYPE = { type: 'folder', label: 'Папка', badge: 'DIR', icon: Folder, accent: '#edff45' };
const GENERIC_TYPE = { type: 'file', label: 'Файл', badge: 'FILE', icon: Description, accent: '#8d9aff' };

export function getFileExtension(file) {
  const name = String(file?.name || '').trim();
  const lastDot = name.lastIndexOf('.');
  if (lastDot < 0 || lastDot === name.length - 1) return '';
  return name.slice(lastDot + 1).toLowerCase();
}

export function getFileType(file) {
  if (file?.type === 'folder') return FOLDER_TYPE;
  const extension = getFileExtension(file);
  return FILE_TYPES.find((group) => group.extensions.includes(extension)) || GENERIC_TYPE;
}

export function getFileTypeLabel(file) {
  return getFileType(file).label;
}
