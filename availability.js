// Availability Module

const Availability = {
    // Toggle visibility switch
    toggleVisibility() {
        const toggle = document.getElementById('visibilityToggle');
        const text = document.getElementById('visibilityText');
        AppState.isPublic = !AppState.isPublic;
        
        if (AppState.isPublic) {
            toggle.classList.add('active');
            text.textContent = 'Public';
        } else {
            toggle.classList.remove('active');
            text.textContent = 'Friends Only';
        }
    },

    // Add new availability
    async add(event) {
        event.preventDefault();
        Utils.log('Adding availability');
        
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const trailType = document.getElementById('trailType').value;
        
        try {
            await db.collection('availability').add({
                userId: AppState.currentUser.uid,
                date: date,
                startTime: startTime,
                endTime: endTime,
                trailType: trailType,
                visibility: AppState.isPublic ? 'public' : 'friends',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Utils.showNotification('Availability added!', 'success');
            
            // Reset form
            event.target.reset();
            AppState.isPublic = false;
            document.getElementById('visibilityToggle').classList.remove('active');
            document.getElementById('visibilityText').textContent = 'Friends Only';
            
            // Reload list
            await this.load();
        } catch (error) {
            Utils.log('Error adding availability', error);
            Utils.showNotification('Error adding availability', 'error');
        }
    },

    // Load user's availability
    async load() {
        Utils.log('Loading user availability');
        const container = document.getElementById('availabilityItems');
        
        try {
            const snapshot = await db.collection('availability')
                .where('userId', '==', AppState.currentUser.uid)
                .get();
            
            container.innerHTML = '';
            
            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state"><p>No availability slots yet. Add your first slot above!</p></div>';
                return;
            }
            
            // Sort by date
            const availabilities = [];
            snapshot.forEach(doc => {
                availabilities.push({ id: doc.id, ...doc.data() });
            });
            
            availabilities.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Display each availability
            availabilities.forEach(availability => {
                this.displayItem(availability);
            });
            
        } catch (error) {
            Utils.log('Error loading availability', error);
            container.innerHTML = '<div class="empty-state"><p>Error loading availability</p></div>';
        }
    },

    // Display single availability item
    displayItem(availability) {
        const container = document.getElementById('availabilityItems');
        const div = document.createElement('div');
        div.className = 'availability-item';
        
        const isPast = !Utils.isFutureDate(availability.date);
        
        div.innerHTML = `
            <div class="availability-header">
                <div>
                    <div class="availability-date">${Utils.formatDate(availability.date)}</div>
                    <div class="availability-time">
                        ${Utils.formatTime(availability.startTime)} - ${Utils.formatTime(availability.endTime)}
                    </div>
                </div>
                <div class="availability-visibility" style="${availability.visibility === 'public' ? 'background: rgba(37, 99, 235, 0.1); color: var(--primary);' : ''}">
                    ${availability.visibility === 'public' ? 'Public' : 'Friends Only'}
                </div>
            </div>
            <div style="color: var(--text-secondary); margin-top: 0.5rem;">
                Preferred: ${this.formatTrailType(availability.trailType)}
                ${isPast ? ' • <span style="color: var(--error);">Past</span>' : ''}
            </div>
            ${!isPast ? `<button class="btn-delete" onclick="Availability.delete('${availability.id}')">×</button>` : ''}
        `;
        
        container.appendChild(div);
    },

    // Delete availability
    async delete(id) {
        if (!confirm('Delete this availability slot?')) return;
        
        try {
            await db.collection('availability').doc(id).delete();
            Utils.showNotification('Availability deleted', 'success');
            await this.load();
        } catch (error) {
            Utils.log('Error deleting availability', error);
            Utils.showNotification('Error deleting availability', 'error');
        }
    },

    // Format trail type for display
    formatTrailType(type) {
        const types = {
            'road': 'Road Cycling',
            'mountain': 'Mountain Biking',
            'casual': 'Casual Ride',
            'gravel': 'Gravel Paths'
        };
        return types[type] || type;
    },

    // Load public rides for Find Riders page
    async loadPublicRides() {
        const container = document.getElementById('publicRides');
        
        try {
            Utils.log('Loading public rides');
            
            // Get all public availability
            const snapshot = await db.collection('availability')
                .where('visibility', '==', 'public')
                .get();
            
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="calendar-container">
                        <div class="empty-state">
                            <p>No public rides available. Be the first to create one!</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '<div class="rides-grid"></div>';
            const grid = container.querySelector('.rides-grid');
            
            // Filter and display future rides from others
            const rides = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.userId !== AppState.currentUser.uid && Utils.isFutureDate(data.date)) {
                    rides.push({ id: doc.id, ...data });
                }
            });
            
            if (rides.length === 0) {
                container.innerHTML = `
                    <div class="calendar-container">
                        <div class="empty-state">
                            <p>No upcoming public rides from other riders</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Load user details and display rides
            for (const ride of rides) {
                await this.displayPublicRide(ride, grid);
            }
            
        } catch (error) {
            Utils.log('Error loading public rides', error);
            container.innerHTML = `
                <div class="calendar-container">
                    <div class="empty-state">
                        <p>Error loading rides</p>
                        <button class="btn-primary" onclick="Availability.loadPublicRides()" style="margin-top: 1rem;">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // Display single public ride
    async displayPublicRide(ride, container) {
        try {
            // Get rider info
            let riderName = 'Anonymous Rider';
            try {
                const userDoc = await db.collection('users').doc(ride.userId).get();
                if (userDoc.exists) {
                    riderName = userDoc.data().name || userDoc.data().displayName || 'Anonymous Rider';
                }
            } catch (error) {
                Utils.log('Error loading rider info', error);
            }
            
            const div = document.createElement('div');
            div.className = 'calendar-container';
            div.style.marginBottom = '1rem';
            
            div.innerHTML = `
                <div class="ride-card">
                    <div class="ride-header">
                        <div class="rider-info">
                            <div class="rider-avatar">
                                ${Utils.getUserInitials(riderName)}
                            </div>
                            <div>
                                <h3>${riderName}</h3>
                                <p>Looking for riding partner</p>
                            </div>
                        </div>
                        <button class="btn-primary" onclick="Bookings.requestToJoin('${ride.id}', event)">
                            Request to Join
                        </button>
                    </div>
                    <div class="ride-details">
                        <p><strong>${Utils.formatDate(ride.date)}</strong></p>
                        <p>${Utils.formatTime(ride.startTime)} - ${Utils.formatTime(ride.endTime)}</p>
                        <span class="trail-type">${this.formatTrailType(ride.trailType)}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(div);
            
        } catch (error) {
            Utils.log('Error displaying ride', error);
        }
    }
};