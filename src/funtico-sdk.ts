// Funtico GameLoop SDK Integration for Avalanche Knight
// Simplified implementation based on working demo: https://js.demo.gameloop.funtico.com/

export class FunticoManager {
    private sdk: any;
    private isInitialized: boolean = false;
    private userInfo: any = null;

    constructor() {
        this.initializeSDK();
    }

    private initializeSDK(): void {
        try {
            // Simple initialization like the working demo
            this.sdk = new (window as any).FunticoSDK({
                authClientId: 'gl-avalanche-knight'
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

    // Simple login like the working demo
    public async signIn(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
            // Use window.location.href like the working demo
            await this.sdk.signInWithFuntico(window.location.href);
            console.log('Login initiated successfully');
            return true;
        } catch (error) {
            console.error('Sign in failed:', error);
            return false;
        }
    }

    // Get current user information - simple like demo
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

    // Submit player score to leaderboard - simple like demo
    public async saveScore(score: number): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
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

    // Sign out user - simple like demo
    public async signOut(): Promise<boolean> {
        if (!this.isReady()) {
            console.error('Funtico SDK not initialized');
            return false;
        }

        try {
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






