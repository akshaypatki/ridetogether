// Utility Functions

const Utils = {
    // Show notification toast
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Format time from 24hr to 12hr
    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', APP_CONFIG.DATE_FORMAT);
    },

    // Get user initials
    getUserInitials(name) {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    },

    // Debug logging
    log(message, data = null) {
        if (data) {
            console.log(`[RideTogether] ${message}`, data);
        } else {
            console.log(`[RideTogether] ${message}`);
        }
    },

    // Show loading screen
    showLoading() {
        document.getElementById('loadingScreen').style.display = 'flex';
    },

    // Hide loading screen
    hideLoading() {
        document.getElementById('loadingScreen').style.display = 'none';
    },

    // Load HTML template
    async loadTemplate(templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error('Template not found');
            return await response.text();
        } catch (error) {
            console.error('Error loading template:', error);
            return '<div class="error">Error loading content</div>';
        }
    },

    // Update active navigation
    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
    },

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Check if date is in future
    isFutureDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    },

    // Debounce function
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
};