export class DateNavigator {
    constructor() {
        this.currentDate = new Date();
        this.viewLevel = 'day';
        this.viewLevels = ['day', 'week', 'month', 'year'];
        this.callbacks = {
            onDateChange: null,
            onViewChange: null
        };
    }
    
    setCallbacks(callbacks) {
        Object.assign(this.callbacks, callbacks);
    }
    
    navigatePeriod(direction) {
        const delta = direction === 'up' ? -1 : 1;
        const oldDate = new Date(this.currentDate);
        
        switch(this.viewLevel) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + delta);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (delta * 7));
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + delta);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + delta);
                break;
        }
        
        if (this.callbacks.onDateChange) {
            this.callbacks.onDateChange(this.currentDate, oldDate, direction);
        }
    }
    
    zoomLevel(direction) {
        const currentIndex = this.viewLevels.indexOf(this.viewLevel);
        const oldLevel = this.viewLevel;
        const newIndex = direction === 'in' ? 
            Math.max(0, currentIndex - 1) : 
            Math.min(3, currentIndex + 1);
        
        if (newIndex !== currentIndex) {
            this.viewLevel = this.viewLevels[newIndex];
            
            if (this.callbacks.onViewChange) {
                this.callbacks.onViewChange(this.viewLevel, oldLevel, direction);
            }
        }
    }
    
    goToToday() {
        const oldDate = new Date(this.currentDate);
        this.currentDate = new Date();
        
        if (this.callbacks.onDateChange) {
            this.callbacks.onDateChange(this.currentDate, oldDate, 'today');
        }
    }
    
    goToDate(date) {
        const oldDate = new Date(this.currentDate);
        this.currentDate = new Date(date);
        
        if (this.callbacks.onDateChange) {
            this.callbacks.onDateChange(this.currentDate, oldDate, 'jump');
        }
    }
    
    getDateKey() {
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.currentDate.getDate()).padStart(2, '0');
        
        switch(this.viewLevel) {
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week':
                const week = this.getWeekNumber();
                return `${year}-W${String(week).padStart(2, '0')}`;
            case 'month':
                return `${year}-${month}`;
            case 'year':
                return `${year}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }
    
    getWeekNumber() {
        const d = new Date(this.currentDate);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
    
    getWeekDates() {
        const dates = [];
        const current = new Date(this.currentDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(current);
            date.setDate(diff + i);
            dates.push(date);
        }
        
        return dates;
    }
    
    getMonthDates() {
        const dates = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1);
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push({
                date: date,
                isCurrentMonth: date.getMonth() === month
            });
        }
        
        return dates;
    }
    
    getYearMonths() {
        const months = [];
        const year = this.currentDate.getFullYear();
        
        for (let i = 0; i < 12; i++) {
            months.push(new Date(year, i, 1));
        }
        
        return months;
    }
    
    formatDate(format = 'full') {
        const options = {
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            month: { year: 'numeric', month: 'long' },
            year: { year: 'numeric' }
        };
        
        const formatOptions = options[format] || options.full;
        return this.currentDate.toLocaleDateString('en-US', formatOptions);
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
}

export default DateNavigator;