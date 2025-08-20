import { SettingsLoader } from './config/settings-loader.js';
import { SwipeHandler } from './navigation/swipe-handler.js';
import { DateNavigator } from './navigation/date-navigator.js';
import { ViewRenderer } from './navigation/view-renderer.js';
import { MenuController } from './radial-menu/menu-controller.js';
import { GestureTracker } from './radial-menu/gesture-tracker.js';
import { ActionFactory } from './radial-menu/action-factory.js';
import { ContentManager } from './content/content-manager.js';
import { DragController } from './content/drag-controller.js';
import { DBManager } from './storage/db-manager.js';
import { formatDate, debounce, supportsIndexedDB } from './utils/helpers.js';
import { ERROR_MESSAGES } from './utils/constants.js';

class CosmicJournalApp {
    constructor() {
        this.isInitialized = false;
        this.isLoading = false;
        this.currentContent = [];
        
        this.elements = {
            app: document.getElementById('app'),
            dateHeader: document.getElementById('date-header'),
            currentDate: document.getElementById('current-date'),
            clock: document.getElementById('clock'),
            contentArea: document.getElementById('content-area'),
            viewContainer: document.getElementById('view-container'),
            radialMenu: document.getElementById('radial-menu'),
            trashZone: document.getElementById('trash-zone')
        };
        
        this.components = {};
        this.autoSaveTimer = null;
    }
    
    async init() {
        try {
            if (!this.checkBrowserSupport()) {
                throw new Error(ERROR_MESSAGES.UNSUPPORTED_BROWSER);
            }
            
            await this.initializeComponents();
            this.setupEventListeners();
            this.startClock();
            this.startAutoSave();
            
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('Cosmic Journal initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleError(error);
        }
    }
    
    checkBrowserSupport() {
        return supportsIndexedDB() && 'addEventListener' in window && 'querySelector' in document;
    }
    
    async initializeComponents() {
        this.components.settings = new SettingsLoader();
        await this.components.settings.load();
        
        this.components.storage = new DBManager();
        await this.components.storage.init();
        
        this.components.dateNavigator = new DateNavigator();
        this.components.viewRenderer = new ViewRenderer(this.elements.viewContainer);
        this.components.dragController = new DragController(this.elements.contentArea);
        
        this.components.contentManager = new ContentManager(
            this.elements.viewContainer,
            this.components.storage,
            {
                onItemCreate: this.handleItemCreate.bind(this),
                onItemUpdate: this.handleItemUpdate.bind(this),
                onItemDelete: this.handleItemDelete.bind(this)
            }
        );
        
        this.components.contentManager.setDragController(this.components.dragController);
        
        this.components.actionFactory = new ActionFactory();
        
        this.components.radialMenu = new MenuController(
            this.elements.radialMenu,
            {
                ...this.components.settings.getSetting('radialMenu'),
                onActionSelect: this.handleActionSelect.bind(this)
            }
        );
        
        this.components.gestureTracker = new GestureTracker(
            this.elements.contentArea,
            {
                longPressDelay: this.components.settings.getSetting('gestures.longPressDelay'),
                dragThreshold: this.components.settings.getSetting('gestures.dragThreshold'),
                onLongPressStart: this.handleLongPressStart.bind(this),
                onLongPressMove: this.handleLongPressMove.bind(this),
                onLongPressEnd: this.handleLongPressEnd.bind(this)
            }
        );
        
        this.components.swipeHandler = new SwipeHandler(
            this.elements.contentArea,
            {
                threshold: this.components.settings.getSetting('gestures.swipeThreshold'),
                onSwipeUp: () => this.navigateTime('up'),
                onSwipeDown: () => this.navigateTime('down'),
                onSwipeLeft: () => this.navigateZoom('out'),
                onSwipeRight: () => this.navigateZoom('in'),
                onPinchIn: () => this.navigateZoom('in'),
                onPinchOut: () => this.navigateZoom('out'),
                onDoubleTap: () => this.goToToday()
            }
        );
        
        this.components.dateNavigator.setCallbacks({
            onDateChange: this.handleDateChange.bind(this),
            onViewChange: this.handleViewChange.bind(this)
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', debounce(this.handleResize.bind(this), 250));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        this.elements.currentDate.addEventListener('click', this.showDatePicker.bind(this));
        
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }
    
    async loadInitialData() {
        const lastDate = await this.components.storage.getSetting('lastDate');
        const lastViewLevel = await this.components.storage.getSetting('lastViewLevel');
        
        if (lastDate) {
            this.components.dateNavigator.goToDate(new Date(lastDate));
        }
        
        if (lastViewLevel) {
            this.components.dateNavigator.viewLevel = lastViewLevel;
        }
        
        await this.refreshContent();
        this.updateDateDisplay();
    }
    
    async refreshContent() {
        try {
            this.isLoading = true;
            
            const dateKey = this.components.dateNavigator.getDateKey();
            this.currentContent = await this.components.contentManager.loadContent(
                this.components.dateNavigator.currentDate
            );
            
            this.renderCurrentView();
            
        } catch (error) {
            console.error('Failed to refresh content:', error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    renderCurrentView() {
        const viewLevel = this.components.dateNavigator.viewLevel;
        const currentDate = this.components.dateNavigator.currentDate;
        
        let dates;
        switch (viewLevel) {
            case 'week':
                dates = this.components.dateNavigator.getWeekDates();
                break;
            case 'month':
                dates = this.components.dateNavigator.getMonthDates();
                break;
            case 'year':
                dates = this.components.dateNavigator.getYearMonths();
                break;
            default:
                dates = currentDate;
        }
        
        this.components.viewRenderer.render(viewLevel, dates, this.currentContent);
        this.setupViewInteractions();
    }
    
    setupViewInteractions() {
        const viewLevel = this.components.dateNavigator.viewLevel;
        
        if (viewLevel !== 'day') {
            const clickableElements = this.elements.viewContainer.querySelectorAll('[data-date], [data-month]');
            
            clickableElements.forEach(element => {
                element.addEventListener('click', (e) => {
                    const date = element.dataset.date || element.dataset.month;
                    if (date) {
                        this.jumpToDate(date);
                    }
                });
            });
        }
    }
    
    async jumpToDate(dateString) {
        try {
            const date = new Date(dateString);
            this.components.dateNavigator.goToDate(date);
            
            if (this.components.dateNavigator.viewLevel !== 'day') {
                this.components.dateNavigator.zoomLevel('in');
            }
            
            await this.refreshContent();
            this.updateDateDisplay();
            
        } catch (error) {
            console.error('Failed to jump to date:', error);
        }
    }
    
    async navigateTime(direction) {
        this.components.dateNavigator.navigatePeriod(direction);
        this.components.viewRenderer.applyTransition(direction);
        
        await this.refreshContent();
        this.updateDateDisplay();
        this.saveState();
    }
    
    async navigateZoom(direction) {
        const oldLevel = this.components.dateNavigator.viewLevel;
        this.components.dateNavigator.zoomLevel(direction);
        
        if (oldLevel !== this.components.dateNavigator.viewLevel) {
            this.components.viewRenderer.applyTransition(direction);
            this.renderCurrentView();
            this.updateDateDisplay();
            this.saveState();
        }
    }
    
    async goToToday() {
        this.components.dateNavigator.goToToday();
        this.components.viewRenderer.applyTransition('today');
        
        await this.refreshContent();
        this.updateDateDisplay();
        this.saveState();
    }
    
    handleDateChange(newDate, oldDate, direction) {
        this.updateDateDisplay();
        this.saveState();
    }
    
    handleViewChange(newLevel, oldLevel, direction) {
        this.renderCurrentView();
        this.updateDateDisplay();
        this.saveState();
    }
    
    handleLongPressStart(x, y, event) {
        if (this.components.dateNavigator.viewLevel === 'day') {
            this.components.radialMenu.show(x, y);
        }
    }
    
    handleLongPressMove(x, y, event) {
        if (this.components.radialMenu.isActive) {
            this.components.radialMenu.updatePosition(x, y);
        }
    }
    
    handleLongPressEnd(x, y, event) {
        if (this.components.radialMenu.isActive) {
            this.components.radialMenu.confirmSelection();
        }
    }
    
    async handleActionSelect(action) {
        try {
            const date = this.components.dateNavigator.currentDate;
            const dateKey = this.components.dateNavigator.getDateKey();
            
            const result = await this.components.actionFactory.create(
                action.id,
                window.innerWidth / 2,
                window.innerHeight / 2,
                { date: dateKey }
            );
            
            if (result) {
                await this.components.contentManager.addItem(result.note);
                this.currentContent.push(result.note);
            }
            
        } catch (error) {
            console.error('Failed to handle action:', error);
        }
    }
    
    handleItemCreate(item) {
        console.log('Item created:', item);
    }
    
    handleItemUpdate(item) {
        console.log('Item updated:', item);
        this.scheduleAutoSave();
    }
    
    handleItemDelete(item) {
        console.log('Item deleted:', item);
        this.currentContent = this.currentContent.filter(i => i.id !== item.id);
    }
    
    updateDateDisplay() {
        const viewLevel = this.components.dateNavigator.viewLevel;
        let displayText;
        
        switch (viewLevel) {
            case 'day':
                displayText = this.components.dateNavigator.formatDate('full');
                break;
            case 'week':
                displayText = `Week ${this.components.dateNavigator.getWeekNumber()}, ${this.components.dateNavigator.formatDate('year')}`;
                break;
            case 'month':
                displayText = this.components.dateNavigator.formatDate('month');
                break;
            case 'year':
                displayText = this.components.dateNavigator.formatDate('year');
                break;
        }
        
        this.elements.currentDate.textContent = displayText;
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            this.elements.clock.textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    startAutoSave() {
        const interval = this.components.settings.getSetting('features.autoSaveInterval') || 5000;
        
        this.autoSaveTimer = setInterval(() => {
            this.saveState();
        }, interval);
    }
    
    scheduleAutoSave() {
        clearTimeout(this.autoSaveDebounce);
        this.autoSaveDebounce = setTimeout(() => {
            this.saveState();
        }, 1000);
    }
    
    async saveState() {
        try {
            await this.components.storage.saveSetting('lastDate', this.components.dateNavigator.currentDate.toISOString());
            await this.components.storage.saveSetting('lastViewLevel', this.components.dateNavigator.viewLevel);
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    handleResize() {
        this.renderCurrentView();
    }
    
    handleBeforeUnload() {
        this.saveState();
        
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
    
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            this.refreshContent();
        }
    }
    
    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
            return;
        }
        
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.navigateTime('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateTime('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.navigateZoom('out');
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.navigateZoom('in');
                break;
            case ' ':
                event.preventDefault();
                this.goToToday();
                break;
            case 'Escape':
                if (this.components.radialMenu.isActive) {
                    this.components.radialMenu.hide();
                }
                break;
        }
    }
    
    showDatePicker() {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = this.components.dateNavigator.currentDate.toISOString().split('T')[0];
        
        input.addEventListener('change', () => {
            if (input.value) {
                this.jumpToDate(input.value);
            }
        });
        
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        
        document.body.appendChild(input);
        input.showPicker?.() || input.click();
        
        setTimeout(() => {
            document.body.removeChild(input);
        }, 1000);
    }
    
    handleError(error) {
        console.error('App error:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-error);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    async exportData() {
        try {
            const data = await this.components.storage.exportData();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cosmic-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Failed to export data:', error);
            this.handleError(error);
        }
    }
    
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await this.components.storage.importData(data);
            await this.refreshContent();
            
            console.log('Data imported successfully');
            
        } catch (error) {
            console.error('Failed to import data:', error);
            this.handleError(error);
        }
    }
}

const app = new CosmicJournalApp();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

window.cosmicJournal = app;

export default app;