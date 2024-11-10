function render(contentDiv, metaInfoItem, state) {
  console.log(state);
  
  // Создаем элемент input типа range для интерактивного изменения значения
  const progressBar = document.createElement('input');
  progressBar.setAttribute('type', 'range');
  progressBar.setAttribute('min', '0');
  progressBar.setAttribute('max', '100');
  progressBar.setAttribute('value', state);
  progressBar.style.flexGrow = '1';
  
  // Обработчик изменения значения прогресс-бара
  progressBar.oninput = async (event) => {
      const newValue = event.target.value;
      
      const contentId = contentDiv.id;
      const tag = event.target.parentElement.getAttribute('data-tag');
      const updatedState = Number(newValue);
      
      await window.electronAPI.updateTagState(contentId, tag, updatedState);
  };
  
  
  metaInfoItem.appendChild(progressBar);
}

export default {
  tag: 'progress',
  description: 'Интерактивный прогресс-бар для отображения и изменения состояния',
  render
};
