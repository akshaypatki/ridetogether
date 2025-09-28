// Firebase Configuration
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

// Global Firebase references
const auth = firebase.auth();
const db = firebase.firestore();

// Mapbox Configuration
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// App Configuration
const APP_CONFIG = {
    DEFAULT_LOCATION: [-122.0838, 37.3861], // San Ramon
    MAP_STYLE: 'mapbox://styles/mapbox/dark-v11',
    DATE_FORMAT: {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }
};

// Global state
const AppState = {
    currentUser: null,
    currentPage: 'dashboard',
    map: null,
    userLocation: null,
    isPublic: false
};