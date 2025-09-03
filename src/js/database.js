// src/js/database.js
// IndexedDB operations for journal notes

class Database {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.readyCallbacks = [];
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("JournalDB", 1);
            
            request.onerror = () => {
                console.error("Failed to open IndexedDB");
                reject(new Error("Failed to open IndexedDB"));
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.isReady = true;
                
                // Execute any pending callbacks
                this.readyCallbacks.forEach(callback => callback());
                this.readyCallbacks = [];
                
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("notes")) {
                    const notesStore = db.createObjectStore("notes", { keyPath: "id" });
                    notesStore.createIndex("date", "date", { unique: false });
                }
            };
        });
    }

    onReady(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }

    saveNote(note) {
        if (!this.db) return Promise.reject(new Error("Database not ready"));
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            const request = store.add(note);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    updateNote(note) {
        if (!this.db) return Promise.reject(new Error("Database not ready"));
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            const request = store.put(note);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    deleteNote(noteId) {
        if (!this.db) return Promise.reject(new Error("Database not ready"));
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            const request = store.delete(noteId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    loadAllNotes() {
        if (!this.db) return Promise.reject(new Error("Database not ready"));
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readonly");
            const store = transaction.objectStore("notes");
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export default Database;