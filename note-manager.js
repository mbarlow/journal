// note-manager.js
// Note CRUD operations and rendering

class NoteManager {
    constructor(database) {
        this.database = database;
        this.notes = new Map();
        this.isDragging = false;
        this.draggedNote = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragMode = false;
    }

    async loadNotes() {
        try {
            const notes = await this.database.loadAllNotes();
            this.notes.clear();
            
            notes.forEach(note => {
                if (!this.notes.has(note.date)) {
                    this.notes.set(note.date, []);
                }
                this.notes.get(note.date).push(note);
            });
        } catch (error) {
            console.error("Failed to load notes:", error);
        }
    }

    createNote(currentDate, content, type, shade, position) {
        const dateKey = this.getDateKey(currentDate);
        const id = `${dateKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate title from content hash
        const title = this.generateTitle(content);
        
        const note = {
            id,
            date: dateKey,
            content,
            type,
            title,
            shade,
            x: position?.x || window.innerWidth / 2,
            y: position?.y || window.innerHeight / 2,
            timestamp: Date.now()
        };
        
        // Add to memory
        if (!this.notes.has(dateKey)) {
            this.notes.set(dateKey, []);
        }
        this.notes.get(dateKey).push(note);
        
        // Save to IndexedDB
        this.saveNote(note);
        
        return note;
    }

    generateTitle(content) {
        // Simple hash function
        let hash = 0;
        const str = typeof content === "string" ? content : "image";
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    }

    saveNote(note) {
        this.database.saveNote(note).catch(error => {
            console.error("Failed to save note:", error);
        });
    }

    updateNotePosition(note, x, y) {
        // Update note object
        note.x = x;
        note.y = y;
        
        // Update in IndexedDB
        this.database.updateNote(note).catch(error => {
            console.error("Failed to update note position:", error);
        });
    }

    deleteNote(currentDate, note) {
        const dateKey = this.getDateKey(currentDate);
        const dayNotes = this.notes.get(dateKey);
        
        if (dayNotes) {
            const index = dayNotes.findIndex(n => n.id === note.id);
            if (index !== -1) {
                dayNotes.splice(index, 1);
            }
        }
        
        // Delete from IndexedDB
        this.database.deleteNote(note.id).catch(error => {
            console.error("Failed to delete note:", error);
        });
    }

    markVerseAsRead(note) {
        note.read = true;
        
        // Update in IndexedDB
        this.database.updateNote(note).catch(error => {
            console.error("Failed to update verse:", error);
        });
        
        // Update visual state
        const verseEl = document.querySelector(".verse-note");
        if (verseEl) {
            verseEl.classList.remove("unread");
            verseEl.classList.add("read");
        }
    }

    renderNotes(container, currentDate, level, callbacks) {
        // Always clear notes from DOM first
        document.querySelectorAll(".sticky-note, .photo-note, .audio-note, .verse-note").forEach(el => el.remove());
        
        if (level !== "day") return;
        
        const dateKey = this.getDateKey(currentDate);
        const dayNotes = this.notes.get(dateKey) || [];
        
        dayNotes.forEach(note => {
            if (note.type === "text") {
                const noteEl = document.createElement("div");
                noteEl.className = `sticky-note shade-${note.shade}`;
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                noteEl.innerHTML = `
                    <div class="sticky-note-title">${note.title}</div>
                    <div class="sticky-note-preview">${note.content}</div>
                `;
                noteEl.addEventListener("click", (e) => {
                    if (!this.isDragging && callbacks.onNoteClick) {
                        callbacks.onNoteClick(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note, callbacks);
                container.appendChild(noteEl);
            } else if (note.type === "image") {
                const noteEl = document.createElement("div");
                noteEl.className = "photo-note";
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                
                // Handle both old and new image format
                let thumbnailSrc;
                try {
                    const imageData = JSON.parse(note.content);
                    thumbnailSrc = imageData.thumbnail;
                } catch {
                    // Old format - use content as is
                    thumbnailSrc = note.content;
                }
                
                noteEl.innerHTML = `<img src="${thumbnailSrc}" alt="Photo">`;
                noteEl.addEventListener("click", (e) => {
                    if (!this.isDragging && callbacks.onImageClick) {
                        callbacks.onImageClick(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note, callbacks);
                container.appendChild(noteEl);
            } else if (note.type === "audio") {
                const noteEl = document.createElement("div");
                noteEl.className = "audio-note";
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                noteEl.innerHTML = `
                    <div class="audio-note-icon">🎵</div>
                    <div class="audio-note-title">${note.title}</div>
                `;
                noteEl.addEventListener("click", (e) => {
                    if (!this.isDragging && callbacks.onNoteClick) {
                        callbacks.onNoteClick(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note, callbacks);
                container.appendChild(noteEl);
            } else if (note.type === "verse") {
                const noteEl = document.createElement("div");
                noteEl.className = `verse-note ${note.read ? 'read' : 'unread'}`;
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                noteEl.innerHTML = `
                    <div class="verse-content">${note.title}</div>
                `;
                noteEl.addEventListener("click", (e) => {
                    if (!this.isDragging) {
                        this.markVerseAsRead(note);
                        if (callbacks.onNoteClick) {
                            callbacks.onNoteClick(note);
                        }
                    }
                });
                this.setupNoteDragHandlers(noteEl, note, callbacks);
                container.appendChild(noteEl);
            }
        });
    }

    setupNoteDragHandlers(noteEl, note, callbacks) {
        let longPressTimer = null;
        let startX, startY;
        let startTime;
        
        noteEl.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            
            // Calculate offset for smooth dragging
            const rect = noteEl.getBoundingClientRect();
            this.dragOffset.x = startX - rect.left;
            this.dragOffset.y = startY - rect.top;
            
            longPressTimer = setTimeout(() => {
                this.startNoteDrag(noteEl, note, startX, startY, callbacks);
            }, 500);
        });
        
        noteEl.addEventListener("touchmove", (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (this.isDragging && this.draggedNote === note) {
                e.preventDefault();
                const touch = e.touches[0];
                const newX = touch.clientX - this.dragOffset.x;
                const newY = touch.clientY - this.dragOffset.y;
                
                noteEl.style.left = `${newX}px`;
                noteEl.style.top = `${newY}px`;
                
                // Check if over recycle bin
                this.checkRecycleBinHover(touch.clientX, touch.clientY);
            }
        });
        
        noteEl.addEventListener("touchend", (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (this.isDragging && this.draggedNote === note) {
                const touch = e.changedTouches[0];
                this.endNoteDrag(noteEl, note, touch.clientX, touch.clientY, callbacks);
            }
        });
    }

    startNoteDrag(noteEl, note, x, y, callbacks) {
        this.isDragging = true;
        this.draggedNote = note;
        noteEl.classList.add("dragging");
        
        // Show recycle bin
        this.showRecycleBin();
        
        // Prevent other touch events during drag
        document.body.style.touchAction = "none";
        
        // Prevent keyboard from appearing during drag
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }
        
        // Disable keyboard handling during drag
        this.dragMode = true;
        
        if (callbacks.onDragStart) {
            callbacks.onDragStart();
        }
    }

    endNoteDrag(noteEl, note, x, y, callbacks) {
        this.isDragging = false;
        this.draggedNote = null;
        noteEl.classList.remove("dragging");
        
        // Check if dropped on recycle bin
        if (this.isOverRecycleBin(x, y)) {
            if (callbacks.onDeleteNote) {
                callbacks.onDeleteNote(note);
            }
        } else {
            // Update note position
            const newX = parseInt(noteEl.style.left);
            const newY = parseInt(noteEl.style.top);
            this.updateNotePosition(note, newX, newY);
        }
        
        // Hide recycle bin
        this.hideRecycleBin();
        
        // Re-enable touch events
        document.body.style.touchAction = "auto";
        
        // Re-enable keyboard handling
        this.dragMode = false;
        
        if (callbacks.onDragEnd) {
            callbacks.onDragEnd();
        }
    }

    showRecycleBin() {
        let recycleBin = document.getElementById("recycleBin");
        if (!recycleBin) {
            recycleBin = document.createElement("div");
            recycleBin.id = "recycleBin";
            recycleBin.className = "recycle-bin";
            recycleBin.innerHTML = `
                <div class="recycle-bin-icon">🗑️</div>
                <div class="recycle-bin-text">Drop to delete</div>
            `;
            document.body.appendChild(recycleBin);
        }
        recycleBin.classList.add("visible");
    }

    hideRecycleBin() {
        const recycleBin = document.getElementById("recycleBin");
        if (recycleBin) {
            recycleBin.classList.remove("visible", "hover");
        }
    }

    checkRecycleBinHover(x, y) {
        const recycleBin = document.getElementById("recycleBin");
        if (recycleBin && this.isOverRecycleBin(x, y)) {
            recycleBin.classList.add("hover");
        } else if (recycleBin) {
            recycleBin.classList.remove("hover");
        }
    }

    isOverRecycleBin(x, y) {
        const recycleBin = document.getElementById("recycleBin");
        if (!recycleBin) return false;
        
        const rect = recycleBin.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    getNotesForDate(date) {
        const dateKey = this.getDateKey(date);
        return this.notes.get(dateKey) || [];
    }
}

export default NoteManager;