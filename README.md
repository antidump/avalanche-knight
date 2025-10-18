# 🎮 Avalanche Knight - Funtico GameLoop Integration

Endless runner game with Funtico SDK integration for tournaments and leaderboards.

## 🚀 Quick Start

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd avalanche-knight
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build and run:**
   ```bash
   npm run build
   npm run dev
   ```

## ⚙️ Environment Configuration

### `.env` File
```bash
# Environment: 'sandbox' or 'production'
FUNTICO_ENV=sandbox

# Redirect URL for OAuth callback
FUNTICO_REDIRECT_URL=https://your-app.vercel.app/

# Funtico Client ID
FUNTICO_CLIENT_ID=gl-avalanche-knight

# Auto-login setting (true/false)
FUNTICO_AUTO_LOGIN=false

# Funtico API endpoints
FUNTICO_AUTH_URL=https://staging.login.funtico.com
FUNTICO_API_URL=https://api.funtico.com
```

### 🔄 Swappable Redirect URLs

**For Vercel Deployment:**
```bash
FUNTICO_REDIRECT_URL=https://avalanche-knight.vercel.app/
```

**For Funtico Hosting:**
```bash
FUNTICO_REDIRECT_URL=https://games.funtico.com/avalanche-knight/auth/callback
```

**For Local Development:**
```bash
FUNTICO_REDIRECT_URL=http://localhost:8000/
```

## 🎯 Deployment

### Vercel
1. Update `vercel.json` with your environment variables
2. Deploy: `vercel --prod`

### Funtico Platform
1. Update `.env` with Funtico redirect URL
2. Build: `npm run build`
3. Send build files to Funtico team

## 🎮 Game Controls

- **Arrow Keys**: Move player
- **L**: Login to Funtico
- **B**: Back to menu
- **Space**: Jump/Start game

## 📊 Features

- ✅ Funtico SDK integration
- ✅ OAuth2 authentication
- ✅ Score submission to leaderboard
- ✅ Real-time leaderboard display
- ✅ Swappable redirect URLs
- ✅ Environment-based configuration

## 🔧 Troubleshooting

### Login Issues
- Check redirect URL in `.env`
- Verify client ID with Funtico support
- Clear browser cache and cookies

### Build Issues
- Run `npm run build` to compile TypeScript
- Check `tsconfig.json` configuration

## 📞 Support

- **Funtico Support**: gameloop@funtico.com
- **Documentation**: https://js.demo.gameloop.funtico.com/

------

## Original Game Info

Avalanche Knight is a tiny arcade endless runner action game themed for Avalanche GameLoop hackathon. Originally made for [js13k competition (2023)](/https://js13kgames.com/).

------

### ⚠️ Warning ⚠️

The code is bad. Like, really bad in some places. This was, however, intentional (well, there is also unintentional spaghetti, but let's ignore it for now), since I needed to find ways to save bytes, so I applied some... questionable programming practices. So, whatever you are going to do this with this code, please don't take any inspiration...

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
