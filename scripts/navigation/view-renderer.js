export class ViewRenderer {
    constructor(container) {
        this.container = container;
        this.currentView = null;
    }
    
    render(viewLevel, date, content = []) {
        this.currentView = viewLevel;
        this.container.innerHTML = '';
        
        switch(viewLevel) {
            case 'day':
                this.renderDay(date, content);
                break;
            case 'week':
                this.renderWeek(date, content);
                break;
            case 'month':
                this.renderMonth(date, content);
                break;
            case 'year':
                this.renderYear(date, content);
                break;
        }
    }
    
    renderDay(date, content) {
        const dayView = document.createElement('div');
        dayView.className = 'day-view';
        dayView.dataset.date = this.getDateKey(date);
        
        content.forEach(item => {
            const noteElement = this.createNoteElement(item);
            dayView.appendChild(noteElement);
        });
        
        this.container.appendChild(dayView);
    }
    
    renderWeek(dates, content) {
        const weekView = document.createElement('div');
        weekView.className = 'week-view';
        
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        dates.forEach((date, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'week-day';
            
            if (this.isToday(date)) {
                dayElement.classList.add('current');
            }
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            dayHeader.innerHTML = `
                <div class="week-day-name">${dayNames[index]}</div>
                <div class="week-day-number">${date.getDate()}</div>
            `;
            
            const dayContent = document.createElement('div');
            dayContent.className = 'week-day-content';
            
            const dateKey = this.getDateKey(date);
            const dayItems = content.filter(item => item.date === dateKey);
            
            dayItems.slice(0, 5).forEach(item => {
                const preview = document.createElement('div');
                preview.className = 'content-preview';
                preview.textContent = this.getContentPreview(item);
                dayContent.appendChild(preview);
            });
            
            dayElement.appendChild(dayHeader);
            dayElement.appendChild(dayContent);
            dayElement.dataset.date = dateKey;
            
            weekView.appendChild(dayElement);
        });
        
        this.container.appendChild(weekView);
    }
    
    renderMonth(dates, content) {
        const monthView = document.createElement('div');
        monthView.className = 'month-view';
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(name => {
            const header = document.createElement('div');
            header.className = 'month-header';
            header.textContent = name.substring(0, 2);
            monthGrid.appendChild(header);
        });
        
        dates.forEach(({ date, isCurrentMonth }) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'month-day';
            
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            if (this.isToday(date)) {
                dayElement.classList.add('current');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'month-day-number';
            dayNumber.textContent = date.getDate();
            
            const dateKey = this.getDateKey(date);
            const dayItems = content.filter(item => item.date === dateKey);
            
            if (dayItems.length > 0) {
                const dots = document.createElement('div');
                dots.className = 'content-dots';
                
                const dotCount = Math.min(3, Math.ceil(dayItems.length / 3));
                for (let i = 0; i < dotCount; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'content-dot';
                    dots.appendChild(dot);
                }
                
                dayElement.appendChild(dots);
            }
            
            dayElement.appendChild(dayNumber);
            dayElement.dataset.date = dateKey;
            
            monthGrid.appendChild(dayElement);
        });
        
        monthView.appendChild(monthGrid);
        this.container.appendChild(monthView);
    }
    
    renderYear(months, content) {
        const yearView = document.createElement('div');
        yearView.className = 'year-view';
        
        const yearGrid = document.createElement('div');
        yearGrid.className = 'year-grid';
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        months.forEach((month, index) => {
            const monthElement = document.createElement('div');
            monthElement.className = 'year-month';
            
            const monthTitle = document.createElement('div');
            monthTitle.className = 'year-month-title';
            monthTitle.textContent = monthNames[index];
            
            const monthMini = document.createElement('div');
            monthMini.className = 'year-month-mini';
            
            const monthKey = this.getMonthKey(month);
            const monthItems = content.filter(item => item.date.startsWith(monthKey));
            
            const heatmapIntensity = Math.min(1, monthItems.length / 100);
            monthElement.style.background = `rgba(255, 255, 255, ${0.05 + heatmapIntensity * 0.15})`;
            
            monthElement.appendChild(monthTitle);
            monthElement.appendChild(monthMini);
            monthElement.dataset.month = monthKey;
            
            yearGrid.appendChild(monthElement);
        });
        
        yearView.appendChild(yearGrid);
        this.container.appendChild(yearView);
    }
    
    createNoteElement(item) {
        const note = document.createElement('div');
        note.className = `note-item note-shade-${item.shade || 1}`;
        note.dataset.id = item.id;
        note.style.left = `${item.x}px`;
        note.style.top = `${item.y}px`;
        
        const content = document.createElement('div');
        content.className = 'note-content';
        
        switch(item.type) {
            case 'note':
                content.textContent = item.content;
                break;
            case 'photo':
                const img = document.createElement('img');
                img.src = item.content;
                content.appendChild(img);
                break;
            case 'todos':
                const list = document.createElement('ul');
                JSON.parse(item.content).forEach(todo => {
                    const li = document.createElement('li');
                    li.textContent = todo.text;
                    if (todo.done) li.classList.add('done');
                    list.appendChild(li);
                });
                content.appendChild(list);
                break;
            default:
                content.textContent = item.content;
        }
        
        note.appendChild(content);
        return note;
    }
    
    getContentPreview(item) {
        switch(item.type) {
            case 'note':
                return item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '');
            case 'photo':
                return '📷 Photo';
            case 'audio':
                return '🎵 Audio';
            case 'video':
                return '🎬 Video';
            case 'todos':
                const todos = JSON.parse(item.content);
                return `☑️ ${todos.length} items`;
            default:
                return item.content.substring(0, 50);
        }
    }
    
    getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    getMonthKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    applyTransition(direction, type) {
        const classMap = {
            up: 'view-transition-vertical-up',
            down: 'view-transition-vertical-down',
            left: 'view-transition-horizontal-left',
            right: 'view-transition-horizontal-right',
            in: 'view-transition-zoom-in',
            out: 'view-transition-zoom-out'
        };
        
        const className = classMap[direction] || classMap[type];
        if (className) {
            this.container.classList.add(className);
            setTimeout(() => {
                this.container.classList.remove(className);
            }, 300);
        }
    }
}

export default ViewRenderer;