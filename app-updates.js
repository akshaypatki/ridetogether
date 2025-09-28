// Updates needed in app.js to integrate the calendar

// In the loadDashboard function, update the calendar container section:

async loadDashboard() {
    const container = document.getElementById('mainContainer');
    container.innerHTML = `
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="profile-section">
                <div class="profile-avatar">
                    <span>${Utils.getUserInitials(AppState.currentUser.displayName)}</span>
                </div>
                <h3>${AppState.currentUser.displayName || AppState.currentUser.email.split('@')[0]}</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Cycling enthusiast</p>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-header">
                <h1>My Ride Schedule</h1>
                <p style="color: var(--text-secondary);">Share your availability and connect with fellow cyclists</p>
            </div>

            <!-- UPDATED: Calendar Container -->
            <div class="calendar-container">
                <h2 style="margin-bottom: 1.5rem;">Add Your Availability</h2>
                <form class="availability-form" id="availabilityForm">
                    <!-- Calendar component will be injected here -->
                </form>
            </div>

            <!-- Availability List -->
            <div class="availability-list">
                <h3>Your Upcoming Availability</h3>
                <div id="availabilityItems">
                    <div class="empty-state">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>

            <!-- Map -->
            <div class="map-container">
                <div id="map"></div>
            </div>
        </main>

        <!-- Right Sidebar -->
        <aside class="right-sidebar">
            <!-- Booking Requests -->
            <div class="booking-requests">
                <h3>Booking Requests</h3>
                <div id="bookingRequests">
                    <div class="empty-state">
                        <p>No booking requests yet</p>
                    </div>
                </div>
            </div>

            <!-- Suggested Trails -->
            <div class="suggested-trails">
                <h3>Nearby Trails</h3>
                <div id="suggestedTrails">
                    <div class="trail-card">
                        <h4>Pacific Coast Trail</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">28 miles • Moderate</p>
                    </div>
                </div>
            </div>
        </aside>
    `;

    // Initialize the calendar component
    Calendar.initialize();
    
    // Load user's availability
    await Availability.load();
    
    // Load booking requests
    await Bookings.loadRequests();
    
    // Initialize map
    setTimeout(() => {
        MapModule.initialize('map');
    }, 100);
}

// Also update the index.html to include the new files:
// <script src="calendar.js"></script>
// <link rel="stylesheet" href="enhanced-styles.css">
