// src/js/ui-renderer.js
// UI rendering for different calendar views (day, week, month, year)

class UIRenderer {
    constructor(headerTitle, pageContent) {
        this.headerTitle = headerTitle;
        this.pageContent = pageContent;
    }

    renderDay(currentDate, clockCallback) {
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
            <div class="realtime-clock" id="realtimeClock"></div>
            <div class="day-number">${currentDate.getDate()}</div>
            <div class="day-name">${dayNames[currentDate.getDay()]}</div>
            <div class="month-year">${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}</div>
        </div>
    `;
        
        // Start the clock after rendering
        if (clockCallback) {
            clockCallback();
        }
    }

    renderWeek(currentWeekStart, currentDate, clickCallback, noteManager = null) {
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

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        this.headerTitle.textContent = `${currentWeekStart.getFullYear()} ${monthNames[currentWeekStart.getMonth()]}`;

        // Create single 7-column grid layout
        let weekHtml = '<div class="week-view"><div class="week-main-grid">';
        
        // Create arrays to store media content for each day
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + i);
            const isToday = this.isSameDay(day, new Date());
            const isCurrent = this.isSameDay(day, currentDate);
            
            const dayNotes = noteManager ? noteManager.getNotesForDate(day) : [];
            weekDays.push({
                date: day,
                dayNumber: day.getDate(),
                isToday,
                isCurrent,
                notes: dayNotes
            });
        }

        // Generate each column (day + its media)
        weekDays.forEach(dayData => {
            weekHtml += '<div class="week-column">';
            
            // Media above (text notes)
            const textNotes = dayData.notes.filter(note => note.type === 'text');
            weekHtml += '<div class="week-media-area week-media-top">';
            textNotes.slice(0, 2).forEach(note => {
                const noteData = JSON.stringify({id: note.id, type: note.type});
                weekHtml += `<div class="week-media-square week-media-text" data-note='${noteData}'>📝</div>`;
            });
            weekHtml += '</div>';
            
            // Main day square
            weekHtml += `<div class="week-day ${dayData.isToday || dayData.isCurrent ? "current" : ""}" data-date="${dayData.date.toISOString()}">
                ${dayData.dayNumber}
            </div>`;
            
            // Media below (images and audio)
            const mediaBelow = dayData.notes.filter(note => note.type === 'image' || note.type === 'audio');
            weekHtml += '<div class="week-media-area week-media-bottom">';
            mediaBelow.slice(0, 2).forEach(note => {
                const noteData = JSON.stringify({id: note.id, type: note.type});
                if (note.type === 'image') {
                    let thumbnailSrc = '';
                    try {
                        const imageData = JSON.parse(note.content);
                        thumbnailSrc = imageData.thumbnail;
                    } catch {
                        thumbnailSrc = note.content;
                    }
                    weekHtml += `<div class="week-media-square week-media-image" data-note='${noteData}'><img src="${thumbnailSrc}" alt="Photo" class="week-media-thumbnail"></div>`;
                } else if (note.type === 'audio') {
                    weekHtml += `<div class="week-media-square week-media-audio" data-note='${noteData}'>🎵</div>`;
                }
            });
            weekHtml += '</div>';
            
            weekHtml += '</div>'; // Close week-column
        });

        weekHtml += "</div></div>"; // Close week-main-grid and week-view
        this.pageContent.innerHTML = weekHtml;
        
        // Add click handlers for week days
        this.pageContent.querySelectorAll('.week-day').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = new Date(e.target.dataset.date);
                if (clickCallback) {
                    clickCallback(date);
                }
            });
        });
        
        // Add click handlers for media squares
        this.pageContent.querySelectorAll('.week-media-square[data-note]').forEach(mediaEl => {
            mediaEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const noteData = JSON.parse(e.currentTarget.dataset.note);
                // Find the note and trigger appropriate action
                if (clickCallback && clickCallback.onMediaClick) {
                    clickCallback.onMediaClick(noteData);
                }
            });
        });
    }

    renderMonth(currentMonth, clickCallback, noteManager = null) {
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

        this.headerTitle.textContent = `${currentMonth.getFullYear()} ${monthNames[currentMonth.getMonth()]}`;

        const firstDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1,
        );
        const lastDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
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
                day.getMonth() === currentMonth.getMonth();
            const isToday = this.isSameDay(day, new Date());

            // Get media indicators for this day
            let mediaIndicators = '';
            if (noteManager && isCurrentMonth) {
                const dayNotes = noteManager.getNotesForDate(day);
                if (dayNotes.length > 0) {
                    mediaIndicators = '<div class="media-indicators">';
                    
                    // Track what types we have and their positions
                    const types = {
                        text: { found: false, position: 'top-left' },
                        image: { found: false, position: 'top-right' },
                        audio: { found: false, position: 'bottom-left' },
                        verse: { found: false, position: 'bottom-right' }
                    };
                    
                    dayNotes.forEach(note => {
                        if (types[note.type]) {
                            types[note.type].found = true;
                        }
                    });
                    
                    // Add indicators for each type found
                    Object.entries(types).forEach(([type, config]) => {
                        if (config.found) {
                            mediaIndicators += `<div class="media-dot media-dot-${type} media-dot-${config.position}"></div>`;
                        }
                    });
                    
                    mediaIndicators += '</div>';
                }
            }

            monthHtml += `<div class="month-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "current" : ""}" data-date="${day.toISOString()}">
            ${day.getDate()}
            ${mediaIndicators}
        </div>`;
        }

        monthHtml += "</div></div>";
        this.pageContent.innerHTML = monthHtml;
        
        // Add click handlers for month days
        this.pageContent.querySelectorAll('.month-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = new Date(e.target.dataset.date);
                if (clickCallback) {
                    clickCallback(date);
                }
            });
        });
    }

    renderYear(currentYear, clickCallback) {
        this.headerTitle.textContent = `${currentYear.getFullYear()}`;

        let yearHtml =
            '<div class="year-view"><div class="year-grid">';

        const year = currentYear.getFullYear();
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
                if (clickCallback) {
                    clickCallback(date);
                }
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
}

export default UIRenderer;