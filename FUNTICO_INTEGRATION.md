# 🎮 Funtico GameLoop SDK Integration - Avalanche Knight

## ⚠️ **IMPORTANT: Redirect URI Registration Required**

**Current Issue**: The `redirect_uri` parameter is not registered with Funtico for this client ID.

**Error**: `The 'redirect_uri' parameter does not match any of the OAuth 2.0 Client's pre-registered redirect urls.`

**Solution**: Contact Funtico support to register the following URLs:
- **Email**: `gameloop@funtico.com` or `support@funtico.com`
- **URLs to register**:
  - `http://localhost:8002` (for local development)
  - `https://avalanche-knight.vercel.app` (for production)

---

## 🎮 Funtico GameLoop SDK Integration - Avalanche Knight

## 📋 Overview

This document explains how Funtico GameLoop SDK has been integrated into the Avalanche Knight game for the Avalanche GameLoop hackathon.

## 🚀 Features Implemented

### ✅ Authentication System
- **Login/Logout**: Press `L` key on title screen to login or logout
- **User Info Display**: Shows current username when logged in
- **Automatic Redirect**: Handles OAuth2 flow with callback URL

### ✅ Score Submission
- **Automatic Submission**: Scores are automatically submitted to Funtico leaderboard when game ends
- **Authentication Check**: Only submits scores when user is logged in
- **Error Handling**: Graceful fallback if submission fails

### ✅ UI Integration
- **Title Screen**: Shows login status and instructions
- **Visual Feedback**: Clear indication of login state
- **User-Friendly**: Simple L key press to login/logout

## 🛠 Technical Implementation

### Files Modified/Added

1. **`index.html`** - Added Funtico SDK script
2. **`src/funtico-sdk.ts`** - New SDK wrapper class
3. **`src/game/game.ts`** - Integrated SDK methods
4. **`src/main.ts`** - Added login key binding
5. **`auth/callback.html`** - Authentication callback page

### Key Components

#### FunticoManager Class
```typescript
export class FunticoManager {
    // Handles all SDK operations
    - signIn(): Promise<boolean>
    - getUserInfo(): Promise<any>
    - saveScore(score: number): Promise<boolean>
    - getLeaderboard(): Promise<any[]>
    - signOut(): Promise<boolean>
}
```

#### Game Integration
```typescript
// Automatic score submission on game over
private async submitScoreToFuntico(score: number): Promise<void>

// Login/logout handling
public async handleLogin(): Promise<boolean>

// User info display
public getCurrentUsername(): string
public isLoggedIn(): boolean
```

## 🎯 How to Use

### For Players
1. **Start Game**: Open the game in a web browser
2. **Login**: Press `L` key on title screen to login with Funtico
3. **Play**: Play the game normally
4. **Compete**: Your scores will automatically be submitted to the leaderboard

### For Developers

#### Setup
1. **Get Client ID**: Request from gameloop@funtico.com
2. **Update Configuration**: Replace `'your-client-id'` in `src/funtico-sdk.ts`
3. **Deploy**: Ensure callback URL is accessible

#### Testing
- **Sandbox Mode**: Currently configured for development
- **Test Accounts**: Use provided test emails for testing
- **Browser Console**: Check for SDK logs and errors

## 🔧 Configuration

### Environment Settings
```typescript
// Development (current)
env: 'sandbox'

// Production (when ready)
env: 'production'
```

### Test Accounts (Sandbox)
- `gameloop_01@funtico.com`
- `gameloop_02@funtico.com`
- `gameloop_03@funtico.com`
- `gameloop_04@funtico.com`
- `gameloop_05@funtico.com`
- **Password**: `GameLoop123!`

## 📱 Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (not supported)

## 🚨 Important Notes

### Development vs Production
- **Current State**: Configured for sandbox environment
- **Client ID**: Needs to be obtained from Funtico
- **Callback URL**: Must be accessible when deployed

### Security Considerations
- ✅ No client secrets in frontend code
- ✅ OAuth2 flow handled securely
- ✅ Tokens managed by SDK

### Error Handling
- ✅ Graceful fallbacks for network issues
- ✅ Console logging for debugging
- ✅ No crashes if SDK fails

## 🎮 Game Loop Hackathon Compliance

This integration fully supports the Avalanche GameLoop hackathon requirements:

- ✅ **High Score Theme**: Leaderboard competition
- ✅ **Funtico Integration**: Full SDK implementation
- ✅ **User Authentication**: Secure login system
- ✅ **Score Tracking**: Automatic submission
- ✅ **Competitive Play**: Global leaderboard access

## 🔄 Next Steps

1. **Get Client ID**: Contact Funtico for production client ID
2. **Test Thoroughly**: Use sandbox accounts for testing
3. **Deploy**: Set up proper callback URL for production
4. **Monitor**: Check leaderboard functionality
5. **Submit**: Ready for hackathon submission!

## 📞 Support

For Funtico SDK issues:
- Email: gameloop@funtico.com or support@funtico.com
- Documentation: Provided SDK docs
- Console Logs: Check browser console for debugging

---

**Game**: Avalanche Knight  
**Hackathon**: Avalanche GameLoop  
**Integration**: Funtico GameLoop SDK  
**Status**: Ready for Testing 🚀






