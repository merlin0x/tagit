// view-renderer.js

// Удалите следующую строку, так как nodeIntegration отключен
// const { ipcRenderer } = require('electron');

const filterInput = document.getElementById('filterInput');
filterInput.focus();

// Функция отображения контента
async function displaySavedContent(searchType = 'all', searchValue = '') {
  const savedContent = await window.electronAPI.getSavedContent({ type: searchType, value: searchValue });
  const contentList = document.getElementById('contentList');
  contentList.innerHTML = ''; // Очищаем существующий контент

  if (savedContent.length === 0) {
    contentList.innerHTML = '<p>Нет сохранённого контента.</p>';
    return;
  }

  savedContent.forEach(item => {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content-item';
    contentDiv.id = `content-${item.id}`; // Уникальный ID

    const date = new Date(item.date).toLocaleTimeString().slice(0,5);
    const tags = item.tags.join(', ');

    contentDiv.innerHTML = `
      <pre>${item.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      <button class="copy-button" data-content="${item.content.replace(/"/g, '&quot;')}" aria-label="Copy">
        <svg viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      </button>
      <div class="right-corner">
          <button class="remove-button" data-id="${item.id}" aria-label="Remove">remove</button>
      </div>
      <div class="meta-info">
        <div><strong>#</strong> <span class="tags">${tags}</span></div>
      </div>
    `;
    contentList.appendChild(contentDiv);
  });
}

// Функция копирования в буфер обмена
async function copyToClipboard(text) {
  const result = await window.electronAPI.copyToClipboard(text);
  if (result.success) {
    alert('Содержимое скопировано в буфер обмена.');
  } else {
    console.error('Ошибка копирования:', result.error);
    alert('Не удалось скопировать содержимое.');
  }
}

// Функция удаления контента
async function removeContent(id) {
  try {
    const result = await window.electronAPI.deleteContent(id);
    if (result.success) {
      // Перерисовываем список после удаления
      const currentFilter = filterInput.value.trim();
      if (currentFilter === '') {
        displaySavedContent();
      } else if (currentFilter.startsWith('#')) {
        const filterTags = currentFilter.substring(1).split(',').map(tag => tag.trim()).filter(tag => tag);
        displaySavedContent('tag', filterTags);
      } else {
        displaySavedContent('content', currentFilter);
      }
    } else {
      alert(result.message || 'Не удалось удалить контент.');
    }
  } catch (error) {
    console.error('Ошибка при удалении контента:', error);
    alert('Не удалось удалить контент.');
  }
}

// Обработчик фильтрации при вводе
document.getElementById('filterInput').addEventListener('input', (event) => {
  const input = event.target.value.trim();
  if (input === '') {
    // Если поле ввода пустое, отображаем весь контент
    displaySavedContent();
  } else if (input.startsWith('#')) {
    // Поиск по тегам
    const filterTags = input.substring(1).split(',').map(tag => tag.trim()).filter(tag => tag);
    displaySavedContent('tag', filterTags);
  } else {
    // Поиск по контенту
    displaySavedContent('content', input);
  }
});

// Делегирование событий для кнопок
document.getElementById('contentList').addEventListener('click', async (event) => {
  const target = event.target;
  
  // Проверяем, была ли нажата кнопка копирования
  if (target.closest('.copy-button')) {
    const button = target.closest('.copy-button');
    const textToCopy = button.getAttribute('data-content');
    if (textToCopy) {
      await copyToClipboard(textToCopy);
    }
  }

  // Проверяем, была ли нажата кнопка удаления
  if (target.closest('.remove-button')) {
    const button = target.closest('.remove-button');
    const idToRemove = button.getAttribute('data-id');
    if (idToRemove) {
      await removeContent(idToRemove);
    }
  }
});

// Загружаем весь контент при загрузке страницы
window.onload = () => {
  displaySavedContent();
};

// Закрытие окна при нажатии клавиши Escape
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.close();
  }
});
