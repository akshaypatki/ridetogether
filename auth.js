// Authentication Module

const Auth = {
    // Initialize auth state listener
    initialize() {
        auth.onAuthStateChanged(async (user) => {
            Utils.log('Auth state changed', user);
            
            if (user) {
                AppState.currentUser = user;
                await this.ensureUserDocument(user);
                App.showMainApp();
            } else {
                AppState.currentUser = null;
                this.showAuthScreen();
            }
        });
    },

    // Show authentication screen
    showAuthScreen() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <h1>🚴 RideTogether</h1>
                    </div>
                    <form id="authForm" class="auth-form">
                        <div class="auth-error" id="authError"></div>
                        <div class="form-group">
                            <label for="authEmail">Email</label>
                            <input type="email" id="authEmail" required placeholder="rider@example.com">
                        </div>
                        <div class="form-group">
                            <label for="authPassword">Password</label>
                            <input type="password" id="authPassword" required placeholder="••••••••">
                        </div>
                        <div class="form-group" id="nameGroup" style="display: none;">
                            <label for="authName">Full Name</label>
                            <input type="text" id="authName" placeholder="Alex Kumar">
                        </div>
                        <button type="submit" class="btn-primary" id="authButton">
                            Sign In
                        </button>
                    </form>
                    <div class="auth-toggle">
                        <span id="authToggleText">Don't have an account?</span>
                        <a href="#" id="authToggleLink" onclick="Auth.toggleMode(event)">Sign Up</a>
                    </div>
                </div>
            </div>
        `;

        // Attach form handler
        document.getElementById('authForm').addEventListener('submit', this.handleAuth);
        Utils.hideLoading();
    },

    // Toggle between sign in and sign up
    toggleMode(event) {
        event.preventDefault();
        const isSignUp = document.getElementById('authButton').textContent === 'Sign In';
        
        document.getElementById('nameGroup').style.display = isSignUp ? 'block' : 'none';
        document.getElementById('authButton').textContent = isSignUp ? 'Sign Up' : 'Sign In';
        document.getElementById('authToggleText').textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
        document.getElementById('authToggleLink').textContent = isSignUp ? 'Sign In' : 'Sign Up';
    },

    // Handle authentication form submission
    async handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authName').value;
        const button = document.getElementById('authButton');
        const errorDiv = document.getElementById('authError');
        const isSignUp = button.textContent === 'Sign Up';
        
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span>';
        errorDiv.style.display = 'none';
        
        try {
            if (isSignUp) {
                Utils.log('Signing up new user');
                const credential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update profile with display name
                await credential.user.updateProfile({ displayName: name });
                
                // Create user document in Firestore
                await db.collection('users').doc(credential.user.uid).set({
                    name: name || email.split('@')[0],
                    email: email,
                    displayName: name || email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    rides: 0,
                    friends: []
                });
                
                Utils.log('User created successfully');
                Utils.showNotification('Welcome to RideTogether!', 'success');
            } else {
                Utils.log('Signing in user');
                await auth.signInWithEmailAndPassword(email, password);
                Utils.log('Sign in successful');
                Utils.showNotification('Welcome back!', 'success');
            }
        } catch (error) {
            Utils.log('Auth error', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            button.disabled = false;
            button.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        }
    },

    // Ensure user document exists in Firestore
    async ensureUserDocument(user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                Utils.log('Creating user document');
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    displayName: user.displayName || user.email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    rides: 0,
                    friends: []
                });
            } else {
                // Update name if missing
                const userData = userDoc.data();
                if (!userData.name || !userData.displayName) {
                    await db.collection('users').doc(user.uid).update({
                        name: userData.name || user.displayName || user.email.split('@')[0],
                        displayName: userData.displayName || user.displayName || user.email.split('@')[0]
                    });
                }
            }
        } catch (error) {
            Utils.log('Error ensuring user document', error);
        }
    },

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            Utils.showNotification('Signed out successfully', 'success');
        } catch (error) {
            Utils.log('Sign out error', error);
            Utils.showNotification('Error signing out', 'error');
        }
    }
};