export const APP_NAME = 'Cosmic Journal';
export const APP_VERSION = '1.0.0';

export const VIEW_LEVELS = ['day', 'week', 'month', 'year'];

export const DEFAULT_SETTINGS = {
    theme: 'cosmic-dark',
    swipeThreshold: 50,
    longPressDelay: 500,
    doubleTapDelay: 300,
    dragThreshold: 10,
    autoSave: true,
    autoSaveInterval: 5000
};

export const CONTENT_TYPES = {
    NOTE: 'note',
    PHOTO: 'photo',
    AUDIO: 'audio',
    VIDEO: 'video',
    TODOS: 'todos',
    TIMER: 'timer',
    EMAIL: 'email',
    THAI: 'thai',
    AI: 'ai'
};

export const ANIMATION_DURATIONS = {
    INSTANT: 0,
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
};

export const DATE_FORMATS = {
    DAY: 'YYYY-MM-DD',
    WEEK: 'YYYY-WXX',
    MONTH: 'YYYY-MM',
    YEAR: 'YYYY'
};

export const STORAGE_KEYS = {
    SETTINGS: 'cosmicJournalSettings',
    THEME: 'cosmicJournalTheme',
    LAST_DATE: 'cosmicJournalLastDate',
    VIEW_LEVEL: 'cosmicJournalViewLevel'
};

export const ERROR_MESSAGES = {
    STORAGE_INIT_FAILED: 'Failed to initialize storage',
    SETTINGS_LOAD_FAILED: 'Failed to load settings',
    CONTENT_SAVE_FAILED: 'Failed to save content',
    CONTENT_LOAD_FAILED: 'Failed to load content',
    UNSUPPORTED_BROWSER: 'Browser not supported'
};

export default {
    APP_NAME,
    APP_VERSION,
    VIEW_LEVELS,
    DEFAULT_SETTINGS,
    CONTENT_TYPES,
    ANIMATION_DURATIONS,
    DATE_FORMATS,
    STORAGE_KEYS,
    ERROR_MESSAGES
};