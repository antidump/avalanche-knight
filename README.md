# 🎮 Avalanche Knight - Funtico GameLoop Integration

Endless runner game with **fully functional** Funtico SDK integration for tournaments and leaderboards.

## ✅ Current Status

**🎉 INTEGRATION COMPLETE & TESTED!**

- ✅ **Login/Authentication**: Working perfectly
- ✅ **Score Submission**: Successfully submitting to Funtico leaderboard  
- ✅ **User Session Management**: Auto-restore after login
- ✅ **Vercel Deployment**: Live at https://avalanche-knight.vercel.app/
- ⚠️ **Leaderboard Display**: API returning 500 error (Funtico server issue)

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

### 🌟 **NEW: Funtico Upload App (Recommended)**
1. **Upload App**: https://upload.gameloop.funtico.com/
2. **Password**: `1k9nw448WaEVRXt`
3. **Instructions**: 
   - Upload zip file with `index.html` in root
   - Automatic hosting on Funtico infrastructure
   - No manual URL updates needed

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

- ✅ **Funtico SDK Integration**: Complete
- ✅ **OAuth2 Authentication**: Working
- ✅ **Score Submission**: Successfully submitting scores
- ✅ **User Session Auto-Restore**: After login redirect
- ✅ **Real-time Score Feedback**: Shows submission status
- ✅ **Error Handling**: Proper error messages for API issues

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

## 🐛 Known Issues

### Leaderboard API Error
- **Issue**: `500 Internal Server Error` from Funtico API
- **Endpoint**: `/api/v1/core/gamejam/games/leaderboard`
- **Status**: Funtico server issue (not our code)
- **Workaround**: Upload to new Funtico Upload App may resolve

## 📞 Support

- **Funtico Support**: gameloop@funtico.com
- **Upload App**: https://upload.gameloop.funtico.com/
- **Documentation**: https://js.demo.gameloop.funtico.com/

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
