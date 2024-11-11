// save-renderer.js

// Function to insert text at the cursor position
function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.slice(0, start) + textToInsert + value.slice(end);
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
}

// Initialize the input field with a permanent '#' prefix
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('input-field');
    
    // If the input is empty, set it to '#'
    if (inputField.value.length === 0) {
        inputField.value = '#';
    }

    // Prevent the user from deleting the '#' symbol
    inputField.addEventListener('keydown', (event) => {
        if (inputField.selectionStart === 0 && (event.key === 'Backspace' || event.key === 'Delete')) {
            event.preventDefault();
        }
    });

    // Ensure that the first character is always '#'
    inputField.addEventListener('input', () => {
        if (!inputField.value.startsWith('#')) {
            inputField.value = '#' + inputField.value.replace(/^#+/, '');
        }
    });
});

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

// Handle global keydown events
window.addEventListener('keydown', async (event) => {
    const inputField = document.getElementById('input-field');

    // Check if '#' key is pressed
    if (event.key === '#') {
        event.preventDefault(); // Prevent default behavior
        inputField.focus(); // Focus on the input field

        // Insert '#' only if it's not already present at the start
        if (!inputField.value.startsWith('#')) {
            insertAtCursor(inputField, '#');
        }
        return; // Exit early
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

    // Close window on Escape key
    if (event.key === 'Escape') {
        if (isInputFocused) {
            window.focus();
            inputField.blur();
        } else {
            await window.electronAPI.hide()
        }
    }
});

// Handle Enter key in the input field
const inputField = document.getElementById('input-field');

inputField.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default behavior (e.g., form submission)

        let inputValue = inputField.value.trim();

        // Ensure the tag starts with '#'
        if (!inputValue.startsWith('#')) {
            inputValue = '#' + inputValue;
        }

        // Remove the '#' for saving
        const tag = inputValue.slice(1);

        if (tag.length === 0) {
            // If the tag is empty after removing '#', do nothing
            return;
        }

        // Save the tag
        await window.electronAPI.saveContent([{
            tag,
            state: null
        }])

        // Clear the input field and reset to '#'
        inputField.value = '#';
        inputField.focus();
    }
});
