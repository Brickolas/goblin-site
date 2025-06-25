// Move the original script.js content to assets/goblin-games.js for Shopify compatibility
class GoblinGames {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('goblinCart')) || [];
        this.wishlist = JSON.parse(localStorage.getItem('goblinWishlist')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartCounter();
        this.updateWishlistCounter();
        this.setupScrollEffects();
        this.setup3DHoverEffects();
        this.setupLazyLoading();
        this.setupSearch();
        this.setupFilterSystem();
        this.setupAnimations();
        this.setupShopifyIntegration();
    }

    setupShopifyIntegration() {
        // Shopify-specific functionality
        if (typeof Shopify !== 'undefined') {
            this.setupShopifyCart();
            this.setupShopifySearch();
        }
    }

    setupShopifyCart() {
        // Integration with Shopify's cart system
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('shopify-add-to-cart')) {
                this.addToShopifyCart(e.target.dataset.variantId, e.target.dataset.quantity || 1);
            }
        });
    }

    addToShopifyCart(variantId, quantity = 1) {
        if (typeof fetch !== 'undefined') {
            fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: variantId,
                    quantity: quantity
                })
            })
            .then(response => response.json())
            .then(data => {
                this.showNotification('Added to cart!', 'success');
                this.updateShopifyCartCounter();
            })
            .catch(error => {
                console.error('Error adding to cart:', error);
                this.showNotification('Error adding to cart', 'error');
            });
        }
    }

    updateShopifyCartCounter() {
        if (typeof fetch !== 'undefined') {
            fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
                const counter = document.querySelector('.cart-counter');
                if (counter) {
                    counter.textContent = cart.item_count;
                    counter.style.display = cart.item_count > 0 ? 'block' : 'none';
                }
            });
        }
    }

    setupShopifySearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput && typeof window.routes !== 'undefined') {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.performShopifySearch(e.target.value);
            }, 300));
        }
    }

    performShopifySearch(query) {
        if (query.length < 2) return;
        
        if (typeof fetch !== 'undefined' && window.routes && window.routes.predictive_search_url) {
            fetch(`${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8`)
            .then(response => response.text())
            .then(data => {
                // Handle search results
                this.displaySearchResults(data);
            })
            .catch(error => {
                console.error('Search error:', error);
            });
        }
    }

    displaySearchResults(resultsHTML) {
        let resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results';
            document.querySelector('.search-input').parentNode.appendChild(resultsContainer);
        }
        resultsContainer.innerHTML = resultsHTML;
    }

    setupEventListeners() {
        // Cart functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                this.addToCart(e.target.dataset.productId);
            }
            if (e.target.classList.contains('remove-from-cart')) {
                this.removeFromCart(e.target.dataset.productId);
            }
            if (e.target.classList.contains('add-to-wishlist-btn')) {
                this.addToWishlist(e.target.dataset.productId);
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.performSearch(e.target.value);
            }, 300));
        }

        // Filter functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
            });
        }
    }

    addToCart(productId) {
        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }
        this.saveCart();
        this.updateCartCounter();
        this.showNotification('Item added to cart!', 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCounter();
        this.showNotification('Item removed from cart', 'info');
    }

    addToWishlist(productId) {
        if (!this.wishlist.includes(productId)) {
            this.wishlist.push(productId);
            this.saveWishlist();
            this.updateWishlistCounter();
            this.showNotification('Added to wishlist!', 'success');
        }
    }

    saveCart() {
        localStorage.setItem('goblinCart', JSON.stringify(this.cart));
    }

    saveWishlist() {
        localStorage.setItem('goblinWishlist', JSON.stringify(this.wishlist));
    }

    updateCartCounter() {
        const counter = document.querySelector('.cart-counter');
        if (counter) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    updateWishlistCounter() {
        const counter = document.querySelector('.wishlist-counter');
        if (counter) {
            counter.textContent = this.wishlist.length;
            counter.style.display = this.wishlist.length > 0 ? 'block' : 'none';
        }
    }

    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.product-card, .feature-card, .hero-content').forEach(el => {
            observer.observe(el);
        });
    }

    setup3DHoverEffects() {
        const cards = document.querySelectorAll('.product-card, .feature-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                card.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg) translateZ(20px)';
                card.style.transition = 'transform 0.3s ease';
            });

            card.addEventListener('mouseleave', (e) => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                const rotateX = (mouseY / rect.height) * -10;
                const rotateY = (mouseX / rect.width) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
            });
        });
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    setupSearch() {
        this.searchIndex = this.buildSearchIndex();
    }

    buildSearchIndex() {
        const products = document.querySelectorAll('.product-card');
        return Array.from(products).map(product => ({
            element: product,
            title: product.querySelector('.product-title')?.textContent.toLowerCase() || '',
            description: product.querySelector('.product-description')?.textContent.toLowerCase() || '',
            category: product.dataset.category?.toLowerCase() || '',
            tags: product.dataset.tags?.toLowerCase() || ''
        }));
    }

    performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.showAllProducts();
            return;
        }

        this.searchIndex.forEach(item => {
            const isMatch = item.title.includes(searchTerm) ||
                           item.description.includes(searchTerm) ||
                           item.category.includes(searchTerm) ||
                           item.tags.includes(searchTerm);
            
            item.element.style.display = isMatch ? 'block' : 'none';
        });
    }

    showAllProducts() {
        this.searchIndex.forEach(item => {
            item.element.style.display = 'block';
        });
    }

    setupFilterSystem() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.products = document.querySelectorAll('.product-card');
    }

    applyFilter(filterValue) {
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
            if (btn.dataset.filter === filterValue) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            }
        });

        // Filter products
        this.products.forEach(product => {
            if (filterValue === 'all' || product.dataset.category === filterValue) {
                product.style.display = 'block';
                product.classList.add('filter-animation');
            } else {
                product.style.display = 'none';
                product.classList.remove('filter-animation');
            }
        });
    }

    setupAnimations() {
        // Kinetic typography for hero section
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            this.animateKineticText(heroTitle);
        }

        // Particle effects for magical elements
        this.setupParticleEffects();

        // Microinteractions for buttons
        this.setupMicrointeractions();
    }

    animateKineticText(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${index * 0.1}s`;
            span.classList.add('kinetic-char');
            element.appendChild(span);
        });
    }

    setupParticleEffects() {
        const particleContainers = document.querySelectorAll('.particle-container');
        particleContainers.forEach(container => {
            this.createParticles(container);
        });
    }

    createParticles(container) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(particle);
        }
    }

    setupMicrointeractions() {
        const buttons = document.querySelectorAll('.btn, .add-to-cart-btn, .filter-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.05) translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });

            button.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1) translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });

            button.addEventListener('mousedown', (e) => {
                e.target.style.transform = 'scale(0.98) translateY(1px)';
            });

            button.addEventListener('mouseup', (e) => {
                e.target.style.transform = 'scale(1.05) translateY(-2px)';
            });
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.textContent = message;
        
        // Add styles if not already present
        if (!document.querySelector('#goblin-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'goblin-notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    z-index: 10000;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-success {
                    background: var(--forest-green);
                }
                .notification-error {
                    background: #dc3545;
                }
                .notification-info {
                    background: var(--goblin-green);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Advanced search with fuzzy matching
    fuzzySearch(query, text) {
        const pattern = query.split('').reduce((a, b) => `${a}.*${b}`);
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
    }

    // Product comparison functionality
    compareProducts(productIds) {
        const comparisonData = productIds.map(id => this.getProductData(id));
        this.displayComparison(comparisonData);
    }

    getProductData(productId) {
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productElement) return null;
        
        return {
            id: productId,
            title: productElement.querySelector('.product-title')?.textContent,
            price: productElement.querySelector('.product-price')?.textContent,
            rating: productElement.querySelector('.product-rating')?.textContent,
            features: productElement.dataset.features?.split(',') || []
        };
    }

    displayComparison(products) {
        // Implementation for product comparison modal
        console.log('Comparison data:', products);
    }

    // User preferences and personalization
    saveUserPreferences(preferences) {
        localStorage.setItem('goblinUserPrefs', JSON.stringify(preferences));
    }

    getUserPreferences() {
        return JSON.parse(localStorage.getItem('goblinUserPrefs')) || {};
    }

    // Advanced cart features
    calculateCartTotal() {
        return this.cart.reduce((total, item) => {
            const productPrice = this.getProductPrice(item.id);
            return total + (productPrice * item.quantity);
        }, 0);
    }

    getProductPrice(productId) {
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        const priceText = productElement?.querySelector('.product-price')?.textContent;
        return parseFloat(priceText?.replace(/[^\d.]/g, '')) || 0;
    }

    // Inventory tracking
    checkInventory(productId) {
        // Mock inventory check - in real implementation would call API
        return Math.floor(Math.random() * 100) + 1;
    }

    updateInventoryDisplay() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            const inventory = this.checkInventory(productId);
            const inventoryElement = card.querySelector('.inventory-count');
            
            if (inventoryElement) {
                inventoryElement.textContent = `${inventory} in stock`;
                if (inventory < 5) {
                    inventoryElement.classList.add('low-stock');
                }
            }
        });
    }
}

// Additional utility functions for enhanced user experience
class GoblinUtils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.goblinGames = new GoblinGames();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoblinGames, GoblinUtils };
}

// --- PHASE 4: SOUND EFFECTS ---
window.GoblinSound = {
  muted: false,
  clickSound: new Audio('/assets/click.mp3'),
  playClick: function() {
    if (!this.muted) {
      this.clickSound.currentTime = 0;
      this.clickSound.play();
    }
  },
  toggleMute: function() {
    this.muted = !this.muted;
    document.querySelectorAll('.mute-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', this.muted);
      btn.textContent = this.muted ? 'Unmute Sounds' : 'Mute Sounds';
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // Add mute toggle button to header if not present
  if (!document.querySelector('.mute-toggle')) {
    const header = document.querySelector('.header, .hut-header');
    if (header) {
      const btn = document.createElement('button');
      btn.className = 'mute-toggle';
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Mute Sounds';
      btn.onclick = function() { window.GoblinSound.toggleMute(); };
      header.appendChild(btn);
    }
  }
  // Attach click sound to all .btn
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
      window.GoblinSound.playClick();
    });
  });
  // Attach hover sound to all .product-card
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      window.GoblinSound.playClick();
    });
  });
});