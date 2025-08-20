export class DBManager {
    constructor() {
        this.dbName = 'CosmicJournalDB';
        this.version = 1;
        this.db = null;
        this.isInitialized = false;
    }
    
    async init() {
        if (this.isInitialized) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }
    
    createStores(db) {
        if (!db.objectStoreNames.contains('items')) {
            const itemStore = db.createObjectStore('items', { keyPath: 'id' });
            itemStore.createIndex('date', 'date', { unique: false });
            itemStore.createIndex('type', 'type', { unique: false });
            itemStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
    }
    
    async saveItem(item) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.put(item);
            
            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(new Error('Failed to save item'));
        });
    }
    
    async getItem(id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get item'));
        });
    }
    
    async getItemsByDate(date) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const index = store.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get items by date'));
        });
    }
    
    async getItemsByType(type) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const index = store.index('type');
            const request = index.getAll(type);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get items by type'));
        });
    }
    
    async getItemsByDateRange(startDate, endDate) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const index = store.index('date');
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get items by date range'));
        });
    }
    
    async getAllItems() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get all items'));
        });
    }
    
    async deleteItem(id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('Failed to delete item'));
        });
    }
    
    async searchItems(query) {
        const items = await this.getAllItems();
        
        const searchTerms = query.toLowerCase().split(' ');
        
        return items.filter(item => {
            const searchableText = [
                item.content,
                item.type,
                item.date
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    
    async saveSetting(key, value) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value, timestamp: Date.now() });
            
            request.onsuccess = () => resolve(value);
            request.onerror = () => reject(new Error('Failed to save setting'));
        });
    }
    
    async getSetting(key) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(new Error('Failed to get setting'));
        });
    }
    
    async cache(key, data, ttl = 3600000) {
        await this.ensureInitialized();
        
        const expiry = Date.now() + ttl;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put({ key, data, expiry });
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(new Error('Failed to cache data'));
        });
    }
    
    async getCache(key) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                
                if (!result) {
                    resolve(null);
                    return;
                }
                
                if (result.expiry < Date.now()) {
                    this.clearCache(key);
                    resolve(null);
                    return;
                }
                
                resolve(result.data);
            };
            request.onerror = () => reject(new Error('Failed to get cached data'));
        });
    }
    
    async clearCache(key = null) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            if (key) {
                const request = store.delete(key);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(new Error('Failed to clear cache item'));
            } else {
                const request = store.clear();
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(new Error('Failed to clear cache'));
            }
        });
    }
    
    async clearExpiredCache() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('expiry');
            const range = IDBKeyRange.upperBound(Date.now());
            const request = index.openCursor(range);
            
            let deleted = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                } else {
                    resolve(deleted);
                }
            };
            
            request.onerror = () => reject(new Error('Failed to clear expired cache'));
        });
    }
    
    async getStorageStats() {
        await this.ensureInitialized();
        
        const [items, settings, cache] = await Promise.all([
            this.getAllItems(),
            this.getAllSettings(),
            this.getAllCache()
        ]);
        
        return {
            items: items.length,
            settings: settings.length,
            cache: cache.length,
            totalSize: this.calculateStorageSize(items, settings, cache)
        };
    }
    
    async getAllSettings() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get all settings'));
        });
    }
    
    async getAllCache() {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('Failed to get all cache'));
        });
    }
    
    calculateStorageSize(items, settings, cache) {
        const data = { items, settings, cache };
        return new Blob([JSON.stringify(data)]).size;
    }
    
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
    }
    
    async exportData() {
        const [items, settings] = await Promise.all([
            this.getAllItems(),
            this.getAllSettings()
        ]);
        
        return {
            version: this.version,
            timestamp: Date.now(),
            items,
            settings
        };
    }
    
    async importData(data) {
        await this.ensureInitialized();
        
        const transaction = this.db.transaction(['items', 'settings'], 'readwrite');
        
        try {
            const itemStore = transaction.objectStore('items');
            const settingStore = transaction.objectStore('settings');
            
            if (data.items) {
                for (const item of data.items) {
                    await new Promise((resolve, reject) => {
                        const request = itemStore.put(item);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(new Error('Failed to import item'));
                    });
                }
            }
            
            if (data.settings) {
                for (const setting of data.settings) {
                    await new Promise((resolve, reject) => {
                        const request = settingStore.put(setting);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(new Error('Failed to import setting'));
                    });
                }
            }
            
            return true;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
    
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

export default DBManager;