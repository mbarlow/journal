export class SettingsLoader {
    constructor() {
        this.settings = null;
        this.cssVariables = new Map();
    }
    
    async load() {
        try {
            const response = await fetch('/settings.json');
            this.settings = await response.json();
            this.applyTheme();
            this.applyTypography();
            this.applyAnimations();
            return this.settings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }
    
    applyTheme() {
        const root = document.documentElement;
        const colors = this.settings.theme.colors;
        
        root.style.setProperty('--color-bg', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-tertiary', colors.tertiary);
        root.style.setProperty('--color-accent', colors.accent);
        root.style.setProperty('--color-border', colors.border);
        root.style.setProperty('--color-shadow', colors.shadow);
        root.style.setProperty('--color-error', colors.error);
        root.style.setProperty('--color-success', colors.success);
        root.style.setProperty('--color-warning', colors.warning);
    }
    
    applyTypography() {
        const root = document.documentElement;
        const fonts = this.settings.typography;
        
        root.style.setProperty('--font-primary', fonts.fontFamily.primary);
        root.style.setProperty('--font-mono', fonts.fontFamily.mono);
        
        Object.entries(fonts.fontSize).forEach(([key, value]) => {
            root.style.setProperty(`--font-${key}`, value);
        });
    }
    
    applyAnimations() {
        const root = document.documentElement;
        const animations = this.settings.animations;
        
        Object.entries(animations.duration).forEach(([key, value]) => {
            root.style.setProperty(`--duration-${key}`, value);
        });
        
        Object.entries(animations.easing).forEach(([key, value]) => {
            root.style.setProperty(`--ease-${key}`, value);
        });
    }
    
    getSetting(path) {
        const keys = path.split('.');
        let value = this.settings;
        
        for (const key of keys) {
            value = value?.[key];
            if (value === undefined) return null;
        }
        
        return value;
    }
    
    updateSetting(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.settings;
        
        for (const key of keys) {
            if (!target[key]) target[key] = {};
            target = target[key];
        }
        
        target[lastKey] = value;
        this.saveTolocalStorage();
        
        if (path.startsWith('theme')) this.applyTheme();
        if (path.startsWith('typography')) this.applyTypography();
        if (path.startsWith('animations')) this.applyAnimations();
    }
    
    saveTolocalStorage() {
        try {
            localStorage.setItem('cosmicJournalSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('cosmicJournalSettings');
            if (saved) {
                this.settings = JSON.parse(saved);
                return true;
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
        return false;
    }
    
    getDefaultSettings() {
        return {
            theme: {
                name: 'cosmic-dark',
                colors: {
                    background: '#1a1a1a',
                    primary: 'rgba(255, 255, 255, 0.95)'
                }
            },
            gestures: {
                swipeThreshold: 50,
                longPressDelay: 500,
                doubleTapDelay: 300
            }
        };
    }
}

export default SettingsLoader;