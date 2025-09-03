// ui-renderer.js
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

    renderWeek(currentWeekStart, currentDate, clickCallback) {
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

        let weekHtml =
            '<div class="week-view"><div class="week-grid">';

        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + i);
            const isToday = this.isSameDay(day, new Date());
            const isCurrent = this.isSameDay(day, currentDate);

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
                if (clickCallback) {
                    clickCallback(date);
                }
            });
        });
    }

    renderMonth(currentMonth, clickCallback) {
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