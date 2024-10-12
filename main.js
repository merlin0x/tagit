// main.js
const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ipcMain } = require('electron');
const { Content, Tag, initializeDatabase, tagCount, getTags } = require('./database');

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

// Функция создания главного окна сохранения
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 260, // Увеличил высоту для отображения тегов
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'save-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true
    },
  });

  mainWindow.loadFile('save.html');
}

// Функция создания окна просмотра
function createViewWindow() {
  viewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'view-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      autoHideMenuBar: true
    },    
  });

  viewWindow.loadFile('view.html');

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
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      autoHideMenuBar: true
    },    
  });

  splashWindow.loadFile('splash.html');
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
      const tagInstances = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { name: tag } })));
      const tagObjects = tagInstances.map(([tag]) => tag);

      // Создаём запись контента и связываем с тегами
      const content = await Content.create({
        id,
        fileName,
        filePath,
        date,
        content: clipboardContent,
      });

      await content.addTags(tagObjects);

      console.log(`Saved: ${filePath} with tags: ${tags.join(', ')}`);
    } catch (error) {
      console.error('Error when saving content:', error);
    }
  } else {
    console.log("Clipboard is empty.");
  }
}

// Обработчик сохранения контента
ipcMain.handle('save-content', async (event, tags) => {
  // Преобразуем теги в массив и удаляем лишние пробелы
  const normalizedTags = Array.isArray(tags) ? tags : [tags];
  const trimmedTags = normalizedTags.map(tag => tag.trim()).filter(tag => tag);
  await saveClipboardContent(trimmedTags);
  if (mainWindow) mainWindow.hide();
});

// Обработчик для получения сохранённого контента с фильтрацией
ipcMain.handle('get-saved-content', async (event, { type, value }) => {
  try {
    let contents;

    if (type === 'tag' && Array.isArray(value) && value.length > 0) {
      // Поиск по тегам
      contents = await Content.findAll({
        include: {
          model: Tag,
          where: {
            name: value,
          },
          through: {
            attributes: [],
          },
        },
        group: ['Content.id'],
        having: tagCount(value.length),
        order: [['date', 'DESC']],
      });
    } else if (type === 'content' && typeof value === 'string' && value.trim() !== '') {
      // Поиск по контенту
      contents = await Content.findAll({
        where: {
          content: {
            [require('sequelize').Op.like]: `%${value}%`,
          },
        },
        include: {
          model: Tag,
          through: {
            attributes: [],
          },
        },
        order: [['date', 'DESC']],
      });
    } else {
      // Получаем весь контент без фильтрации
      contents = await Content.findAll({
        include: {
          model: Tag,
          through: {
            attributes: [],
          },
        },
        order: [['date', 'DESC']],
      });
    }

    // Формируем данные для передачи в рендерер
    const result = contents.map(content => ({
      id: content.id,
      fileName: content.fileName,
      filePath: content.filePath,
      date: content.date,
      content: content.content,
      tags: content.Tags.map(tag => tag.name),
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
    const content = await Content.findByPk(id, {
      include: Tag, // Если необходимо загрузить связанные теги
    });

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
  if (window) {
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
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('Tag it!');
  tray.setContextMenu(contextMenu);

  createSplashWindow();
  splashWindow.show();


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
