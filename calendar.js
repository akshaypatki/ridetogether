// Calendar Component - Better Date/Time Selection

const Calendar = {
    currentDate: new Date(),
    selectedDate: null,
    selectedStartTime: null,
    selectedEndTime: null,
    
    // Initialize calendar in the availability form
    initialize() {
        const calendarContainer = document.querySelector('.availability-form');
        if (!calendarContainer) return;
        
        // Replace the basic inputs with better UI
        calendarContainer.innerHTML = `
            <div class="calendar-grid">
                <!-- Date Selection -->
                <div class="form-section" style="grid-column: span 2;">
                    <label>Select Date</label>
                    <div class="calendar-nav">
                        <button type="button" onclick="Calendar.changeMonth(-1)" class="cal-nav-btn">‹</button>
                        <h3 id="calendarMonth">${this.getMonthYear()}</h3>
                        <button type="button" onclick="Calendar.changeMonth(1)" class="cal-nav-btn">›</button>
                    </div>
                    <div id="calendarGrid" class="date-grid"></div>
                </div>
                
                <!-- Time Selection -->
                <div class="form-section">
                    <label>Start Time</label>
                    <div class="time-picker" id="startTimePicker">
                        <div class="time-slots"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label>End Time</label>
                    <div class="time-picker" id="endTimePicker">
                        <div class="time-slots"></div>
                    </div>
                </div>
                
                <!-- Trail Type -->
                <div class="form-group">
                    <label>Preferred Trail Type</label>
                    <select id="trailType" class="trail-select">
                        <option value="road">🚴 Road Cycling</option>
                        <option value="mountain">⛰️ Mountain Biking</option>
                        <option value="casual">🌳 Casual Ride</option>
                        <option value="gravel">🏞️ Gravel Paths</option>
                    </select>
                </div>
                
                <!-- Quick Options -->
                <div class="form-group">
                    <label>Quick Select</label>
                    <div class="quick-options">
                        <button type="button" class="quick-btn" onclick="Calendar.quickSelect('weekend-morning')">
                            Weekend Morning
                        </button>
                        <button type="button" class="quick-btn" onclick="Calendar.quickSelect('weekday-evening')">
                            Weekday Evening
                        </button>
                        <button type="button" class="quick-btn" onclick="Calendar.quickSelect('tomorrow')">
                            Tomorrow
                        </button>
                    </div>
                </div>
                
                <!-- Visibility Toggle -->
                <div class="visibility-toggle">
                    <span>Make this slot public to all riders</span>
                    <div class="toggle-switch" id="visibilityToggle" onclick="Availability.toggleVisibility()"></div>
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">
                        Currently: <span id="visibilityText">Friends Only</span>
                    </span>
                </div>
                
                <!-- Submit Button -->
                <button type="button" onclick="Calendar.submitAvailability()" class="btn-primary" id="submitBtn" disabled>
                    Add Availability
                </button>
            </div>
        `;
        
        this.renderCalendar();
        this.renderTimeSlots();
    },
    
    // Render calendar grid
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = '<div class="weekday-headers">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div><div class="days-grid">';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="day empty"></div>';
        }
        
        // Days of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = date < today;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            
            let classes = 'day';
            if (isPast) classes += ' past';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (!isPast) classes += ' available';
            
            html += `<div class="${classes}" ${!isPast ? `onclick="Calendar.selectDate(${year}, ${month}, ${day})"` : ''}>
                ${day}
                ${isToday ? '<span class="today-label">Today</span>' : ''}
            </div>`;
        }
        
        html += '</div>';
        grid.innerHTML = html;
    },
    
    // Render time slots
    renderTimeSlots() {
        const startContainer = document.querySelector('#startTimePicker .time-slots');
        const endContainer = document.querySelector('#endTimePicker .time-slots');
        
        const times = [];
        // Generate time slots from 5 AM to 9 PM
        for (let hour = 5; hour <= 21; hour++) {
            times.push(`${hour}:00`);
            times.push(`${hour}:30`);
        }
        
        // Start time slots
        startContainer.innerHTML = times.map(time => {
            const isSelected = this.selectedStartTime === time;
            return `<div class="time-slot ${isSelected ? 'selected' : ''}" 
                         onclick="Calendar.selectStartTime('${time}')">
                ${this.formatTimeDisplay(time)}
            </div>`;
        }).join('');
        
        // End time slots (only show times after start time)
        if (this.selectedStartTime) {
            const startIndex = times.indexOf(this.selectedStartTime);
            const availableEndTimes = times.slice(startIndex + 1);
            
            endContainer.innerHTML = availableEndTimes.map(time => {
                const isSelected = this.selectedEndTime === time;
                return `<div class="time-slot ${isSelected ? 'selected' : ''}" 
                             onclick="Calendar.selectEndTime('${time}')">
                    ${this.formatTimeDisplay(time)}
                </div>`;
            }).join('');
        } else {
            endContainer.innerHTML = '<p class="time-hint">Select start time first</p>';
        }
        
        this.checkFormValidity();
    },
    
    // Format time for display
    formatTimeDisplay(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },
    
    // Select date
    selectDate(year, month, day) {
        this.selectedDate = new Date(year, month, day);
        this.renderCalendar();
        this.checkFormValidity();
    },
    
    // Select start time
    selectStartTime(time) {
        this.selectedStartTime = time;
        this.selectedEndTime = null; // Reset end time
        this.renderTimeSlots();
    },
    
    // Select end time
    selectEndTime(time) {
        this.selectedEndTime = time;
        this.renderTimeSlots();
    },
    
    // Change month
    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        document.getElementById('calendarMonth').textContent = this.getMonthYear();
        this.renderCalendar();
    },
    
    // Get month and year string
    getMonthYear() {
        return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    },
    
    // Quick select options
    quickSelect(option) {
        const today = new Date();
        
        switch(option) {
            case 'weekend-morning':
                // Next Saturday at 8 AM
                const saturday = new Date(today);
                saturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
                if (saturday <= today) saturday.setDate(saturday.getDate() + 7);
                this.selectedDate = saturday;
                this.selectedStartTime = '8:00';
                this.selectedEndTime = '11:00';
                break;
                
            case 'weekday-evening':
                // Next weekday at 5 PM
                const weekday = new Date(today);
                weekday.setDate(today.getDate() + 1);
                while (weekday.getDay() === 0 || weekday.getDay() === 6) {
                    weekday.setDate(weekday.getDate() + 1);
                }
                this.selectedDate = weekday;
                this.selectedStartTime = '17:00';
                this.selectedEndTime = '19:00';
                break;
                
            case 'tomorrow':
                // Tomorrow at 9 AM
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                this.selectedDate = tomorrow;
                this.selectedStartTime = '9:00';
                this.selectedEndTime = '11:00';
                break;
        }
        
        this.currentDate = new Date(this.selectedDate);
        this.renderCalendar();
        this.renderTimeSlots();
    },
    
    // Check if form is valid
    checkFormValidity() {
        const btn = document.getElementById('submitBtn');
        if (btn) {
            btn.disabled = !(this.selectedDate && this.selectedStartTime && this.selectedEndTime);
        }
    },
    
    // Submit availability
    async submitAvailability() {
        if (!this.selectedDate || !this.selectedStartTime || !this.selectedEndTime) {
            Utils.showNotification('Please select date and times', 'error');
            return;
        }
        
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        const trailType = document.getElementById('trailType').value;
        
        try {
            await db.collection('availability').add({
                userId: AppState.currentUser.uid,
                date: dateStr,
                startTime: this.selectedStartTime,
                endTime: this.selectedEndTime,
                trailType: trailType,
                visibility: AppState.isPublic ? 'public' : 'friends',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Utils.showNotification('Availability added!', 'success');
            
            // Reset selections
            this.selectedDate = null;
            this.selectedStartTime = null;
            this.selectedEndTime = null;
            AppState.isPublic = false;
            
            // Reinitialize calendar
            this.initialize();
            
            // Reload availability list
            await Availability.load();
            
        } catch (error) {
            Utils.log('Error adding availability', error);
            Utils.showNotification('Error adding availability', 'error');
        }
    }
};
