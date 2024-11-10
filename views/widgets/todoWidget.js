function render (contentDiv, metaInfoItem, state) {
    console.log(state)
    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox')
    checkbox.style.top = '8px'
    checkbox.checked = state

    checkbox.onclick = async (event) => {
      const contentId = event.target.parentElement.parentElement.parentElement.id;
      const tag = event.target.parentElement.getAttribute('data-tag');
      const state = event.target.checked;

      await window.electronAPI.updateTagState(contentId, tag, state);
    }

    metaInfoItem.appendChild(checkbox);
}

export default {
    tag: 'todo',
    description: 'A checkbox is added to track the completion status of the entry',
    render
}