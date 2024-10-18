// Функция для вставки символа в поле ввода
function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.slice(0, start) + textToInsert + value.slice(end);
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
}

// Получение данных о тегах из main.js
async function loadTags() {
    const tags = await window.electronAPI.getTags();
    const speedDial = document.getElementById('speed-dial');
    speedDial.innerHTML = '';

    tags.forEach((tag, index) => {
        // Создаем элемент кнопки
        const button = document.createElement('div');
        button.classList.add('custom-button');
        button.setAttribute('data-key', tag.key); // Для сопоставления с клавишами
        button.setAttribute('data-tag', tag.tag); // Сам тег
        button.setAttribute('tabindex', '0'); // Делает элемент фокусируемым

        // Внутри кнопки: отображаемая клавиша и тег
        const keySpan = document.createElement('span');
        keySpan.classList.add('button-key');
        keySpan.textContent = tag.key.toUpperCase();

        const tagSpan = document.createElement('span');
        tagSpan.classList.add('button-tag');
        tagSpan.textContent = tag.tag;

        button.appendChild(keySpan);
        button.appendChild(tagSpan);

        // Обработчик клика
        button.addEventListener('click', async () => {
            await window.electronAPI.saveContent([{
                tag: tag.tag,
                state: null
            }])
        });

        // Обработчики клавиатурных событий для навигации и активации
    button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                button.click();
            }
        });

        // Добавляем кнопку в контейнер
        speedDial.appendChild(button);
    });

    // Устанавливаем фокус на первую кнопку, если она есть
    const firstButton = document.querySelector('.custom-button');
    if (firstButton) {
        firstButton.focus();
    }
}

const settingsButton = document.getElementById('settings-button')
settingsButton.addEventListener('click', () => {
    window.electronAPI.openSettingsWindow();
})

window.addEventListener('pageshow', () => {
    loadTags();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadTags();
    }
});

// Обработка нажатий клавиш
window.addEventListener('keydown', async (event) => {

    const inputField = document.getElementById('input-field');

    // Проверка нажатия '#'
    if (event.key === '#') {
        event.preventDefault(); // Предотвращаем стандартное поведение
        inputField.focus(); // Перемещаем фокус на поле ввода

        if (inputField.value.length === 0) {
            insertAtCursor(inputField, '#'); // Вставляем '#'
        }
        return; // Прерываем дальнейшую обработку
    }


    const isInputFocused = (document.activeElement === inputField);

    if (!event.ctrlKey && !isInputFocused) {
        const key = event.code.replace('Key', '').toLowerCase();
        const button = document.querySelector(`.custom-button[data-key="${key}"]`);
        if (button) {
            event.preventDefault();
            button.click();
        }
    }

    // Закрытие окна по Esc
    if (event.key === 'Escape') {
        if (isInputFocused) {
            window.focus();
            inputField.blur();
        } else {
            await window.electronAPI.hide()
        }
    }
});

// Добавляем обработчик для нажатия Enter в поле ввода
const inputField = document.getElementById('input-field');

inputField.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Предотвращаем стандартное поведение (например, отправку формы)

        const inputValue = inputField.value.trim();

        if (inputValue.length === 0) {
            // Поле пустое, ничего не делаем
            return;
        }

        // Удаляем символ '#' если он есть в начале
        const tag = inputValue.startsWith('#') ? inputValue.slice(1) : inputValue;

        if (tag.length === 0) {
            // Если после удаления '#' строка пуста, ничего не делаем
            return;
        }

        // Отправляем тег
        await window.electronAPI.saveContent([{
            tag,
            state: null
        }])

        // Очищаем поле ввода после отправки
        inputField.value = '';
    }
});