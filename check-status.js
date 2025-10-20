// CEK STATUS LOGIN & LEADERBOARD
// Jalankan di console browser di https://avalanche-knight.vercel.app

console.log('🔍 CEKING STATUS LOGIN & LEADERBOARD...');

async function checkStatus() {
    try {
        // 1. Cek apakah funticoManager tersedia
        console.log('1️⃣ Checking funticoManager...');
        if (typeof window.funticoManager !== 'undefined') {
            console.log('✅ funticoManager available');
            console.log('Ready:', window.funticoManager.isReady());
            console.log('Authenticated:', window.funticoManager.isAuthenticated());
            
            // Cek user info
            try {
                const userInfo = await window.funticoManager.getUserInfo();
                console.log('✅ User info:', userInfo);
                if (userInfo) {
                    console.log('🎉 LOGIN BERHASIL!');
                    console.log('Username:', userInfo.username);
                    console.log('User ID:', userInfo.user_id);
                } else {
                    console.log('❌ LOGIN GAGAL - No user info');
                }
            } catch (userError) {
                console.log('❌ LOGIN GAGAL - Error getting user info:', userError.message);
            }
        } else {
            console.log('❌ funticoManager not available');
        }
        
        // 2. Cek leaderboard
        console.log('2️⃣ Checking leaderboard...');
        if (typeof window.funticoManager !== 'undefined') {
            try {
                const leaderboard = await window.funticoManager.getLeaderboard();
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
        }
        
        // 3. Cek SDK langsung
        console.log('3️⃣ Checking SDK directly...');
        if (typeof FunticoSDK !== 'undefined') {
            const sdk = new FunticoSDK({
                authClientId: 'gl-avalanche-knight',
                env: 'sandbox'
            });
            
            try {
                const userInfo = await sdk.getUserInfo();
                console.log('✅ SDK User info:', userInfo);
            } catch (sdkError) {
                console.log('ℹ️ SDK User not authenticated:', sdkError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error);
    }
}

// Run the check
checkStatus();
