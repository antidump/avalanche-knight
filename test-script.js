// Test script untuk login dan leaderboard
// Jalankan di console browser di https://avalanche-knight.vercel.app

async function testLoginAndLeaderboard() {
    console.log('🔐 Testing login and leaderboard...');
    
    try {
        // Check if FunticoSDK is available
        if (typeof FunticoSDK === 'undefined') {
            console.error('❌ FunticoSDK not available');
            return;
        }
        
        // Initialize SDK
        const sdk = new FunticoSDK({
            authClientId: 'gl-avalanche-knight',
            env: 'sandbox'
        });
        
        console.log('✅ SDK initialized');
        
        // Test leaderboard first (without login)
        console.log('📊 Testing leaderboard...');
        try {
            const leaderboard = await sdk.getLeaderboard();
            console.log('✅ Leaderboard result:', leaderboard);
            
            if (leaderboard && leaderboard.length > 0) {
                console.log('🎉 Leaderboard has data!');
                console.table(leaderboard);
            } else {
                console.log('📭 No leaderboard data');
            }
        } catch (leaderboardError) {
            console.error('❌ Leaderboard error:', leaderboardError);
            console.log('Error details:', {
                message: leaderboardError.message,
                status: leaderboardError.status,
                type: leaderboardError.constructor.name
            });
        }
        
        // Test user info
        console.log('👤 Testing user info...');
        try {
            const userInfo = await sdk.getUserInfo();
            console.log('✅ User info:', userInfo);
        } catch (userError) {
            console.log('ℹ️ User not authenticated (expected):', userError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testLoginAndLeaderboard();
