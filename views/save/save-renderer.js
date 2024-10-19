// Функция для вставки символа в поле ввода
function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.slice(0, start) + textToInsert + value.slice(end);
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
}

const settingsButton = document.getElementById('settings-button')
settingsButton.addEventListener('click', () => {
    window.electronAPI.openSettingsWindow();
})

window.addEventListener('pageshow', async () => {
    await loadTags(speedDialClickHandler);
});

document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        await loadTags(speedDialClickHandler);
    }
});

async function speedDialClickHandler(tag) {
    await window.electronAPI.saveContent([{
        tag: tag.tag,
        state: null
    }])
}

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