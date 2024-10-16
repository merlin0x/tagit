// main.js
const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');
const { ipcMain } = require('electron');
const { initializeDatabase, createContentTag, getTags, createContent, getContentByTag, getContents, getAllContents, getContent, getOrCreateTag } = require('./database');

let mainWindow, viewWindow, splashWindow;
let tray = null;


// Пример данных о тегах. В реальном приложении эти данные могут поступать из базы данных или конфигурационного файла.
const predefinedTags = [
  { key: 'a', tag: 'all' },
  { key: 'b', tag: 'spok' },
  { key: 'c', tag: 'todo' },
  { key: 'd', tag: 'tagit!' },
  { key: 'e', tag: 'e' },
  { key: 'f', tag: 'f' },
  { key: 'g', tag: 'g' },
  { key: 'h', tag: 'h' },
  { key: 'i', tag: 'i' },
  { key: 'j', tag: 'j' },
  { key: 'k', tag: 'k' },
  { key: 'l', tag: 'l' },
];

function loadYaml(filename)
{
  try
  {
    const fileContents = fs.readFileSync(filename, 'utf8');
    const content = yaml.load(fileContents);
    return content;
  }
  catch(e)
  {
    console.error(e);
  }
}

const Config = loadYaml('config.yaml')

// Функция создания главного окна сохранения
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 260, // Увеличил высоту для отображения тегов
    frame: Config.frame.value,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, './views/save/save-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true
    },
  });

  mainWindow.loadFile('./views/save/save.html');
  mainWindow.setMenu(null);
}

// Функция создания окна просмотра
function createViewWindow() {
  viewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, './views/view/view-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true
    },    
  });

  viewWindow.loadFile('./views/view/view.html');
  viewWindow.setMenu(null);

  viewWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Открываем ссылку во внешнем браузере
    shell.openExternal(url);
    return { action: 'deny' }; // Запрещаем открытие внутри приложения
  });

  // Обработчик для навигации внутри текущего окна
  viewWindow.webContents.on('will-navigate', (event, url) => {
    const currentURL = viewWindow.webContents.getURL();
    if (url !== currentURL) {
      event.preventDefault(); // Отменяем навигацию внутри приложения
      shell.openExternal(url); // Открываем во внешнем браузере
    }
  });  
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      autoHideMenuBar: true
    },    
  });

  splashWindow.loadFile('./views/splash/splash.html');
  splashWindow.setMenu(null);
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, './views/settings/settings-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true,
      devTools: true
    },    
  });

  settingsWindow.loadFile('./views/settings/settings.html');
  settingsWindow.setMenu(null);
  //settingsWindow.webContents.openDevTools();
}

// Функция сохранения содержимого буфера обмена с тегами
async function saveClipboardContent(tags = []) {
  const clipboardContent = clipboard.readText();
  if (clipboardContent) {
    const id = uuidv4();
    const fileName = `content_${id}.txt`;
    const filePath = path.join(app.getPath('documents'), fileName);
    fs.writeFileSync(filePath, clipboardContent);

    const date = new Date();

    try {
      // Создаём или находим теги
      const tagInstances = await Promise.all(tags.map(tagObj => getOrCreateTag(tagObj.tag)));
      const tagObjects = tagInstances.map(([tag]) => tag);

      // Создаём запись контента
      const content = await createContent({
        id,
        fileName,
        filePath,
        date,
        content: clipboardContent,
      });

      // Подготавливаем данные для связывания тегов с контентом, включая состояние
      const contentTagsData = tagObjects.map((tag, index) => ({
        tagId: tag.id,
        contentId: content.id,
        state: tags[index].state,
      }));

      // Используем транзакцию для атомарности операции
      await createContentTag(contentTagsData);

      console.log(`Saved: ${filePath} with tags: ${tags.map(t => t.tag).join(', ')}`);
    } catch (error) {
      console.error('Error when saving content:', error);
    }
  } else {
    console.log("Clipboard is empty.");
  }
}

ipcMain.handle('get-config', async () => {
  return Config;
})

// Обработчик сохранения контента
ipcMain.handle('save-content', async (event, tags) => {
  // Проверяем, является ли tags массивом, если нет — превращаем в массив
  const normalizedTags = Array.isArray(tags) ? tags : [tags];

  // Нормализуем теги: обрезаем пробелы у имени тега и обеспечиваем наличие объекта state или устанавливаем его в null
  const trimmedTags = normalizedTags
    .map(tagObj => ({
      tag: typeof tagObj.tag === 'string' ? tagObj.tag.trim() : '',
      state: tagObj.state || null,
    }))
    .filter(tagObj => tagObj.tag); // Удаляем теги без имени

  // Сохраняем контент с привязанными тегами и их состоянием
  await saveClipboardContent(trimmedTags);

  // Скрываем главное окно, если оно существует
  if (mainWindow) mainWindow.hide();
});

// Обработчик для получения сохранённого контента с фильтрацией
ipcMain.handle('get-saved-content', async (event, { type, value }) => {
  try {
    let contents;

    if (type === 'tag' && Array.isArray(value) && value.length > 0) {
      // Поиск по тегам
      contents = await getContentByTag(value);
    } else if (type === 'content' && typeof value === 'string' && value.trim() !== '') {
      // Поиск по контенту
      contents = await getContents(value);      
    } else {
      // Получаем весь контент без фильтрации
      contents = await getAllContents();
    }

    // Формируем данные для передачи в рендерер
    const result = contents.map(content => ({
      id: content.id,
      fileName: content.fileName,
      filePath: content.filePath,
      date: content.date,
      content: content.content,
      tags: content.Tags.map(tag => { 
        return {
          tag: tag.name, 
          state: tag.ContentTags.state 
        }
      }),
    }));

    return result;
  } catch (error) {
    console.error('Error by getting contents:', error);
    return [];
  }
});

// Обработчик для получения тегов
ipcMain.handle('get-predefined-tags', async (event) => {
  try {
    // В реальном приложении теги могут храниться в базе данных
    // Здесь используем предварительно заданные теги
    return predefinedTags;
  } catch (error) {
    console.error('Error by getting tags:', error);
    return [];
  }
});

ipcMain.handle('get-tags', async (event) => {
  return getTags();
})

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Ошибка копирования в буфер обмена:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-content', async (event, id) => {
  try {
    // Находим запись контента по ID
    const content = await getContent(id);

    if (!content) {
      return { success: false, message: 'Content not found' };
    }

    // Удаляем файл из файловой системы
    if (fs.existsSync(content.filePath)) {
      fs.unlinkSync(content.filePath);
      console.log(`File deleted: ${content.filePath}`);
    } else {
      console.warn(`File not found: ${content.filePath}`);
    }

    // Удаляем запись из базы данных
    await content.destroy();
    console.log(`Content ${id} has been deleted from db.`);

    return { success: true, message: 'The content has been successfully removed.' };
  } catch (error) {
    console.error('Error when deleting content:', error);
    return { success: false, message: 'An error occurred while deleting content.' };
  }
});

ipcMain.handle('save-hide', async () => {
  mainWindow.hide();
});

ipcMain.handle('view-hide', async () => {
  viewWindow.hide();
});

function toggleWindow(window, createHandler, toHide = true)
{
  if (window && !window.isDestroyed()) {
    if (!window.isVisible())
      window.show();
    else if (toHide)
      window.hide();
  } else {
    createHandler();
  }
}


app.whenReady().then(async () => {
  await initializeDatabase(); // Инициализируем базу данных

  tray = new Tray('tray-icon.png'); // Убедитесь, что иконка находится по указанному пути
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show tagger', click: () => {
        toggleWindow(mainWindow, createMainWindow, false);
      } 
    },
    { label: 'View content', click: () => {
        toggleWindow(viewWindow, createViewWindow, false);
      } 
    },
    { label: 'Settings', click: () => {
      createSettingsWindow();
      settingsWindow.show();
    } 
  },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('Tag it!');
  tray.setContextMenu(contextMenu);

  if (Config && Config.showSplashScren.value)
  {
    createSplashWindow();
    splashWindow.show();
  }


  // Регистрация глобальных горячих клавиш
  globalShortcut.register('Ctrl+Shift+{', () => {
    toggleWindow(mainWindow, createMainWindow);
  });

  globalShortcut.register('Ctrl+Shift+}', () => {
    toggleWindow(viewWindow, createViewWindow);    
  });

  // Предотвращаем выход приложения при закрытии всех окон
  app.on('window-all-closed', (e) => e.preventDefault());
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
