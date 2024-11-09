// main.js
const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');
const { ipcMain } = require('electron');
const { initializeDatabase, createContentTag, getTags, createContent, getContentByTag, getContents, getAllContents, getContent, getOrCreateTag, updateContentTagState } = require('./database');
const { createLogger, format, transports } = require('winston');

let mainWindow, viewWindow, splashWindow, settingsWindow;
let tray = null;


const logger = createLogger({
  level: 'info', // Минимальный уровень логирования
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    // Логирование в файл
    new transports.File({ filename: path.join(__dirname, 'app.log') }),
    
    // Логирование в консоль (опционально)
    new transports.Console()
  ],
});

const ConfigFilename = "config.yaml";
const SpeedDialFileName = "speedDial.yaml"

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
    logger.error(e);
  }
}

function saveYaml(data, filename)
{
  try 
  {
    const yamlStr = yaml.dump(data, {
      flowLevel: 1
    });
    fs.writeFileSync(filename, yamlStr, 'utf8');
  }
  catch(e)
  {
    logger.error(e);
  }
}


let Config = loadYaml(ConfigFilename)

// Функция создания главного окна сохранения
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 260,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './views/save/save-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true,
      devTools: true
    },
  });

  mainWindow.loadFile('./views/save/save.html');
  mainWindow.setMenu(null);
  enableDevTools(mainWindow);
}

// Функция создания окна просмотра
function createViewWindow() {
  viewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, './views/view/view-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true,
      devTools: true
    },    
  });

  viewWindow.loadFile('./views/view/view.html');
  viewWindow.setMenu(null);
  enableDevTools(viewWindow);

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
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      autoHideMenuBar: true,
      devTools: true
    },    
  });

  splashWindow.loadFile('./views/splash/splash.html');
  splashWindow.setMenu(null);
  enableDevTools(splashWindow);
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: Config.frame.value,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'icon.png'),
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
  enableDevTools(settingsWindow);
}

function enableDevTools(window) {
  window.webContents.on('before-input-event', (_, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      window.webContents.isDevToolsOpened()
        ? window.webContents.closeDevTools()
        : window.webContents.openDevTools({ mode: 'left' });
    }
  });
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

      logger.info(`Saved: ${filePath} with tags: ${tags.map(t => t.tag).join(', ')}`);
    } catch (error) {
      logger.error('Error when saving content:', error);
    }
  } else {
    logger.info("Clipboard is empty.");
  }
}

ipcMain.handle('get-config', async () => {
  return Config;
})

ipcMain.handle('save-config', async (event, data) => {
  Config = data;
  saveYaml(Config, ConfigFilename)
})

ipcMain.handle('save-speed-dial', async (event, tagKey, tagValue) => {
  let speedDialConfig = loadYaml(SpeedDialFileName);

  speedDialConfig = speedDialConfig.map(item => 
    item.key === tagKey ? {key: tagKey, tag: tagValue} : item
  );

  saveYaml(speedDialConfig, SpeedDialFileName);
})

ipcMain.handle('open-settings-window', async (event) => {
  safeOpen(settingsWindow, createSettingsWindow);
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
    logger.error('Error by getting contents:', error);
    return [];
  }
});

ipcMain.handle('get-speed-dial', async (event) => {
  try {
    const tags = loadYaml(SpeedDialFileName);
    return tags;
  } catch (error) {
    logger.error('Error by getting tags:', error);
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
    logger.error('Ошибка копирования в буфер обмена:', error);
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
      logger.info(`File deleted: ${content.filePath}`);
    } else {
      logger.warn(`File not found: ${content.filePath}`);
    }

    // Удаляем запись из базы данных
    await content.destroy();
    logger.info(`Content ${id} has been deleted from db.`);

    return { success: true, message: 'The content has been successfully removed.' };
  } catch (error) {
    logger.error('Error when deleting content:', error);
    return { success: false, message: 'An error occurred while deleting content.' };
  }
});

ipcMain.handle('save-hide', async () => {
  mainWindow.hide();
});

ipcMain.handle('view-hide', async () => {
  viewWindow.hide();
});

ipcMain.handle('update-tag-state', async (event, contentId, tagName, newState) => {
  try {
    if (!contentId || !tagName) {
      return { success: false, error: 'Недостаточно данных для обновления состояния тега.' };
    }

    const result = await updateContentTagState(contentId, tagName, newState);

    if (result.success) {
      logger.info(`Состояние тега '${tagName}' для контента ID '${contentId}' обновлено на '${newState}'.`);
    } else {
      logger.warn(`Не удалось обновить состояние тега: ${result.error}`);
    }

    return result;
  } catch (error) {
    logger.error('Ошибка в обработчике update-tag-state:', error);
    return { success: false, error: 'Произошла ошибка при обновлении состояния тега.' };
  }
})


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

function safeOpen(window, createHandler)
{
  if (window && !window.isDestroyed()) {
    if (!window.isVisible())
      window.show();
  } else {
    createHandler();
  }
}

app.whenReady().then(async () => {
  await initializeDatabase(); // Инициализируем базу данных

  tray = new Tray('icon.png'); // Убедитесь, что иконка находится по указанному пути
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
      safeOpen(settingsWindow, createSettingsWindow);
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
