import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";
import { Terrain } from "./terrain.js";
import { DEATH_TIME, Player } from "./player.js";
import { Camera } from "./camera.js";
import { updateSpeedAxis } from "./gameobject.js";
import { funticoManager } from "../funtico-sdk.js";


const SPEED_UP_ALERT_TIME = 180;


const scoreToString = (score : number) : string => {

    const s = String(score);
    return "0".repeat(Math.max(0, 6 - s.length)) + s; 
}


const getHiscore = () : number => {

    try {

        return Number(window["localStorage"].getItem("__s"));
    }
    catch (e) {}
    return 0;
}


const storeScore = (score : number) : void => {

    try {

        window["localStorage"].setItem("__s", String(score));
    }
    catch (e) {}
}


export class Game implements Scene {


    private terrain : Terrain;
    private player : Player;
    private camera : Camera;

    private cloudPos : number = 0;

    private globalSpeed : number = 0.0;
    private targetSpeed : number = 1.0; // 2.0;
    private playTime : number = 0;
    private speedUpCount : number = 0;
    private speedUpAlert : number = 0;

    private paused : boolean = false;
    private gameOverPhase : number = 0;
    private showLeaderboard : boolean = false;
    private scoreSubmitted : boolean = false;
    private scoreSubmissionStatus : string = "";
    private cachedLeaderboard : any[] = [];
    private leaderboardLoaded : boolean = false;

    private transitionTimer : number = 1.0;
    private fadeIn : boolean = false;

    private hiscore : number = 0;

    private titleScreenActive : boolean = true;
    private enterTimer : number = 0.49;
    private gameStarted : boolean = false;

    // For animation
    private oldFuel : number = 1.0;


    constructor(event : ProgramEvent) {

        this.terrain = new Terrain(event);
        this.player = new Player(64, event.screenHeight - 40);
        this.camera = new Camera(-144);
        

        this.hiscore = getHiscore();
        
        // Check if user is already logged in and show popup
        this.checkExistingLogin();
    }


    private checkExistingLogin() : void {
        // Check if user is already logged in from existing session
        setTimeout(() => {
            if (funticoManager.isAuthenticated()) {
                const username = funticoManager.getUsername();
                if (username) {
                    console.log('Existing login detected:', username);
                    // Show browser alert instead of in-game popup
                    alert(`Welcome back, ${username}!`);
                }
            }
        }, 1000); // Wait 1 second for SDK to initialize
    }

    private drawBackground(canvas : Canvas, assets : AssetManager) : void {

        const CLOUD_Y = 64;
        const CLOUD_EXTRA_HEIGHT = 16;
        const CAMERA_SHIFT_FACTOR = 0.25;

        const bmpBase = assets.getBitmap("b");

        canvas.drawBitmap(assets.getBitmap("s"));

        canvas.move(0,-Math.round(this.camera.getPosition()*CAMERA_SHIFT_FACTOR));

        // Clouds
        canvas.fillColor("#ffffff");
        canvas.fillRect(0, CLOUD_Y + 16, canvas.width, CLOUD_EXTRA_HEIGHT);

        const shift = -Math.round(this.cloudPos);
        for (let i = 0; i < (canvas.width/48) + 2; ++ i) {

            canvas.drawBitmap(bmpBase, shift + i*48, CLOUD_Y, 0, 56, 48, 16)
        }

        // Water
        const waterY = (CLOUD_Y + CLOUD_EXTRA_HEIGHT + 32);

        canvas.fillColor("#0055aa");
        canvas.fillRect(0, waterY, canvas.width, canvas.height - waterY);

        for (let i = 0; i < canvas.width/8; ++ i) {

            canvas.drawBitmap(bmpBase, i*8, CLOUD_Y + 16 + CLOUD_EXTRA_HEIGHT, 48, 56, 8, 16);
        }

        canvas.moveTo();
    }


    private reset(event : ProgramEvent) : void {

        this.player = new Player(64, event.screenHeight - 40);
        this.terrain = new Terrain(event)
        this.camera.reset();

        this.globalSpeed = 0.0;
        this.targetSpeed = 1.0;
        this.playTime = 0.0;
        this.speedUpCount = 0;
        this.speedUpAlert = 0;
        this.oldFuel = 1.0;

        this.gameOverPhase = 0;
        this.scoreSubmitted = false;
        this.scoreSubmissionStatus = "";
        this.showLeaderboard = false;
    }


    private drawGameOver(canvas : Canvas, assets : AssetManager) : void {

        const bmpGameOver = assets.getBitmap("g");
        const fontYellow = assets.getBitmap("fy");

        const cx = canvas.width/2;
        const dx = cx - 60;
        const dy = 32;

        if (this.gameOverPhase == 2) {

            canvas.fillColor("#000000aa");
            canvas.fillRect();

            // ALL TEXT REMOVED FOR DEBUGGING
            canvas.drawText(fontYellow, "SCORE: " + scoreToString(this.player.getScore()), cx, 80, -1, 0, TextAlign.Center);
            canvas.drawText(fontYellow, "BEST: " + scoreToString(this.hiscore), cx, 96, -1, 0, TextAlign.Center);
            
            // Show score submission status
            if (this.scoreSubmissionStatus) {
                const statusColor = this.scoreSubmitted ? "#00ff00" : "#ffff00";
                canvas.drawText(fontYellow, this.scoreSubmissionStatus, cx, 112, -1, 0, TextAlign.Center);
            }
            
            // Show controls
            if (this.enterTimer >= 0.5) {
                canvas.drawText(fontYellow, "ENTER: RESTART", cx, canvas.height - 20, -1, 0, TextAlign.Center);
            }
        }

        let t = this.player.getDeathTimer() / DEATH_TIME;
        if (this.gameOverPhase == 1 && t < 0.5) {

            t = (0.5 - t)*2;
            canvas.drawFunkyWaveEffectBitmap(bmpGameOver, dx, dy, t*t, 32, 4, 16);
            return;
        }
        canvas.drawBitmap(bmpGameOver, dx, dy);
    }


    private drawHUD(canvas : Canvas, assets : AssetManager) : void {

        const BAR_COLOR_1 = [ "#aaff00", "#ffff55", "#ffaa00", "#aa0000", "#000000" ];
        const BAR_COLOR_2 = [ "#55aa00", "#aaaa00", "#aa5500", "#550000", "#000000" ];
        const BAR_OUTER_COLOR = [ "#000000", "#555555" ];
        const BAR_WIDTH = 40;
        const BAR_HEIGHT = 7;
        const BAR_X = 12;
        const BAR_Y = 5;

        const bmpBase = assets.getBitmap("b");
        const bmpFont = assets.getBitmap("fw");

        canvas.fillColor("#00000033");
        canvas.fillRect(0, 0, canvas.width, 16);

        // Score
        canvas.drawBitmap(bmpBase, canvas.width/2 - 8, 1, 48, 80, 16, 8);
        canvas.drawText(bmpFont, scoreToString(this.player.getScore()), canvas.width/2, 8, -1, 0, TextAlign.Center);
        
        // Orbs - DISABLED FOR DEBUG
        canvas.drawBitmap(bmpBase, canvas.width - 40, 4, 32, 88, 8, 8);
        // canvas.drawText(bmpFont, "#" + String(this.player.getOrbs()), canvas.width - 31, 4, -1);

        // Fuel

        canvas.drawBitmap(bmpBase, 2, 4, 40, 88, 8, 8);

        for (let i = 0; i < 2; ++ i) {

            canvas.fillColor(BAR_OUTER_COLOR[i]);
            canvas.fillRect(BAR_X + i, BAR_Y + i, BAR_WIDTH - i*2, BAR_HEIGHT - i*2);
        }

        const fillLevel = (this.oldFuel * (BAR_WIDTH - 2)) | 0;
        const barIndex = 3 - Math.round(this.oldFuel*3);

        if (fillLevel > 1) {

            canvas.fillColor(BAR_COLOR_2[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel, BAR_HEIGHT - 2);

            canvas.fillColor(BAR_COLOR_1[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel - 1, BAR_HEIGHT - 3);
        }
    }
    

    private drawTitleScreen(canvas : Canvas, assets : AssetManager) : void {

        const bmpLogo = assets.getBitmap("l");
        const bmpFont = assets.getBitmap("fy");
        const bmpFontWhite = assets.getBitmap("fw");
    
        const w = canvas.width;
        const h = canvas.height;

        canvas.fillColor("#00000055");
        canvas.fillRect();

        let moveY = 0;
        if (this.transitionTimer > 0) {

            moveY = this.transitionTimer * canvas.height;
        }
        canvas.move(0, Math.round(moveY));

        canvas.drawVerticallyWavingBitmap(bmpLogo, w/2 - bmpLogo.width/2, 12, Math.PI*2, 4, (this.enterTimer + this.transitionTimer)*Math.PI*2);
        // canvas.drawBitmap(bmpLogo, w/2 - bmpLogo.width/2, 16);

        // Show username in top-right corner if logged in - DISABLED FOR DEBUG
        // if (funticoManager.isAuthenticated()) {
        //     const username = funticoManager.getUsername();
        //     if (username) {
        //         canvas.drawText(bmpFontWhite, `Hi ${username}`, w - 20, 4, -1, 0, TextAlign.Right);
        //     }
        // }

        // Controls
        canvas.fillRect(24, 40, canvas.width - 48, 72);
        canvas.drawText(bmpFont, "CONTROLS: ", canvas.width/2, 44, 0, 0, TextAlign.Center);
        canvas.drawText(bmpFontWhite, "+;/< OR A/D: MOVE", 28, 54);
        canvas.drawText(bmpFontWhite, "+= OR W: JUMP/FLY", 28, 64);
        canvas.drawText(bmpFontWhite, "+SPACE: ATTACK", 28, 74);
        canvas.drawText(bmpFontWhite, "+ENTER: PAUSE", 28, 84);
        canvas.drawText(bmpFontWhite, "+L: LOGIN/LOGOUT", 28, 94);
        canvas.drawText(bmpFontWhite, "+B: LEADERBOARD", 28, 104);

        // Funtico Status - REMOVED
        // const funticoStatus = this.isLoggedIn() ? 
        //     `LOGGED IN: ${this.getCurrentUsername()}` : 
        //     "PRESS L TO LOGIN";
        // canvas.drawText(bmpFont, funticoStatus, w/2, 130, -1, 0, TextAlign.Center);

        if (this.enterTimer >= 0.5) {
            
            canvas.drawText(bmpFont, "PRESS ENTER", w/2, h - 24, -1, 0, TextAlign.Center);
        }

        canvas.drawText(bmpFont, "$2025 AVALANCHE GAMELOOP", w/2, h - 9, -1, 0, TextAlign.Center);

        // TEMP, a color test
        /*
        canvas.drawBitmap(assets.getBitmap("b1"), 0, 0);
        canvas.drawBitmap(assets.getBitmap("b2"), 16, 0);
        canvas.drawBitmap(assets.getBitmap("b3"), 32, 0);
        canvas.drawBitmap(assets.getBitmap("b4"), 48, 0);
        canvas.drawBitmap(assets.getBitmap("b5"), 64, 0);
        */

        canvas.moveTo();
    }

    private drawLeaderboard(canvas : Canvas, assets : AssetManager) : void {
        const bmpFont = assets.getBitmap("fy");
        const bmpFontWhite = assets.getBitmap("fw");
        const bmpFontYellow = assets.getBitmap("fy");
    
        const w = canvas.width;
        const h = canvas.height;

        canvas.fillColor("#00000055");
        canvas.fillRect();

        // Title
        canvas.drawText(bmpFontYellow, "LEADERBOARD", w/2, 20, -1, 0, TextAlign.Center);

        // Load leaderboard data only once
        if (!this.leaderboardLoaded) {
            this.leaderboardLoaded = true;
            this.getFunticoLeaderboard().then(leaderboard => {
                // Handle both array and object with numeric keys
                if (Array.isArray(leaderboard)) {
                    this.cachedLeaderboard = leaderboard;
                } else if (typeof leaderboard === 'object' && leaderboard !== null) {
                    // Convert object with numeric keys to array
                    this.cachedLeaderboard = Object.values(leaderboard);
                } else {
                    this.cachedLeaderboard = [];
                }
                console.log('Processed leaderboard data:', this.cachedLeaderboard);
            }).catch(error => {
                console.error('Error loading leaderboard:', error);
                this.cachedLeaderboard = [];
            });
        }
        
        // Draw cached leaderboard data
        if (this.cachedLeaderboard.length === 0) {
            // No leaderboard data available
            canvas.drawText(bmpFontYellow, "NO LEADERBOARD DATA", w/2, h/2 - 10, -1, 0, TextAlign.Center);
            canvas.drawText(bmpFontWhite, "Login to submit scores", w/2, h/2 + 5, -1, 0, TextAlign.Center);
        } else {
            // Draw leaderboard entries
            let y = 40;
            for (const entry of this.cachedLeaderboard) {
                const rankText = `#${entry.place.toString().padStart(2, ' ')}`;
                const nameText = entry.user.username;
                const scoreText = entry.score.toString().padStart(5, ' ');
                
                // Highlight current user if logged in
                if (this.isLoggedIn() && entry.user.username === this.getCurrentUsername()) {
                    canvas.fillColor("#ffff0033");
                    canvas.fillRect(20, y - 2, w - 40, 10);
                }
                
                canvas.drawText(bmpFontWhite, rankText, 25, y);
                canvas.drawText(bmpFontWhite, nameText, 50, y);
                canvas.drawText(bmpFontWhite, scoreText, w - 60, y);
                y += 10;
            }
        }

        // Instructions
        canvas.drawText(bmpFontYellow, "B: BACK TO MENU", w/2, h - 20, -1, 0, TextAlign.Center);
        // canvas.drawText(bmpFontYellow, "L: LOGIN TO COMPETE", w/2, h - 10, -1, 0, TextAlign.Center);
    }

    private drawTransition(canvas : Canvas) : void {

        if (this.transitionTimer <= 0)
            return;

        let t = this.transitionTimer;
        if (!this.fadeIn)
            t = 1.0 - t;

        canvas.fillColor("#000000");
        canvas.fillCircleOutside((Math.hypot(canvas.width/2, canvas.height/2)*t*t) | 0);
    }


    // public init(param : SceneParameter, event : ProgramEvent) : void {}


    private updateTimersAndSpeed(event : ProgramEvent) : void {

        // const SPEED_UP_INTERVALS = [30, 60, 90, 120];

        if (this.speedUpAlert > 0) {

            this.speedUpAlert -= event.tick;
        }

        this.playTime += event.tick
        if (this.speedUpCount < 4 &&
            this.playTime >= (this.speedUpCount+1)*1200) {

            this.targetSpeed = 1.0 + (++ this.speedUpCount)*0.25;
            this.speedUpAlert = SPEED_UP_ALERT_TIME;

            event.audio.playSample(event.assets.getSample("au"), 0.50);
        }

        this.globalSpeed = updateSpeedAxis(
            this.globalSpeed, 
            this.targetSpeed, 
            1.0/60.0*(this.gameOverPhase*2 + 1));

        this.oldFuel = updateSpeedAxis(this.oldFuel, this.player.getFuel(), 1.0/60.0*event.tick);
    }


    public update(event : ProgramEvent) : void {

        const CLOUD_BASE_SPEED = 0.25;
        const CLOUD_SPEED_FACTOR = 0.125;
        const TRANSITION_SPEED = 1.0/30.0;
        const ENTER_SPEED = 1.0/60.0;
        const MAX_PLAY_TIME_MOD = 180*60;

        const speedFactor = this.titleScreenActive ? 0.5 : 1.0;

        if (this.transitionTimer > 0.0) {

            if ((this.transitionTimer -= TRANSITION_SPEED*speedFactor*event.tick) <= 0.0 &&
                this.gameOverPhase == 2) {

                this.transitionTimer = 1.0;
                this.fadeIn = false;
                this.reset(event);
            }
            return;
        }

        // Yes we also update this when the "Press Enter" text is 
        // not shown to avoid having to write this twice, thus saving
        // some precious bytes
        this.enterTimer = (this.enterTimer + ENTER_SPEED*event.tick) % 1.0;

        if (this.titleScreenActive) {

            this.cloudPos = (this.cloudPos + CLOUD_BASE_SPEED*event.tick) % 48;
            
            
            if (event.input.getAction("s") == InputState.Pressed) {

                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.titleScreenActive = false;
            }
            
            // Handle Funtico login/logout
            if (event.input.getAction("login") == InputState.Pressed) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.handleLogin();
            }
            
            // Handle leaderboard
            if (event.input.getAction("leaderboard") == InputState.Pressed) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.showLeaderboard = !this.showLeaderboard;
                // Reset cache when opening leaderboard
                if (this.showLeaderboard) {
                    this.leaderboardLoaded = false;
                    this.cachedLeaderboard = [];
                }
            }
            
            return;
        }

        if (!this.gameStarted) {

            this.gameStarted = this.camera.reachInitialPoint(event);
            return;
        }

        if (this.gameOverPhase == 2) {

            if (event.input.getAction("s") == InputState.Pressed) {

                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.transitionTimer = 1.0;
                this.fadeIn = true;
            }
            
            // Handle return to home button in game over screen
            if (event.input.getAction("h") == InputState.Pressed) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.titleScreenActive = true;
                this.gameOverPhase = 0;
                this.showLeaderboard = false;
            }
            
            // Handle leaderboard button in game over screen
            if (event.input.getAction("leaderboard") == InputState.Pressed) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.showLeaderboard = !this.showLeaderboard;
                // Reset cache when opening leaderboard
                if (this.showLeaderboard) {
                    this.leaderboardLoaded = false;
                    this.cachedLeaderboard = [];
                }
            }
            
            return;
        }

        if (this.gameOverPhase == 0 &&
            event.input.getAction("p") == InputState.Pressed) {

            event.audio.playSample(event.assets.getSample("as"), 0.60);
            this.paused = !this.paused;
        }
        if (this.paused)
            return;

        this.updateTimersAndSpeed(event);
        this.terrain.update(this.player, this.playTime/MAX_PLAY_TIME_MOD, this.globalSpeed, event);

        this.player.update(this.globalSpeed, event);
        if (this.gameOverPhase == 0 && this.player.isDying()) {

            this.gameOverPhase = 1;
            this.targetSpeed = 0.0;
            
            const finalScore = this.player.getScore();
            this.hiscore = Math.max(finalScore, this.hiscore);
            storeScore(this.hiscore);
            
            // Submit score to Funtico leaderboard
            this.submitScoreToFuntico(finalScore);
        }

        if (!this.player.doesExist()) {
            
            this.gameOverPhase = 2;
            return;
        }

        this.terrain.objectCollision(this.player, this.globalSpeed, event);

        this.camera.followObject(this.player, event);

        this.cloudPos = (this.cloudPos + (CLOUD_BASE_SPEED + this.globalSpeed*CLOUD_SPEED_FACTOR)*event.tick) % 48;
    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        const SHAKE_TIME = 30;

        const fontYellow = assets.getBitmap("fy");

        canvas.moveTo();

        this.drawBackground(canvas, assets);

        this.camera.use(canvas);

        if (this.gameOverPhase == 1 &&
            this.player.getDeathTimer() < SHAKE_TIME) {

            canvas.move(
                ((Math.random()*2 - 1) * 4) | 0,
                ((Math.random()*2 - 1) * 4) | 0);
        }

        this.terrain.draw(canvas, assets);
        this.player.draw?.(canvas, assets);

        canvas.moveTo();
        if (this.gameOverPhase > 0) {

            this.drawGameOver(canvas, assets);
            
            // Draw leaderboard if active in game over screen
            if (this.showLeaderboard) {
                this.drawLeaderboard(canvas, assets);
            }
        }
        else if (!this.titleScreenActive) {

            this.drawHUD(canvas, assets);
            if (this.paused) {

                canvas.fillColor("#00000055");
                canvas.fillRect();

                canvas.drawText(fontYellow, "PAUSED", 
                    canvas.width/2, canvas.height/2 - 4, -1, 0, TextAlign.Center);
            }
            else if (this.speedUpAlert > 0 &&
                ( this.speedUpAlert > 60 || (((this.speedUpAlert/4) | 0) % 2) == 0 ) ) {

                canvas.drawText(fontYellow, "SPEED UP!", 
                    canvas.width/2, 32, -1, 0, TextAlign.Center);
            }
        }

        else if (this.titleScreenActive) {

            this.drawTitleScreen(canvas, assets);
            
            // Draw leaderboard if active
            if (this.showLeaderboard) {
                this.drawLeaderboard(canvas, assets);
            }
        }

        this.drawTransition(canvas);

        //canvas.moveTo();
        //canvas.drawBitmap(assets.getBitmap("t"));
    }

    // Funtico SDK Integration Methods
    private async getFunticoLeaderboard(): Promise<any[]> {
        if (!funticoManager.isReady()) {
            console.log('Funtico SDK not ready');
            return [];
        }

        try {
            const leaderboard = await funticoManager.getLeaderboard();
            console.log('Real leaderboard data from Funtico:', leaderboard);
            return leaderboard;
        } catch (error) {
            console.error('Failed to get Funtico leaderboard:', error);
            
            // Check if it's a server error
            if (error.status === 500 || error.status === 404) {
                console.log('❌ Funtico server error - leaderboard API not available');
                console.log('📧 Contact Funtico support: gameloop@funtico.com');
            }
            
            return [];
        }
    }

    private async submitScoreToFuntico(score: number): Promise<void> {
        if (funticoManager.isReady() && funticoManager.isAuthenticated()) {
            try {
                this.scoreSubmissionStatus = "Submitting score...";
                const success = await funticoManager.saveScore(score);
                if (success) {
                    this.scoreSubmitted = true;
                    this.scoreSubmissionStatus = `Score ${score} submitted!`;
                    console.log(`Score ${score} submitted to Funtico leaderboard`);
                } else {
                    this.scoreSubmissionStatus = "Failed to submit score";
                    console.log('Failed to submit score to Funtico');
                }
            } catch (error) {
                this.scoreSubmissionStatus = "Error submitting score";
                console.error('Error submitting score to Funtico:', error);
            }
        }         else {
            this.scoreSubmissionStatus = "";
            console.log('User not authenticated with Funtico, skipping score submission');
        }
    }

    // Method to handle login button press (can be called from UI)
    public async handleLogin(): Promise<boolean> {
        if (!funticoManager.isReady()) {
            console.error('Funtico SDK not ready');
            return false;
        }

        try {
            const success = await funticoManager.signIn();
            if (success) {
                const userInfo = await funticoManager.getUserInfo();
                if (userInfo) {
                    console.log(`Welcome ${userInfo.username}!`);
                    // Ensure we're on title screen after login
                    this.titleScreenActive = true;
                    // Show browser alert instead of in-game popup
                    alert(`Welcome, ${userInfo.username}!`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }

    // Method to get current username for display
    public getCurrentUsername(): string {
        return funticoManager.getUsername();
    }

    // Method to check if user is logged in
    public isLoggedIn(): boolean {
        return funticoManager.isAuthenticated();
    }

}

