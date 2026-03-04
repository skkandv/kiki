// cart.js - Основная логика корзины для всех страниц

// Инициализация корзины
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Сохранение корзины
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Вызываем событие для обновления других страниц
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

// Обновление счетчика в шапке
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartLinks = document.querySelectorAll('.cart-link');
    
    cartLinks.forEach(cartLink => {
        let badge = cartLink.querySelector('.cart-count');
        
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count';
            cartLink.style.position = 'relative';
            cartLink.appendChild(badge);
        }
        
        if (totalItems > 0) {
            badge.classList.remove('d-none');
            badge.textContent = totalItems;
            badge.style.animation = 'bounce 0.5s ease';
            setTimeout(() => {
                badge.style.animation = '';
            }, 500);
        } else {
            badge.classList.add('d-none');
        }
    });
}

// Добавление товара с анимацией
function addToCart(product) {
    if (!product || !product.id) {
        console.error('Некорректный товар:', product);
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        showNotification(`✓ Количество товара "${product.name}" увеличено`, 'success');
    } else {
        cart.push({
            id: product.id,
            name: product.name || 'Товар',
            price: parseInt(product.price) || 0,
            image: product.image || 'https://via.placeholder.com/100x100?text=Нет+фото',
            quantity: 1
        });
        showNotification(`✓ "${product.name}" добавлен в корзину`, 'success');
    }
    
    saveCart();
}

// Удаление товара
function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    showNotification(`✗ ${item ? item.name : 'Товар'} удален из корзины`, 'error');
}

// Изменение количества
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        const newQuantity = (item.quantity || 1) + change;
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
        }
    }
}

// Очистка корзины
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Очистить корзину?')) {
        cart = [];
        saveCart();
        showNotification('🗑️ Корзина очищена', 'info');
    }
}

// Показать уведомление с анимацией
function showNotification(message, type = 'success') {
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'check-circle-fill';
    if (type === 'error') icon = 'exclamation-circle-fill';
    if (type === 'info') icon = 'info-circle-fill';
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    notification.innerHTML = `
        <i class="bi bi-${icon}" style="color: ${colors[type] || colors.info}; font-size: 1.2rem; margin-right: 10px;"></i>
        <span class="flex-grow-1">${message}</span>
        <button class="btn-close btn-sm ms-2" onclick="this.parentElement.remove()"></button>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Кнопка наверх
function initScrollTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Анимация появления элементов
function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-scroll]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => observer.observe(el));
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    initScrollTop();
    initScrollAnimations();
    
    // Анимация навбара при скролле
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});

// Глобальные функции
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.showNotification = showNotification;
