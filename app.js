// RideTogether Main Application
console.log('[RideTogether] Loading app.js');

// Initialize Firebase with REAL configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYvXaWbO6fsW_U0FTPlKq-fJRAqjVnTWM",
    authDomain: "ridetogether-app.firebaseapp.com",
    projectId: "ridetogether-app",
    storageBucket: "ridetogether-app.firebasestorage.app",
    messagingSenderId: "826999719441",
    appId: "1:826999719441:web:8873d477869d61451dd3b0",
    measurementId: "G-L1TQJ9110P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log('[RideTogether] Firebase initialized');

// Global state
let currentUser = null;
let userAvailability = [];
let allAvailability = [];
let demoFriends = [];

// Application Class
class App {
    constructor() {
        console.log('[RideTogether] Initializing RideTogether app');
        this.currentPage = 'dashboard';
        this.map = null;
        this.userMarker = null;
        this.markers = [];
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.checkAuthState();
        this.initializeDemoData();
        this.startRealtimeUpdates();
    }

    setupEventListeners() {
        // Auth form submissions
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        // Navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                if (page) {
                    this.showPage(page);
                }
            });
        });

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // Add availability button
        const addAvailabilityBtn = document.getElementById('addAvailabilityBtn');
        if (addAvailabilityBtn) {
            addAvailabilityBtn.addEventListener('click', () => {
                document.getElementById('availabilityModal').style.display = 'flex';
            });
        }

        // Close modal
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('availabilityModal').style.display = 'none';
            });
        }

        // Availability form
        const availabilityForm = document.getElementById('availabilityForm');
        if (availabilityForm) {
            availabilityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAvailability();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.signOut();
            });
        }
    }

    checkAuthState() {
        auth.onAuthStateChanged(async (user) => {
            console.log('[RideTogether] Auth state changed:', user?.email);
            if (user) {
                currentUser = user;
                await this.loadUserData();
                this.showMainApp();
                this.showDashboard();
            } else {
                currentUser = null;
                this.showAuthScreen();
            }
        });
    }

    async loadUserData() {
        if (!currentUser) return;

        try {
            // Load user profile
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (!userDoc.exists) {
                // Create user profile if it doesn't exist
                await db.collection('users').doc(currentUser.uid).set({
                    email: currentUser.email,
                    name: currentUser.displayName || 'Cyclist',
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    rides: 0,
                    friends: []
                });
            }

            // Load user's availability
            await this.loadUserAvailability();
            
            // Update UI with user info
            this.updateUserInfo();
        } catch (error) {
            console.error('[RideTogether] Error loading user data:', error);
            showNotification('Error loading user data', 'error');
        }
    }

    async loadUserAvailability() {
        try {
            const snapshot = await db.collection('availability')
                .where('userId', '==', currentUser.uid)
                .orderBy('date', 'asc')
                .get();
            
            userAvailability = [];
            snapshot.forEach((doc) => {
                userAvailability.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('[RideTogether] Loaded availability:', userAvailability.length);
            this.updateAvailabilityDisplay();
        } catch (error) {
            console.error('[RideTogether] Error loading availability:', error);
        }
    }

    updateUserInfo() {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = currentUser.displayName || 'Cyclist';
        if (userEmailEl) userEmailEl.textContent = currentUser.email;
        if (userAvatarEl) {
            userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=2563eb&color=fff`;
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            showNotification('Signing in...', 'info');
            await auth.signInWithEmailAndPassword(email, password);
            showNotification('Welcome back!', 'success');
        } catch (error) {
            console.error('[RideTogether] Login error:', error);
            showNotification(error.message, 'error');
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            showNotification('Creating account...', 'info');
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update display name
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Create user profile in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                name: name,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rides: 0,
                friends: []
            });

            showNotification('Account created successfully!', 'success');
        } catch (error) {
            console.error('[RideTogether] Signup error:', error);
            showNotification(error.message, 'error');
        }
    }

    async saveAvailability() {
        const date = document.getElementById('availDate').value;
        const startTime = document.getElementById('availStartTime').value;
        const endTime = document.getElementById('availEndTime').value;
        const location = document.getElementById('availLocation').value;
        const visibility = document.getElementById('availVisibility').value;

        if (!date || !startTime || !endTime || !location) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            showNotification('Saving availability...', 'info');
            
            const availability = {
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Cyclist',
                date: date,
                startTime: startTime,
                endTime: endTime,
                location: location,
                visibility: visibility,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('availability').add(availability);
            
            document.getElementById('availabilityModal').style.display = 'none';
            document.getElementById('availabilityForm').reset();
            
            showNotification('Availability saved!', 'success');
            await this.loadUserAvailability();
        } catch (error) {
            console.error('[RideTogether] Error saving availability:', error);
            showNotification('Error saving availability', 'error');
        }
    }

    updateAvailabilityDisplay() {
        const container = document.getElementById('myAvailability');
        if (!container) return;

        if (userAvailability.length === 0) {
            container.innerHTML = '<p class="empty-state">No availability set. Click "Add Availability" to get started!</p>';
            return;
        }

        container.innerHTML = userAvailability.map(avail => `
            <div class="availability-card">
                <div class="availability-header">
                    <h3>${formatDate(avail.date)}</h3>
                    <span class="visibility-badge ${avail.visibility}">${avail.visibility}</span>
                </div>
                <div class="availability-details">
                    <p><i class="icon">🕐</i> ${avail.startTime} - ${avail.endTime}</p>
                    <p><i class="icon">📍</i> ${avail.location}</p>
                </div>
                <div class="availability-actions">
                    <button onclick="window.app.deleteAvailability('${avail.id}')" class="btn-secondary btn-small">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async deleteAvailability(id) {
        if (!confirm('Are you sure you want to delete this availability?')) return;

        try {
            await db.collection('availability').doc(id).delete();
            showNotification('Availability deleted', 'success');
            await this.loadUserAvailability();
        } catch (error) {
            console.error('[RideTogether] Error deleting availability:', error);
            showNotification('Error deleting availability', 'error');
        }
    }

    async loadAllAvailability() {
        try {
            const snapshot = await db.collection('availability')
                .where('visibility', '==', 'public')
                .orderBy('date', 'asc')
                .limit(20)
                .get();
            
            allAvailability = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.userId !== currentUser?.uid) {
                    allAvailability.push({ id: doc.id, ...data });
                }
            });
            
            console.log('[RideTogether] Loaded public availability:', allAvailability.length);
            this.updatePublicRidesDisplay();
        } catch (error) {
            console.error('[RideTogether] Error loading public availability:', error);
        }
    }

    updatePublicRidesDisplay() {
        const container = document.getElementById('publicRides');
        if (!container) return;

        if (allAvailability.length === 0) {
            container.innerHTML = '<p class="empty-state">No public rides available. Check back later!</p>';
            return;
        }

        container.innerHTML = allAvailability.map(avail => `
            <div class="ride-card">
                <div class="ride-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(avail.userName)}&background=10b981&color=fff" alt="${avail.userName}">
                    <div>
                        <h4>${avail.userName}</h4>
                        <p class="ride-date">${formatDate(avail.date)}</p>
                    </div>
                </div>
                <div class="ride-details">
                    <p><i class="icon">🕐</i> ${avail.startTime} - ${avail.endTime}</p>
                    <p><i class="icon">📍</i> ${avail.location}</p>
                </div>
                <button onclick="window.app.requestToJoin('${avail.id}')" class="btn-primary btn-small">Request to Join</button>
            </div>
        `).join('');
    }

    async requestToJoin(availabilityId) {
        try {
            showNotification('Sending request...', 'info');
            
            // Create a booking request
            await db.collection('bookingRequests').add({
                availabilityId: availabilityId,
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName || 'Cyclist',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showNotification('Request sent! The rider will be notified.', 'success');
        } catch (error) {
            console.error('[RideTogether] Error sending request:', error);
            showNotification('Error sending request', 'error');
        }
    }

    showAuthScreen() {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
    }

    showDashboard() {
        this.currentPage = 'dashboard';
        this.updateNavigation();
        
        document.getElementById('dashboardContent').style.display = 'block';
        document.getElementById('findRidersContent').style.display = 'none';
        document.getElementById('trailsContent').style.display = 'none';
        document.getElementById('eventsContent').style.display = 'none';
        
        // Load latest data
        this.loadUserAvailability();
        this.updateBookingRequests();
    }

    showPage(page) {
        console.log('[RideTogether] Navigating to:', page);
        this.currentPage = page;
        this.updateNavigation();
        
        // Hide all content
        document.getElementById('dashboardContent').style.display = 'none';
        document.getElementById('findRidersContent').style.display = 'none';
        document.getElementById('trailsContent').style.display = 'none';
        document.getElementById('eventsContent').style.display = 'none';
        
        // Show selected content
        switch(page) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'find':
                document.getElementById('findRidersContent').style.display = 'block';
                this.loadAllAvailability();
                break;
            case 'trails':
                document.getElementById('trailsContent').style.display = 'block';
                setTimeout(() => this.initializeMap(), 100);
                break;
            case 'events':
                document.getElementById('eventsContent').style.display = 'block';
                break;
        }
    }

    updateNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    initializeMap() {
        if (this.map) return;
        
        console.log('[RideTogether] Initializing map');
        
        mapboxgl.accessToken = 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNsaTFyMjN4NTAxa2Eza28wYTNjYzJ5aWoifQ.demo-token';
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-122.0842, 37.4224], // San Francisco Bay Area
            zoom: 10
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl());
        
        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });
        
        this.map.addControl(geolocate);
        
        // Add demo trail markers
        this.addTrailMarkers();
    }

    addTrailMarkers() {
        const trails = [
            { name: 'Golden Gate Park Loop', coords: [-122.4836, 37.7694], difficulty: 'Easy', distance: '6 miles' },
            { name: 'Bay Trail', coords: [-122.0642, 37.3874], difficulty: 'Easy', distance: '12 miles' },
            { name: 'Mount Tam Loop', coords: [-122.5964, 37.9235], difficulty: 'Hard', distance: '25 miles' },
            { name: 'Crystal Springs Trail', coords: [-122.3652, 37.5299], difficulty: 'Moderate', distance: '15 miles' }
        ];

        trails.forEach(trail => {
            const el = document.createElement('div');
            el.className = 'trail-marker';
            el.innerHTML = '🚴';
            
            const marker = new mapboxgl.Marker(el)
                .setLngLat(trail.coords)
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
                            <h3>${trail.name}</h3>
                            <p>Difficulty: <strong>${trail.difficulty}</strong></p>
                            <p>Distance: ${trail.distance}</p>
                        `)
                )
                .addTo(this.map);
            
            this.markers.push(marker);
        });
    }

    initializeDemoData() {
        // Initialize demo friends
        demoFriends = [
            { id: 1, name: 'Sarah Chen', status: 'active', rides: 47, avatar: 'SC' },
            { id: 2, name: 'Mike Johnson', status: 'offline', rides: 23, avatar: 'MJ' },
            { id: 3, name: 'Emma Wilson', status: 'active', rides: 89, avatar: 'EW' },
            { id: 4, name: 'Tom Rodriguez', status: 'riding', rides: 156, avatar: 'TR' }
        ];
        
        this.updateFriendsDisplay();
    }

    updateFriendsDisplay() {
        const container = document.getElementById('friendsList');
        if (!container) return;
        
        container.innerHTML = demoFriends.map(friend => `
            <div class="friend-item">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=2563eb&color=fff" alt="${friend.name}">
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-status ${friend.status}">${friend.status}</div>
                </div>
                <div class="friend-rides">${friend.rides} rides</div>
            </div>
        `).join('');
    }

    async updateBookingRequests() {
        try {
            // Load booking requests for user's availability
            const userAvailIds = userAvailability.map(a => a.id);
            if (userAvailIds.length === 0) return;
            
            const snapshot = await db.collection('bookingRequests')
                .where('availabilityId', 'in', userAvailIds)
                .where('status', '==', 'pending')
                .get();
            
            const requests = [];
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            
            this.displayBookingRequests(requests);
        } catch (error) {
            console.error('[RideTogether] Error loading booking requests:', error);
        }
    }

    displayBookingRequests(requests) {
        const container = document.getElementById('bookingRequests');
        if (!container) return;
        
        if (requests.length === 0) {
            container.innerHTML = '<p class="empty-state">No pending requests</p>';
            return;
        }
        
        container.innerHTML = requests.map(request => `
            <div class="booking-request">
                <div class="request-info">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(request.requesterName)}&background=f59e0b&color=fff" alt="${request.requesterName}">
                    <div>
                        <div class="request-name">${request.requesterName}</div>
                        <div class="request-time">Requested ${timeAgo(request.createdAt)}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button onclick="window.app.acceptRequest('${request.id}')" class="btn-success btn-small">Accept</button>
                    <button onclick="window.app.declineRequest('${request.id}')" class="btn-secondary btn-small">Decline</button>
                </div>
            </div>
        `).join('');
    }

    async acceptRequest(requestId) {
        try {
            await db.collection('bookingRequests').doc(requestId).update({
                status: 'accepted',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showNotification('Request accepted!', 'success');
            this.updateBookingRequests();
        } catch (error) {
            console.error('[RideTogether] Error accepting request:', error);
            showNotification('Error accepting request', 'error');
        }
    }

    async declineRequest(requestId) {
        try {
            await db.collection('bookingRequests').doc(requestId).update({
                status: 'declined',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showNotification('Request declined', 'info');
            this.updateBookingRequests();
        } catch (error) {
            console.error('[RideTogether] Error declining request:', error);
            showNotification('Error declining request', 'error');
        }
    }

    startRealtimeUpdates() {
        // Listen for new booking requests in real-time
        if (currentUser) {
            db.collection('bookingRequests')
                .where('status', '==', 'pending')
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            console.log('[RideTogether] New booking request');
                            this.updateBookingRequests();
                        }
                    });
                });
        }
    }

    toggleAuthMode() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authToggle = document.getElementById('authToggle');
        
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            authToggle.innerHTML = `Don't have an account? <a href="#" onclick="window.app.toggleAuthMode(); return false;">Sign up</a>`;
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            authToggle.innerHTML = `Already have an account? <a href="#" onclick="window.app.toggleAuthMode(); return false;">Log in</a>`;
        }
    }
}

// Helper functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function timeAgo(timestamp) {
    if (!timestamp) return 'just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

function showNotification(message, type = 'info') {
    console.log(`[RideTogether] ${type.toUpperCase()}: ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RideTogether] DOM loaded, initializing app');
    window.app = new App();
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // For now, we'll use a basic inline service worker
        const sw = `
            self.addEventListener('install', e => self.skipWaiting());
            self.addEventListener('activate', e => self.clients.claim());
            self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
        `;
        
        const blob = new Blob([sw], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl).then(reg => {
            console.log('[RideTogether] Service Worker registered');
        }).catch(err => {
            console.error('[RideTogether] Service Worker registration failed:', err);
        });
    });
}

console.log('[RideTogether] app.js loaded successfully');
