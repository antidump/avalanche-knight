# 🎮 Avalanche Knight - Funtico GameLoop Integration

Endless runner game with **fully functional** Funtico SDK integration for tournaments and leaderboards.

## ✅ Current Status

**🎉 READY FOR FUNTICO SUBMISSION!**

- ✅ **Login/Authentication**: Working perfectly
- ✅ **Score Submission**: Successfully submitting to Funtico leaderboard  
- ✅ **User Session Management**: Auto-restore after login
- ✅ **Global Leaderboard Access**: B button works in all scenes
- ✅ **Clean UI**: No debug text or status messages
- ✅ **Vercel Deployment**: Live at https://avalanche-knight.vercel.app/
- ✅ **Zip Package**: Ready for Funtico Upload App submission

## 🚀 Quick Start

1. **Clone repository:**
   ```bash
   git clone https://github.com/Modolo-oss/Avalanche-Knight.git
   cd avalanche-knight
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm run dev
   ```

## 🎯 Deployment Options

### 🌟 **FUNTICO SUBMISSION (Ready!)**
1. **Upload App**: https://upload.gameloop.funtico.com/
2. **Password**: `xxxxxxxxxxx`
3. **Package**: `avalanche-knight-funtico.zip` (ready for upload)
4. **Instructions**: 
   - Upload zip file with `index.html` in root
   - Automatic hosting on Funtico infrastructure
   - No manual URL updates needed
   - **Status**: ✅ Ready for submission

### 📋 **Installation Guide for Funtico Team**
1. **Download**: `avalanche-knight-funtico.zip` from repository
2. **Extract**: Unzip to any folder
3. **Structure**: 
   ```
   avalanche-knight/
   ├── index.html          (main entry point)
   ├── js/                 (compiled JavaScript)
   │   ├── main.js
   │   ├── funtico-sdk.js
   │   └── game/
   ├── Icon.png           (game icon)
   ├── cover.png          (game cover)
   └── b.png, f.png       (game sprites)
   ```
4. **Deploy**: Upload to Funtico Upload App or host anywhere
5. **Test**: Open `index.html` in browser
6. **Features**: Login (L), Leaderboard (B), Gameplay (Arrow keys + Space)

### Vercel (Current Live)
- **Live URL**: https://avalanche-knight.vercel.app/
- **Status**: ✅ Fully functional
- **Auto-deploy**: On git push

### Itch.io (Backup)
- Can still upload to Itch.io for wider audience
- No manual URL updates needed anymore

## 🎮 Game Controls

- **Arrow Keys**: Move player
- **L**: Login to Funtico
- **B**: View leaderboard
- **Space**: Jump/Start game

## 📊 Features

- ✅ **Funtico SDK Integration**: Complete and tested
- ✅ **OAuth2 Authentication**: Working perfectly
- ✅ **Score Submission**: Successfully submitting scores
- ✅ **User Session Auto-Restore**: After login redirect
- ✅ **Global Leaderboard Access**: B button works in all scenes
- ✅ **Clean UI**: No debug text or status messages
- ✅ **Browser-native Alerts**: For login feedback and leaderboard
- ✅ **Error Handling**: Proper error messages for API issues
- ✅ **Mobile Support**: Responsive design
- ✅ **Audio Integration**: Sound effects and music

## 🔧 Technical Details

### Funtico SDK Configuration
```javascript
// Simplified configuration (working)
const sdk = new FunticoSDK({
    authClientId: 'gl-avalanche-knight'
});
```

### Key Features Implemented
- **Auto-session restore**: Detects existing login after redirect
- **Score submission**: Real-time feedback to user
- **Error handling**: Graceful handling of API errors
- **Global access**: `window.funticoManager` available

## 🧪 Testing Guide

### Pre-deployment Testing
1. **Local Testing**: Open `index.html` in browser
2. **Login Test**: Press L → Should redirect to Funtico login
3. **Gameplay Test**: Press Space → Start game, use Arrow keys
4. **Leaderboard Test**: Press B → Should show popup with scores
5. **Score Submission**: Play game → Score auto-submitted on game over

### Funtico Integration Testing
1. **Authentication**: Test login/logout flow
2. **Score Submission**: Verify scores appear in leaderboard
3. **Session Management**: Test auto-restore after redirect
4. **Error Handling**: Test with network issues
5. **Cross-browser**: Test on different browsers

### Performance Testing
- **Load Time**: Game should load within 3 seconds
- **Memory Usage**: Should not exceed 50MB
- **Frame Rate**: Should maintain 60fps on modern devices
- **File Size**: Zip package is 106KB (well under limits)

## 🔧 Troubleshooting

### Common Issues
1. **Game won't start**: Check browser console for errors
2. **Login not working**: Verify Funtico SDK is loaded
3. **Leaderboard empty**: Check Funtico API status
4. **Audio not playing**: Enable audio in browser settings
5. **Controls not responding**: Click on game area first

### Browser Compatibility
- ✅ **Chrome**: Fully supported
- ✅ **Firefox**: Fully supported  
- ✅ **Safari**: Fully supported
- ✅ **Edge**: Fully supported
- ✅ **Mobile browsers**: Responsive design

### System Requirements
- **Modern browser** with JavaScript enabled
- **Audio support** (optional)
- **Internet connection** for Funtico features
- **No additional plugins** required

## 📞 Support

- **Funtico Support**: gameloop@funtico.com
- **Upload App**: https://upload.gameloop.funtico.com/
- **Documentation**: https://js.demo.gameloop.funtico.com/
- **Live Demo**: https://avalanche-knight.vercel.app/
- **GitHub Issues**: Report bugs via GitHub repository

------

### Building

Typescript installation is mandatory. If you just want to make changes to the code, running `tsc` on the root is sufficient. If you want to make a zipped and "optimized" package that should fit 13kB (provided that you have up-to-date versions of all the tools), you need the following tools:
- Closure compiler
- advzip

Let us assume that you have the Closure compiler's `jar` file in the root and you have renamed it to `closure.jar`. Then you can run `CLOSURE_PATH=closure.jar make dist`. This should compile the Typescript, optimized the Javascript, embed the output script file to an index file and finally pack everything to a single zip file, of which size is then reduced using `advzip`. **Note that for some reason this might fail the first time you run the command, so try running it twice.**

-------

### License

The game has "I made my own license and saved money v. 0.1" license, which states the following:

```
SOURCE CODE (includes .ts, .html, .json and makefile files):

+ You are allowed to:
> Use the source code in your own personal, non-commercial projects. Giving credit to the original author of the code is not mandatory, but is recommended.
> Modify the source code in any way you want, and share the modified code. Again, giving credit to the original author is optional.

- You may not:
> Use the source code in a commercial product of any kind. This includes applications that cannot be accessed without a payment, but also applications that show ads when the application is running (for example, mobile games with ads). 
> Use the source code to train an AI. Not for any particular reason, I just want to see if the AI people actually read the source code licenses - or care about them.


ASSETS (includes .png files):

+ You are allowed to:
> Use the asset files in your own non-commercial projects, but in this case you have to give a credit to the original author.
> Modify the asset files as you like. If the modified assets are no longer recognizable (that is, they are heavily modified), then there is not need to give a credit to the original author.

- You are not allowed to:
> Do anything else with them, obviously.


BOTH:

- You may not:
> Do anything related to blockchains, NFTs or this weird term "web3" that seems to mean nothing at all.

```

------

(c) 2025 Avalanche GameLoop
