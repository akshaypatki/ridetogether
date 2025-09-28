// Bookings Module

const Bookings = {
    // Request to join a ride
    async requestToJoin(availabilityId, event) {
        Utils.log('Requesting to join ride:', availabilityId);
        
        try {
            // Get the availability details first
            const availDoc = await db.collection('availability').doc(availabilityId).get();
            if (!availDoc.exists) {
                Utils.showNotification('This ride no longer exists', 'error');
                return;
            }
            
            const availData = availDoc.data();
            
            // Check if user already requested
            const existingRequest = await db.collection('bookings')
                .where('availabilityId', '==', availabilityId)
                .where('requesterId', '==', AppState.currentUser.uid)
                .get();
            
            if (!existingRequest.empty) {
                Utils.showNotification('You already requested to join this ride', 'info');
                return;
            }
            
            // Don't allow booking own ride
            if (availData.userId === AppState.currentUser.uid) {
                Utils.showNotification('This is your own ride!', 'info');
                return;
            }
            
            // Create booking request
            await db.collection('bookings').add({
                availabilityId: availabilityId,
                ownerId: availData.userId,
                requesterId: AppState.currentUser.uid,
                requesterName: AppState.currentUser.displayName || AppState.currentUser.email.split('@')[0],
                status: 'pending',
                message: "I'd love to join your ride!",
                date: availData.date,
                startTime: availData.startTime,
                endTime: availData.endTime,
                trailType: availData.trailType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Utils.showNotification('Request sent! The rider will be notified.', 'success');
            
            // Update button
            if (event && event.target) {
                event.target.textContent = 'Request Sent';
                event.target.disabled = true;
                event.target.style.opacity = '0.7';
            }
            
        } catch (error) {
            Utils.log('Error sending request:', error);
            Utils.showNotification('Error sending request: ' + error.message, 'error');
        }
    },

    // Load booking requests for current user's rides
    async loadRequests() {
        Utils.log('Loading booking requests');
        const container = document.getElementById('bookingRequests');
        
        if (!container) return;
        
        try {
            // First get all user's availability IDs
            const myAvailability = await db.collection('availability')
                .where('userId', '==', AppState.currentUser.uid)
                .get();
            
            if (myAvailability.empty) {
                container.innerHTML = '<div class="empty-state"><p>Create availability slots to receive booking requests</p></div>';
                return;
            }
            
            const myAvailabilityIds = myAvailability.docs.map(doc => doc.id);
            
            // Get all pending bookings for these availability slots
            const bookingsSnapshot = await db.collection('bookings')
                .where('availabilityId', 'in', myAvailabilityIds)
                .where('status', '==', 'pending')
                .get();
            
            container.innerHTML = '';
            
            if (bookingsSnapshot.empty) {
                container.innerHTML = '<div class="empty-state"><p>No pending requests</p></div>';
                return;
            }
            
            // Display each booking request
            for (const doc of bookingsSnapshot.docs) {
                const booking = { id: doc.id, ...doc.data() };
                await this.displayRequest(booking, container);
            }
            
        } catch (error) {
            Utils.log('Error loading booking requests:', error);
            container.innerHTML = '<div class="empty-state"><p>Error loading requests</p></div>';
        }
    },

    // Display single booking request
    async displayRequest(booking, container) {
        try {
            // Get requester info
            let requesterName = booking.requesterName || 'Anonymous';
            try {
                const userDoc = await db.collection('users').doc(booking.requesterId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    requesterName = userData.name || userData.displayName || requesterName;
                }
            } catch (error) {
                Utils.log('Error loading requester info', error);
            }
            
            const div = document.createElement('div');
            div.className = 'booking-request';
            
            div.innerHTML = `
                <div class="request-header">
                    <div class="request-avatar">${Utils.getUserInitials(requesterName)}</div>
                    <div class="request-info">
                        <h4>${requesterName}</h4>
                        <p>${Utils.formatDate(booking.date)} • ${Utils.formatTime(booking.startTime)}</p>
                    </div>
                </div>
                <p class="request-message">"${booking.message}"</p>
                <div class="request-actions">
                    <button class="btn-accept" onclick="Bookings.handleRequest('${booking.id}', 'accepted')">
                        Accept
                    </button>
                    <button class="btn-decline" onclick="Bookings.handleRequest('${booking.id}', 'declined')">
                        Decline
                    </button>
                </div>
            `;
            
            container.appendChild(div);
            
        } catch (error) {
            Utils.log('Error displaying booking request', error);
        }
    },

    // Handle accepting/declining booking requests
    async handleRequest(bookingId, status) {
        try {
            Utils.log(`${status} booking request:`, bookingId);
            
            // Update booking status
            await db.collection('bookings').doc(bookingId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Get booking details for notification
            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            const booking = bookingDoc.data();
            
            // Create notification for requester
            await this.createNotification(booking.requesterId, {
                type: `booking_${status}`,
                message: `Your ride request for ${Utils.formatDate(booking.date)} was ${status}`,
                fromUserId: AppState.currentUser.uid,
                bookingId: bookingId
            });
            
            Utils.showNotification(
                status === 'accepted' ? 'Ride buddy confirmed! 🚴' : 'Request declined',
                status === 'accepted' ? 'success' : 'info'
            );
            
            // Reload booking requests
            await this.loadRequests();
            
        } catch (error) {
            Utils.log('Error updating booking:', error);
            Utils.showNotification('Error updating request', 'error');
        }
    },

    // Create notification (for future implementation)
    async createNotification(userId, data) {
        try {
            await db.collection('notifications').add({
                userId: userId,
                ...data,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            Utils.log('Error creating notification:', error);
        }
    },

    // Get user's upcoming rides (accepted bookings)
    async getUpcomingRides() {
        try {
            // Get rides where user is the owner and booking is accepted
            const ownerBookings = await db.collection('bookings')
                .where('ownerId', '==', AppState.currentUser.uid)
                .where('status', '==', 'accepted')
                .get();
            
            // Get rides where user is the requester and booking is accepted
            const requesterBookings = await db.collection('bookings')
                .where('requesterId', '==', AppState.currentUser.uid)
                .where('status', '==', 'accepted')
                .get();
            
            const allBookings = [];
            
            // Process owner bookings
            ownerBookings.forEach(doc => {
                allBookings.push({
                    id: doc.id,
                    ...doc.data(),
                    role: 'owner'
                });
            });
            
            // Process requester bookings
            requesterBookings.forEach(doc => {
                allBookings.push({
                    id: doc.id,
                    ...doc.data(),
                    role: 'participant'
                });
            });
            
            // Filter future rides only
            const upcomingRides = allBookings.filter(booking => 
                Utils.isFutureDate(booking.date)
            );
            
            // Sort by date
            upcomingRides.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            return upcomingRides;
            
        } catch (error) {
            Utils.log('Error getting upcoming rides:', error);
            return [];
        }
    },

    // Display upcoming confirmed rides
    async displayUpcomingRides(container) {
        try {
            const rides = await this.getUpcomingRides();
            
            if (rides.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No upcoming rides scheduled</p></div>';
                return;
            }
            
            container.innerHTML = '<h3>Confirmed Rides</h3>';
            
            for (const ride of rides) {
                const div = document.createElement('div');
                div.className = 'upcoming-ride';
                
                // Get partner info
                const partnerId = ride.role === 'owner' ? ride.requesterId : ride.ownerId;
                let partnerName = 'Riding Partner';
                
                try {
                    const partnerDoc = await db.collection('users').doc(partnerId).get();
                    if (partnerDoc.exists) {
                        partnerName = partnerDoc.data().name || partnerName;
                    }
                } catch (error) {
                    Utils.log('Error loading partner info', error);
                }
                
                div.innerHTML = `
                    <div class="ride-info">
                        <h4>${Utils.formatDate(ride.date)}</h4>
                        <p>${Utils.formatTime(ride.startTime)} - ${Utils.formatTime(ride.endTime)}</p>
                        <p>With: ${partnerName}</p>
                        <span class="trail-type">${ride.trailType}</span>
                    </div>
                `;
                
                container.appendChild(div);
            }
            
        } catch (error) {
            Utils.log('Error displaying upcoming rides:', error);
        }
    }
};