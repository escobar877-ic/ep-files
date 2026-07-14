import { useState } from 'react';
import api, { startBrowserDownload, uploadFileApi } from '../../api/axios';
import { extractIncomingFiles, getApiErrorMessage } from './fileManagerHelpers';

function makeTaskId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatTransferSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} Б`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} КБ`;
  return `${(value / 1024 ** 2).toFixed(1)} МБ`;
}

export function useUploadCommand({ currentFolderId, loadData, taskQueue }) {
  const processUpload = async (incomingData, targetFolderId = currentFolderId) => {
    const cleanFiles = extractIncomingFiles(incomingData);
    if (cleanFiles.length === 0) return;

    let uploadedAny = false;
    for (const cleanFile of cleanFiles) {
      const taskId = makeTaskId('upload');
      taskQueue.setIsWidgetMinimized(false);
      taskQueue.addTask(taskId, cleanFile.name, 'Загрузка файла...', 'Отправка в облако', 'uploading', 0);
      try {
        await uploadFileApi(cleanFile, {
          folderId: targetFolderId,
          onProgress: ({ loaded, total, percent }) => taskQueue.updateTask(taskId, {
            progress: percent,
            subText: `${formatTransferSize(loaded)} из ${formatTransferSize(total)}`,
          }),
        });
        uploadedAny = true;
        taskQueue.updateTask(taskId, { title: 'Загрузка завершена', subText: 'Файл успешно сохранен', status: 'success', progress: 100 });
      } catch (err) {
        console.error(`Критическая ошибка при отправке файла ${cleanFile.name}:`, err);
        taskQueue.updateTask(taskId, { title: 'Ошибка загрузки', subText: getApiErrorMessage(err, 'Не удалось загрузить файл'), status: 'error' });
      }
      taskQueue.removeTaskWithTimer(taskId);
    }
    if (uploadedAny) await loadData({ silent: true });
  };
  return processUpload;
}

export function useDownloadCommand(taskQueue) {
  return (id, name, type) => {
    const taskId = makeTaskId('download');
    const isFolder = type === 'folder';
    taskQueue.setIsWidgetMinimized(false);
    taskQueue.addTask(taskId, name + (isFolder ? '.zip' : ''), isFolder ? 'Архивация и скачивание папки...' : 'Скачивание файла...', 'Подготовка потока данных', 'downloading');
    try {
      startBrowserDownload(isFolder ? `/folders/${id}/download/` : `/download/${id}/`, isFolder ? `${name}.zip` : name);
      taskQueue.updateTask(taskId, { title: 'Скачивание начато', subText: 'Передача выполняется браузером', status: 'success' });
    } catch (err) {
      console.error('Ошибка при скачивании:', err);
      taskQueue.updateTask(taskId, { title: 'Ошибка скачивания', subText: getApiErrorMessage(err, err.response?.status === 404 ? 'Объект не найден' : 'Не удалось скачать объект'), status: 'error' });
    }
    taskQueue.removeTaskWithTimer(taskId);
  };
}

export function useSelectionDialogs({ loadData, taskQueue }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const taskId = makeTaskId('delete');
    taskQueue.setIsWidgetMinimized(false);
    taskQueue.addTask(taskId, fileToDelete.name, 'Удаление объекта...', 'Очистка диска', 'deleting');
    setDeleteDialogOpen(false);
    try {
      await api.delete(fileToDelete.type === 'folder' ? `/folders/${fileToDelete.id}/delete/` : `/files/${fileToDelete.id}/`);
      taskQueue.updateTask(taskId, { title: 'Удалено успешно', subText: 'Объект перемещен в корзину', status: 'success' });
      loadData();
    } catch (err) {
      taskQueue.updateTask(taskId, { title: 'Ошибка удаления', subText: getApiErrorMessage(err, 'Не удалось удалить объект'), status: 'error' });
    }
    setSelectedItem(null);
    setFileToDelete(null);
    taskQueue.removeTaskWithTimer(taskId);
  };

  return { selectedItem, setSelectedItem, fileToDelete, setFileToDelete, deleteDialogOpen, setDeleteDialogOpen, renameDialogOpen, setRenameDialogOpen, newName, setNewName, moveDialogOpen, setMoveDialogOpen, accessDialogOpen, setAccessDialogOpen, confirmDelete };
}

export async function renameSelectedItem({ selectedItem, newName, setRenameDialogOpen, setNewName, setError, loadData }) {
  const trimmedName = (newName || '').trim();
  if (!trimmedName || !selectedItem) return;
  try {
    const url = selectedItem.type === 'folder' ? `/folders/${selectedItem.id}/rename/` : `/files/${selectedItem.id}/`;
    await api.patch(url, { name: trimmedName });
    setRenameDialogOpen(false);
    setNewName('');
    loadData();
  } catch (err) {
    setError(getApiErrorMessage(err, 'Ошибка переименования'));
  }
}

export async function toggleFavoriteItem({ selectedItem, setFavoriteIds, setError, setSuccess }) {
  if (!selectedItem) return;
  try {
    const response = await api.post(`/favorites/${selectedItem.id}/toggle/`, { type: selectedItem.type });
    const key = selectedItem.type === 'folder' ? 'folders' : 'files';
    setFavoriteIds((current) => {
      const ids = current[key] || [];
      const nextIds = response.data?.is_favorite
        ? [...new Set([...ids, selectedItem.id])]
        : ids.filter((id) => id !== selectedItem.id);
      return { ...current, [key]: nextIds };
    });
    setSuccess(response.data?.message || 'Избранное обновлено');
  } catch (err) {
    setError(getApiErrorMessage(err, 'Не удалось обновить избранное'));
  }
}

export async function createFolder({ name, currentFolderId, setName, setOpen, setError, loadData }) {
  if (!name.trim()) return;
  try {
    await api.post('/folders/create/', { name, parent_id: currentFolderId });
    setName('');
    setOpen(false);
    loadData();
  } catch (err) {
    setError(getApiErrorMessage(err, 'Ошибка создания папки'));
  }
}

export async function moveFileToFolder({ file, targetFolder, setError, setSuccess, loadData }) {
  if (!file || !targetFolder || file.type !== 'file' || targetFolder.type !== 'folder') return;
  if (Number(file.folder) === Number(targetFolder.id)) {
    setSuccess?.('Файл уже находится в этой папке');
    return;
  }

  try {
    await api.patch(`/files/${file.id}/move/`, { folder_id: targetFolder.id });
    setSuccess?.(`Файл "${file.name}" перемещён в папку "${targetFolder.name}"`);
    loadData?.({ silent: true });
  } catch (err) {
    setError?.(getApiErrorMessage(err, 'Не удалось переместить файл'));
  }
}
