// cart.js - Основная логика корзины для всех страниц

// Глобальные функции для работы с корзиной
window.CartManager = {
    // Получить корзину
    getCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    },

    // Сохранить корзину
    saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
        // Вызываем событие для обновления других страниц
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    },

    // Обновление счетчика в шапке
    updateCartCount() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const cartLinks = document.querySelectorAll('.cart-link .cart-count');
        
        cartLinks.forEach(badge => {
            if (totalItems > 0) {
                badge.classList.remove('d-none');
                badge.textContent = totalItems;
            } else {
                badge.classList.add('d-none');
            }
        });
    },

    // Добавление товара
    addToCart(product) {
        if (!product || !product.id) {
            console.error('Некорректный товар:', product);
            return false;
        }
        
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            this.showNotification(`✓ Количество товара "${product.name}" увеличено`, 'success');
        } else {
            cart.push({
                id: product.id,
                name: product.name || 'Товар',
                price: parseInt(product.price) || 0,
                image: product.image || 'https://via.placeholder.com/100x100?text=Нет+фото',
                quantity: 1
            });
            this.showNotification(`✓ "${product.name}" добавлен в корзину`, 'success');
        }
        
        this.saveCart(cart);
        return true;
    },

    // Удаление товара
    removeFromCart(productId) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        const newCart = cart.filter(item => item.id !== productId);
        
        if (newCart.length !== cart.length) {
            this.saveCart(newCart);
            this.showNotification(`✗ ${item ? item.name : 'Товар'} удален из корзины`, 'error');
            return true;
        }
        return false;
    },

    // Изменение количества
    updateQuantity(productId, change) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            const newQuantity = (item.quantity || 1) + change;
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart(cart);
                
                // Обновляем отображение на странице корзины, если мы на ней
                if (window.location.pathname.includes('cart.html')) {
                    this.renderCartPage();
                }
            }
            return true;
        }
        return false;
    },

    // Очистка корзины
    clearCart() {
        const cart = this.getCart();
        if (cart.length === 0) return false;
        
        if (confirm('Очистить корзину?')) {
            this.saveCart([]);
            this.showNotification('🗑️ Корзина очищена', 'info');
            return true;
        }
        return false;
    },

    // Показать уведомление
    showNotification(message, type = 'success') {
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
    },

    // Отрисовка страницы корзины
    renderCartPage() {
        const container = document.getElementById('cartItemsContainer');
        const summaryContainer = document.getElementById('summaryContent');
        const recommendationsSection = document.getElementById('recommendationsSection');
        
        if (!container) return;
        
        const cart = this.getCart();
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="bi bi-cart-x"></i>
                    <h2>Корзина пуста</h2>
                    <p>Добавьте товары, чтобы оформить заказ</p>
                    <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
                </div>
            `;
            if (summaryContainer) summaryContainer.innerHTML = '';
            if (recommendationsSection) recommendationsSection.style.display = 'none';
            return;
        }
        
        if (recommendationsSection) recommendationsSection.style.display = 'block';
        
        let total = 0;
        let totalItems = 0;
        let cartHtml = '';
        
        cart.forEach((item, index) => {
            const quantity = item.quantity || 1;
            const itemTotal = item.price * quantity;
            total += itemTotal;
            totalItems += quantity;
            
            cartHtml += `
                <div class="cart-item" data-aos="fade-up" data-aos-delay="${index * 50}">
                    <div class="row align-items-center">
                        <div class="col-md-3 mb-3 mb-md-0">
                            <div class="item-image mx-auto mx-md-0">
                                <img src="${item.image || 'https://via.placeholder.com/120x120?text=Нет+фото'}" 
                                     alt="${item.name}" 
                                     onerror="this.src='https://via.placeholder.com/120x120?text=Нет+фото'">
                            </div>
                        </div>
                        <div class="col-md-5 mb-3 mb-md-0">
                            <h4 class="item-title">${item.name}</h4>
                            <p class="item-price">Цена: <span>${item.price} ₽</span></p>
                        </div>
                        <div class="col-md-4">
                            <div class="d-flex flex-column align-items-center align-items-md-end">
                                <div class="quantity-control mb-3">
                                    <button class="quantity-btn" onclick="CartManager.updateQuantity('${item.id}', -1)" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                                    <span class="quantity-value">${quantity}</span>
                                    <button class="quantity-btn" onclick="CartManager.updateQuantity('${item.id}', 1)">+</button>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <span class="item-total">${itemTotal} ₽</span>
                                    <button class="remove-btn" onclick="CartManager.removeFromCart('${item.id}')" title="Удалить">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = cartHtml;
        
        // Сводка
        const delivery = total > 1000 ? 0 : 300;
        const finalTotal = total + delivery;
        const progressPercent = Math.min((total / 1000) * 100, 100);
        const remainingForFree = Math.max(1000 - total, 0);
        
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Товары (${totalItems} шт.)</span>
                <span>${total} ₽</span>
            </div>
            <div class="summary-row">
                <span>Доставка</span>
                <span class="${delivery === 0 ? 'text-success' : ''}">${delivery === 0 ? 'Бесплатно' : delivery + ' ₽'}</span>
            </div>
            ${delivery > 0 ? `
                <div class="delivery-progress">
                    <div class="progress-text">
                        <i class="bi bi-truck"></i>
                        До бесплатной доставки ${remainingForFree} ₽
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            ` : `
                <div class="alert alert-success py-2 mb-3 small">
                    <i class="bi bi-check-circle me-2"></i>
                    Бесплатная доставка!
                </div>
            `}
            <div class="summary-row total">
                <span>К оплате</span>
                <span>${finalTotal} ₽</span>
            </div>
            <button class="checkout-btn" onclick="CartManager.checkout()">
                <i class="bi bi-check2-circle me-2"></i>Оформить заказ
            </button>
            <a href="catalog.html" class="continue-shopping d-block text-center">
                <i class="bi bi-arrow-left"></i>Продолжить покупки
            </a>
        `;
    },

    // Оформление заказа
    checkout() {
        const cart = this.getCart();
        if (cart.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const delivery = total > 1000 ? 0 : 300;
        const finalTotal = total + delivery;
        
        // Формируем детали заказа
        let orderItems = '';
        cart.forEach(item => {
            orderItems += `
                <div class="d-flex justify-content-between small mb-2">
                    <span>${item.name}</span>
                    <span class="fw-bold">${item.quantity || 1} × ${item.price} ₽</span>
                </div>
            `;
        });
        
        let existingModal = document.getElementById('orderModal');
        if (existingModal) existingModal.remove();
        
        const modalHtml = `
            <div class="modal fade" id="orderModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border-radius: 30px;">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold">Заказ оформлен</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-4">
                                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                            </div>
                            <p class="text-center mb-4">Спасибо за покупку в ЗвероМире!</p>
                            <div class="bg-light p-3 rounded-4 mb-3">
                                ${orderItems}
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Сумма:</span>
                                <span class="fw-bold">${total} ₽</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Доставка:</span>
                                <span class="fw-bold ${delivery === 0 ? 'text-success' : ''}">${delivery === 0 ? 'Бесплатно' : delivery + ' ₽'}</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between">
                                <span class="h5 fw-bold">Итого:</span>
                                <span class="h5 fw-bold text-primary">${finalTotal} ₽</span>
                            </div>
                            <p class="text-secondary small mt-3 mb-0">
                                <i class="bi bi-info-circle me-1"></i>
                                Наш менеджер свяжется с вами для подтверждения заказа.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('orderModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        modalElement.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        // Очищаем корзину
        this.saveCart([]);
        this.showNotification('Заказ успешно оформлен!', 'success');
        this.renderCartPage();
    },

    // Инициализация кнопки наверх
    initScrollTop() {
        const scrollBtn = document.getElementById('scrollTopBtn');
        if (!scrollBtn) return;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('show');
            } else {
                scrollBtn.classList.remove('show');
            }
        });
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    // Инициализация навбара
    initNavbar() {
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
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем счетчик корзины
    CartManager.updateCartCount();
    
    // Инициализируем доп. функции
    CartManager.initScrollTop();
    CartManager.initNavbar();
    
    // Если мы на странице корзины, отрисовываем её
    if (window.location.pathname.includes('cart.html')) {
        CartManager.renderCartPage();
    }
});
