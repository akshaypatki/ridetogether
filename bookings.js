// Enhanced Bookings Module with Connection Flow

const Bookings = {
    // Keep all existing functions from original bookings.js
    async loadRequests() {
        // ... existing code ...
    },

    async displayRequest(booking, container) {
        // ... existing code ...
    },

    async createNotification(userId, data) {
        // ... existing code ...
    },

    async getUpcomingRides() {
        // ... existing code ...
    },

    async displayUpcomingRides(container) {
        // ... existing code ...
    },

    // NEW ENHANCED FUNCTIONS BELOW

    // Enhanced request to join with dialog
    async requestToJoin(availabilityId, event) {
        Utils.log('Requesting to join ride:', availabilityId);
        
        try {
            const availDoc = await db.collection('availability').doc(availabilityId).get();
            if (!availDoc.exists) {
                Utils.showNotification('This ride no longer exists', 'error');
                return;
            }
            
            const availData = availDoc.data();
            
            // Check existing request
            const existingRequest = await db.collection('bookings')
                .where('availabilityId', '==', availabilityId)
                .where('requesterId', '==', AppState.currentUser.uid)
                .get();
            
            if (!existingRequest.empty) {
                Utils.showNotification('You already requested to join this ride', 'info');
                return;
            }
            
            if (availData.userId === AppState.currentUser.uid) {
                Utils.showNotification('This is your own ride!', 'info');
                return;
            }
            
            // Show enhanced request dialog
            this.showRequestDialog(availabilityId, availData);
            
        } catch (error) {
            Utils.log('Error with booking request:', error);
            Utils.showNotification('Error processing request', 'error');
        }
    },

    // Show request dialog with contact options
    showRequestDialog(availabilityId, availData) {
        const dialog = document.createElement('div');
        dialog.className = 'booking-dialog-overlay';
        dialog.innerHTML = `
            <div class="booking-dialog">
                <h3>Request to Join Ride</h3>
                <p class="dialog-subtitle">
                    ${Utils.formatDate(availData.date)} • ${Utils.formatTime(availData.startTime)}
                </p>
                
                <div class="form-group">
                    <label>Message to rider:</label>
                    <textarea id="bookingMessage" 
                             placeholder="Hi! I'd love to join your ${availData.trailType} ride. Tell them about your experience level..." 
                             rows="4"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Contact preferences:</label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="shareEmail" checked>
                        Share my email address
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="sharePhone" onchange="Bookings.togglePhoneInput()">
                        Share my phone number
                    </label>
                    <input type="tel" id="phoneNumber" 
                           placeholder="(555) 123-4567" 
                           style="margin-top: 10px; display: none;">
                </div>
                
                <div class="dialog-actions">
                    <button class="btn-secondary" onclick="Bookings.closeDialog()">Cancel</button>
                    <button class="btn-primary" onclick="Bookings.submitRequest('${availabilityId}', '${availData.userId}')">
                        Send Request
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    },

    // Toggle phone input visibility
    togglePhoneInput() {
        const checkbox = document.getElementById('sharePhone');
        const input = document.getElementById('phoneNumber');
        input.style.display = checkbox.checked ? 'block'
