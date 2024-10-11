const filterInput = document.getElementById('filterInput');
filterInput.focus();

// Функция отображения уведомлений
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.innerHTML = `
    <span>${message}</span>
    <button class="close-button" aria-label="Close">&times;</button>
  `;

    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);

    // Автоматическое удаление уведомления через 3 секунды
    setTimeout(() => {
        notification.classList.add('hide');
        // Удаляем элемент после окончания анимации
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }, 3000);

    // Обработчик для закрытия уведомления вручную
    notification.querySelector('.close-button').addEventListener('click', () => {
        notification.classList.add('hide');
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    });
}

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

        const date = new Date(item.date).toLocaleTimeString().slice(0, 5);
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
        // alert('Содержимое скопировано в буфер обмена.');
        showNotification('Copied.', 'success');
    } else {
        console.error('Failed to copy the contents.', result.error);
        showNotification('Failed to copy the contents.', 'error');
    }
}

// Функция удаления контента
async function removeContent(id) {
    try {
        const result = await window.electronAPI.deleteContent(id);
        if (result.success) {
            showNotification('The content has been successfully removed.', 'success');
            // Перерисовываем список после удаления
            const currentFilter = filterInput.value.trim();

            showContent(currentFilter);
        } else {
            showNotification(result.message || 'Failed to delete content.', 'error');
        }
    } catch (error) {
        console.error('Failed to delete content:', error);
        showNotification('Failed to delete content.', 'error');
    }
}

function showContent(q) {
    if (q === '') {
        // Если поле ввода пустое, отображаем весь контент
        displaySavedContent();
    } else if (q.startsWith('#')) {
        // Поиск по тегам
        const filterTags = q.substring(1).split(',').map(tag => tag.trim()).filter(tag => tag);
        displaySavedContent('tag', filterTags);
    } else {
        // Поиск по контенту
        displaySavedContent('content', q);
    }
}

// Обработчик фильтрации при вводе
document.getElementById('filterInput').addEventListener('input', (event) => {
    const input = event.target.value.trim();
    showContent(input);
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

window.addEventListener('pageshow', () => {
    showContent('');
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        showContent('');
    }
});

// Закрытие окна при нажатии клавиши Escape
window.addEventListener('keydown', async (event) => {
    if (event.key === 'Escape') {
        await window.electronAPI.hide();
    }
});
