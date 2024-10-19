async function loadTags(clickHandler) {
    const tags = await window.electronAPI.getSpeedDial();
    const speedDial = document.getElementById('speed-dial');
    speedDial.innerHTML = '';

    tags.forEach((tag, index) => {
        const button = document.createElement('div');
        button.classList.add('custom-button');
        button.setAttribute('data-key', tag.key); 
        button.setAttribute('data-tag', tag.tag);
        button.setAttribute('tabindex', '0');


        const keySpan = document.createElement('span');
        keySpan.classList.add('button-key');
        keySpan.textContent = tag.key.toUpperCase();

        const tagSpan = document.createElement('span');
        tagSpan.classList.add('button-tag');
        tagSpan.textContent = tag.tag;

        button.appendChild(keySpan);
        button.appendChild(tagSpan);

        button.addEventListener('click', () => clickHandler(tag));

        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                button.click();
            }
        });

        speedDial.appendChild(button);
    });

    const firstButton = document.querySelector('.custom-button');
    if (firstButton) {
        firstButton.focus();
    }
}
