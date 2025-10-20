// TEST SCRIPT UNTUK LOGIN & LEADERBOARD
// Jalankan di console browser di https://avalanche-knight.vercel.app

console.log('🔥 TESTING LOGIN & LEADERBOARD...');

async function testEverything() {
    try {
        // 1. Test SDK initialization
        console.log('1️⃣ Testing SDK initialization...');
        if (typeof FunticoSDK === 'undefined') {
            console.error('❌ FunticoSDK not available');
            return;
        }
        
        const sdk = new FunticoSDK({
            authClientId: 'gl-avalanche-knight',
            env: 'sandbox'
        });
        console.log('✅ SDK initialized');
        
        // 2. Test leaderboard (without login)
        console.log('2️⃣ Testing leaderboard...');
        try {
            const leaderboard = await sdk.getLeaderboard();
            console.log('✅ Leaderboard result:', leaderboard);
            
            if (leaderboard && leaderboard.length > 0) {
                console.log('🎉 LEADERBOARD HAS DATA!');
                console.table(leaderboard);
            } else {
                console.log('📭 No leaderboard data');
            }
        } catch (leaderboardError) {
            console.error('❌ Leaderboard error:', leaderboardError);
            console.log('Error status:', leaderboardError.status);
            console.log('Error message:', leaderboardError.message);
        }
        
        // 3. Test user info
        console.log('3️⃣ Testing user info...');
        try {
            const userInfo = await sdk.getUserInfo();
            console.log('✅ User info:', userInfo);
        } catch (userError) {
            console.log('ℹ️ User not authenticated:', userError.message);
        }
        
        // 4. Test login
        console.log('4️⃣ Testing login...');
        try {
            const loginResult = await sdk.signInWithFuntico();
            console.log('✅ Login initiated:', loginResult);
        } catch (loginError) {
            console.error('❌ Login error:', loginError);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testEverything();