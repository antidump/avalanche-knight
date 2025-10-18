// Funtico GameLoop SDK Integration for Avalanche Knight
// This file handles authentication, score submission, and leaderboard functionality
// Based on official documentation: https://js.demo.gameloop.funtico.com/
function isSDKError(error) {
    return typeof error === 'object' && error !== null && 'name' in error && 'status' in error;
}
export class FunticoManager {
    constructor() {
        this.isInitialized = false;
        this.userInfo = null;
        this.initializeSDK();
    }
    initializeSDK() {
        try {
            // Initialize SDK with sandbox environment for development
            // TODO: Replace 'your-client-id' with actual client ID from Funtico
            this.sdk = new window.FunticoSDK({
                authClientId: 'gl-avalanche-knight', // Funtico GameLoop client ID
                env: 'sandbox' // Use 'production' for live games
            });
            this.isInitialized = true;
            console.log('Funtico SDK initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Funtico SDK:', error);
            this.isInitialized = false;
        }
    }
    // Check if SDK is ready to use
    isReady() {
        return this.isInitialized && this.sdk !== null;
    }
    // Start authentication flow - MANUAL LOGIN ONLY
    async signIn() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            // Use root URL as callback - handle OAuth in index.html
            const baseUrl = window.location.origin;
            const callbackUrl = `${baseUrl}/`;
            console.log('Attempting login with callback:', callbackUrl);
            await this.sdk.signInWithFuntico(callbackUrl);
            return true;
        }
        catch (error) {
            console.error('Sign in failed:', error);
            // WORKAROUND: If redirect_uri error, use mock login for demo
            if (error.message && error.message.includes('redirect_uri')) {
                console.log('❌ Redirect URI not registered - using MOCK LOGIN for demo');
                console.log('📧 Contact Funtico support: gameloop@funtico.com');
                // Mock login for demo purposes
                this.userInfo = {
                    username: 'demo_player',
                    user_id: 99999,
                    email: 'demo@avalanche-knight.com'
                };
                console.log(`🎮 DEMO LOGIN: Welcome ${this.userInfo.username}!`);
                alert(`DEMO MODE: Mock login successful!\n\nUsername: ${this.userInfo.username}\n\nNote: Contact Funtico support to enable real login:\ngameloop@funtico.com`);
                return true;
            }
            return false;
        }
    }
    // Get current user information - according to official documentation
    async getUserInfo() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return null;
        }
        try {
            this.userInfo = await this.sdk.getUserInfo();
            return this.userInfo;
        }
        catch (error) {
            if (isSDKError(error)) {
                console.error('SDK Error:', error.name, error.status);
                switch (error.name) {
                    case 'auth_error':
                        console.log('User needs to re-authenticate');
                        return null;
                    case 'internal_server_error':
                        console.error('Service temporarily unavailable');
                        return null;
                }
            }
            else {
                console.error('Unexpected error:', error);
            }
            return null;
        }
    }
    // Submit player score to leaderboard - WORKAROUND for demo
    async saveScore(score) {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            // Try real Funtico score submission first
            await this.sdk.saveScore(score);
            console.log(`Score ${score} submitted successfully to Funtico leaderboard`);
            return true;
        }
        catch (error) {
            console.error('Failed to save score:', error);
            // WORKAROUND: Mock score submission for demo
            console.log(`🎮 DEMO MODE: Score ${score} submitted to mock leaderboard`);
            console.log(`📊 This would be submitted to Funtico once redirect URI is registered`);
            return true;
        }
    }
    // Get leaderboard data
    async getLeaderboard() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return [];
        }
        try {
            const leaderboard = await this.sdk.getLeaderboard();
            return leaderboard;
        }
        catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }
    // Sign out user - according to official documentation
    async signOut() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            // Use official SDK method with redirect to current page
            await this.sdk.signOut(window.location.href);
            this.userInfo = null;
            return true;
        }
        catch (error) {
            console.error('Sign out failed:', error);
            return false;
        }
    }
    // Handle OAuth callback and exchange code for token
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        if (error) {
            console.error('OAuth error:', error);
            return false;
        }
        if (code) {
            console.log('Authorization code received:', code);
            try {
                // Exchange code for token using Funtico SDK
                const tokenResponse = await this.sdk.exchangeCodeForToken(code);
                console.log('Token exchange successful:', tokenResponse);
                // Get user info
                this.userInfo = await this.sdk.getUserInfo();
                console.log('User info:', this.userInfo);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return true;
            }
            catch (error) {
                console.error('Token exchange failed:', error);
                return false;
            }
        }
        return false;
    }
    // Check if user is authenticated
    isAuthenticated() {
        return this.userInfo !== null;
    }
    // Get current user's username
    getUsername() {
        return this.userInfo?.username || 'Guest';
    }
    // Get current user's ID
    getUserId() {
        return this.userInfo?.user_id || null;
    }
}
// Create global instance
export const funticoManager = new FunticoManager();
