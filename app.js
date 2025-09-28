// Main Application Module

const App = {
    // Initialize the application
    initialize() {
        Utils.log('Initializing RideTogether app');
        Utils.showLoading();
        
        // Initialize authentication
        Auth.initialize();
        
        // Get user location
        this.getUserLocation();
    },

    // Show main application after auth
    async showMainApp() {
        Utils.log('Loading main application');
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Header -->
            <header class="header">
                <nav class="nav-container">
                    <div class="logo" onclick="App.navigateTo('dashboard')">
                        🚴 RideTogether
                    </div>
                    <div class="nav-links">
                        <a href="#" class="nav-link active" data-page="dashboard" onclick="App.navigateTo('dashboard'); return false;">Dashboard</a>
                        <a href="#" class="nav-link" data-page="find" onclick="App.navigateTo('find'); return false;">Find Riders</a>
                        <a href="#" class="nav-link" data-page="trails" onclick="App.navigateTo('trails'); return false;">Trails</a>
                        <a href="#" class="nav-link" data-page="events" onclick="App.navigateTo('events'); return false;">Events</a>
                    </div>
                    <div class="user-menu">
                        <div class="user-avatar" onclick="Auth.signOut()" title="Click to sign out">
                            <span id="userInitials">${Utils.getUserInitials(AppState.currentUser.displayName)}</span>
                        </div>
                    </div>
                </nav>
            </header>

            <!-- Main Container -->
            <div id="mainContainer" class="main-container">
                <!-- Content will be loaded here -->
            </div>
        `;

        Utils.hideLoading();
        
        // Load dashboard by default
        await this.navigateTo('dashboard');
    },

    // Navigate to different pages
    async navigateTo(page) {
        Utils.log(`Navigating to ${page}`);
        AppState.currentPage = page;
        Utils.updateActiveNav(page);

        const container = document.getElementById('mainContainer');
        
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'find':
                await this.loadFindRiders();
                break;
            case 'trails':
                await this.loadTrails();
                break;
            case 'events':
                await this.loadEvents();
                break;
            default:
                container.innerHTML = '<div class="error">Page not found</div>';
        }
    },

    // Load dashboard page
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

                <!-- Add Availability Form -->
                <div class="calendar-container">
                    <h2 style="margin-bottom: 1.5rem;">Add Your Availability</h2>
                    <form class="availability-form" onsubmit="Availability.add(event)">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" id="date" required min="${Utils.getTodayDate()}">
                        </div>
                        <div class="form-group">
                            <label>Start Time</label>
                            <input type="time" id="startTime" required>
                        </div>
                        <div class="form-group">
                            <label>End Time</label>
                            <input type="time" id="endTime" required>
                        </div>
                        <div class="form-group">
                            <label>Preferred Trail Type</label>
                            <select id="trailType">
                                <option value="road">Road Cycling</option>
                                <option value="mountain">Mountain Biking</option>
                                <option value="casual">Casual Ride</option>
                                <option value="gravel">Gravel Paths</option>
                            </select>
                        </div>
                        <div class="visibility-toggle">
                            <span>Make this slot public to all riders</span>
                            <div class="toggle-switch" id="visibilityToggle" onclick="Availability.toggleVisibility()"></div>
                            <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                Currently: <span id="visibilityText">Friends Only</span>
                            </span>
                        </div>
                        <button type="submit" class="btn-primary">Add Availability</button>
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

        // Load user's availability
        await Availability.load();
        
        // Load booking requests
        await Bookings.loadRequests();
        
        // Initialize map
        setTimeout(() => {
            MapModule.initialize('map');
        }, 100);
    },

    // Load Find Riders page
    async loadFindRiders() {
        const container = document.getElementById('mainContainer');
        container.innerHTML = `
            <main class="main-content" style="grid-column: 1 / -1;">
                <div class="content-header">
                    <h1>Find Riders</h1>
                    <p style="color: var(--text-secondary);">Discover cyclists looking for riding partners</p>
                </div>
                <div id="publicRides">
                    <div class="empty-state"><p>Loading public rides...</p></div>
                </div>
            </main>
        `;

        await Availability.loadPublicRides();
    },

    // Load Trails page
    async loadTrails() {
        const container = document.getElementById('mainContainer');
        container.innerHTML = `
            <main class="main-content" style="grid-column: 1 / -1;">
                <div class="content-header">
                    <h1>Trails</h1>
                    <p style="color: var(--text-secondary);">Explore cycling trails near you</p>
                </div>
                <div class="map-container" style="height: 600px;">
                    <div id="trailsMap"></div>
                </div>
            </main>
        `;

        setTimeout(() => {
            MapModule.initializeTrailsMap('trailsMap');
        }, 100);
    },

    // Load Events page
    async loadEvents() {
        const container = document.getElementById('mainContainer');
        container.innerHTML = `
            <main class="main-content" style="grid-column: 1 / -1;">
                <div class="content-header">
                    <h1>Events</h1>
                    <p style="color: var(--text-secondary);">Group rides and cycling events</p>
                </div>
                <div class="calendar-container">
                    <div class="empty-state">
                        <h3>Coming Soon!</h3>
                        <p>Group rides and events will be available here</p>
                    </div>
                </div>
            </main>
        `;
    },

    // Get user location
    getUserLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    AppState.userLocation = [position.coords.longitude, position.coords.latitude];
                    Utils.log('User location obtained', AppState.userLocation);
                },
                (error) => {
                    Utils.log('Location error', error);
                    AppState.userLocation = APP_CONFIG.DEFAULT_LOCATION;
                }
            );
        } else {
            AppState.userLocation = APP_CONFIG.DEFAULT_LOCATION;
        }
    }
};