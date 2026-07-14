import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { buildBreadcrumbs, getApiErrorMessage } from './fileManagerHelpers';

async function fetchFileManagerData() {
  const ts = Date.now();
  const [foldersRes, filesRes, favsRes] = await Promise.all([
    api.get(`folders/?_ts=${ts}`),
    api.get(`files/?_ts=${ts}`),
    api.get(`favorites/all/?_ts=${ts}`),
  ]);
  const allFolders = foldersRes.data.folders || [];
  const allFiles = filesRes.data || [];
  const accessibleFolderIds = new Set(allFolders.map((folder) => folder.id));
  const visibleFolders = allFolders.map((folder) => ({
    ...folder,
    parent_id: folder.parent_id && accessibleFolderIds.has(folder.parent_id) ? folder.parent_id : null,
  }));
  const visibleFiles = allFiles.map((file) => ({
    ...file,
    folder: file.folder && accessibleFolderIds.has(file.folder) ? file.folder : null,
  }));
  return {
    favoriteIds: { files: favsRes.data.file_ids || [], folders: favsRes.data.folder_ids || [] },
    folders: visibleFolders,
    files: visibleFiles,
  };
}

export default function useFileManagerData(currentFolderId, searchQuery) {
  const [favoriteIds, setFavoriteIds] = useState({ files: [], folders: [] });
  const [allFolders, setAllFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await fetchFileManagerData();
      setFavoriteIds(data.favoriteIds);
      setAllFolders(data.folders);
      setAllFiles(data.files);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(getApiErrorMessage(err, 'Не удалось загрузить файлы и папки'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleData = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      return {
        folders: allFolders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery)),
        files: allFiles.filter((file) => file.name.toLowerCase().includes(normalizedQuery)),
      };
    }
    return {
      folders: allFolders.filter((folder) => folder.parent_id === currentFolderId),
      files: allFiles.filter((file) => (currentFolderId ? file.folder === currentFolderId : !file.folder)),
    };
  }, [allFiles, allFolders, currentFolderId, deferredSearchQuery]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(allFolders, currentFolderId), [allFolders, currentFolderId]);

  return { favoriteIds, setFavoriteIds, folders: visibleData.folders, files: visibleData.files, breadcrumbs, loading, error, setError, success, setSuccess, loadData };
}
