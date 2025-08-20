export function formatDate(date, format = 'full') {
    const options = {
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        short: { year: 'numeric', month: 'short', day: 'numeric' },
        month: { year: 'numeric', month: 'long' },
        year: { year: 'numeric' },
        dayMonth: { month: 'short', day: 'numeric' },
        monthYear: { year: 'numeric', month: 'short' }
    };
    
    const formatOptions = options[format] || options.full;
    return date.toLocaleDateString('en-US', formatOptions);
}

export function getDateKey(date, viewLevel = 'day') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch(viewLevel) {
        case 'day':
            return `${year}-${month}-${day}`;
        case 'week':
            const week = getWeekNumber(date);
            return `${year}-W${String(week).padStart(2, '0')}`;
        case 'month':
            return `${year}-${month}`;
        case 'year':
            return `${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

export function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

export function isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addWeeks(date, weeks) {
    return addDays(date, weeks * 7);
}

export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

export function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

export function getWeekDates(date) {
    const dates = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    
    for (let i = 0; i < 7; i++) {
        const weekDate = new Date(current);
        weekDate.setDate(diff + i);
        dates.push(weekDate);
    }
    
    return dates;
}

export function getMonthDates(date) {
    const dates = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1);
    
    for (let i = 0; i < 42; i++) {
        const monthDate = new Date(startDate);
        monthDate.setDate(startDate.getDate() + i);
        dates.push({
            date: monthDate,
            isCurrentMonth: monthDate.getMonth() === month
        });
    }
    
    return dates;
}

export function getYearMonths(date) {
    const months = [];
    const year = date.getFullYear();
    
    for (let i = 0; i < 12; i++) {
        months.push(new Date(year, i, 1));
    }
    
    return months;
}

export function generateId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

export function degToRad(deg) {
    return deg * Math.PI / 180;
}

export function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

export function scrollToElement(element, behavior = 'smooth') {
    element.scrollIntoView({ behavior, block: 'center' });
}

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function supportsIndexedDB() {
    return 'indexedDB' in window;
}

export function supportsLocalStorage() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

export function createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

export function addClass(element, className) {
    element.classList.add(className);
}

export function removeClass(element, className) {
    element.classList.remove(className);
}

export function toggleClass(element, className) {
    element.classList.toggle(className);
}

export function hasClass(element, className) {
    return element.classList.contains(className);
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergeObjects(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (isObject(result[key]) && isObject(source[key])) {
                result[key] = mergeObjects(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

export default {
    formatDate,
    getDateKey,
    getWeekNumber,
    isToday,
    isSameDate,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    getWeekDates,
    getMonthDates,
    getYearMonths,
    generateId,
    debounce,
    throttle,
    clamp,
    lerp,
    getDistance,
    getAngle,
    radToDeg,
    degToRad,
    isElementInViewport,
    scrollToElement,
    isMobile,
    isTouchDevice,
    supportsIndexedDB,
    supportsLocalStorage,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    getRandomInt,
    getRandomFloat,
    shuffleArray,
    deepClone,
    isEmpty,
    isObject,
    mergeObjects
};