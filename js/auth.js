/**
 * RadioAnalyzer - Authentication Module
 */

const Auth = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const session = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH);
        if (!session) return false;

        try {
            const data = JSON.parse(session);
            // Check if session is still valid (24 hours)
            if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                this.logout();
                return false;
            }
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Login with username and password
     */
    login(username, password) {
        const credentials = this.getCredentials();

        if (username === credentials.username && password === credentials.password) {
            const session = {
                username: username,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH, JSON.stringify(session));
            return true;
        }
        return false;
    },

    /**
     * Logout
     */
    logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH);
        window.location.href = 'index.html';
    },

    /**
     * Get current credentials
     */
    getCredentials() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.CREDENTIALS);
        return stored ? JSON.parse(stored) : CONFIG.DEFAULT_CREDENTIALS;
    },

    /**
     * Change password
     */
    changePassword(currentPassword, newPassword) {
        const credentials = this.getCredentials();

        if (currentPassword !== credentials.password) {
            return { success: false, message: 'Mot de passe actuel incorrect' };
        }

        if (newPassword.length < 4) {
            return { success: false, message: 'Le nouveau mot de passe doit contenir au moins 4 caractères' };
        }

        credentials.password = newPassword;
        localStorage.setItem(CONFIG.STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

        return { success: true, message: 'Mot de passe modifié avec succès' };
    },

    /**
     * Get current username
     */
    getCurrentUser() {
        const session = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH);
        if (!session) return null;

        try {
            const data = JSON.parse(session);
            return data.username;
        } catch {
            return null;
        }
    }
};

/**
 * Protect page - redirect to login if not authenticated
 */
function requireAuth() {
    if (!Auth.isAuthenticated()) {
        // If on admin page, redirect to index
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}
