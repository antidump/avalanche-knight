// Funtico GameLoop SDK Integration for Avalanche Knight
// This file handles authentication, score submission, and leaderboard functionality

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
                authClientId: 'your-client-id', // This will be provided by Funtico
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

    // Start authentication flow
    public async signIn(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            await this.sdk.signInWithFuntico(window.location.origin + '/auth/callback');
            return true;
        } catch (error) {
            console.error('Sign in failed:', error);
            return false;
        }
    }

    // Get current user information
    public async getUserInfo(): Promise<any> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return null;
        }

        try {
            this.userInfo = await this.sdk.getUserInfo();
            return this.userInfo;
        } catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    }

    // Submit player score to leaderboard
    public async saveScore(score: number): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            await this.sdk.saveScore(score);
            console.log(`Score ${score} submitted successfully`);
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

    // Sign out user
    public async signOut(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            await this.sdk.signOut('/');
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






