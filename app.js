import Database from './database.js';
import TouchHandler from './touch-handler.js';
import UIRenderer from './ui-renderer.js';
import MediaHandler from './media-handler.js';

class CalendarNavigator {
    constructor() {
        this.currentDate = new Date();
        this.level = "day"; // day, week, month, year
        this.currentWeekStart = null;
        this.currentMonth = null;
        this.currentYear = null;
        this.notes = new Map(); // Store notes by date key
        this.selectedShade = 1;
        this.clockInterval = null;
        this.isDragging = false;
        this.draggedNote = null;
        this.dragOffset = { x: 0, y: 0 };

        this.container = document.getElementById("container");
        this.headerTitle = document.getElementById("headerTitle");
        this.pageContent = document.getElementById("pageContent");

        this.database = new Database();
        this.uiRenderer = new UIRenderer(this.headerTitle, this.pageContent);
        this.mediaHandler = new MediaHandler();
        this.init();
    }

    async init() {
        try {
            await this.database.init();
            this.loadNotes();
        } catch (error) {
            console.error("Failed to initialize database:", error);
        }

        this.setupTouchHandler();
        this.setupFullscreen();
        this.setupChatInput();
        this.setupKeyboardHandling();
        this.render();
    }

    setupTouchHandler() {
        this.touchHandler = new TouchHandler(this.container, {
            isInDayView: () => this.level === "day",
            onLongPress: (position) => this.openChatInput(position),
            onSwipeUp: () => this.navigateForward(),
            onSwipeDown: () => this.navigateBackward(),
            onSwipeLeft: () => this.zoomOut(),
            onSwipeRight: () => this.zoomIn()
        });
    }


    navigateForward() {
        switch (this.level) {
            case "day":
                this.currentDate.setDate(
                    this.currentDate.getDate() + 1,
                );
                break;
            case "week":
                this.currentWeekStart.setDate(
                    this.currentWeekStart.getDate() + 7,
                );
                break;
            case "month":
                this.currentMonth.setMonth(
                    this.currentMonth.getMonth() + 1,
                );
                break;
            case "year":
                this.currentYear.setFullYear(
                    this.currentYear.getFullYear() + 1,
                );
                break;
        }
        this.render();
    }

    navigateBackward() {
        switch (this.level) {
            case "day":
                this.currentDate.setDate(
                    this.currentDate.getDate() - 1,
                );
                break;
            case "week":
                this.currentWeekStart.setDate(
                    this.currentWeekStart.getDate() - 7,
                );
                break;
            case "month":
                this.currentMonth.setMonth(
                    this.currentMonth.getMonth() - 1,
                );
                break;
            case "year":
                this.currentYear.setFullYear(
                    this.currentYear.getFullYear() - 1,
                );
                break;
        }
        this.render();
    }

    zoomOut() {
        switch (this.level) {
            case "day":
                this.level = "week";
                this.currentWeekStart = this.getWeekStart(
                    this.currentDate,
                );
                break;
            case "week":
                this.level = "month";
                this.currentMonth = new Date(this.currentWeekStart);
                break;
            case "month":
                this.level = "year";
                this.currentYear = new Date(this.currentMonth);
                break;
        }
        this.render();
    }

    zoomIn() {
        switch (this.level) {
            case "week":
                this.level = "day";
                // Keep the current date instead of jumping to week start
                break;
            case "month":
                this.level = "week";
                this.currentWeekStart = this.getWeekStart(
                    this.currentMonth,
                );
                break;
            case "year":
                this.level = "month";
                this.currentMonth = new Date(this.currentYear);
                break;
        }
        this.render();
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    render() {
        // Stop clock when leaving day view
        if (this.level !== "day") {
            this.stopRealtimeClock();
        }
        
        // Always call renderNotes to clear notes when not in day view
        this.renderNotes();
        
        switch (this.level) {
            case "day":
                this.uiRenderer.renderDay(this.currentDate, () => this.startRealtimeClock());
                break;
            case "week":
                this.uiRenderer.renderWeek(this.currentWeekStart, this.currentDate, (date) => this.jumpToDate(date));
                break;
            case "month":
                this.uiRenderer.renderMonth(this.currentMonth, (date) => this.jumpToDate(date));
                break;
            case "year":
                this.uiRenderer.renderYear(this.currentYear, (date) => this.jumpToDate(date));
                break;
        }
    }




    
    jumpToDate(date) {
        this.currentDate = new Date(date);
        this.level = "day";
        this.render();
    }

    setupFullscreen() {
        const toggle = document.getElementById("fullscreenToggle");
        toggle.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                toggle.textContent = "-";
                toggle.title = "Exit fullscreen";
            } else {
                document.exitFullscreen();
                toggle.textContent = "+";
                toggle.title = "Enter fullscreen";
            }
        });
        
        document.addEventListener("fullscreenchange", () => {
            const isFullscreen = document.fullscreenElement;
            toggle.textContent = isFullscreen ? "-" : "+";
            toggle.title = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
            
            // Make toggle more visible in fullscreen
            if (isFullscreen) {
                toggle.style.background = "rgba(255, 255, 255, 0.2)";
                toggle.style.border = "1px solid rgba(255, 255, 255, 0.3)";
            } else {
                toggle.style.background = "transparent";
                toggle.style.border = "none";
            }
        });
        
        // Add escape key listener
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && document.fullscreenElement) {
                document.exitFullscreen();
            }
        });
        
        // Add double-tap to exit fullscreen on mobile
        let lastTap = 0;
        document.addEventListener("touchend", (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0 && document.fullscreenElement) {
                // Double tap detected in fullscreen - check if tap is in top area
                const tapY = e.changedTouches[0].clientY;
                if (tapY < 100) { // Top 100px of screen
                    document.exitFullscreen();
                }
            }
            lastTap = currentTime;
        });
    }
    
    
    setupChatInput() {
        // Create chat input UI
        const chatOverlay = document.createElement("div");
        chatOverlay.className = "chat-input-overlay";
        chatOverlay.innerHTML = `
            <div class="chat-input-container">
                <div class="shade-selector">
                    <div class="shade-option selected" data-shade="1"></div>
                    <div class="shade-option" data-shade="2"></div>
                    <div class="shade-option" data-shade="3"></div>
                    <div class="shade-option" data-shade="4"></div>
                    <div class="shade-option" data-shade="5"></div>
                </div>
                <div class="chat-input-row">
                    <button class="chat-button camera">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                    </button>
                    <div class="chat-input-wrapper">
                        <textarea class="chat-input" placeholder="Type a message..." rows="1"></textarea>
                        <button class="chat-button send">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                    <button class="chat-button audio">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <input type="file" class="hidden-file-input" accept="image/*" capture="environment">
        `;
        document.body.appendChild(chatOverlay);
        
        // Shade selector
        chatOverlay.querySelectorAll(".shade-option").forEach(option => {
            option.addEventListener("click", () => {
                chatOverlay.querySelectorAll(".shade-option").forEach(o => o.classList.remove("selected"));
                option.classList.add("selected");
                this.selectedShade = parseInt(option.dataset.shade);
            });
        });
        
        // Auto-resize textarea
        const textarea = chatOverlay.querySelector(".chat-input");
        textarea.addEventListener("input", () => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        });
        
        // Send button
        chatOverlay.querySelector(".send").addEventListener("click", () => {
            const text = textarea.value.trim();
            if (text) {
                this.createNote(text, "text");
                this.closeChatInput();
            }
        });
        
        // Camera button
        const fileInput = chatOverlay.querySelector(".hidden-file-input");
        chatOverlay.querySelector(".camera").addEventListener("click", () => {
            fileInput.click();
        });
        
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                this.mediaHandler.processImage(file, (content, type) => {
                    this.createNote(content, type);
                    this.closeChatInput();
                });
            }
        });
        
        // Audio recording
        const audioButton = chatOverlay.querySelector(".audio");
        audioButton.addEventListener("click", () => {
            if (this.mediaHandler.isRecording()) {
                this.mediaHandler.stopRecording(audioButton);
            } else {
                this.mediaHandler.startRecording(
                    audioButton,
                    (content, type) => {
                        this.createNote(content, type);
                        this.closeChatInput();
                    },
                    (message) => {
                        this.mediaHandler.showPermissionMessage(message);
                    }
                );
            }
        });
        
        // Close on background click
        chatOverlay.addEventListener("click", (e) => {
            if (e.target === chatOverlay) {
                this.closeChatInput();
            }
        });
        
        this.chatOverlay = chatOverlay;
        this.audioButton = audioButton;
    }
    
    setupKeyboardHandling() {
        // Store original viewport height
        this.originalViewportHeight = window.innerHeight;
        
        // Handle visual viewport changes for mobile keyboards
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        } else {
            // Fallback for browsers without Visual Viewport API
            window.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        }
        
        // Also listen for input focus events
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('.chat-input') && !this.isDragging) {
                setTimeout(() => this.handleKeyboardShow(), 300);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (e.target.matches('.chat-input')) {
                setTimeout(() => this.handleKeyboardHide(), 300);
            }
        });
    }
    
    handleViewportChange() {
        // Don't handle viewport changes during drag
        if (this.isDragging) {
            return;
        }
        
        const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const heightDiff = this.originalViewportHeight - currentHeight;
        
        if (heightDiff > 150) { // Keyboard is likely open
            this.handleKeyboardShow(heightDiff);
        } else {
            this.handleKeyboardHide();
        }
    }
    
    handleKeyboardShow(keyboardHeight = null) {
        // Don't show keyboard during drag operations
        if (this.dragMode) {
            return;
        }
        
        const chatOverlay = this.chatOverlay;
        if (chatOverlay && chatOverlay.classList.contains('active')) {
            chatOverlay.classList.add('keyboard-open');
            
            // If we have keyboard height, adjust accordingly
            if (keyboardHeight) {
                chatOverlay.style.transform = `translateY(-${keyboardHeight}px)`;
            } else {
                // Fallback: move up by estimated keyboard height
                chatOverlay.style.transform = 'translateY(-280px)';
            }
        }
    }
    
    handleKeyboardHide() {
        const chatOverlay = this.chatOverlay;
        if (chatOverlay) {
            chatOverlay.classList.remove('keyboard-open');
            chatOverlay.style.transform = '';
        }
    }
    
    openChatInput(position = null) {
        this.chatOverlay.classList.add("active");
        this.chatOverlay.querySelector(".chat-input").focus();
        
        // Store the position for note creation
        if (position) {
            this.currentLongPressPosition = position;
        }
    }
    
    closeChatInput() {
        this.chatOverlay.classList.remove("active");
        this.chatOverlay.querySelector(".chat-input").value = "";
        this.chatOverlay.querySelector(".chat-input").style.height = "auto";
    }
    
    
    createNote(content, type) {
        const dateKey = this.getDateKey(this.currentDate);
        const id = `${dateKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate title from content hash
        const title = this.generateTitle(content);
        
        const note = {
            id,
            date: dateKey,
            content,
            type,
            title,
            shade: this.selectedShade,
            x: this.currentLongPressPosition?.x || window.innerWidth / 2,
            y: this.currentLongPressPosition?.y || window.innerHeight / 2,
            timestamp: Date.now()
        };
        
        // Add to memory
        if (!this.notes.has(dateKey)) {
            this.notes.set(dateKey, []);
        }
        this.notes.get(dateKey).push(note);
        
        // Save to IndexedDB
        this.saveNote(note);
        
        // Re-render to show new note
        this.renderNotes();
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
            
            this.renderNotes();
        } catch (error) {
            console.error("Failed to load notes:", error);
        }
    }
    
    renderNotes() {
        // Always clear notes from DOM first
        document.querySelectorAll(".sticky-note, .photo-note, .audio-note, .verse-note").forEach(el => el.remove());
        
        if (this.level !== "day") return;
        
        const dateKey = this.getDateKey(this.currentDate);
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
                    if (!this.isDragging) {
                        this.showNoteDetail(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note);
                this.container.appendChild(noteEl);
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
                    if (!this.isDragging) {
                        this.showImageFullPage(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note);
                this.container.appendChild(noteEl);
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
                    if (!this.isDragging) {
                        this.showNoteDetail(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note);
                this.container.appendChild(noteEl);
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
                        this.showNoteDetail(note);
                    }
                });
                this.setupNoteDragHandlers(noteEl, note);
                this.container.appendChild(noteEl);
            }
        });
        
        // Add daily verse if not already present
        this.addDailyVerse(dateKey);
    }
    
    showNoteDetail(note) {
        // Don't use modal for images - they have their own full-page viewer
        if (note.type === "image") {
            this.showImageFullPage(note);
            return;
        }
        
        // Create modal if it doesn't exist
        let modal = document.querySelector(".note-detail-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "note-detail-modal";
            modal.innerHTML = `
                <div class="note-detail-content">
                    <button class="note-detail-close">×</button>
                    <div class="note-detail-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector(".note-detail-close").addEventListener("click", () => {
                modal.classList.remove("active");
            });
            
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.classList.remove("active");
                }
            });
        }
        
        const body = modal.querySelector(".note-detail-body");
        if (note.type === "text") {
            body.innerHTML = `
                <h3>${note.title}</h3>
                <div class="note-detail-text">${note.content}</div>
            `;
        } else if (note.type === "audio") {
            body.innerHTML = `
                <h3>${note.title}</h3>
                <audio controls style="width: 100%; margin-top: 20px;">
                    <source src="${note.content}" type="audio/webm">
                    <source src="${note.content}" type="audio/wav">
                    Your browser does not support audio playback.
                </audio>
            `;
        } else if (note.type === "verse") {
            body.innerHTML = `
                <h3>${note.reference}</h3>
                <div class="note-detail-text" style="font-style: italic; line-height: 1.6; margin-top: 20px;">${note.content}</div>
            `;
        }
        
        modal.classList.add("active");
    }
    
    showImageFullPage(note) {
        // Get the original image or fallback to content
        let imageSrc;
        try {
            const imageData = JSON.parse(note.content);
            imageSrc = imageData.original;
        } catch {
            // Old format - use content as is
            imageSrc = note.content;
        }
        
        // Create full-page image viewer
        const viewer = document.createElement("div");
        viewer.className = "image-viewer";
        viewer.innerHTML = `
            <button class="image-viewer-close">×</button>
            <div class="image-viewer-container">
                <img src="${imageSrc}" class="image-viewer-img" alt="Photo">
            </div>
        `;
        
        document.body.appendChild(viewer);
        
        // Animate in
        setTimeout(() => {
            viewer.classList.add("active");
        }, 10);
        
        // Close handlers
        const closeViewer = () => {
            viewer.classList.remove("active");
            setTimeout(() => {
                viewer.remove();
            }, 300);
        };
        
        viewer.querySelector(".image-viewer-close").addEventListener("click", closeViewer);
        
        // Close on image click
        viewer.querySelector(".image-viewer-container").addEventListener("click", closeViewer);
        
        // Prevent image click from bubbling
        viewer.querySelector(".image-viewer-img").addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }
    
    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    
    
    
    
    async addDailyVerse(dateKey) {
        // Check if verse already exists for this day
        const dayNotes = this.notes.get(dateKey) || [];
        const existingVerse = dayNotes.find(note => note.type === "verse");
        if (existingVerse) return;
        
        // Get verse for this date
        const verse = await this.getDailyVerse(dateKey);
        
        // Create verse note at a fixed position (top center)
        const verseNote = {
            id: `${dateKey}_verse_${Date.now()}`,
            date: dateKey,
            content: verse.text,
            reference: verse.reference,
            type: "verse",
            title: verse.reference,
            x: window.innerWidth / 2 - 100, // Center horizontally
            y: 150, // Fixed top position
            timestamp: Date.now(),
            read: false
        };
        
        // Add to memory
        if (!this.notes.has(dateKey)) {
            this.notes.set(dateKey, []);
        }
        this.notes.get(dateKey).push(verseNote);
        
        // Save to IndexedDB
        this.saveNote(verseNote);
        
        // Re-render to show verse
        this.renderNotes();
    }
    
    async getDailyVerse(dateKey) {
        // Simple daily verse system using date as seed
        const verses = [
            { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
            { reference: "Psalm 23:1", text: "The Lord is my shepherd, I lack nothing." },
            { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
            { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
            { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
            { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
            { reference: "Matthew 28:20", text: "And surely I am with you always, to the very end of the age." },
            { reference: "Psalm 46:10", text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth." },
            { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
            { reference: "1 Corinthians 13:4", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud." }
        ];
        
        // Use date as seed for consistent daily verse
        const dateNum = parseInt(dateKey.replace(/-/g, ''));
        const index = dateNum % verses.length;
        
        return verses[index];
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
    
    startRealtimeClock() {
        // Clear any existing interval
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        
        const updateClock = () => {
            const clockElement = document.getElementById("realtimeClock");
            if (clockElement && this.level === "day") {
                const now = new Date();
                const timeString = now.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: false 
                });
                clockElement.textContent = timeString;
            }
        };
        
        // Update immediately
        updateClock();
        
        // Update every second
        this.clockInterval = setInterval(updateClock, 1000);
    }
    
    stopRealtimeClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }
    
    setupNoteDragHandlers(noteEl, note) {
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
                this.startNoteDrag(noteEl, note, startX, startY);
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
                this.endNoteDrag(noteEl, note, touch.clientX, touch.clientY);
            }
        });
    }
    
    startNoteDrag(noteEl, note, x, y) {
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
    }
    
    endNoteDrag(noteEl, note, x, y) {
        this.isDragging = false;
        this.draggedNote = null;
        noteEl.classList.remove("dragging");
        
        // Check if dropped on recycle bin
        if (this.isOverRecycleBin(x, y)) {
            this.deleteNote(note);
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
    
    updateNotePosition(note, x, y) {
        // Update note object
        note.x = x;
        note.y = y;
        
        // Update in IndexedDB
        this.database.updateNote(note).catch(error => {
            console.error("Failed to update note position:", error);
        });
    }
    
    deleteNote(note) {
        const dateKey = this.getDateKey(this.currentDate);
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
        
        // Re-render notes
        this.renderNotes();
    }
}

// Initialize the app
new CalendarNavigator();