// Функция отображения уведомлений
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.innerHTML = `
    <span>${message}</span>
    <button class="close-notify" aria-label="Close">&times;</button>
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
    }, 750);

    // Обработчик для закрытия уведомления вручную
    notification.querySelector('.close-notify').addEventListener('click', () => {
        notification.remove();
    });
}
