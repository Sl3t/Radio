/**
 * RadioAnalyzer - Theme Management Module
 * Handles custom themes and mood board functionality
 */

const THEME_STORAGE_KEY = 'radioanalyzer_theme';

// Predefined themes
const THEME_PRESETS = {
    'dark-blue': {
        name: 'Bleu Nuit',
        colors: {
            '--accent-primary': '#3b82f6',
            '--accent-primary-hover': '#2563eb',
            '--bg-primary': '#0a0a0b',
            '--bg-secondary': '#111113',
            '--bg-tertiary': '#18181b',
            '--bg-hover': '#1f1f23',
            '--bg-active': '#27272a',
            '--border-color': '#27272a',
            '--border-light': '#3f3f46',
            '--text-primary': '#fafafa',
            '--text-secondary': '#a1a1aa',
            '--text-muted': '#71717a'
        }
    },
    'dark-purple': {
        name: 'Violet Profond',
        colors: {
            '--accent-primary': '#8b5cf6',
            '--accent-primary-hover': '#7c3aed',
            '--bg-primary': '#0d0a12',
            '--bg-secondary': '#13101a',
            '--bg-tertiary': '#1a1622',
            '--bg-hover': '#221d2b',
            '--bg-active': '#2a2435',
            '--border-color': '#2a2435',
            '--border-light': '#3d3550',
            '--text-primary': '#f5f3ff',
            '--text-secondary': '#a5a0b8',
            '--text-muted': '#7a7490'
        }
    },
    'dark-green': {
        name: 'Vert Médical',
        colors: {
            '--accent-primary': '#22c55e',
            '--accent-primary-hover': '#16a34a',
            '--bg-primary': '#0a0b0a',
            '--bg-secondary': '#101310',
            '--bg-tertiary': '#161a16',
            '--bg-hover': '#1c211c',
            '--bg-active': '#232823',
            '--border-color': '#232823',
            '--border-light': '#354035',
            '--text-primary': '#f0fdf4',
            '--text-secondary': '#a3b8a8',
            '--text-muted': '#6b8070'
        }
    },
    'dark-orange': {
        name: 'Orange Chaleureux',
        colors: {
            '--accent-primary': '#f97316',
            '--accent-primary-hover': '#ea580c',
            '--bg-primary': '#0b0a09',
            '--bg-secondary': '#131210',
            '--bg-tertiary': '#1a1916',
            '--bg-hover': '#22201c',
            '--bg-active': '#2a2723',
            '--border-color': '#2a2723',
            '--border-light': '#403b33',
            '--text-primary': '#fff7ed',
            '--text-secondary': '#b8ada0',
            '--text-muted': '#8a7f70'
        }
    },
    'dark-red': {
        name: 'Rouge Intense',
        colors: {
            '--accent-primary': '#ef4444',
            '--accent-primary-hover': '#dc2626',
            '--bg-primary': '#0b0909',
            '--bg-secondary': '#131010',
            '--bg-tertiary': '#1a1515',
            '--bg-hover': '#221c1c',
            '--bg-active': '#2a2323',
            '--border-color': '#2a2323',
            '--border-light': '#403535',
            '--text-primary': '#fef2f2',
            '--text-secondary': '#b8a5a5',
            '--text-muted': '#8a7575'
        }
    },
    'dark-teal': {
        name: 'Turquoise',
        colors: {
            '--accent-primary': '#14b8a6',
            '--accent-primary-hover': '#0d9488',
            '--bg-primary': '#090b0b',
            '--bg-secondary': '#101313',
            '--bg-tertiary': '#161a1a',
            '--bg-hover': '#1c2121',
            '--bg-active': '#232828',
            '--border-color': '#232828',
            '--border-light': '#354040',
            '--text-primary': '#f0fdfa',
            '--text-secondary': '#a0b8b5',
            '--text-muted': '#6b8a85'
        }
    }
};

// Default theme (dark-blue)
const DEFAULT_THEME = THEME_PRESETS['dark-blue'].colors;

/**
 * Theme Manager Class
 */
const ThemeManager = {
    /**
     * Initialize theme on page load
     */
    init() {
        this.applyStoredTheme();
    },

    /**
     * Get stored theme or default
     */
    getStoredTheme() {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    },

    /**
     * Save theme to storage
     */
    saveTheme(theme) {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    },

    /**
     * Apply stored theme or default
     */
    applyStoredTheme() {
        const theme = this.getStoredTheme();
        if (theme && theme.colors) {
            this.applyColors(theme.colors);
        }
    },

    /**
     * Apply preset theme by name
     */
    applyPreset(presetName) {
        const preset = THEME_PRESETS[presetName];
        if (preset) {
            this.applyColors(preset.colors);
            this.saveTheme({ preset: presetName, colors: preset.colors });
            return true;
        }
        return false;
    },

    /**
     * Apply custom colors
     */
    applyColors(colors) {
        const root = document.documentElement;
        for (const [property, value] of Object.entries(colors)) {
            root.style.setProperty(property, value);
        }
    },

    /**
     * Apply custom theme (from color pickers)
     */
    applyCustomTheme(colors) {
        this.applyColors(colors);
        this.saveTheme({ preset: 'custom', colors });
    },

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.applyColors(DEFAULT_THEME);
        this.saveTheme({ preset: 'dark-blue', colors: DEFAULT_THEME });
    },

    /**
     * Get current theme colors
     */
    getCurrentColors() {
        const theme = this.getStoredTheme();
        return theme?.colors || DEFAULT_THEME;
    },

    /**
     * Get current preset name
     */
    getCurrentPreset() {
        const theme = this.getStoredTheme();
        return theme?.preset || 'dark-blue';
    }
};

// Initialize theme on DOM load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Also try to apply immediately for faster loading
if (document.readyState === 'loading') {
    // DOM not ready, wait for it
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    // DOM already ready
    ThemeManager.init();
}
