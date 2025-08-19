class CalendarNavigator {
    constructor() {
        this.currentDate = new Date();
        this.level = "day"; // day, week, month, year
        this.currentWeekStart = null;
        this.currentMonth = null;
        this.currentYear = null;
        this.notes = new Map(); // Store notes by date key
        this.longPressTimer = null;
        this.longPressPosition = { x: 0, y: 0 };
        this.selectedShade = 1;
        this.mediaRecorder = null;
        this.audioChunks = [];

        this.container = document.getElementById("container");
        this.headerTitle = document.getElementById("headerTitle");
        this.pageContent = document.getElementById("pageContent");

        this.setupTouchHandlers();
        this.setupFullscreen();
        this.setupIndexedDB();
        this.setupChatInput();
        this.render();
    }

    setupTouchHandlers() {
        let startX, startY, startTime;
        let isLongPress = false;

        this.container.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            
            // Long press detection for day view
            if (this.level === "day") {
                isLongPress = false;
                this.longPressPosition = { x: startX, y: startY };
                this.longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    this.openChatInput();
                }, 500); // 500ms for long press
            }
        });
        
        this.container.addEventListener("touchmove", () => {
            // Cancel long press if user moves
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });

        this.container.addEventListener("touchend", (e) => {
            // Clear long press timer
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            if (isLongPress) {
                isLongPress = false;
                return; // Don't process swipes after long press
            }
            
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = Date.now() - startTime;

            // Minimum swipe distance and maximum time
            if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50)
                return;
            if (deltaTime > 300) return;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }

            startX = startY = null;
        });
    }

    handleSwipeUp() {
        this.navigateForward();
    }

    handleSwipeDown() {
        this.navigateBackward();
    }

    handleSwipeLeft() {
        this.zoomOut();
    }

    handleSwipeRight() {
        this.zoomIn();
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
                this.currentDate = new Date(this.currentWeekStart);
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
        switch (this.level) {
            case "day":
                this.renderDay();
                break;
            case "week":
                this.renderWeek();
                break;
            case "month":
                this.renderMonth();
                break;
            case "year":
                this.renderYear();
                break;
        }
    }

    renderDay() {
        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        this.headerTitle.textContent = ``;

        this.pageContent.innerHTML = `
        <div class="day-view">
            <div class="day-number">${this.currentDate.getDate()}</div>
            <div class="day-name">${dayNames[this.currentDate.getDay()]}</div>
            <div class="month-year">${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}</div>
        </div>
    `;
        
        // Render notes for this day
        this.renderNotes();
    }

    renderWeek() {
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        this.headerTitle.textContent = `${this.currentWeekStart.getFullYear()} ${monthNames[this.currentWeekStart.getMonth()]}`;

        let weekHtml =
            '<div class="week-view"><div class="week-grid">';

        for (let i = 0; i < 7; i++) {
            const day = new Date(this.currentWeekStart);
            day.setDate(day.getDate() + i);
            const isToday = this.isSameDay(day, new Date());
            const isCurrent = this.isSameDay(day, this.currentDate);

            weekHtml += `<div class="week-day ${isToday || isCurrent ? "current" : ""}" data-date="${day.toISOString()}">
            ${day.getDate()}
        </div>`;
        }

        weekHtml += "</div></div>";
        this.pageContent.innerHTML = weekHtml;
        
        // Add click handlers for week days
        this.pageContent.querySelectorAll('.week-day').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = new Date(e.target.dataset.date);
                this.jumpToDate(date);
            });
        });
    }

    renderMonth() {
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        this.headerTitle.textContent = `${this.currentMonth.getFullYear()} ${monthNames[this.currentMonth.getMonth()]}`;

        const firstDay = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth(),
            1,
        );
        const lastDay = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            0,
        );
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let monthHtml =
            '<div class="month-view"><div class="month-grid">';

        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const isCurrentMonth =
                day.getMonth() === this.currentMonth.getMonth();
            const isToday = this.isSameDay(day, new Date());

            monthHtml += `<div class="month-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "current" : ""}" data-date="${day.toISOString()}">
            ${day.getDate()}
        </div>`;
        }

        monthHtml += "</div></div>";
        this.pageContent.innerHTML = monthHtml;
        
        // Add click handlers for month days
        this.pageContent.querySelectorAll('.month-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = new Date(e.target.dataset.date);
                this.jumpToDate(date);
            });
        });
    }

    renderYear() {
        this.headerTitle.textContent = `${this.currentYear.getFullYear()}`;

        let yearHtml =
            '<div class="year-view"><div class="year-grid">';

        const year = this.currentYear.getFullYear();
        const today = new Date();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;

        for (let i = 0; i < daysInYear; i++) {
            const day = new Date(year, 0, 1 + i);
            const isToday = this.isSameDay(day, today);

            yearHtml += `<div class="year-day ${isToday ? "current" : ""}" data-date="${day.toISOString()}" title="${day.toDateString()}"></div>`;
        }

        yearHtml += "</div></div>";
        this.pageContent.innerHTML = yearHtml;
        
        // Add click handlers for year days
        this.pageContent.querySelectorAll('.year-day').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = new Date(e.target.dataset.date);
                this.jumpToDate(date);
            });
        });
    }

    isSameDay(date1, date2) {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
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
            } else {
                document.exitFullscreen();
                toggle.textContent = "+";
            }
        });
        
        document.addEventListener("fullscreenchange", () => {
            toggle.textContent = document.fullscreenElement ? "-" : "+";
        });
    }
    
    setupIndexedDB() {
        const request = indexedDB.open("JournalDB", 1);
        
        request.onerror = () => {
            console.error("Failed to open IndexedDB");
        };
        
        request.onsuccess = (e) => {
            this.db = e.target.result;
            this.loadNotes();
        };
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("notes")) {
                const notesStore = db.createObjectStore("notes", { keyPath: "id" });
                notesStore.createIndex("date", "date", { unique: false });
            }
        };
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
                    <textarea class="chat-input" placeholder="Write a note..." rows="1"></textarea>
                    <div class="chat-buttons">
                        <button class="chat-button camera">📷</button>
                        <button class="chat-button audio">🎤</button>
                        <button class="chat-button send">→</button>
                    </div>
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
                this.processImage(file);
            }
        });
        
        // Audio recording
        const audioButton = chatOverlay.querySelector(".audio");
        audioButton.addEventListener("click", () => {
            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                this.stopRecording();
            } else {
                this.startRecording();
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
    
    openChatInput() {
        this.chatOverlay.classList.add("active");
        this.chatOverlay.querySelector(".chat-input").focus();
    }
    
    closeChatInput() {
        this.chatOverlay.classList.remove("active");
        this.chatOverlay.querySelector(".chat-input").value = "";
        this.chatOverlay.querySelector(".chat-input").style.height = "auto";
    }
    
    processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create low-res version
                const canvas = document.createElement("canvas");
                const size = 64; // Small size for storage
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                
                // Draw and pixelate
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, size, size);
                
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                this.createNote(dataUrl, "image");
                this.closeChatInput();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
            x: this.longPressPosition.x,
            y: this.longPressPosition.y,
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
        if (!this.db) return;
        
        const transaction = this.db.transaction(["notes"], "readwrite");
        const store = transaction.objectStore("notes");
        store.add(note);
    }
    
    loadNotes() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(["notes"], "readonly");
        const store = transaction.objectStore("notes");
        const request = store.getAll();
        
        request.onsuccess = () => {
            const notes = request.result;
            this.notes.clear();
            
            notes.forEach(note => {
                if (!this.notes.has(note.date)) {
                    this.notes.set(note.date, []);
                }
                this.notes.get(note.date).push(note);
            });
            
            this.renderNotes();
        };
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
                noteEl.addEventListener("click", () => this.showNoteDetail(note));
                this.container.appendChild(noteEl);
            } else if (note.type === "image") {
                const noteEl = document.createElement("div");
                noteEl.className = "photo-note";
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                noteEl.innerHTML = `<img src="${note.content}" alt="Photo">`;
                noteEl.addEventListener("click", () => this.showNoteDetail(note));
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
                noteEl.addEventListener("click", () => this.showNoteDetail(note));
                this.container.appendChild(noteEl);
            } else if (note.type === "verse") {
                const noteEl = document.createElement("div");
                noteEl.className = `verse-note ${note.read ? 'read' : 'unread'}`;
                noteEl.style.left = `${note.x}px`;
                noteEl.style.top = `${note.y}px`;
                noteEl.innerHTML = `
                    <div class="verse-content">${note.title}</div>
                `;
                noteEl.addEventListener("click", () => {
                    this.markVerseAsRead(note);
                    this.showNoteDetail(note);
                });
                this.container.appendChild(noteEl);
            }
        });
        
        // Add daily verse if not already present
        this.addDailyVerse(dateKey);
    }
    
    showNoteDetail(note) {
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
        } else if (note.type === "image") {
            body.innerHTML = `
                <img src="${note.content}" class="note-detail-image">
            `;
        } else if (note.type === "audio") {
            body.innerHTML = `
                <h3>${note.title}</h3>
                <audio controls style="width: 100%; margin-top: 20px;">
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
    
    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onload = () => {
                    this.createNote(reader.result, "audio");
                    this.closeChatInput();
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            this.audioButton.textContent = "⏹";
            this.audioButton.style.background = "rgba(255, 0, 0, 0.3)";
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
            this.audioButton.textContent = "🎤";
            this.audioButton.style.background = "rgba(255, 255, 255, 0.1)";
        }
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
        if (this.db) {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            store.put(note);
        }
        
        // Update visual state
        const verseEl = document.querySelector(".verse-note");
        if (verseEl) {
            verseEl.classList.remove("unread");
            verseEl.classList.add("read");
        }
    }
}

// Initialize the app
new CalendarNavigator();