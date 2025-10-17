// Funtico GameLoop SDK Integration for Avalanche Knight
// This file handles authentication, score submission, and leaderboard functionality
// Based on official documentation: https://js.demo.gameloop.funtico.com/

// Error handling types according to official documentation
interface SDKError {
    name: 'auth_error' | 'internal_server_error';
    status: number;
}

function isSDKError(error: unknown): error is SDKError {
    return typeof error === 'object' && error !== null && 'name' in error && 'status' in error;
}

export class FunticoManager {
    private sdk: any;
    private isInitialized: boolean = false;
    private userInfo: any = null;

    constructor() {
        this.initializeSDK();
    }

    private initializeSDK(): void {
        try {
            // Initialize SDK with sandbox environment for development
            // TODO: Replace 'your-client-id' with actual client ID from Funtico
            this.sdk = new (window as any).FunticoSDK({
                authClientId: 'gl-avalanche-knight', // Funtico GameLoop client ID
                env: 'sandbox' // Use 'production' for live games
            });
            this.isInitialized = true;
            console.log('Funtico SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Funtico SDK:', error);
            this.isInitialized = false;
        }
    }

    // Check if SDK is ready to use
    public isReady(): boolean {
        return this.isInitialized && this.sdk !== null;
    }

    // Start authentication flow - according to official documentation
    public async signIn(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            // Use current page as callback - this should work for most cases
            const callbackUrl = window.location.href;
            console.log('Attempting login with callback:', callbackUrl);
            
            await this.sdk.signInWithFuntico(callbackUrl);
            return true;
        } catch (error) {
            console.error('Sign in failed:', error);
            
            // Show user-friendly error message
            if (error.message && error.message.includes('redirect_uri')) {
                console.log('❌ Redirect URI not registered with Funtico');
                console.log('📧 Please contact Funtico support to register this URL:');
                console.log('   Email: gameloop@funtico.com or support@funtico.com');
                console.log('   URL to register:', window.location.href);
                
                // Show alert to user
                alert(`Login failed: Redirect URI not registered.\n\nPlease contact Funtico support:\nEmail: gameloop@funtico.com\nURL to register: ${window.location.href}`);
            }
            
            return false;
        }
    }

    // Get current user information - according to official documentation
    public async getUserInfo(): Promise<any> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return null;
        }

        try {
            this.userInfo = await this.sdk.getUserInfo();
            return this.userInfo;
        } catch (error) {
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
            } else {
                console.error('Unexpected error:', error);
            }
            return null;
        }
    }

    // Submit player score to leaderboard - according to official documentation
    public async saveScore(score: number): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            // Use official SDK method
            await this.sdk.saveScore(score);
            console.log(`Score ${score} submitted successfully to Funtico leaderboard`);
            return true;
        } catch (error) {
            console.error('Failed to save score:', error);
            return false;
        }
    }

    // Get leaderboard data
    public async getLeaderboard(): Promise<any[]> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return [];
        }

        try {
            const leaderboard = await this.sdk.getLeaderboard();
            return leaderboard;
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }

    // Sign out user - according to official documentation
    public async signOut(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            // Use official SDK method with redirect to current page
            await this.sdk.signOut(window.location.href);
            this.userInfo = null;
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            return false;
        }
    }

    // Check if user is authenticated
    public isAuthenticated(): boolean {
        return this.userInfo !== null;
    }

    // Get current user's username
    public getUsername(): string {
        return this.userInfo?.username || 'Guest';
    }

    // Get current user's ID
    public getUserId(): number | null {
        return this.userInfo?.user_id || null;
    }
}

// Create global instance
export const funticoManager = new FunticoManager();






