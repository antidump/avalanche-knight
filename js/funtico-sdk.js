// Funtico GameLoop SDK Integration for Avalanche Knight
// Simplified implementation based on working demo: https://js.demo.gameloop.funtico.com/
export class FunticoManager {
    constructor() {
        this.isInitialized = false;
        this.userInfo = null;
        this.initializeSDK();
    }
    initializeSDK() {
        try {
            // Simple initialization like the working demo
            this.sdk = new window.FunticoSDK({
                authClientId: 'gl-avalanche-knight'
            });
            this.isInitialized = true;
            console.log('Funtico SDK initialized successfully');
            // Silent session restore: try to fetch current user
            // If user has an active session (after redirect), this will populate userInfo
            // Do not block init; run in background and ignore errors
            setTimeout(async () => {
                try {
                    const info = await this.sdk.getUserInfo();
                    if (info) {
                        this.userInfo = info;
                        console.log('Funtico session detected. User:', this.userInfo);
                    }
                }
                catch (_e) {
                    // No active session yet or network error; ignore silently
                }
            }, 0);
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
    // Simple login like the working demo
    async signIn() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            // Use window.location.href like the working demo
            await this.sdk.signInWithFuntico(window.location.href);
            console.log('Login initiated successfully');
            // Wait a bit for login to complete, then update userInfo
            setTimeout(async () => {
                try {
                    this.userInfo = await this.sdk.getUserInfo();
                    if (this.userInfo) {
                        console.log('✅ Login successful! User info updated:', this.userInfo);
                    }
                }
                catch (error) {
                    console.log('Login still in progress or failed:', error.message);
                }
            }, 2000);
            return true;
        }
        catch (error) {
            console.error('Sign in failed:', error);
            return false;
        }
    }
    // Get current user information - simple like demo
    async getUserInfo() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return null;
        }
        try {
            // Always get fresh user info from SDK
            const freshUserInfo = await this.sdk.getUserInfo();
            // Update cached userInfo
            this.userInfo = freshUserInfo;
            return freshUserInfo;
        }
        catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    }
    // Submit player score to leaderboard - simple like demo
    async saveScore(score) {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            await this.sdk.saveScore(score);
            console.log(`Score ${score} submitted successfully to Funtico leaderboard`);
            return true;
        }
        catch (error) {
            console.error('Failed to save score:', error);
            return false;
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
            // Check if it's a server error
            if (error.status === 500 || error.status === 404) {
                console.log('❌ Funtico server error - leaderboard API not available');
                console.log('📧 Contact Funtico support: gameloop@funtico.com');
            }
            return [];
        }
    }
    // Sign out user - simple like demo
    async signOut() {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }
        try {
            await this.sdk.signOut(window.location.href);
            this.userInfo = null;
            return true;
        }
        catch (error) {
            console.error('Sign out failed:', error);
            return false;
        }
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
