/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/common/math.ts
const negMod = (m, n) => ((m % n) + n) % n;
const clamp = (x, min, max) => Math.max(Math.min(x, max), min);
const sampleUniform = (min, max) => min + ((Math.random() * (max - min + 1)) | 0);
const sampleUniformInterpolate = (t, min, max) => {
    const imin = ((1 - t) * min[0] + t * min[1]) | 0;
    const imax = ((1 - t) * max[0] + t * max[1]) | 0;
    return imin + ((Math.random() * (imax - imin + 1)) | 0);
};
const weightedProbability = (weights) => weightedProbabilityInterpolate(weights, weights, 1.0);
const weightedProbabilityInterpolate = (weights1, weights2, t) => {
    let p = Math.random();
    let v1 = weights1[0];
    let v2 = weights2[0];
    let i;
    let len = Math.min(weights1.length, weights2.length);
    let v = (1.0 - t) * v1 + t * v2;
    for (i = 0; i < len; ++i) {
        if (p < v)
            break;
        if (i < len - 1) {
            v1 = weights1[i + 1];
            v2 = weights2[i + 1];
            v += (1.0 - t) * v1 + t * v2;
        }
    }
    return i;
};

;// ./src/audio/sample.ts

;
class Sample {
    constructor(ctx, sequence, baseVolume, type, ramp, attackTime) {
        this.oscillator = undefined;
        this.ctx = ctx;
        this.baseSequence = Array.from(sequence);
        this.baseVolume = baseVolume;
        this.type = type;
        this.ramp = ramp;
        this.attackTime = attackTime;
    }
    play(volume) {
        const INITIAL_VOLUME = 0.20;
        const FUNC = ["setValueAtTime", "linearRampToValueAtTime", "exponentialRampToValueAtTime"];
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.type;
        volume *= this.baseVolume;
        osc.frequency.setValueAtTime(this.baseSequence[0], time);
        gain.gain.setValueAtTime(INITIAL_VOLUME * volume, time);
        gain.gain.exponentialRampToValueAtTime(clamp(volume, 0.01, 1.0), time + this.attackTime / 60.0);
        let timer = 0.0;
        let freq;
        let len;
        for (let i = 0; i < this.baseSequence.length; i += 2) {
            freq = this.baseSequence[i];
            len = this.baseSequence[i + 1];
            /*
                        switch (this.ramp) {
                        
                        case Ramp.Instant:
                            osc.frequency.setValueAtTime(freq, time + timer);
                            break;
            
                        case Ramp.Linear:
                            osc.frequency.linearRampToValueAtTime(freq, time + timer);
                            break;
            
                        case Ramp.Exponential:
                            osc.frequency.exponentialRampToValueAtTime(freq, time + timer);
                            break;
            
                        default:
                            break;
                        }
                        */
            osc.frequency[FUNC[this.ramp]](freq, time + timer);
            timer += 1.0 / 60.0 * len;
        }
        gain.gain.exponentialRampToValueAtTime(volume * 0.50, time + timer);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + timer);
        osc.onended = () => osc.disconnect();
        this.oscillator?.disconnect();
        this.oscillator = osc;
    }
}

;// ./src/audio/audioplayer.ts

class AudioPlayer {
    constructor() {
        this.createSample = (sequence, baseVolume = 1.0, type = "square", ramp = 2 /* Ramp.Exponential */, attackTime = 2) => new Sample(this.ctx, sequence, baseVolume, type, ramp, attackTime);
        this.toggle = (state = !this.enabled) => (this.enabled = state);
        this.isEnabled = () => this.enabled;
        this.ctx = new AudioContext();
        this.enabled = true;
        // this.globalVolume = globalVolume;
    }
    playSample(s, volume = 1.0) {
        // Let's pretend that it's never undefined
        if (!this.enabled) // || s === undefined)
            return;
        try {
            s.play(volume * this.globalVolume);
        }
        catch (e) { }
    }
    setGlobalVolume(vol) {
        this.globalVolume = vol;
    }
}

;// ./src/common/vector.ts
class Vector {
    constructor(x = 0, y = 0) {
        this.clone = () => new Vector(this.x, this.y);
        this.x = x;
        this.y = y;
    }
    zero() {
        this.x = 0;
        this.y = 0;
    }
}

;// ./src/renderer/canvas.ts

const createCanvasElement = (width, height) => {
    const styleArg = "position: absolute; top: 0; left: 0; z-index: -1;";
    let div;
    let canvas;
    canvas = document.createElement("canvas");
    canvas.setAttribute("style", styleArg);
    canvas.setAttribute("style", styleArg +
        "image-rendering: optimizeSpeed;" +
        "image-rendering: pixelated;" +
        "image-rendering: -moz-crisp-edges;");
    canvas.width = width;
    canvas.height = height;
    div = document.createElement("div");
    div.setAttribute("style", styleArg);
    div.appendChild(canvas);
    document.body.appendChild(div);
    return [
        canvas,
        canvas.getContext("2d")
    ];
};
;
;
class Canvas {
    constructor(width, height) {
        this.activeColor = "#ffffff";
        this.width = width;
        this.height = height;
        [this.canvas, this.ctx] = createCanvasElement(width, height);
        this.ctx.imageSmoothingEnabled = false;
        this.translation = new Vector();
        window.addEventListener("resize", () => {
            this.resize(window.innerWidth, window.innerHeight);
        });
        this.resize(window.innerWidth, window.innerHeight);
    }
    resize(width, height) {
        let m = Math.min(width / this.width, height / this.height);
        if (m > 1.0)
            m |= 0;
        this.canvas.style.width = String((m * this.width) | 0) + "px";
        this.canvas.style.height = String((m * this.height) | 0) + "px";
        this.canvas.style.left = String((width / 2 - m * this.width / 2) | 0) + "px";
        this.canvas.style.top = String((height / 2 - m * this.height / 2) | 0) + "px";
    }
    clear(colorStr) {
        const c = this.ctx;
        c.fillStyle = colorStr;
        c.fillRect(0, 0, this.width, this.height);
        c.fillStyle = this.activeColor;
    }
    fillColor(colorStr) {
        this.ctx.fillStyle = (this.activeColor = colorStr);
    }
    fillRect(x = 0, y = 0, w = this.width, h = this.height) {
        const c = this.ctx;
        c.fillRect((x + this.translation.x) | 0, (y + this.translation.y) | 0, w | 0, h | 0);
    }
    fillCircle(cx, cy, radius) {
        const c = this.ctx;
        let r;
        let ny;
        cx += this.translation.x;
        cy += this.translation.y;
        cx |= 0;
        cy |= 0;
        for (let y = -radius; y <= radius; ++y) {
            ny = y / radius;
            if ((r = Math.round(Math.sqrt(1 - ny * ny) * radius)) <= 0)
                continue;
            c.fillRect(cx - r, cy + y, r * 2, 1);
        }
    }
    fillRing(cx, cy, innerRadius, outerRadius) {
        const c = this.ctx;
        let r1;
        let r2;
        let ny1;
        let ny2;
        innerRadius |= 0;
        outerRadius |= 0;
        if (innerRadius >= outerRadius)
            return;
        cx += this.translation.x;
        cy += this.translation.y;
        cx |= 0;
        cy |= 0;
        for (let y = -outerRadius; y <= outerRadius; ++y) {
            ny1 = y / outerRadius;
            if ((r1 = Math.round(Math.sqrt(1 - ny1 * ny1) * outerRadius)) <= 0)
                continue;
            r2 = 0;
            if (Math.abs(y) < innerRadius) {
                ny2 = y / innerRadius;
                r2 = Math.round(Math.sqrt(1 - ny2 * ny2) * innerRadius);
            }
            if (r2 <= 0) {
                c.fillRect(cx - r1, cy + y, r1 * 2, 1);
            }
            else {
                // Left-most part
                c.fillRect(cx - r1, cy + y, r1 - r2, 1);
                // Right-most part
                c.fillRect(cx + r2, cy + y, r1 - r2, 1);
            }
        }
    }
    fillCircleOutside(r, cx = this.width / 2, cy = this.height / 2) {
        const c = this.ctx;
        const start = Math.max(0, cy - r) | 0;
        const end = Math.min(this.height, cy + r) | 0;
        if (start > 0)
            c.fillRect(0, 0, this.width, start);
        if (end < this.height)
            c.fillRect(0, end, this.width, this.height - end);
        let dy;
        let px1;
        let px2;
        for (let y = start; y < end; ++y) {
            dy = y - cy;
            if (Math.abs(dy) >= r) {
                c.fillRect(0, y, this.width, 1);
                continue;
            }
            px1 = Math.round(cx - Math.sqrt(r * r - dy * dy));
            px2 = Math.round(cx + Math.sqrt(r * r - dy * dy));
            if (px1 > 0)
                c.fillRect(0, y, px1, 1);
            if (px2 < this.width)
                c.fillRect(px2, y, this.width - px1, 1);
        }
        return this;
    }
    drawBitmap(bmp, dx = 0, dy = 0, sx = 0, sy = 0, sw = bmp.width, sh = bmp.height, flip = 0 /* Flip.None */) {
        const c = this.ctx;
        const saveState = flip != 0 /* Flip.None */;
        dx += this.translation.x;
        dy += this.translation.y;
        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx |= 0;
        dy |= 0;
        if (saveState) {
            c.save();
        }
        if ((flip & 1 /* Flip.Horizontal */) != 0) {
            c.translate(sw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & 2 /* Flip.Vertical */) != 0) {
            c.translate(0, sh);
            c.scale(1, -1);
            dy *= -1;
        }
        c.drawImage(bmp, sx, sy, sw, sh, dx, dy, sw, sh);
        if (saveState) {
            c.restore();
        }
    }
    drawVerticallyWavingBitmap(bmp, dx, dy, period, amplitude, shift) {
        const c = this.ctx;
        dx += this.translation.x;
        dy += this.translation.y;
        let y;
        let t;
        for (let x = 0; x < bmp.width; ++x) {
            t = shift + (x / bmp.width) * period;
            y = Math.round(Math.sin(t) * amplitude);
            c.drawImage(bmp, x | 0, 0, 1, bmp.height, (dx + x) | 0, (dy + y) | 0, 1, bmp.height);
        }
    }
    drawText(font, str, dx, dy, xoff = 0.0, yoff = 0.0, align = 0 /* TextAlign.Left */) {
        //  if (font === undefined)
        //    return;
        const cw = (font.width / 16) | 0;
        const ch = cw;
        let x = dx;
        let y = dy;
        let chr;
        if (align == 1 /* TextAlign.Center */) {
            dx -= (str.length * (cw + xoff)) / 2.0;
            x = dx;
        }
        // Unused
        /*
        else if (align == TextAlign.Right) {
            
            dx -= (str.length * (cw + xoff));
            x = dx;
        }
        */
        for (let i = 0; i < str.length; ++i) {
            chr = str.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {
                x = dx;
                y += ch + yoff;
                continue;
            }
            chr -= 32;
            this.drawBitmap(font, x, y, (chr % 16) * cw, ((chr / 16) | 0) * ch, cw, ch);
            x += cw + xoff;
        }
    }
    drawFunkyWaveEffectBitmap(bmp, dx, dy, t, amplitude, latitude, maxOffset) {
        const c = this.ctx;
        const offset = 1 + maxOffset * t;
        // let xoff : number;
        // let yoff : number;
        // dy += bmp.height/2;
        for (let y = 0; y < bmp.height; ++y) {
            // xoff = Math.sin((Math.PI*2*latitude)/bmp.height*y + t*(Math.PI*latitude))*amplitude*t;
            // yoff = (y - bmp.height/2) * offset;
            c.drawImage(bmp, 0, y, bmp.width, 1, (dx + Math.sin((Math.PI * 2 * latitude) / bmp.height * y + t * (Math.PI * latitude)) * amplitude * t) | 0, (dy + y * offset) | 0, bmp.width, 1);
        }
    }
    /*
        public setAlpha(alpha = 1.0) : void {
    
            this.ctx.globalAlpha = alpha;
        }
        */
    moveTo(x = 0, y = 0) {
        this.translation.x = x;
        this.translation.y = y;
    }
    move(x, y) {
        this.translation.x += x;
        this.translation.y += y;
    }
}

;// ./src/core/assets.ts
class AssetManager {
    // private emptyImage : Bitmap;
    constructor() {
        this.loaded = 0;
        this.totalAssets = 0;
        this.getBitmap = (name) => this.bitmaps.get(name); // ?? this.emptyImage;
        this.getSample = (name) => this.samples.get(name);
        this.hasLoaded = () => this.loaded >= this.totalAssets;
        this.bitmaps = new Map();
        this.samples = new Map();
        // Faster than dealing with undefined
        // this.emptyImage = new Image(1, 1);
    }
    addBitmap(name, bmp) {
        this.bitmaps.set(name, bmp);
    }
    loadBitmap(name, path) {
        const img = new Image();
        img.onload = () => {
            this.addBitmap(name, img);
            ++this.loaded;
        };
        img.src = path;
        ++this.totalAssets;
    }
    addSample(name, sample) {
        this.samples.set(name, sample);
    }
}

;// ./src/core/event.ts
class ProgramEvent {
    get screenWidth() {
        return this.canvas.width;
    }
    get screenHeight() {
        return this.canvas.height;
    }
    constructor(canvas, scenes, input, audio, 
    // transition : TransitionManager, 
    assets) {
        this.tick = 1.0;
        this.canvas = canvas;
        this.scenes = scenes;
        this.input = input;
        this.audio = audio;
        // this.transition = transition;
        this.assets = assets;
    }
}

;// ./src/core/input.ts
class InputAction {
    // gamepadButtons : number[]
    constructor(keys) {
        this.keys = Array.from(keys);
    }
}
class InputManager {
    get anyPressed() {
        return this.anyKeyPressed; // || this.anyGamepadButtonPressed;
    }
    constructor() {
        this.anyKeyPressed = false;
        this.keys = new Map();
        this.prevent = new Array();
        this.actions = new Map();
        window.addEventListener("keydown", (e) => {
            if (this.prevent.includes(e.code)) {
                e.preventDefault();
            }
            this.keyEvent(e.code, 3 /* InputState.Pressed */);
        });
        window.addEventListener("keyup", (e) => {
            if (this.prevent.includes(e.code)) {
                e.preventDefault();
            }
            this.keyEvent(e.code, 2 /* InputState.Released */);
        });
        window.addEventListener("contextmenu", (e) => e.preventDefault());
        // The bottom two are mostly needed if this game is ever being
        // run inside an iframe
        window.addEventListener("mousemove", () => window.focus());
        window.addEventListener("mousedown", () => window.focus());
    }
    keyEvent(key, state) {
        if (this.keys.get(key) === state - 2)
            return;
        this.keys.set(key, state);
        this.anyKeyPressed || (this.anyKeyPressed = Boolean(state & 1));
    }
    update() {
        let v;
        for (let k of this.keys.keys()) {
            if ((v = this.keys.get(k)) > 1) {
                this.keys.set(k, v - 2);
            }
        }
        this.anyKeyPressed = false;
    }
    addAction(name, keys) {
        this.actions.set(name, new InputAction(keys));
    }
    getAction(name) {
        const a = this.actions.get(name);
        if (a === undefined)
            return 0 /* InputState.Up */;
        let state = 0 /* InputState.Up */;
        // Check keyboard input first
        for (let k of a.keys) {
            if ((state = (this.keys.get(k) ?? 0 /* InputState.Up */)) != 0 /* InputState.Up */)
                break;
        }
        return state;
    }
}

;// ./src/core/scenemanager.ts
class SceneManager {
    constructor() {
        this.activeScene = undefined;
        this.scenes = new Map();
    }
    addScene(name, scene) {
        this.scenes.set(name, scene);
        this.activeScene = scene;
    }
    /*
        public init(event : ProgramEvent) : void {
    
            this.activeScene?.init?.(undefined, event);
        }
    */
    update(event) {
        this.activeScene?.update(event);
    }
    redraw(canvas, assets) {
        this.activeScene?.redraw(canvas, assets);
    }
    changeScene(name) {
        // const s = this.scenes.get(name);
        // const param = s?.dispose();
        this.activeScene = this.scenes.get(name);
        // this.activeScene.init?.(param, event)
    }
}

;// ./src/core/program.ts






// import { TransitionManager } from "./transition";
class Program {
    constructor(canvasWidth, canvasHeight) {
        this.timeSum = 0.0;
        this.oldTime = 0.0;
        this.initialized = false;
        this.onloadEvent = undefined;
        this.canvas = new Canvas(canvasWidth, canvasHeight);
        this.audio = new AudioPlayer();
        this.input = new InputManager();
        this.assets = new AssetManager();
        // this.transition = new TransitionManager();
        this.scenes = new SceneManager();
        this.event = new ProgramEvent(this.canvas, this.scenes, this.input, this.audio, 
        // this.transition, 
        this.assets);
    }
    loop(ts) {
        const MAX_REFRESH_COUNT = 5; // Needed in the case that window gets deactivated and reactivated much later
        const FRAME_TIME = 16.66667;
        const delta = ts - this.oldTime;
        const loaded = this.assets.hasLoaded();
        this.timeSum = Math.min(this.timeSum + delta, MAX_REFRESH_COUNT * FRAME_TIME);
        this.oldTime = ts;
        if (loaded && !this.initialized) {
            this.onloadEvent?.(this.event);
            // this.scenes.init(this.event);
            this.initialized = true;
        }
        let firstFrame = true;
        for (; this.timeSum >= FRAME_TIME; this.timeSum -= FRAME_TIME) {
            if (loaded) {
                this.scenes.update(this.event);
                // this.transition.update(this.event);
            }
            if (firstFrame) {
                this.event.input.update();
                firstFrame = false;
            }
        }
        if (loaded) {
            this.scenes.redraw(this.canvas, this.assets);
            // this.transition.draw(this.canvas);
        }
        else {
            // TODO: Loading text?
            this.canvas.clear("#0055aa");
        }
        window.requestAnimationFrame(ts => this.loop(ts));
    }
    run(initialEvent, onload) {
        initialEvent?.(this.event);
        this.onloadEvent = onload;
        this.loop(0.0);
    }
}

;// ./src/game/existingobject.ts
class ExistingObject {
    constructor() {
        this.exist = false;
        this.doesExist = () => this.exist;
    }
    forceKill() {
        this.exist = false;
    }
}
function next(type, arr) {
    for (let o of arr) {
        if (!o.doesExist())
            return o;
    }
    let o = new type.prototype.constructor();
    arr.push(o);
    return o;
}

;// ./src/game/decoration.ts
;
const drawDecoration = (canvas, bmp, decoration, dx, dy) => {
    const SX = [, 160, 24, 0];
    const SY = [, 0, 48, 48];
    const SW = [, 32, 16, 24];
    const SH = [, 33, 16, 16];
    const XOFF = [, -8, 0, 8];
    const YOFF = [, -33, -16, -16];
    canvas.drawBitmap(bmp, dx + XOFF[decoration], dy + YOFF[decoration], SX[decoration], SY[decoration], SW[decoration], SH[decoration]);
};

;// ./src/game/groundlayer.ts


const BASE_SHIFT_X = 2;
const SLOPE_WAIT_MIN = 4;
const SLOPE_WAIT_MAX = 16;
const MIN_HEIGHT = [1, 2];
const MAX_HEIGHT = [5, 4];
const DECORATION_WAIT_MIN = 8;
const DECORATION_WAIT_MAX = 16;
const SPIKE_WAIT_MIN = [12, 6];
const SPIKE_WAIT_MAX = [18, 12];
const INITIAL_HEIGHT = [2, 0];
const INITIAL_TYPE = [1 /* TileType.Surface */, 0 /* TileType.None */];
;
;
;
class GroundLayer {
    constructor(width, type, shift = 0) {
        this.typeWait = 0;
        this.slopeDuration = 0;
        this.activeSlope = 0 /* SlopeDirection.None */;
        this.lastSlope = 0 /* SlopeDirection.None */;
        this.gapTimer = 0;
        this.spikeCount = 0;
        this.hadSpike = false;
        this.ref = this; // Saves space vs undefined
        // It hurts to comment these out
        /*
        public recreate() : void {
    
            this.activeHeight = INITIAL_HEIGHT[this.layerType as number];
            this.activeType = INITIAL_TYPE[this.layerType as number];
    
            this.height.fill(this.activeHeight);
            this.type.fill(this.activeType);
            this.slope.fill(SlopeDirection.None);
            this.decorations.fill(Decoration.None);
            this.spikes = (new Array<boolean> (this.width)).fill(false);
    
            this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
            this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);
            this.spikeWait = sampleUniform(SPIKE_WAIT_MIN, SPIKE_WAIT_MAX);
        }
        */
        this.getHeight = () => this.activeHeight;
        this.hasGap = () => this.activeType == 0 /* TileType.None */;
        this.isFlatSurfaceOrBridge = () => this.activeType != 0 /* TileType.None */ &&
            this.activeSlope == 0 /* SlopeDirection.None */ &&
            !this.hadSpike;
        this.getDistanceFromPlatform = () => Math.min(this.gapTimer, this.typeWait);
        this.width = width;
        this.activeHeight = INITIAL_HEIGHT[type];
        this.activeType = INITIAL_TYPE[type];
        this.height = (new Array(this.width)).fill(this.activeHeight);
        this.type = (new Array(this.width)).fill(this.activeType);
        this.slope = (new Array(this.width)).fill(0 /* SlopeDirection.None */);
        this.decorations = (new Array(this.width)).fill(0 /* Decoration.None */);
        this.spikes = (new Array(this.width)).fill(false);
        this.slopeWait = sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
        this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);
        this.spikeWait = sampleUniform(SPIKE_WAIT_MIN[0], SPIKE_WAIT_MAX[0]);
        this.layerType = type;
        this.shift = shift;
        if (type == 0 /* GroundLayerType.Foreground */) {
            this.generateInitialDecorations();
        }
    }
    generateInitialDecorations() {
        let x1 = sampleUniform(2, this.width / 2);
        const type = sampleUniform(1, 3);
        this.decorations[x1] = type;
        x1 = sampleUniform(x1 + 4, this.width - 4);
        this.decorations[x1] = 1 + (((type - 1) + sampleUniform(1, 2)) % 3);
    }
    getHeightRange() {
        let min = MIN_HEIGHT[this.layerType];
        let max = MAX_HEIGHT[this.layerType];
        if (this.layerType == 1 /* GroundLayerType.Background */) {
            min += this.ref.activeHeight ?? 0;
            max += this.ref.activeHeight ?? 0;
        }
        return [min, max];
    }
    updateSlope() {
        const SLOPE_DURATION_WEIGHTS = [0.67, 0.33];
        this.lastSlope = this.activeSlope;
        if ((--this.slopeDuration) <= 0) {
            this.activeSlope = 0 /* SlopeDirection.None */;
        }
        let nextHeight;
        let dif;
        const [min, max] = this.getHeightRange();
        if (this.activeType == 1 /* TileType.Surface */ &&
            this.layerType == 1 /* GroundLayerType.Background */) {
            // TODO: Add slope direction to the ref height?
            dif = this.activeHeight - this.ref.activeHeight;
            if ((this.ref.activeSlope == -1 /* SlopeDirection.Up */ &&
                dif <= 2) || dif <= 1) {
                this.activeSlope = -1 /* SlopeDirection.Up */;
                this.slopeWait = 2;
                this.slopeDuration = 0;
                this.activeHeight -= this.activeSlope;
                ++this.typeWait;
                return;
            }
        }
        if (this.activeType == 1 /* TileType.Surface */ &&
            this.typeWait >= 2 &&
            (--this.slopeWait) <= 0) {
            this.slopeDuration = Math.min(this.typeWait - 1, 1 + weightedProbability(SLOPE_DURATION_WEIGHTS));
            this.slopeWait = (this.slopeDuration - 1) + sampleUniform(SLOPE_WAIT_MIN, SLOPE_WAIT_MAX);
            this.activeSlope = Math.random() < 0.5 ? -1 /* SlopeDirection.Up */ : 1 /* SlopeDirection.Down */;
            nextHeight = this.activeHeight - this.activeSlope * this.slopeDuration;
            if (nextHeight != clamp(nextHeight, min, max)) {
                this.activeSlope *= -1;
            }
            ++this.typeWait;
        }
        this.activeHeight -= this.activeSlope;
    }
    updateType() {
        const TYPE_WAIT_MIN = [[2, 2, 2], [4, 2, 0]];
        const TYPE_WAIT_MAX = [[4, 16, 6], [16, 10, 0]];
        const GAP_JUMP_MAX = 2;
        const BRIDGE_PROB = [0.33, 0];
        // let min : number;
        // let max : number;
        const [minHeight, maxHeight] = this.getHeightRange();
        if (this.activeType == 0 /* TileType.None */) {
            ++this.gapTimer;
        }
        if ((--this.typeWait) <= 0 && this.lastSlope == 0 /* SlopeDirection.None */) {
            if (this.activeType != 1 /* TileType.Surface */) {
                this.activeType = 1 /* TileType.Surface */;
                if (this.layerType == 1 /* GroundLayerType.Background */) {
                    this.activeHeight = sampleUniform(minHeight, maxHeight);
                }
                this.gapTimer = 0;
            }
            else {
                this.activeType = (!this.hadSpike && Math.random() < BRIDGE_PROB[this.layerType]) ? 2 /* TileType.Bridge */ : 0 /* TileType.None */;
                if (this.layerType == 0 /* GroundLayerType.Foreground */ &&
                    this.activeType == 0 /* TileType.None */) {
                    // min = Math.max(minHeight, this.activeHeight - GAP_JUMP_MAX);
                    // max = Math.min(maxHeight, this.activeHeight + GAP_JUMP_MAX);
                    this.activeHeight = sampleUniform(Math.max(minHeight, this.activeHeight - GAP_JUMP_MAX), Math.min(maxHeight, this.activeHeight + GAP_JUMP_MAX));
                    // Try to avoid cases where the background layer goes behind
                    // the front layer
                    /*
                    if (this.ref !== undefined) {

                        if (this.ref.activeHeight <= this.activeHeight) {

                            if ((-- this.activeHeight) < MIN_HEIGHT[0]) {

                                this.activeHeight = MIN_HEIGHT[0];
                                ++ this.typeWait;
                                return;
                            }
                        }
                    }
                    */
                }
            }
            this.typeWait = sampleUniform(TYPE_WAIT_MIN[this.layerType][this.activeType], TYPE_WAIT_MAX[this.layerType][this.activeType]);
        }
    }
    updateDecorations(tilePointer) {
        const DECORATION_PROB_WEIGHTS = [0.20, 0.30, 0.50];
        if ((--this.decorationWait) > 0 ||
            this.activeType != 1 /* TileType.Surface */ ||
            this.activeSlope != 0 /* SlopeDirection.None */ ||
            (this.layerType == 0 /* GroundLayerType.Foreground */ &&
                this.ref.activeType !== 0 /* TileType.None */))
            return false;
        let type = (weightedProbability(DECORATION_PROB_WEIGHTS) + 1);
        // No room for a palmtree
        // (NOTE: There is no empirical evidence that this even works)
        // Note: the following expression has some unnecessary question marks after ref
        // to silent Closure...
        if (this.layerType == 0 /* GroundLayerType.Foreground */ &&
            this.ref.activeType == 1 /* TileType.Surface */ &&
            this.ref.activeHeight - this.activeHeight <= 2) {
            type = 3 /* Decoration.BigBush */;
        }
        // No room for a big bush
        if (type == 3 /* Decoration.BigBush */ && (this.slopeWait <= 2 || this.typeWait <= 1)) {
            type = 2 /* Decoration.SmallBush */;
        }
        this.decorations[tilePointer] = type;
        this.decorationWait = sampleUniform(DECORATION_WAIT_MIN, DECORATION_WAIT_MAX);
        if (type == 3 /* Decoration.BigBush */) {
            this.spikeWait = Math.max(this.spikeWait + 1, 1);
        }
        return true;
    }
    updateSpikes(t) {
        const SPIKE_COUNT_WEIGHTS = [0.67, 0.33];
        if (this.activeType != 1 /* TileType.Surface */ ||
            this.activeSlope != 0 /* SlopeDirection.None */) {
            this.spikeCount = 0;
            return false;
        }
        if ((--this.spikeCount) > 0) {
            return true;
        }
        if ((--this.spikeWait) <= 0) {
            this.spikeWait = sampleUniformInterpolate(t, SPIKE_WAIT_MIN, SPIKE_WAIT_MAX);
            this.spikeCount = 1 + weightedProbability(SPIKE_COUNT_WEIGHTS);
            return true;
        }
        return false;
    }
    update(tilePointer, interpolationWeight) {
        this.updateSlope();
        this.updateType();
        this.decorations[tilePointer] = 0 /* Decoration.None */;
        if (!(this.spikes[tilePointer] = (this.hadSpike = this.updateSpikes(interpolationWeight)))) {
            this.updateDecorations(tilePointer);
        }
        this.height[tilePointer] = this.activeHeight;
        this.type[tilePointer] = this.activeType;
        this.slope[tilePointer] = this.activeSlope;
    }
    setReferenceLayer(ref) {
        this.ref = ref;
    }
    draw(canvas, bmp, tilePointer, tileOffset) {
        const BRIDGE_Y_OFF = -2;
        const BASE_SRC_X = [80, 32, 96];
        const YOFF = [0, 0, -1];
        let i;
        let dx;
        let dy;
        let dir;
        const h = (canvas.height / 16) | 0;
        let sx;
        let left;
        let right;
        for (let x = 0; x < this.width; ++x) {
            i = (x + tilePointer) % this.width;
            dir = this.slope[i];
            dx = x * 16 - (tileOffset | 0) - BASE_SHIFT_X * 16 + this.shift;
            dy = h - this.height[i];
            left = this.type[negMod(i - 1, this.width)] != 1 /* TileType.Surface */;
            right = this.type[(i + 1) % this.width] != 1 /* TileType.Surface */;
            // Decorations
            if (this.decorations[i] != 0 /* Decoration.None */) {
                drawDecoration(canvas, bmp, this.decorations[i], dx, dy * 16);
            }
            switch (this.type[i]) {
                case 1 /* TileType.Surface */:
                    sx = BASE_SRC_X[dir + 1];
                    if (left)
                        sx -= 16;
                    else if (right)
                        sx += 16;
                    canvas.drawBitmap(bmp, dx, dy * 16 + YOFF[dir + 1] * 16, sx, 0, 16, 32);
                    // TODO: Find a way to avoid having to compute the same shit twice...
                    sx = 32;
                    if (left)
                        sx -= 16;
                    else if (right)
                        sx += 16;
                    for (let y = dy + YOFF[dir + 1] + 2; y < h; ++y) {
                        canvas.drawBitmap(bmp, dx, y * 16, sx, y == dy ? 0 : 16, 16, 16);
                    }
                    // Grass edges
                    if (left) {
                        canvas.drawBitmap(bmp, dx - 16, dy * 16, 0, 0, 16, 16);
                    }
                    if (right) {
                        canvas.drawBitmap(bmp, dx + 16, dy * 16, 64, 0, 16, 16);
                    }
                    break;
                case 2 /* TileType.Bridge */:
                    // Fence
                    if (!left) {
                        canvas.drawBitmap(bmp, dx - 16, dy * 16 + BRIDGE_Y_OFF - 14, 0, 64, 16, 16);
                    }
                    if (!right) {
                        canvas.drawBitmap(bmp, dx + 16, dy * 16 + BRIDGE_Y_OFF - 14, 32, 64, 16, 16);
                    }
                    canvas.drawBitmap(bmp, dx, dy * 16 + BRIDGE_Y_OFF - 14, 16, 64, 16, 16);
                    canvas.drawBitmap(bmp, dx, dy * 16 + BRIDGE_Y_OFF, 96, 32, 16, 16);
                    break;
                default:
                    break;
            }
            // Spikes
            if (this.spikes[i]) {
                canvas.drawBitmap(bmp, dx, (dy - 1) * 16, 112 + (tilePointer % 2) * 16, 48, 16, 16);
            }
        }
    }
    objectCollision(o, globalSpeed, tilePointer, tileOffset, event) {
        const OFFSET = 2;
        let i;
        let dx;
        let dy;
        const h = (event.screenHeight / 16) | 0;
        const px = (((o.getPosition().x - this.shift) / 16) | 0) + BASE_SHIFT_X;
        let left = 0;
        let right = 0;
        for (let x = px - OFFSET; x <= px + OFFSET; ++x) {
            i = negMod(x + tilePointer, this.width);
            // Ground collision
            if (this.type[i] == 0 /* TileType.None */)
                continue;
            left = Number(this.type[negMod(i - 1, this.width)] == 0 /* TileType.None */);
            right = Number(this.type[(i + 1) % this.width] == 0 /* TileType.None */);
            dx = x * 16 - tileOffset - BASE_SHIFT_X * 16 + this.shift;
            dy = (h - this.height[i]) * 16;
            switch (this.slope[i]) {
                case 0 /* SlopeDirection.None */:
                    o.floorCollision(dx, dy, dx + 16, dy, globalSpeed, event, left, right);
                    break;
                case -1 /* SlopeDirection.Up */:
                    o.floorCollision(dx, dy + 16, dx + 16, dy, globalSpeed, event, 0, 0);
                    break;
                case 1 /* SlopeDirection.Down */:
                    o.floorCollision(dx, dy - 16, dx + 16, dy, globalSpeed, event, 0, 0);
                    break;
                default:
                    break;
            }
            // Palmtree collisions mess up everything
            /*
            if (this.decorations[i] == Decoration.Palmtree) {

                o.floorCollision(dx - 4, dy - 30, dx + 20, dy - 30, globalSpeed, event);
            }
            */
            if (this.spikes[i]) {
                o.hurtCollision?.(dx + 2, dy - 6, 12, 6, event);
            }
        }
    }
}

;// ./src/game/specialplatform.ts


;
class SpecialPlatform extends ExistingObject {
    constructor() {
        super();
        this.width = 0;
        this.type = 0 /* SpecialPlatformType.Mushroom */;
        this.pos = new Vector();
    }
    spawn(x, y, width, type) {
        this.pos.x = x;
        this.pos.y = y;
        this.width = width;
        this.type = type;
        this.exist = true;
    }
    update(globalSpeed, event) {
        if (!this.exist)
            return;
        if ((this.pos.x -= globalSpeed * event.tick) <= -this.width * 8) {
            this.exist = false;
        }
    }
    draw(canvas, bmp) {
        if (!this.exist)
            return;
        const dx = Math.round(this.pos.x);
        const dy = canvas.height - this.pos.y;
        // const mushroomHeight = ((canvas.height - dy) / 16) | 0;
        let sx;
        switch (this.type) {
            // Mushroom
            case 0 /* SpecialPlatformType.Mushroom */:
                // Hat
                for (let j = 0; j < this.width; ++j) {
                    sx = 128;
                    if (j == 0)
                        sx -= 16;
                    else if (j == this.width - 1)
                        sx += 16;
                    canvas.drawBitmap(bmp, dx - this.width * 8 + j * 16, dy, sx, 0, 16, 16);
                }
                // Ring
                canvas.drawBitmap(bmp, dx - 12, dy + 16, 124, 16, 24, 16);
                // Leg
                for (let y = 2; y < (((canvas.height - dy) / 16) | 0); ++y) {
                    canvas.drawBitmap(bmp, dx - 8, dy + y * 16, 128, 32, 16, 16);
                }
                break;
            // Floating platform
            case 1 /* SpecialPlatformType.FloatingPlatform */:
                // Soil edges
                canvas.drawBitmap(bmp, dx - this.width * 8 - 16, dy, 0, 32, 16, 16);
                canvas.drawBitmap(bmp, dx + this.width * 8, dy, 64, 32, 16, 16);
                if (this.width == 1) {
                    canvas.drawBitmap(bmp, dx - 8, dy, 80, 32, 16, 16);
                    break;
                }
                for (let j = 0; j < this.width; ++j) {
                    sx = 32;
                    if (j == 0)
                        sx -= 16;
                    else if (j == this.width - 1)
                        sx += 16;
                    canvas.drawBitmap(bmp, dx - this.width * 8 + j * 16, dy, sx, 32, 16, 16);
                }
                break;
            default:
                break;
        }
    }
    objectCollision(o, globalSpeed, event) {
        if (!this.exist)
            return;
        const y = event.screenHeight - this.pos.y;
        o.floorCollision(this.pos.x - this.width * 8, y, this.pos.x + this.width * 8, y, globalSpeed, event);
    }
}

;// ./src/game/gameobject.ts


const updateSpeedAxis = (speed, target, step) => {
    if (speed < target) {
        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
};
class GameObject extends ExistingObject {
    constructor(x = 0, y = 0) {
        super();
        this.dying = false;
        this.touchSurface = false;
        this.getCollision = true;
        this.isDying = () => this.dying;
        this.getPosition = () => this.pos.clone();
        this.doesOverlayRect = (pos, center, hitbox) => this.pos.x + this.center.x + this.hitbox.x / 2 >= pos.x + center.x - hitbox.x / 2 &&
            this.pos.x + this.center.x - this.hitbox.x / 2 <= pos.x + center.x + hitbox.x / 2 &&
            this.pos.y + this.center.y + this.hitbox.y / 2 >= pos.y + center.y - hitbox.y / 2 &&
            this.pos.y + this.center.y - this.hitbox.y / 2 <= pos.y + center.y + hitbox.y / 2;
        this.doesOverlay = (o) => this.doesOverlayRect(o.pos, o.center, o.hitbox);
        this.pos = new Vector(x, y);
        this.speed = new Vector();
        this.target = new Vector();
        this.friction = new Vector(1, 1);
        this.hitbox = new Vector();
        this.center = new Vector();
    }
    die(globalSpeed, event) { return true; }
    move(event) {
        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x * event.tick);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y * event.tick);
        this.pos.x += this.speed.x * event.tick;
        this.pos.y += this.speed.y * event.tick;
    }
    floorCollisionEvent(event) { }
    update(globalSpeed, event) {
        if (!this.exist)
            return;
        if (this.dying) {
            if (this.die(globalSpeed, event)) {
                this.dying = false;
                this.exist = false;
            }
            return;
        }
        this.updateEvent?.(globalSpeed, event);
        this.move(event);
        this.touchSurface = false;
    }
    forceKill() {
        this.exist = false;
        this.dying = false;
    }
    floorCollision(x1, y1, x2, y2, globalSpeed, event, leftMargin = 1, rightMargin = 1, speedCheckLimit = 0.0, topMargin = 2, bottomMargin = 8) {
        // The case x1 > x2 can be ignored since it never happens anyway
        // But to save bytes, let's just pretend it never happens anyway!
        // if (x1 >= x2)
        //    return false;
        if (!this.getCollision ||
            !this.exist || this.dying ||
            this.speed.y <= speedCheckLimit ||
            this.pos.x + this.center.x + this.hitbox.x / 2 * leftMargin < x1 ||
            this.pos.x + this.center.x - this.hitbox.x / 2 * rightMargin > x2)
            return false;
        const k = (y2 - y1) / (x2 - x1);
        const b = y1 - k * x1;
        const y0 = this.pos.x * k + b;
        const bottom = this.pos.y + this.center.y + this.hitbox.y / 2;
        const hmod = Math.abs(k * (this.speed.x + globalSpeed)) * event.tick;
        const vmod = Math.abs(this.speed.y) * event.tick;
        if (bottom < y0 + bottomMargin + vmod + hmod &&
            bottom >= y0 - topMargin - hmod) {
            this.pos.y = y0 - this.center.y - this.hitbox.y / 2;
            this.speed.y = 0;
            this.touchSurface = true;
            this.floorCollisionEvent(event);
            return true;
        }
        return false;
    }
}

;// ./src/game/propeller.ts
const drawPropeller = (canvas, bmp, frame, dx, dy) => {
    const PROPELLER_FLIP = [0 /* Flip.None */, 0 /* Flip.None */, 0 /* Flip.None */, 1 /* Flip.Horizontal */];
    const PROPELLER_SX = [32, 48, 56, 48];
    const PROPELLER_SW = [16, 8, 8, 8];
    const sw = PROPELLER_SW[frame];
    canvas.drawBitmap(bmp, dx + (16 - sw) / 2, dy - 6, PROPELLER_SX[frame], 48, sw, 8, PROPELLER_FLIP[frame]);
};

;// ./src/game/touchableobject.ts



// Yes, this contains both enemies and gems. Saves a lot of
// bytes this way
class TouchableObject extends GameObject {
    constructor() {
        super();
        this.type = 0 /* TouchableType.None */;
        this.specialTimer = 0;
        this.deathTimer = 0;
        this.yoff = 0;
        this.initialY = 0;
        this.didTouchGround = false;
        this.exist = false;
        this.friction = new Vector(0.15, 0.125);
    }
    kill(player, event) {
        event.audio.playSample(event.assets.getSample("ak"), 0.50);
        this.dying = true;
        this.deathTimer = 0.0;
        player.addScore(100);
    }
    die(globalSpeed, event) {
        const DEATH_SPEED = 1.0 / 12.0;
        this.pos.x -= globalSpeed * event.tick;
        return (this.deathTimer += DEATH_SPEED * event.tick) >= 1.0;
    }
    updateEvent(globalSpeed, event) {
        const FLOAT_SPEED = Math.PI * 2 / 60.0;
        const BOUNCING_SPEED = 4.0 / 40.0;
        const JUMP_WAIT_SPEED = 3.0 / 30.0;
        const JUMP_SPEED = -3.25;
        const DRIVE_SPEED = 0.5;
        const TIRE_ANIM_SPEED = 2.0 / 15.0;
        const LEDGE_JUMP = -2.5;
        const STONE_BALL_SPEED = 0.5;
        const FLY_BALL_FLOAT_SPEED = Math.PI * 2 / 150;
        const FLY_SPEED_X = -0.25;
        let jumpWaitFactor = 1;
        let jumpFactor = 1;
        switch (this.type) {
            case 1 /* TouchableType.Gem */:
                this.specialTimer = (this.specialTimer + FLOAT_SPEED * event.tick) % (Math.PI * 2);
                break;
            case 2 /* TouchableType.StaticBall */:
                this.specialTimer = (this.specialTimer + BOUNCING_SPEED * event.tick) % 4;
                break;
            case 5 /* TouchableType.StoneBall */:
                this.speed.x = 0;
                if (!this.touchSurface) {
                    this.speed.x = -STONE_BALL_SPEED;
                }
                this.target.x = this.speed.x;
                jumpWaitFactor = 2;
                jumpFactor = 0.75;
            case 3 /* TouchableType.JumpingBall */:
                if (this.touchSurface) {
                    if ((this.specialTimer += jumpWaitFactor * JUMP_WAIT_SPEED * event.tick) >= 3.0) {
                        this.specialTimer = 0.0;
                        this.speed.y = JUMP_SPEED * jumpFactor;
                        // This sounds annoying
                        // event.audio.playSample(event.assets.getSample("ab"), 0.50);
                    }
                }
                break;
            case 4 /* TouchableType.DrivingBall */:
                this.specialTimer = (this.specialTimer + TIRE_ANIM_SPEED * event.tick) % 2;
                this.target.x = (this.speed.x = -DRIVE_SPEED);
                if (this.didTouchGround && !this.touchSurface) {
                    this.speed.y = LEDGE_JUMP;
                }
                break;
            case 6 /* TouchableType.FlyingBall */:
                this.specialTimer = (this.specialTimer + FLY_BALL_FLOAT_SPEED * event.tick) % (Math.PI * 2);
                this.target.x = (this.speed.x = FLY_SPEED_X);
                this.yoff = Math.sin(this.specialTimer) * 12;
                this.pos.y = this.initialY + this.yoff;
                break;
            default:
                break;
        }
        if ((this.pos.x -= globalSpeed * event.tick) < -8) {
            this.exist = false;
        }
        this.didTouchGround = this.touchSurface;
    }
    spawn(x, y, type) {
        const BASE_GRAVITY = 2.5;
        /*
        if (type == 0 || type >= TouchableType.FlyingBall) {

            return;
        }
        */
        this.pos = new Vector(x, y);
        this.speed.zero();
        this.target.zero();
        this.center.zero();
        this.initialY = y;
        this.type = type;
        this.exist = true;
        this.dying = false;
        const isGem = type == 1 /* TouchableType.Gem */;
        const isFlying = type == 6 /* TouchableType.FlyingBall */;
        const w = isGem ? 12 : 8;
        this.hitbox = new Vector(w, 12);
        this.specialTimer = 0;
        if (!isGem && !isFlying) {
            this.target.y = BASE_GRAVITY;
            this.center.y = 2;
        }
        this.specialTimer = (((x / 16) | 0) % 2) * (Math.PI * (isFlying ? 0.5 : 1.0));
        this.touchSurface = true;
        this.didTouchGround = false;
        this.getCollision = !isFlying;
        this.friction.y = isFlying ? 0.05 : 0.15;
    }
    draw(canvas, assets) {
        const DEATH_WEIGHT = 0.75;
        const DEATH_RING_RADIUS = 16;
        const FACE_EPS = 1.0;
        const BODY_FRAME = [0, 1, 0, 2];
        const FACE_SX = [0, 8, 0, 24, 16];
        const FACE_SH = [8, 8, 4, 8, 8];
        const FACE_SHIFT_Y = [0, 1, -1];
        if (!this.exist || this.type == 0 /* TouchableType.None */)
            return;
        const bmpBase = assets.getBitmap("b");
        let dx = Math.round(this.pos.x);
        let dy = Math.round(this.pos.y);
        const isGem = this.type == 1 /* TouchableType.Gem */;
        let t;
        if (this.dying) {
            t = (1.0 - DEATH_WEIGHT) + this.deathTimer * DEATH_WEIGHT;
            canvas.fillColor(isGem ? "#ffaaff" : "#ff0000");
            canvas.fillRing(dx, dy, t * t * DEATH_RING_RADIUS, t * DEATH_RING_RADIUS);
            return;
        }
        if (isGem) {
            canvas.drawBitmap(bmpBase, dx - 8, dy - 8 + Math.round(Math.sin(this.specialTimer) * 2), 48, 88, 16, 16);
            return;
        }
        const bmpBody = assets.getBitmap("b" + String(this.type - 1));
        let faceShiftX = 0;
        let faceShiftY = 0;
        let frame = 0;
        let bsh = 16;
        if ([2, 3, 5].includes(this.type)) {
            frame = BODY_FRAME[(this.specialTimer | 0)];
            faceShiftY = Math.abs(this.speed.y) > FACE_EPS ? Math.sign(this.speed.y) * 2 : 0;
        }
        else if (this.type == 4 /* TouchableType.DrivingBall */) {
            // -- dy;
            bsh = 14;
            faceShiftY = 2;
            faceShiftX = -1;
        }
        // Body
        canvas.drawBitmap(bmpBody, dx - 8, dy - 7, frame * 16, 0, 16, bsh);
        // Face
        canvas.drawBitmap(bmpBase, dx - 5 + faceShiftX, dy - 3 + faceShiftY + FACE_SHIFT_Y[frame], 16 + FACE_SX[this.type - 2], 112, 8, FACE_SH[this.type - 2]);
        if (this.type == 4 /* TouchableType.DrivingBall */) {
            frame = (this.specialTimer | 0);
            canvas.drawBitmap(bmpBase, dx - 8, dy + 1, 48, 104 + frame * 8, 16, 8);
        }
        else if (this.type == 6 /* TouchableType.FlyingBall */) {
            drawPropeller(canvas, bmpBase, (((this.specialTimer / (Math.PI * 2)) * 32) | 0) % 4, dx - 8, dy - 5);
        }
    }
    playerCollision(globalSpeed, player, event) {
        const STOMP_W = 20;
        const STOMP_Y = -6;
        if (!this.exist || !player.doesExist() ||
            this.isDying() || player.isDying())
            return;
        const isGem = this.type == 1 /* TouchableType.Gem */;
        let stompx = this.pos.x - STOMP_W / 2;
        let stompy = this.pos.y + this.center.y + STOMP_Y;
        if (!isGem && player.doesOverlaySpear(this)) {
            this.kill(player, event);
            return;
        }
        if (!isGem &&
            player.floorCollision(stompx, stompy, stompx + STOMP_W, stompy, globalSpeed, event, 1, 1, -1.0)) {
            this.kill(player, event);
            player.stompJump();
            return;
        }
        if (this.doesOverlay(player)) {
            // Kill player or give them an orb
            player.touchTouchableEvent(isGem, event);
            if (isGem) {
                this.dying = true;
                this.deathTimer = 0.0;
            }
        }
    }
}

;// ./src/game/terrain.ts





const SPECIAL_WAIT_MIN = 4;
const SPECIAL_WAIT_MAX = 16;
const TOUCHABLE_TIMER_MIN = [4, 1];
const TOUCHABLE_TIMER_MAX = [12, 6];
const FLYING_ENEMY_TIMER_MIN = [16, 6];
const FLYING_ENEMY_TIMER_MAX = [32, 12];
const REPEAT_WEIGHT = [[0.50, 0.30, 0.20], [0.10, 0.50, 0.40]];
const ENEMY_WEIGHTS = [[0.40, 0.30, 0.20, 0.10], [0.25, 0.25, 0.25, 0.25]];
const GEM_OFF_Y = -10;
class Terrain {
    constructor(event) {
        this.tilePointer = 0;
        this.tileOffset = 0;
        this.specialWait = 0;
        this.touchableRepeat = 0;
        this.touchableLayer = 0;
        this.touchableType = 1 /* TouchableType.Gem */;
        this.flyingEnemyTimer = 0;
        this.getObjectPos = () => this.width * 16 - BASE_SHIFT_X * 16 + (this.tileOffset % 16);
        const EXTRA_MARGIN = 5;
        this.width = ((event.screenWidth / 16) | 0) + EXTRA_MARGIN;
        this.layers = new Array(2);
        this.layers[0] = new GroundLayer(this.width, 0 /* GroundLayerType.Foreground */);
        this.layers[1] = new GroundLayer(this.width, 1 /* GroundLayerType.Background */, 8);
        this.layers[0].setReferenceLayer(this.layers[1]);
        this.layers[1].setReferenceLayer(this.layers[0]);
        this.specialWait = sampleUniform(SPECIAL_WAIT_MIN, SPECIAL_WAIT_MAX);
        this.specialPlatforms = new Array();
        this.touchableTimer = sampleUniform(TOUCHABLE_TIMER_MIN[0], TOUCHABLE_TIMER_MAX[0]);
        this.flyingEnemyTimer = sampleUniform(FLYING_ENEMY_TIMER_MIN[0], FLYING_ENEMY_TIMER_MAX[0]);
        this.touchables = new Array();
    }
    spawnSpecialPlatform(event) {
        const MIN_HEIGHT = 3;
        const MAX_HEIGHT = 5;
        const MIN_WIDTH = 1;
        const MAX_WIDTH = 5;
        const MUSHROOM_MAX_HEIGHT = 6;
        const TYPE_PROB = [0.75, 0.25];
        const OBJECT_PROB = 0.5;
        if ((--this.specialWait) > 0)
            return;
        let width = sampleUniform(MIN_WIDTH, MAX_WIDTH);
        if (this.layers[1].getDistanceFromPlatform() <= width / 2 + 1) {
            return;
        }
        let groundHeight = this.layers[0].getHeight();
        if (!this.layers[1].hasGap()) {
            // this.layers[1].getGapTimer() <= width/2 ???
            groundHeight = this.layers[1].getHeight();
        }
        const height = groundHeight + sampleUniform(MIN_HEIGHT, MAX_HEIGHT);
        // Determine type
        let type = weightedProbability(TYPE_PROB);
        if (width == MAX_WIDTH) {
            type = 0 /* SpecialPlatformType.Mushroom */;
        }
        else if (height >= this.layers[0].getHeight() + MUSHROOM_MAX_HEIGHT ||
            width <= 2) {
            type = 1 /* SpecialPlatformType.FloatingPlatform */;
        }
        const opos = this.getObjectPos();
        next(SpecialPlatform, this.specialPlatforms)
            .spawn(opos, height * 16, width, type);
        this.specialWait = sampleUniform(width + 2, SPECIAL_WAIT_MAX);
        let x;
        let y;
        let count;
        if (Math.random() < OBJECT_PROB) {
            count = Math.min(3, sampleUniform(1, width));
            x = opos + 8 - width * 16 / 2 + ((Math.random() * (width - count + 1)) | 0) * 16;
            y = event.screenHeight - height * 16 + (this.touchableType == 1 /* TouchableType.Gem */ ? GEM_OFF_Y : -8);
            for (let i = 0; i < count; ++i) {
                next(TouchableObject, this.touchables).spawn(x + i * 16, y, this.touchableType);
            }
        }
    }
    spawnTouchableObject(event) {
        const yoff = this.touchableType == 1 /* TouchableType.Gem */ ? GEM_OFF_Y : -8;
        const layer = this.touchableLayer;
        next(TouchableObject, this.touchables)
            .spawn(this.getObjectPos() + 8 - 16 * (1 - layer) - 8 * layer, event.screenHeight - this.layers[layer].getHeight() * 16 + yoff, this.touchableType);
    }
    layerCheck() {
        return (!this.layers[this.touchableLayer].isFlatSurfaceOrBridge() &&
            !this.layers[this.touchableLayer = 1 - this.touchableLayer].isFlatSurfaceOrBridge());
    }
    spawnTouchables(t, event) {
        if (this.touchableRepeat > 0) {
            if (this.layerCheck()) {
                return false;
            }
            --this.touchableRepeat;
            this.spawnTouchableObject(event);
            return true;
        }
        if ((--this.touchableTimer) > 0)
            return false;
        this.touchableLayer = 1 - this.touchableLayer;
        if (this.layerCheck()) {
            return false;
        }
        this.touchableType = this.touchableType == 1 /* TouchableType.Gem */ ?
            2 + weightedProbabilityInterpolate(ENEMY_WEIGHTS[0], ENEMY_WEIGHTS[1], t) :
            1 /* TouchableType.Gem */;
        this.touchableRepeat = weightedProbabilityInterpolate(REPEAT_WEIGHT[0], REPEAT_WEIGHT[1], t); // + 1?
        this.touchableTimer = this.touchableRepeat + sampleUniformInterpolate(t, TOUCHABLE_TIMER_MIN, TOUCHABLE_TIMER_MAX);
        this.spawnTouchableObject(event);
        return true;
    }
    spawnFlyingEnemies(t, event) {
        const OFFSET_Y = 32;
        if ((--this.flyingEnemyTimer) > 0)
            return;
        const layer = Math.random() < 0.5 ? 0 : 1;
        const y = event.screenHeight - this.layers[layer].getHeight() * 16 - OFFSET_Y;
        const repeat = weightedProbabilityInterpolate(REPEAT_WEIGHT[0], REPEAT_WEIGHT[1], t);
        this.flyingEnemyTimer = sampleUniformInterpolate(t, FLYING_ENEMY_TIMER_MIN, FLYING_ENEMY_TIMER_MAX);
        for (let i = 0; i < repeat; ++i) {
            next(TouchableObject, this.touchables)
                .spawn(this.getObjectPos() + 8 - 16 * (1 - layer) - 8 * layer + i * 16, y, 6 /* TouchableType.FlyingBall */);
        }
    }
    update(player, playTimeFactor, globalSpeed, event) {
        for (let p of this.specialPlatforms) {
            p.update(globalSpeed, event);
        }
        for (let o of this.touchables) {
            o.update(globalSpeed, event);
            o.playerCollision(globalSpeed, player, event);
            this.objectCollision(o, globalSpeed, event);
        }
        if ((this.tileOffset += globalSpeed * event.tick) >= 16) {
            // TODO: In the old code tileOffset was updated accidentally
            // *afterwards*. See that this does not break anything.
            this.tileOffset -= 16;
            for (let l of this.layers) {
                l.update(this.tilePointer, playTimeFactor);
            }
            this.spawnSpecialPlatform(event);
            if (!this.spawnTouchables(playTimeFactor, event)) {
                this.spawnFlyingEnemies(playTimeFactor, event);
            }
            this.tilePointer = (this.tilePointer + 1) % this.width;
        }
    }
    draw(canvas, assets) {
        const bmpTerrain = assets.getBitmap("t");
        for (let p of this.specialPlatforms) {
            p.draw(canvas, bmpTerrain);
        }
        for (let i = 1; i >= 0; --i) {
            this.layers[i].draw(canvas, bmpTerrain, this.tilePointer, this.tileOffset);
        }
        for (let o of this.touchables) {
            o.draw(canvas, assets);
        }
    }
    objectCollision(o, globalSpeed, event) {
        if (!o.doesExist() || o.isDying())
            return;
        for (let l of this.layers) {
            l.objectCollision(o, globalSpeed, this.tilePointer, this.tileOffset, event);
        }
        for (let p of this.specialPlatforms) {
            p.objectCollision(o, globalSpeed, event);
        }
    }
}

;// ./src/renderer/sprite.ts
class Sprite {
    constructor() {
        this.frame = 0;
        this.timer = 0.0;
        this.getFrame = () => this.frame;
    }
    nextFrame(dir, startFrame, endFrame) {
        this.frame += dir;
        const min = Math.min(startFrame, endFrame);
        const max = Math.max(startFrame, endFrame);
        if (this.frame < min)
            this.frame = max;
        else if (this.frame > max)
            this.frame = min;
    }
    animate(startFrame, endFrame, frameTime, step) {
        const dir = Math.sign(endFrame - startFrame);
        if (frameTime <= 0) {
            this.nextFrame(dir, startFrame, endFrame);
            return;
        }
        this.timer += step;
        while (this.timer >= frameTime) {
            this.timer -= frameTime;
            this.nextFrame(dir, startFrame, endFrame);
        }
    }
    setFrame(frame) {
        this.frame = frame;
    }
}

;// ./src/game/player.ts






const DEATH_TIME = 60;
class Dust extends ExistingObject {
    constructor() {
        super(...arguments);
        this.timer = 0.0;
        this.x = 0;
        this.y = 0;
    }
    spawn(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 1.0;
        this.exist = true;
    }
    update(globalSpeed, event) {
        if (!this.exist)
            return;
        if ((this.timer -= 1.0 / 30.0 * event.tick) <= 0) {
            this.exist = false;
            return;
        }
        this.x -= globalSpeed * event.tick;
    }
    draw(canvas, bmp) {
        if (!this.exist)
            return;
        const px = Math.round(this.x);
        const py = Math.round(this.y);
        const frame = Math.round((1.0 - this.timer) * 3.0);
        canvas.drawBitmap(bmp, px - 4, py - 4, 32 + frame * 8, 72, 8, 8);
    }
}
class Player extends GameObject {
    constructor(x, y) {
        super(x, y);
        // private initialPos : Vector;
        this.jumpTimer = 0;
        this.ledgeTimer = 0;
        this.propelling = false;
        this.propellerTimer = 0;
        this.propellerRelease = false;
        this.canFly = true;
        this.deathTimer = 0;
        this.throwTimer = 0;
        this.dustTimer = 10;
        this.fuel = 1.0;
        // Yes, we store this here, I don't have room for another
        // class
        this.score = 0;
        this.scoreTimer = 0;
        this.orbs = 0;
        this.doesOverlaySpear = (o) => o.doesOverlayRect(this.spearPos, new Vector(), new Vector(16, 8));
        this.getDeathTimer = () => this.deathTimer;
        this.getFuel = () => this.fuel;
        this.getScore = () => this.score;
        this.getOrbs = () => this.orbs;
        this.friction = new Vector(0.15, 0.15);
        this.hitbox = new Vector(12, 12);
        this.center = new Vector(0, 2);
        this.spr = new Sprite();
        this.propeller = new Sprite();
        this.exist = true;
        this.spearPos = new Vector();
        this.computeSpearPos();
        this.dust = new Array();
        // this.initialPos = new Vector(x, y);
    }
    computeSpearPos() {
        const TIP_DISTANCE = 24;
        const THROW_DISTANCE = 64;
        const throwPos = Math.sin((1.0 - this.throwTimer) * Math.PI) * THROW_DISTANCE;
        this.spearPos.x = this.pos.x + TIP_DISTANCE + throwPos;
        this.spearPos.y = this.pos.y + 3;
    }
    control(event) {
        const BASE_SPEED = 1.5;
        const BASE_GRAVITY = 4.0;
        const JUMP_TIME = 20;
        const PROPELLER_FALL_SPEED = 0.75;
        const FLY_DELTA = 0.30;
        const FLY_SPEED_MAX = -1.5;
        const FLY_SPEED_LOW = 2.0;
        const FLY_TIME = 60;
        const FUEL_CONSUMPTION = 1.0 / 180.0;
        let dir = 0;
        if ((event.input.getAction("r") & 1 /* InputState.DownOrPressed */) != 0) {
            dir = 1;
        }
        else if ((event.input.getAction("l") & 1 /* InputState.DownOrPressed */) != 0) {
            dir = -1;
        }
        this.target.x = BASE_SPEED * dir;
        this.target.y = BASE_GRAVITY;
        const jumpButtonState = event.input.getAction("j");
        const jumpButtonDown = (jumpButtonState & 1 /* InputState.DownOrPressed */) != 0;
        if (this.propellerRelease && !jumpButtonDown) {
            this.propellerRelease = false;
        }
        this.propelling = this.fuel > 0 && !this.propellerRelease && jumpButtonDown;
        // Jump
        if (this.ledgeTimer > 0 && jumpButtonState == 3 /* InputState.Pressed */) {
            this.jumpTimer = JUMP_TIME;
            this.touchSurface = false;
            this.ledgeTimer = 0;
            event.audio.playSample(event.assets.getSample("aj"), 0.60);
        }
        else if ((jumpButtonState & 1 /* InputState.DownOrPressed */) == 0) {
            this.jumpTimer = 0;
        }
        // Propelling
        if (this.propelling) {
            this.fuel = Math.max(0, this.fuel - FUEL_CONSUMPTION * event.tick);
            if (this.propellerTimer > 0) {
                this.propellerTimer -= event.tick;
                this.speed.y = clamp(this.speed.y - FLY_DELTA * event.tick, FLY_SPEED_MAX, FLY_SPEED_LOW);
            }
            else if (!this.canFly && this.speed.y >= PROPELLER_FALL_SPEED) {
                this.speed.y = PROPELLER_FALL_SPEED;
                this.target.y = this.speed.y;
            }
            else if (this.canFly) {
                this.propellerTimer = FLY_TIME;
                this.canFly = false;
            }
        }
        else {
            this.propellerTimer = 0;
        }
        const throwState = event.input.getAction("t");
        if (this.throwTimer <= 0 && throwState == 3 /* InputState.Pressed */) {
            this.throwTimer = 1.0;
            event.audio.playSample(event.assets.getSample("aa"), 0.60);
        }
        else if (this.throwTimer > 0.5 && (throwState & 1 /* InputState.DownOrPressed */) == 0) {
            this.throwTimer = 1.0 - this.throwTimer;
        }
    }
    updateTimers(event) {
        const JUMP_SPEED = 2.75;
        const THROW_SPEED = 1.0 / 60.0;
        if (this.jumpTimer > 0) {
            this.speed.y = -JUMP_SPEED;
            this.jumpTimer -= event.tick;
        }
        if (this.ledgeTimer > 0) {
            this.ledgeTimer -= event.tick;
        }
        if (this.throwTimer > 0.0) {
            this.throwTimer -= THROW_SPEED * event.tick;
        }
    }
    checkScreenCollisions(event) {
        if (this.speed.x < 0 && this.pos.x - this.hitbox.x / 2 <= 0) {
            this.pos.x = this.hitbox.x / 2;
            this.speed.x = 0;
        }
        else if (this.speed.x > 0 && this.pos.x + this.hitbox.x / 2 >= event.screenWidth) {
            this.pos.x = event.screenWidth - this.hitbox.x / 2;
            this.speed.x = 0;
        }
        if (this.pos.y > event.screenHeight) {
            this.kill(event);
            this.pos.y = event.screenHeight;
        }
    }
    animate(globalSpeed, event) {
        const JUMP_EPS = 0.5;
        const PROPELLER_SPEED = 2;
        let frame;
        if (this.touchSurface) {
            this.spr.animate(0, 3, 8 - globalSpeed * 2, event.tick);
        }
        else {
            frame = 5;
            if (this.speed.y < -JUMP_EPS)
                frame = 4;
            else if (this.speed.y > JUMP_EPS)
                frame = 6;
            this.spr.setFrame(frame);
        }
        const lastFrame = this.propeller.getFrame();
        if (this.propelling) {
            this.propeller.animate(0, 3, PROPELLER_SPEED, event.tick);
            if (this.propeller.getFrame() != lastFrame &&
                lastFrame == 0) {
                event.audio.playSample(event.assets.getSample("ap"), 0.60);
            }
        }
    }
    updateDust(globalSpeed, event) {
        const dustTime = this.propelling ? 6 : 8;
        const speed = this.propelling ? 1 : globalSpeed;
        if ((this.touchSurface || this.propelling) &&
            (this.dustTimer -= speed * event.tick) <= 0) {
            this.dustTimer += dustTime;
            next(Dust, this.dust).spawn(this.pos.x - 4, this.pos.y + 7);
        }
        for (let d of this.dust) {
            d.update(globalSpeed, event);
        }
    }
    // Wait draw *what* now?
    drawDeathBalls(canvas) {
        const MAX_DISTANCE = 64;
        const COLORS = ["#5555aa", "#aaaaff", "#ffffff"];
        const RADIUS = [7, 5, 3];
        // const shift = (((this.deathTimer / 3) | 0)) % 3;
        // const angleShift = Math.PI*2/8;
        const distance = this.deathTimer / DEATH_TIME * MAX_DISTANCE;
        let dx;
        let dy;
        let angle;
        for (let i = 0; i < 8; ++i) {
            angle = Math.PI * 2 / 8 * i;
            dx = this.pos.x + Math.cos(angle) * distance;
            dy = this.pos.y + Math.sin(angle) * distance;
            for (let j = 0; j < 3; ++j) {
                canvas.fillColor(COLORS[(j + ((((this.deathTimer / 3) | 0)) % 3)) % 3]);
                canvas.fillCircle(dx, dy, RADIUS[j]);
            }
        }
    }
    drawSpear(canvas, bmp) {
        // Need to re-compute this for reasons
        this.computeSpearPos();
        const px = Math.round(this.pos.x);
        const dx = Math.round(this.spearPos.x);
        const dy = Math.round(this.spearPos.y);
        const w = dx - px;
        canvas.fillColor("#000000");
        canvas.fillRect(px, dy - 1, w, 3);
        canvas.fillColor("#aa5500");
        canvas.fillRect(px, dy, w, 1);
        // Spear tip
        canvas.drawBitmap(bmp, dx - 8, dy - 3, 0, 112, 16, 8);
    }
    updateEvent(globalSpeed, event) {
        const SCORE_TIME = 6;
        this.control(event);
        this.updateTimers(event);
        this.checkScreenCollisions(event);
        this.animate(globalSpeed, event);
        this.updateDust(globalSpeed, event);
        this.touchSurface = false;
        if ((this.scoreTimer += globalSpeed * event.tick) >= SCORE_TIME) {
            this.scoreTimer -= SCORE_TIME;
            this.addScore(1);
        }
        this.computeSpearPos();
    }
    die(globalSpeed, event) {
        for (let d of this.dust) {
            d.update(globalSpeed, event);
        }
        return (this.deathTimer += event.tick) >= DEATH_TIME;
    }
    floorCollisionEvent(event) {
        const LEDGE_TIME = 8;
        this.touchSurface = true;
        this.ledgeTimer = LEDGE_TIME;
        this.propellerRelease = true;
        this.propelling = false;
        this.canFly = true;
    }
    draw(canvas, assets) {
        const SX = [0, 1, 0, 2, 0, 0, 1];
        const SY = [0, 0, 0, 0, 1, 0, 1];
        const FEATHER = [0, 1, 0, 2, 1, 0, 2];
        if (!this.exist)
            return;
        const dx = Math.round(this.pos.x) - 8;
        const dy = Math.round(this.pos.y) - 7;
        const bmp = assets.getBitmap("b");
        for (let d of this.dust) {
            d.draw(canvas, bmp);
        }
        if (this.dying) {
            this.drawDeathBalls(canvas);
            return;
        }
        const sx = SX[this.spr.getFrame()] * 16;
        const sy = 40 + SY[this.spr.getFrame()] * 8;
        const fsx = FEATHER[this.spr.getFrame()] * 16;
        this.drawSpear(canvas, bmp);
        // Body
        canvas.drawBitmap(bmp, dx, dy, 48, 32, 16, 16);
        // Legs
        canvas.drawBitmap(bmp, dx, dy + 8, sx, sy, 16, 8);
        // Feather
        if (this.propelling) {
            drawPropeller(canvas, bmp, this.propeller.getFrame(), dx, dy);
        }
        else {
            canvas.drawBitmap(bmp, dx, dy - 6, fsx, 32, 16, 8);
        }
        // Eyes
        canvas.fillColor("#aa0000");
        for (let i = 0; i < 2; ++i) {
            canvas.fillRect(dx + 7 + i * 4, dy + 6, 1, 1);
        }
    }
    hurtCollision(x, y, w, h, event) {
        if (!this.exist || this.dying)
            return false;
        if (this.doesOverlayRect(new Vector(x + w / 2, y + h / 2), new Vector(), new Vector(w, h))) {
            this.kill(event);
        }
    }
    // This is more memory friendly, but wastes too many bytes...
    /*
    public recreate() : void {

        this.pos = this.initialPos.clone();
        this.speed.zero();
        this.target.zero();

        this.canFly = false;
        this.touchSurface = true;
        this.propelling = false;
        this.propellerTimer = 0;
        this.propellerRelease = false;
        this.ledgeTimer = 0;
        this.jumpTimer = 0;
        this.deathTimer = 0;
        this.fuel = 1.0;

        this.score = 0;
        this.scoreTimer = 0;
        this.orbs = 0;

        this.spr.setFrame(0);
        this.propeller.setFrame(0);
        
        this.dying = false;
        this.exist = true;
    }
    */
    // Good naming here, congrats
    touchTouchableEvent(isGem, event) {
        const FUEL_BONUS = 0.15;
        if (isGem) {
            ++this.orbs;
            this.fuel = Math.min(1.0, this.fuel + FUEL_BONUS);
            event.audio.playSample(event.assets.getSample("ag"), 0.60);
            return;
        }
        this.kill(event);
    }
    kill(event) {
        this.dying = true;
        event.audio.playSample(event.assets.getSample("ad"), 0.60);
    }
    stompJump() {
        const STOMP_SPEED = -3.0;
        // To avoid getting killed when trying to stomp
        // two enemies...
        const SAFE_SHIFT = -2.0;
        this.speed.y = STOMP_SPEED;
        this.canFly = true;
        this.pos.y += SAFE_SHIFT;
    }
    addScore(count) {
        this.score += (count * (1.0 + this.orbs / 10.0)) | 0;
    }
}

;// ./src/game/camera.ts
class Camera {
    constructor(y = 0) {
        this.speed = 1.0;
        this.getPosition = () => this.y;
        this.y = y;
    }
    reachInitialPoint(event) {
        const DELTA = 0.1;
        const MAX_SPEED = 4.0;
        this.speed = Math.min(MAX_SPEED, this.speed + DELTA * event.tick);
        if ((this.y += this.speed * event.tick) >= 0) {
            this.y = 0;
            return true;
        }
        return false;
    }
    followObject(o, event) {
        const VERTICAL_DEADZONE = 16;
        const RANGE_OFFSET = 24;
        const py = o.getPosition().y - event.screenHeight / 2 + RANGE_OFFSET;
        // TEMP (or not?)
        let d = this.y - py;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {
            this.y = py + VERTICAL_DEADZONE * Math.sign(d);
        }
        this.y = Math.min(0, this.y);
    }
    use(canvas) {
        canvas.moveTo(0, -Math.round(this.y));
    }
    reset() {
        this.y = 0;
    }
}

;// ./src/funtico-sdk.ts
// Funtico GameLoop SDK integration (bundled into build/bundle.js)
// Auto SSO via localStorage managed by login.funtico.com through SDK
class FunticoManager {
    constructor() {
        this.sdk = null;
        this.user = null;
        this.ready = false;
        this.loadingPromise = null;
        this.init();
    }
    wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }
    shouldAutoLogin() {
        const params = new URLSearchParams(location.search);
        const forced = params.has('autologin') || params.get('sso') === '1';
        // Always auto-login on official hosts
        const onGameHost = location.hostname === 'games.gameloop.funtico.com';
        const onAnyFuntico = location.hostname.endsWith('.funtico.com') || location.hostname === 'funtico.com';
        const fromFuntico = !!document.referrer && document.referrer.includes('funtico.com');
        return forced || onGameHost || onAnyFuntico || fromFuntico;
    }
    async processCallbackAndCleanUrl() {
        const params = new URLSearchParams(location.search);
        const hasCode = params.has('code');
        const hasState = params.has('state');
        const hasError = params.has('error');
        const hasCb = hasCode || hasState || hasError;
        if (hasCb) {
            console.log('[Funtico] OAuth callback detected!');
            console.log('[Funtico] - code:', hasCode ? 'present' : 'none');
            console.log('[Funtico] - state:', hasState ? 'present' : 'none');
            console.log('[Funtico] - error:', hasError ? params.get('error') : 'none');
            if (hasError) {
                console.log('[Funtico] OAuth error:', params.get('error'), params.get('error_description'));
            }
            // Give SDK time to finish OIDC token exchange (authorization code → access token)
            console.log('[Funtico] Waiting for SDK to exchange authorization code for access token...');
            await this.wait(3000); // Wait 3 seconds for token exchange
            // Clean URL after SDK processed the callback
            console.log('[Funtico] Cleaning OAuth parameters from URL...');
            history.replaceState({}, document.title, location.pathname);
            // Try to get user info after callback processing
            console.log('[Funtico] Checking if user is authenticated after OAuth callback...');
            await this.getUserSafe(5);
            if (this.user) {
                console.log('[Funtico] ✅ OAuth callback successful! User authenticated:', this.user.username);
            }
            else {
                console.log('[Funtico] ⚠️ OAuth callback processed but user info not available yet');
            }
        }
    }
    async getUserSafe(retries = 3, ignoreErrors = false) {
        if (!this.sdk)
            return null;
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`[Funtico] Getting user info (attempt ${i + 1}/${retries})...`);
                const info = await this.sdk.getUserInfo();
                console.log('[Funtico] getUserInfo() response:', info);
                if (info && info.username) {
                    this.user = info;
                    console.log('[Funtico] ✅ User data retrieved:', info.username);
                    return this.user;
                }
                // Check alternative username fields
                if (info && !info.username) {
                    const altUsername = info.name || info.displayName || info.user?.name || info.user?.username;
                    if (altUsername) {
                        console.log('[Funtico] Found username in alternative field:', altUsername);
                        this.user = { ...info, username: altUsername };
                        return this.user;
                    }
                    console.log('[Funtico] getUserInfo returned data but no username field:', Object.keys(info));
                }
                // Wait before retry
                if (i < retries - 1) {
                    await this.wait(1000); // Wait 1s before retry (increased from 500ms)
                }
            }
            catch (err) {
                const errMsg = err?.message || err?.name || 'unknown';
                const errStatus = err?.status || '';
                console.log(`[Funtico] getUserInfo error (attempt ${i + 1}): ${errMsg} ${errStatus ? `(${errStatus})` : ''}`);
                // If 401, maybe we need to initialize session first
                if (err?.status === 401 && !ignoreErrors) {
                    console.log('[Funtico] 401 error - session not initialized or expired');
                }
                if (i < retries - 1) {
                    await this.wait(1000);
                }
            }
        }
        console.log('[Funtico] Failed to get user info after retries');
        return this.user;
    }
    async bootstrapAuth() {
        console.log('[Funtico] Checking for existing session...');
        // Process OAuth callback if present
        await this.processCallbackAndCleanUrl();
        // Try to restore session - like Circuit-Siege, just call getUserInfo()
        await this.getUserSafe(3, true);
        if (this.user) {
            console.log('[Funtico] ✅ Session active:', this.user.username);
        }
        else {
            console.log('[Funtico] ℹ️ No active session - Press L to login');
        }
    }
    async ensureSdk() {
        if (this.sdk)
            return true;
        const W = window;
        if (W.FunticoSDK) {
            const env = W.FUNTICO_ENV || 'production';
            console.log('[Funtico] Initializing SDK with clientId: gl-avalanche-knight, env:', env);
            this.sdk = new W.FunticoSDK({ authClientId: 'gl-avalanche-knight', env });
            this.ready = true;
            // Wait for SDK to auto-restore session from localStorage
            console.log('[Funtico] Waiting for SDK to initialize and restore session...');
            await this.wait(2000); // Wait 2 seconds for SDK internal initialization
            return true;
        }
        if (!this.loadingPromise) {
            this.loadingPromise = new Promise((resolve) => {
                const el = document.createElement('script');
                el.src = FunticoManager.CDN_URL;
                el.async = true;
                el.onload = () => resolve();
                el.onerror = () => resolve(); // resolve anyway; we'll check after
                document.head.appendChild(el);
            });
        }
        await this.loadingPromise;
        if (window.FunticoSDK) {
            const env = window.FUNTICO_ENV || 'production';
            console.log('[Funtico] Initializing SDK with clientId: gl-avalanche-knight, env:', env);
            this.sdk = new window.FunticoSDK({ authClientId: 'gl-avalanche-knight', env });
            this.ready = true;
            // Wait for SDK to auto-restore session from localStorage
            console.log('[Funtico] Waiting for SDK to initialize and restore session...');
            await this.wait(2000); // Wait 2 seconds for SDK internal initialization
            return true;
        }
        return false;
    }
    init() {
        // Don’t throw if SDK not present yet; try lazily and then bootstrap
        this.ensureSdk().then(() => this.bootstrapAuth());
    }
    // Public API used by game
    isReady() { return this.ready && !!this.sdk; }
    isAuthenticated() { return !!this.user; }
    getUsername() { return (this.user && this.user.username) || ''; }
    async getUserInfo() { await this.ensureSdk(); return await this.getUserSafe(); }
    async signIn() {
        if (!(await this.ensureSdk()))
            return false;
        // Check if user is already logged in
        if (this.user && this.user.username) {
            // Show browser alert when already logged in
            alert(`✅ Already logged in as: ${this.user.username}`);
            console.log('[Funtico] User already authenticated:', this.user.username);
            return true;
        }
        try {
            const s = this.sdk;
            // Use registered callback URL (hardcoded to registered domain)
            const callbackUrl = 'https://avalanche-knight.vercel.app/';
            console.log('[Funtico] Starting login flow...');
            console.log('[Funtico] Current URL:', window.location.href);
            console.log('[Funtico] Callback URL (registered):', callbackUrl);
            if (typeof s.signInWithFuntico === 'function') {
                console.log('[Funtico] Redirecting to Funtico login...');
                await s.signInWithFuntico(callbackUrl);
            }
            else if (typeof s.signIn === 'function') {
                console.log('[Funtico] Redirecting to Funtico login...');
                await s.signIn();
            }
            else {
                console.log('[Funtico] ❌ No signIn method available');
                alert('❌ Login error: SDK not available');
                return false;
            }
            // After redirect back, wait for SDK to process
            console.log('[Funtico] Login redirect completed, processing...');
            await this.wait(1000);
            // Try to get user info with retries
            await this.getUserSafe(5);
            if (this.user) {
                console.log('[Funtico] ✅ Login successful! User:', this.user.username);
                // Show success notification
                alert(`✅ Login successful!\nWelcome ${this.user.username}!`);
                return true;
            }
            else {
                console.log('[Funtico] ⚠️ Login completed but no user data (may need page reload)');
                return false;
            }
        }
        catch (err) {
            console.error('[Funtico] ❌ Login failed:', err);
            alert('❌ Login failed. Please try again.');
            return false;
        }
    }
    async signOut() {
        if (!(await this.ensureSdk()))
            return false;
        // Check if user is logged in
        if (!this.user) {
            alert('ℹ️ Not logged in');
            console.log('[Funtico] No user to logout');
            return false;
        }
        const username = this.user.username;
        try {
            const s = this.sdk;
            // Use registered callback URL (same as signIn)
            const redirectUrl = 'https://avalanche-knight.vercel.app/';
            console.log('[Funtico] Logging out user:', username);
            if (typeof s.signOut === 'function') {
                // Newer API accepts postSignOutRedirectUrl
                if (s.signOut.length >= 1) {
                    await s.signOut(redirectUrl);
                }
                else {
                    await s.signOut();
                }
            }
            else {
                alert('❌ Logout error: SDK method not available');
                return false;
            }
            this.user = null;
            console.log('[Funtico] ✅ Logout successful');
            alert(`✅ Logged out successfully!\nGoodbye ${username}!`);
            return true;
        }
        catch (err) {
            console.error('[Funtico] ❌ Logout failed:', err);
            alert('❌ Logout failed. Please try again.');
            return false;
        }
    }
    async saveScore(score) {
        if (!(await this.ensureSdk()))
            return false;
        try {
            return !!(await this.sdk.saveScore(score));
        }
        catch {
            return false;
        }
    }
    async getLeaderboard() {
        if (!(await this.ensureSdk()))
            return [];
        try {
            const lb = await this.sdk.getLeaderboard();
            return Array.isArray(lb) ? lb : [];
        }
        catch {
            return [];
        }
    }
    // Debug helper: Clear session storage
    clearAuthGuards() {
        sessionStorage.clear();
        console.log('[Funtico] Session storage cleared');
    }
    // Debug helper: Get current auth state
    getDebugInfo() {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const funticoCookies = cookies.filter(c => c.toLowerCase().includes('funtico') ||
            c.toLowerCase().includes('auth') ||
            c.toLowerCase().includes('token') ||
            c.toLowerCase().includes('session'));
        const lsKeys = Object.keys(localStorage);
        const funticoLS = lsKeys.filter(k => k.toLowerCase().includes('funtico') ||
            k.toLowerCase().includes('auth') ||
            k.toLowerCase().includes('token') ||
            k.toLowerCase().includes('oidc'));
        return {
            isReady: this.ready,
            isAuthenticated: !!this.user,
            username: this.getUsername(),
            shouldAutoLogin: this.shouldAutoLogin(),
            hostname: location.hostname,
            referrer: document.referrer,
            hasSDK: !!this.sdk,
            sdkAvailable: !!window.FunticoSDK,
            funticoCookies: funticoCookies.length > 0 ? funticoCookies : 'none',
            funticoLocalStorage: funticoLS.length > 0 ? funticoLS : 'none',
            allCookies: cookies.length,
            allLocalStorageKeys: lsKeys.length,
        };
    }
    // Get SDK instance for debugging
    getSdk() {
        return this.sdk;
    }
}
FunticoManager.CDN_URL = 'https://funtico-frontend-js-sdk.pages.dev/funtico-sdk.min.js';
// Singleton used by the game code
const funticoManager = new FunticoManager();
// Expose debug helpers to window for console debugging
window.funticoDebug = {
    getInfo: () => funticoManager.getDebugInfo(),
    clearGuards: () => funticoManager.clearAuthGuards(),
    login: () => funticoManager.signIn(),
    logout: () => funticoManager.signOut(),
    getUserInfo: () => funticoManager.getUserInfo(),
    getSdk: () => funticoManager.getSdk(),
    inspectCookies: () => {
        console.log('All cookies:', document.cookie);
        return document.cookie.split(';').map(c => c.trim());
    },
    inspectLocalStorage: () => {
        const data = {};
        Object.keys(localStorage).forEach(key => {
            try {
                data[key] = JSON.parse(localStorage[key]);
            }
            catch {
                data[key] = localStorage[key];
            }
        });
        console.log('LocalStorage:', data);
        return data;
    },
};

;// ./src/game/game.ts





const SPEED_UP_ALERT_TIME = 180;
const scoreToString = (score) => {
    const s = String(score);
    return "0".repeat(Math.max(0, 6 - s.length)) + s;
};
const getHiscore = () => {
    try {
        return Number(window["localStorage"].getItem("__s"));
    }
    catch (e) { }
    return 0;
};
const storeScore = (score) => {
    try {
        window["localStorage"].setItem("__s", String(score));
    }
    catch (e) { }
};
class Game {
    constructor(event) {
        this.cloudPos = 0;
        this.globalSpeed = 0.0;
        this.targetSpeed = 1.0; // 2.0;
        this.playTime = 0;
        this.speedUpCount = 0;
        this.speedUpAlert = 0;
        this.paused = false;
        this.gameOverPhase = 0;
        this.showLeaderboard = false;
        this.scoreSubmitted = false;
        this.scoreSubmissionStatus = "";
        this.cachedLeaderboard = [];
        this.leaderboardLoaded = false;
        this.leaderboardScreen = false;
        this.transitionTimer = 1.0;
        this.fadeIn = false;
        this.hiscore = 0;
        this.titleScreenActive = true;
        this.enterTimer = 0.49;
        this.gameStarted = false;
        // For animation
        this.oldFuel = 1.0;
        this.terrain = new Terrain(event);
        this.player = new Player(64, event.screenHeight - 40);
        this.camera = new Camera(-144);
        this.hiscore = getHiscore();
        // Check if user is already logged in and show popup
        this.checkExistingLogin();
    }
    checkExistingLogin() {
        // Check if user is already logged in from existing session
        setTimeout(() => {
            if (funticoManager.isAuthenticated()) {
                const username = funticoManager.getUsername();
                if (username) {
                    console.log('Existing login detected:', username);
                    // Login detected - no popup notification
                }
            }
        }, 1000); // Wait 1 second for SDK to initialize
    }
    drawBackground(canvas, assets) {
        const CLOUD_Y = 64;
        const CLOUD_EXTRA_HEIGHT = 16;
        const CAMERA_SHIFT_FACTOR = 0.25;
        const bmpBase = assets.getBitmap("b");
        canvas.drawBitmap(assets.getBitmap("s"));
        canvas.move(0, -Math.round(this.camera.getPosition() * CAMERA_SHIFT_FACTOR));
        // Clouds
        canvas.fillColor("#ffffff");
        canvas.fillRect(0, CLOUD_Y + 16, canvas.width, CLOUD_EXTRA_HEIGHT);
        const shift = -Math.round(this.cloudPos);
        for (let i = 0; i < (canvas.width / 48) + 2; ++i) {
            canvas.drawBitmap(bmpBase, shift + i * 48, CLOUD_Y, 0, 56, 48, 16);
        }
        // Water
        const waterY = (CLOUD_Y + CLOUD_EXTRA_HEIGHT + 32);
        canvas.fillColor("#0055aa");
        canvas.fillRect(0, waterY, canvas.width, canvas.height - waterY);
        for (let i = 0; i < canvas.width / 8; ++i) {
            canvas.drawBitmap(bmpBase, i * 8, CLOUD_Y + 16 + CLOUD_EXTRA_HEIGHT, 48, 56, 8, 16);
        }
        canvas.moveTo();
    }
    reset(event) {
        this.player = new Player(64, event.screenHeight - 40);
        this.terrain = new Terrain(event);
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
    drawGameOver(canvas, assets) {
        const bmpGameOver = assets.getBitmap("g");
        const fontYellow = assets.getBitmap("fy");
        const cx = canvas.width / 2;
        const dx = cx - 60;
        const dy = 32;
        if (this.gameOverPhase == 2) {
            canvas.fillColor("#000000aa");
            canvas.fillRect();
            // ALL TEXT REMOVED FOR DEBUGGING
            canvas.drawText(fontYellow, "SCORE: " + scoreToString(this.player.getScore()), cx, 80, -1, 0, 1 /* TextAlign.Center */);
            canvas.drawText(fontYellow, "BEST: " + scoreToString(this.hiscore), cx, 96, -1, 0, 1 /* TextAlign.Center */);
            // Score submission runs in background - no UI display
            // Show controls
            if (this.enterTimer >= 0.5) {
                canvas.drawText(fontYellow, "ENTER: RESTART", cx, canvas.height - 20, -1, 0, 1 /* TextAlign.Center */);
            }
        }
        let t = this.player.getDeathTimer() / DEATH_TIME;
        if (this.gameOverPhase == 1 && t < 0.5) {
            t = (0.5 - t) * 2;
            canvas.drawFunkyWaveEffectBitmap(bmpGameOver, dx, dy, t * t, 32, 4, 16);
            return;
        }
        canvas.drawBitmap(bmpGameOver, dx, dy);
    }
    drawHUD(canvas, assets) {
        const BAR_COLOR_1 = ["#aaff00", "#ffff55", "#ffaa00", "#aa0000", "#000000"];
        const BAR_COLOR_2 = ["#55aa00", "#aaaa00", "#aa5500", "#550000", "#000000"];
        const BAR_OUTER_COLOR = ["#000000", "#555555"];
        const BAR_WIDTH = 40;
        const BAR_HEIGHT = 7;
        const BAR_X = 12;
        const BAR_Y = 5;
        const bmpBase = assets.getBitmap("b");
        const bmpFont = assets.getBitmap("fw");
        canvas.fillColor("#00000033");
        canvas.fillRect(0, 0, canvas.width, 16);
        // Score
        canvas.drawBitmap(bmpBase, canvas.width / 2 - 8, 1, 48, 80, 16, 8);
        canvas.drawText(bmpFont, scoreToString(this.player.getScore()), canvas.width / 2, 8, -1, 0, 1 /* TextAlign.Center */);
        // Orbs - DISABLED FOR DEBUG
        canvas.drawBitmap(bmpBase, canvas.width - 40, 4, 32, 88, 8, 8);
        // canvas.drawText(bmpFont, "#" + String(this.player.getOrbs()), canvas.width - 31, 4, -1);
        // Fuel
        canvas.drawBitmap(bmpBase, 2, 4, 40, 88, 8, 8);
        for (let i = 0; i < 2; ++i) {
            canvas.fillColor(BAR_OUTER_COLOR[i]);
            canvas.fillRect(BAR_X + i, BAR_Y + i, BAR_WIDTH - i * 2, BAR_HEIGHT - i * 2);
        }
        const fillLevel = (this.oldFuel * (BAR_WIDTH - 2)) | 0;
        const barIndex = 3 - Math.round(this.oldFuel * 3);
        if (fillLevel > 1) {
            canvas.fillColor(BAR_COLOR_2[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel, BAR_HEIGHT - 2);
            canvas.fillColor(BAR_COLOR_1[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel - 1, BAR_HEIGHT - 3);
        }
    }
    drawTitleScreen(canvas, assets) {
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
        canvas.drawVerticallyWavingBitmap(bmpLogo, w / 2 - bmpLogo.width / 2, 12, Math.PI * 2, 4, (this.enterTimer + this.transitionTimer) * Math.PI * 2);
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
        canvas.drawText(bmpFont, "CONTROLS: ", canvas.width / 2, 44, 0, 0, 1 /* TextAlign.Center */);
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
            canvas.drawText(bmpFont, "PRESS ENTER", w / 2, h - 24, -1, 0, 1 /* TextAlign.Center */);
        }
        canvas.drawText(bmpFont, "$2025 AVALANCHE GAMELOOP", w / 2, h - 9, -1, 0, 1 /* TextAlign.Center */);
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
    drawLeaderboard(canvas, assets) {
        const bmpFont = assets.getBitmap("fy");
        const bmpFontWhite = assets.getBitmap("fw");
        const bmpFontYellow = assets.getBitmap("fy");
        const w = canvas.width;
        const h = canvas.height;
        // Clear background with solid color
        canvas.fillColor("#000000");
        canvas.fillRect(0, 0, w, h);
        // Semi-transparent overlay
        canvas.fillColor("#00000088");
        canvas.fillRect(0, 0, w, h);
        // Title
        canvas.drawText(bmpFontYellow, "LEADERBOARD", w / 2, 20, -1, 0, 1 /* TextAlign.Center */);
        // Load leaderboard data only once
        if (!this.leaderboardLoaded) {
            this.leaderboardLoaded = true;
            this.getFunticoLeaderboard().then(leaderboard => {
                // Handle both array and object with numeric keys
                if (Array.isArray(leaderboard)) {
                    this.cachedLeaderboard = leaderboard;
                }
                else if (typeof leaderboard === 'object' && leaderboard !== null) {
                    // Convert object with numeric keys to array
                    this.cachedLeaderboard = Object.values(leaderboard);
                }
                else {
                    this.cachedLeaderboard = [];
                }
            }).catch(error => {
                console.error('Error loading leaderboard:', error);
                this.cachedLeaderboard = [];
            });
        }
        // Draw cached leaderboard data
        if (this.cachedLeaderboard.length === 0) {
            // No leaderboard data available
            canvas.drawText(bmpFontYellow, "NO LEADERBOARD DATA", w / 2, h / 2 - 10, -1, 0, 1 /* TextAlign.Center */);
            canvas.drawText(bmpFontWhite, "Login to submit scores", w / 2, h / 2 + 5, -1, 0, 1 /* TextAlign.Center */);
        }
        else {
            // Draw leaderboard entries
            let y = 40;
            for (const entry of this.cachedLeaderboard) {
                console.log('Entry data:', entry);
                console.log('Entry user:', entry.user);
                console.log('Entry username:', entry.user?.username);
                // Safe access to username with fallback
                const nameText = entry.user?.username || 'Unknown User';
                const scoreText = entry.score?.toString().padStart(5, ' ') || '0';
                console.log('Rendering nameText:', nameText, 'at position:', 25, y);
                console.log('Rendering scoreText:', scoreText, 'at position:', w - 60, y);
                // Highlight current user if logged in
                if (this.isLoggedIn() && entry.user?.username === this.getCurrentUsername()) {
                    canvas.fillColor("#ffff0033");
                    canvas.fillRect(20, y - 2, w - 40, 10);
                }
                // Test with different positions and fonts
                canvas.drawText(bmpFontWhite, nameText, 25, y);
                canvas.drawText(bmpFontWhite, scoreText, w - 60, y);
                y += 20; // Space between entries
            }
        }
        // Clean leaderboard display - no instructions
    }
    drawLeaderboardScreen(canvas, assets) {
        const bmpFontWhite = assets.getBitmap("fw");
        const bmpFontYellow = assets.getBitmap("fy");
        const w = canvas.width;
        const h = canvas.height;
        // Clear background with solid color
        canvas.fillColor("#000000");
        canvas.fillRect(0, 0, w, h);
        // Semi-transparent overlay
        canvas.fillColor("#00000088");
        canvas.fillRect(0, 0, w, h);
        // Title
        canvas.drawText(bmpFontYellow, "LEADERBOARD", w / 2, 20, -1, 0, 1 /* TextAlign.Center */);
        // Load leaderboard data only once
        if (!this.leaderboardLoaded) {
            this.leaderboardLoaded = true;
            this.getFunticoLeaderboard().then(leaderboard => {
                // Handle both array and object with numeric keys
                if (Array.isArray(leaderboard)) {
                    this.cachedLeaderboard = leaderboard;
                }
                else if (typeof leaderboard === 'object' && leaderboard !== null) {
                    // Convert object with numeric keys to array
                    this.cachedLeaderboard = Object.values(leaderboard);
                }
                else {
                    this.cachedLeaderboard = [];
                }
            }).catch(error => {
                console.error('Error loading leaderboard:', error);
                this.cachedLeaderboard = [];
            });
        }
        // Draw cached leaderboard data
        if (this.cachedLeaderboard.length === 0) {
            // No leaderboard data available
            canvas.drawText(bmpFontYellow, "NO LEADERBOARD DATA", w / 2, h / 2 - 10, -1, 0, 1 /* TextAlign.Center */);
            canvas.drawText(bmpFontWhite, "Login to submit scores", w / 2, h / 2 + 5, -1, 0, 1 /* TextAlign.Center */);
        }
        else {
            // Draw leaderboard entries
            let y = 60;
            for (const entry of this.cachedLeaderboard) {
                const nameText = entry.user?.username || 'Unknown User';
                const scoreText = entry.score?.toString().padStart(5, ' ') || '0';
                // Draw username and score cleanly
                canvas.drawText(bmpFontWhite, nameText, 25, y);
                canvas.drawText(bmpFontWhite, scoreText, w - 60, y);
                y += 20; // Space between entries
            }
        }
        // Clean leaderboard display - no instructions
    }
    async showLeaderboardPopup() {
        try {
            const leaderboard = await this.getFunticoLeaderboard();
            // Handle both array and object with numeric keys
            let leaderboardData = [];
            if (Array.isArray(leaderboard)) {
                leaderboardData = leaderboard;
            }
            else if (typeof leaderboard === 'object' && leaderboard !== null) {
                leaderboardData = Object.values(leaderboard);
            }
            if (leaderboardData.length === 0) {
                alert("🏆 LEADERBOARD\n\nNo data available.\nLogin to submit scores!");
                return;
            }
            // Format leaderboard text
            let leaderboardText = "🏆 LEADERBOARD\n\n";
            leaderboardData.slice(0, 5).forEach((entry, index) => {
                const rank = index + 1;
                const username = entry.user?.username || 'Unknown User';
                const score = entry.score || 0;
                console.log(`Real leaderboard entry ${rank}: ${username} - ${score}`);
                leaderboardText += `${rank}. ${username} - ${score}\n`;
            });
            alert(leaderboardText);
        }
        catch (error) {
            console.error('Error loading leaderboard:', error);
            alert("🏆 LEADERBOARD\n\nError loading leaderboard.\nTry again later!");
        }
    }
    drawTransition(canvas) {
        if (this.transitionTimer <= 0)
            return;
        let t = this.transitionTimer;
        if (!this.fadeIn)
            t = 1.0 - t;
        canvas.fillColor("#000000");
        canvas.fillCircleOutside((Math.hypot(canvas.width / 2, canvas.height / 2) * t * t) | 0);
    }
    // public init(param : SceneParameter, event : ProgramEvent) : void {}
    updateTimersAndSpeed(event) {
        // const SPEED_UP_INTERVALS = [30, 60, 90, 120];
        if (this.speedUpAlert > 0) {
            this.speedUpAlert -= event.tick;
        }
        this.playTime += event.tick;
        if (this.speedUpCount < 4 &&
            this.playTime >= (this.speedUpCount + 1) * 1200) {
            this.targetSpeed = 1.0 + (++this.speedUpCount) * 0.25;
            this.speedUpAlert = SPEED_UP_ALERT_TIME;
            event.audio.playSample(event.assets.getSample("au"), 0.50);
        }
        this.globalSpeed = updateSpeedAxis(this.globalSpeed, this.targetSpeed, 1.0 / 60.0 * (this.gameOverPhase * 2 + 1));
        this.oldFuel = updateSpeedAxis(this.oldFuel, this.player.getFuel(), 1.0 / 60.0 * event.tick);
    }
    update(event) {
        // Handle leaderboard button globally (works in ALL scenes)
        if (event.input.getAction("leaderboard") == 3 /* InputState.Pressed */) {
            event.audio.playSample(event.assets.getSample("as"), 0.60);
            this.showLeaderboardPopup();
        }
        const CLOUD_BASE_SPEED = 0.25;
        const CLOUD_SPEED_FACTOR = 0.125;
        const TRANSITION_SPEED = 1.0 / 30.0;
        const ENTER_SPEED = 1.0 / 60.0;
        const MAX_PLAY_TIME_MOD = 180 * 60;
        const speedFactor = this.titleScreenActive ? 0.5 : 1.0;
        if (this.transitionTimer > 0.0) {
            if ((this.transitionTimer -= TRANSITION_SPEED * speedFactor * event.tick) <= 0.0 &&
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
        this.enterTimer = (this.enterTimer + ENTER_SPEED * event.tick) % 1.0;
        if (this.titleScreenActive) {
            this.cloudPos = (this.cloudPos + CLOUD_BASE_SPEED * event.tick) % 48;
            if (event.input.getAction("s") == 3 /* InputState.Pressed */) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.titleScreenActive = false;
            }
            // Handle Funtico login/logout
            if (event.input.getAction("login") == 3 /* InputState.Pressed */) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.handleLogin();
            }
            // Leaderboard handled globally - no need for separate handler here
            return;
        }
        if (!this.gameStarted) {
            this.gameStarted = this.camera.reachInitialPoint(event);
            return;
        }
        if (this.gameOverPhase == 2) {
            if (event.input.getAction("s") == 3 /* InputState.Pressed */) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.transitionTimer = 1.0;
                this.fadeIn = true;
            }
            // Handle return to home button in game over screen
            if (event.input.getAction("h") == 3 /* InputState.Pressed */) {
                event.audio.playSample(event.assets.getSample("as"), 0.60);
                this.titleScreenActive = true;
                this.gameOverPhase = 0;
                this.showLeaderboard = false;
            }
            return;
        }
        if (this.gameOverPhase == 0 &&
            event.input.getAction("p") == 3 /* InputState.Pressed */) {
            event.audio.playSample(event.assets.getSample("as"), 0.60);
            this.paused = !this.paused;
        }
        if (this.paused)
            return;
        this.updateTimersAndSpeed(event);
        this.terrain.update(this.player, this.playTime / MAX_PLAY_TIME_MOD, this.globalSpeed, event);
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
        this.cloudPos = (this.cloudPos + (CLOUD_BASE_SPEED + this.globalSpeed * CLOUD_SPEED_FACTOR) * event.tick) % 48;
    }
    redraw(canvas, assets) {
        const SHAKE_TIME = 30;
        const fontYellow = assets.getBitmap("fy");
        canvas.moveTo();
        this.drawBackground(canvas, assets);
        this.camera.use(canvas);
        if (this.gameOverPhase == 1 &&
            this.player.getDeathTimer() < SHAKE_TIME) {
            canvas.move(((Math.random() * 2 - 1) * 4) | 0, ((Math.random() * 2 - 1) * 4) | 0);
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
                canvas.drawText(fontYellow, "PAUSED", canvas.width / 2, canvas.height / 2 - 4, -1, 0, 1 /* TextAlign.Center */);
            }
            else if (this.speedUpAlert > 0 &&
                (this.speedUpAlert > 60 || (((this.speedUpAlert / 4) | 0) % 2) == 0)) {
                canvas.drawText(fontYellow, "SPEED UP!", canvas.width / 2, 32, -1, 0, 1 /* TextAlign.Center */);
            }
        }
        else if (this.titleScreenActive) {
            // Check if we're in leaderboard screen
            if (this.leaderboardScreen) {
                this.drawLeaderboardScreen(canvas, assets);
            }
            else {
                this.drawTitleScreen(canvas, assets);
            }
        }
        this.drawTransition(canvas);
        //canvas.moveTo();
        //canvas.drawBitmap(assets.getBitmap("t"));
    }
    // Funtico SDK Integration Methods
    async getFunticoLeaderboard() {
        if (!funticoManager.isReady()) {
            console.log('Funtico SDK not ready');
            return [];
        }
        try {
            const leaderboard = await funticoManager.getLeaderboard();
            console.log('Real leaderboard data from Funtico:', leaderboard);
            return leaderboard;
        }
        catch (error) {
            console.error('Failed to get Funtico leaderboard:', error);
            // Check if it's a server error
            if (error.status === 500 || error.status === 404) {
                console.log('❌ Funtico server error - leaderboard API not available');
                console.log('📧 Contact Funtico support: gameloop@funtico.com');
            }
            return [];
        }
    }
    async submitScoreToFuntico(score) {
        if (funticoManager.isReady() && funticoManager.isAuthenticated()) {
            try {
                this.scoreSubmissionStatus = "Submitting score...";
                const success = await funticoManager.saveScore(score);
                if (success) {
                    this.scoreSubmitted = true;
                    this.scoreSubmissionStatus = `Score ${score} submitted!`;
                    console.log(`Score ${score} submitted to Funtico leaderboard`);
                }
                else {
                    this.scoreSubmissionStatus = "Failed to submit score";
                    console.log('Failed to submit score to Funtico');
                }
            }
            catch (error) {
                this.scoreSubmissionStatus = "Error submitting score";
                console.error('Error submitting score to Funtico:', error);
            }
        }
        else {
            this.scoreSubmissionStatus = "";
            console.log('User not authenticated with Funtico, skipping score submission');
        }
    }
    // Method to handle login button press (can be called from UI)
    async handleLogin() {
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
                    // Login successful - no popup notification
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }
    // Method to get current username for display
    getCurrentUsername() {
        return funticoManager.getUsername();
    }
    // Method to check if user is logged in
    isLoggedIn() {
        return funticoManager.isAuthenticated();
    }
}

;// ./src/renderer/bitmap.ts
const unpackPalette = (palette) => {
    let out = new Array();
    let len;
    for (let j = 0; j < palette.length; ++j) {
        len = (palette[j].length / 2) | 0;
        out.push(new Array(len));
        for (let i = 0; i < len; ++i) {
            out[j][i] = parseInt(palette[j].substring(i * 2, i * 2 + 2), 16);
        }
    }
    return out;
};
const convertTile = (imageData, dx, dy, dw, dh, offset, colorTable, palette) => {
    let paletteEntry;
    let i;
    for (let y = dy; y < dy + dh; ++y) {
        for (let x = dx; x < dx + dw; ++x) {
            i = y * offset + x;
            paletteEntry = palette[colorTable[(imageData.data[i * 4] / 85) | 0]];
            for (let j = 0; j < 4; ++j) {
                imageData.data[i * 4 + j] = paletteEntry[j];
            }
        }
    }
};
// Unused (for now)
/*
const convertToRGB222 = (imageData : ImageData, len : number, alphaThreshold = 128) : void => {

    for (let i = 0; i < len; ++ i) {

        for (let j = 0; j < 3; ++ j) {

            imageData.data[i*4 + j] = Math.floor(imageData.data[i*4 + j] / 85) * 85;
        }
        imageData.data[i*4 + 3] = imageData.data[i*4 + 3] < alphaThreshold ? 0 : 255;
    }
}
*/
const convertToMonochrome = (imageData, color, len) => {
    for (let i = 0; i < len; ++i) {
        for (let j = 0; j < 3; ++j) {
            imageData.data[i * 4 + j] = color[j];
        }
        imageData.data[i * 4 + 3] = imageData.data[i * 4 + 3] < 192 ? 0 : 255;
    }
};
const applyPalette = (image, colorTables, packedPalette) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const w = (canvas.width / 8) | 0;
    const h = (canvas.height / 8) | 0;
    // Faster than accessing image each tile?
    const imgWidth = image.width;
    const palette = unpackPalette(packedPalette);
    let colorTable;
    let j = 0;
    for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
            if (j >= colorTables.length)
                continue;
            colorTable = (colorTables[j] ?? "0000").split("").map((s) => parseInt(s, 32));
            convertTile(imageData, x * 8, y * 8, 8, 8, imgWidth, colorTable, palette);
            ++j;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
};
const createCustom = (width, height, params, event, monochromeColor = undefined) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    event(ctx, width, height, params);
    let imageData;
    if (monochromeColor) {
        ctx.drawImage(canvas, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        convertToMonochrome(imageData, monochromeColor, width * height);
        ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
};
const BitmapGenerator = {
    applyPalette: applyPalette,
    createCustom: createCustom
};

;// ./src/game/assetgen.ts

const PALETTE = [
    "00000000", // 0 Alpha
    "000000ff", // 1 Black
    "ffffffff", // 2 White
    "ffff00ff", // 3 Yellow
    "aaff00ff", // 4 Bright green
    "55aa00ff", // 5 Green
    "aa5555ff", // 6 Reddish brown
    "ffaa55ff", // 7 Brownish brown (what)
    "ffffaaff", // 8 Bright yellow
    "aa0000ff", // 9 Red
    "ff5500ff", // A Orange
    "aaaa55ff", // B Ugly yellow
    "aaaaaaff", // C Bright gray
    "555555ff", // D Dark gray
    "aa5500ff", // E Brown,
    "5555aaff", // F Darker purple
    "aaaaffff", // G Lighter purple
    "0055aaff", // H Darker blue,
    "55aaffff", // I Lighter blue
    "005500ff", // J Dark green
    "aaffffff", // K Bright blue
    "ff0000ff", // L Bright red
    "aaffaaff", // M Bright green
    "55aa55ff", // N Weird green
    "550055ff", // O Darkish reddish purple
    "aa55aaff", // P Brighter reddish purple
    "ffaaffff", // Q Pink
];
const COLOR_MAP = [
    "1540", "1540", "6670", "0880", "1E70", "19A0", "19A0", "19A0",
    "1670", "1670", "1B80", "1B80", "1E70", "19A0", "19A0", "19A0",
    "1670", "1670", "1540", "1540", "1670", "1B80", "1B80", "1B80",
    "6660", "6660", "1540", "1540", "1670", "1670", "1L30", "1970",
    "1FG0", "1FG0", "1FG0", "1FG0", "1FG0", "1FG0", "1DC0", "1DC0",
    "1B80", "1B80", "1B80", "1B80", "1B80", "1B80", "1DC0", "1DC0",
    "1B80", "1B80", "1B80", "1B80", "1FG0", "1FG0", "1FG0", "1FG0",
    "H2I0", "H2I0", "H2I0", "H2I0", "H2I0", "H2I0", "0HI2", "1780",
    "H2I0", "H2I0", "H2I0", "H2I0", "H2I0", "H2I0", "0HI2", "1780",
    "1J50", "1J50", "1J50", "1J50", "0B80", "0B80", "0B80", "0B80",
    "1540", "1540", "1540", "1E70", "1E70", "1E70", "3000", "3000",
    "1540", "1540", "1540", "0K20", "1QP0", "14C0", "1QP0", "1OP0",
    "1DC0", "1DC0", "1DC0", "1DC0", "1DC0", "1DC0", "1OP0", "1OP0",
    "1DC0", "1DC0", "1DC0", "1DC0", "1DC0", "1DC0", "1620", "1620",
    "1DC0", "12C0", "1020", "1020", "1020", "1020", "1620", "1620",
];
const generateFonts = (font, event) => {
    event.assets.addBitmap("fw", BitmapGenerator.applyPalette(font, (new Array(16 * 4)).fill("0002"), PALETTE));
    event.assets.addBitmap("fy", BitmapGenerator.applyPalette(font, (new Array(16 * 4)).fill("0003"), PALETTE));
};
const generateTerrainTileset = (c, width, height, bmp) => {
    const base = bmp[0];
    const put = (sx, sy, dx, dy, xoff = 0, yoff = 0) => {
        c.drawImage(base, sx * 8, sy * 8, 8, 8, dx * 8 + xoff, dy * 8 + yoff, 8, 8);
    };
    c.fillStyle = "#000000";
    // Don't let this confuse you...
    c.translate(8, 0);
    //
    // Grass & soil (ground & sky)
    //
    for (let j = 0; j < 2; ++j) {
        // Grass edges
        c.drawImage(base, 12, 0, 4, 8, 4, j * 32, 4, 8);
        c.drawImage(base, 8, 0, 4, 8, 4 * 16 - 8, j * 32, 4, 8);
        // Other grassy stuff
        for (let i = 0; i < 6; ++i) {
            if (j == 1) {
                if (i == 0)
                    put(0, 2, i + 1, 5);
                else if (i == 5)
                    put(1, 2, i + 1, 5);
                else
                    put(5, 3, i + 1, 5);
            }
            if (j == 0) {
                for (let k = 0; k < 3; ++k) {
                    put(0, 1, i + 1, k + 1);
                }
            }
            put(0, 0, i + 1, j * 4);
            put(2, 0, i + 1, j * 4 + 1, 0, -2);
        }
    }
    // Soil edges
    for (let i = 1; i < 4; ++i) {
        c.drawImage(base, 8, 8, 2, 8, 8, i * 8, 2, 8);
        c.drawImage(base, 14, 8, 2, 8, 54, i * 8, 2, 8);
    }
    // Tiny platform
    put(0, 2, 9, 5);
    put(1, 2, 10, 5);
    for (let i = 0; i < 2; ++i) {
        put(0, 0, 9 + i, 4);
        put(2, 0, 9 + i, 5, 0, -2);
    }
    // Correction pixels
    c.fillRect(8, 6, 1, 2);
    c.fillRect(55, 6, 1, 2);
    c.fillRect(8, 6 + 32, 1, 2);
    c.fillRect(55, 6 + 32, 1, 2);
    c.fillRect(72, 6 + 32, 1, 2);
    c.fillRect(87, 6 + 32, 1, 2);
    // Slopes
    let shift;
    for (let j = 0; j < 2; ++j) {
        for (let i = 0; i < 4; ++i) {
            put(0, 1, 9 + i, 2 + j);
        }
        for (let i = 0; i < 2; ++i) {
            shift = i * j * 2 - (j + i);
            put(4, 2 + j, 9 + i + j * 2, 2 + shift);
            put(2 + j, 2, 9 + i + j * 2, 1 + shift);
            put(2 + j, 3, 9 + i + j * 2, 2 + shift);
            put(j, 3, 9 + i + j * 2, 2 + shift, 0, -1);
        }
    }
    // 
    // Bridge & spikes
    //
    for (let i = 0; i < 2; ++i) {
        // Bridge
        put(4, 0, 11 + i, 4);
        put(4, 1, 11 + i, 5);
        put(3, 0, 11 + i, 4, 1, 5);
        // Spikes
        put(6, 3, 13 + i, 7);
        put(7, 3, 15 + i, 7);
    }
    //
    // Palm tree
    //
    // Trunk
    for (let i = 0; i < 2; ++i) {
        put(7, 7, 20, 1 + i, 4, 1);
    }
    put(7, 8, 20, 3, 4, 1);
    // Leaves
    c.drawImage(base, 0, 72, 32, 8, 152, 5, 32, 8);
    // Missing pixels
    for (let i = 0; i < 2; ++i) {
        c.fillRect(152 + 8 + i * 11, 4, 5, 1);
    }
    //
    // Mushrooms
    //
    // "Leg"
    for (let j = 0; j < 4; ++j) {
        put(2, 1, 15, 5 - j);
        put(3, 1, 16, 5 - j);
    }
    // Hat shadow
    c.fillStyle = "#aaaa55";
    c.fillRect(122, 16, 12, 1);
    // Ring
    c.drawImage(base, 40, 16, 24, 8, 116, 24, 24, 8);
    // Hat
    for (let i = 0; i < 4; ++i) {
        put(6, 0, 14 + i, 0);
        put(6, 1, 14 + i, 1);
    }
    for (let i = 0; i < 2; ++i) {
        put(5 + i * 2, 0, 13 + i * 5, 0);
        put(5 + i * 2, 1, 13 + i * 5, 1);
    }
    c.translate(-8, 0);
    // Bushes
    c.drawImage(base, 0, 80, 24, 16, 0, 48, 24, 16);
    c.drawImage(base, 0, 80, 8, 16, 24, 48, 8, 16);
    c.drawImage(base, 16, 80, 8, 16, 32, 48, 8, 16);
    // Fence
    put(3, 10, 1, 9);
    put(4, 10, 2, 9);
    put(4, 10, 3, 9);
    put(5, 10, 4, 9);
};
const generateSky = (c, width, height, bmp) => {
    const STARS = [
        [32, 16, 0],
        [84, 40, 1],
        [64, 8, 1],
        [112, 20, 0],
        [8, 36, 1],
        [48, 48, 0],
        [180, 12, 0],
        [180, 64, 1],
        [104, 64, 0],
        [18, 62, 1],
        [32, 80, 0],
        [64, 72, 1],
        [128, 84, 1],
        [176, 88, 0],
    ];
    const circle = (cx, cy, radius) => {
        let ny;
        let r;
        for (let y = -radius; y <= radius; ++y) {
            ny = y / radius;
            r = Math.round(Math.sqrt(1 - ny * ny) * radius);
            if (r <= 0)
                continue;
            c.fillRect((cx - r) | 0, (cy + y) | 0, r * 2, 1);
        }
    };
    c.fillStyle = "#55aaff";
    c.fillRect(0, 0, width, height);
    c.fillStyle = "#aaffff";
    circle(width - 48, 36, 28);
    c.fillStyle = "#55aaff";
    circle(width - 66, 26, 26);
    // Stars
    for (let a of STARS) {
        c.drawImage(bmp[0], 24, 88 + a[2] * 4, 4, 4, a[0], a[1], 4, 4);
    }
};
const generateGameOverTextBase = (c, width, height, bmp) => {
    c.font = "bold 14px Arial";
    c.textAlign = "center";
    c.fillStyle = "#ffffff";
    c.fillText("Avalanche Crash", width / 2, height - 2);
};
const generateLogoBase = (c, width, height, bmp) => {
    c.font = "bold 14px Arial";
    c.textAlign = "center";
    c.fillStyle = "#E84142";
    c.fillText("Avalanche Knight", width / 2, height - 6);
};
const generateOutlinedText = (c, width, height, bmp) => {
    for (let j = -1; j <= 2; ++j) {
        for (let i = -1; i <= 1; ++i) {
            c.drawImage(bmp[0], i + 1, j + 1);
        }
    }
    c.drawImage(bmp[1], 1, 1);
};
const generateAudio = (event) => {
    event.assets.addSample("aj", event.audio.createSample([96, 7,
        112, 6,
        160, 5,
        256, 3], 0.60, "sawtooth", 2 /* Ramp.Exponential */, 6));
    event.assets.addSample("ag", event.audio.createSample([128, 4,
        192, 4,
        320, 10], 0.40, "square", 0 /* Ramp.Instant */, 4));
    event.assets.addSample("ap", event.audio.createSample([96, 3], 0.70, "sawtooth", 0 /* Ramp.Instant */, 2));
    event.assets.addSample("ad", event.audio.createSample([96, 8,
        144, 8,
        96, 10,
        64, 16], 0.50, "square", 2 /* Ramp.Exponential */, 6));
    event.assets.addSample("as", event.audio.createSample([224, 20], 0.50, "sawtooth", 1 /* Ramp.Linear */, 6));
    event.assets.addSample("ak", event.audio.createSample([320, 6, 192, 4, 80, 10], 0.55, "square", 1 /* Ramp.Linear */, 4));
    event.assets.addSample("aa", event.audio.createSample([96, 4,
        128, 8,
        256, 6], 0.40, "square", 2 /* Ramp.Exponential */, 4));
    event.assets.addSample("au", event.audio.createSample([96, 6,
        192, 4,
        128, 4,
        192, 6,
        256, 16], 0.50, "square", 1 /* Ramp.Linear */, 6));
    event.assets.addSample("ac", event.audio.createSample([128, 8], 0.50, "sawtooth", 0 /* Ramp.Instant */, 1));
    // "Bounce" sound for balls, sounds annoying so commented out
    /*
        event.assets.addSample("ab",
            event.audio.createSample(
                [112,  6,
                 192, 5,
                 320, 4],
                0.70,
                "sawtooth", Ramp.Exponential
            )
        );
    */
};
const generateAssets = (event) => {
    // const BALL_NAMES = [ "b1", "b2", "b3", "b4", "b5" ];
    const BALL_COLORS = [
        ["12M0", "1NM0"],
        ["12K0", "1IK0"],
        ["12Q0", "16Q0"],
        ["12C0", "1DC0"],
        ["13A0", "19A0"],
    ];
    const bmpBase = event.assets.getBitmap("_b");
    const bmpFont = event.assets.getBitmap("_f");
    generateFonts(bmpFont, event);
    const coloredBase = BitmapGenerator.applyPalette(bmpBase, COLOR_MAP, PALETTE);
    event.assets.addBitmap("b", coloredBase);
    event.assets.addBitmap("t", BitmapGenerator.createCustom(256, 128, [coloredBase], generateTerrainTileset));
    event.assets.addBitmap("s", BitmapGenerator.createCustom(192, 144, [coloredBase], generateSky));
    const gameoverBase = BitmapGenerator.createCustom(112, 20, [], generateGameOverTextBase, [255, 85, 0]);
    const gameoverDark = BitmapGenerator.createCustom(112, 20, [], generateGameOverTextBase, [85, 0, 0]);
    const logoBase = BitmapGenerator.createCustom(132, 24, [], generateLogoBase, [232, 65, 66]);
    const logoDark = BitmapGenerator.createCustom(132, 24, [], generateLogoBase, [85, 0, 0]);
    event.assets.addBitmap("g", BitmapGenerator.createCustom(114, 22, [gameoverDark, gameoverBase], generateOutlinedText));
    event.assets.addBitmap("l", BitmapGenerator.createCustom(134, 26, [logoDark, logoBase], generateOutlinedText));
    // Not baseball, mind you
    const ballColorMap = "010101111111".split("").map(s => Number(s));
    const baseBall = BitmapGenerator.createCustom(48, 16, [bmpBase], (c, w, h, bmps) => {
        c.drawImage(bmps[0], 0, 96, 48, 16, 0, 0, 48, 16);
    });
    for (let i = 0; i < 5; ++i) {
        event.assets.addBitmap("b" + String(i + 1), BitmapGenerator.applyPalette(baseBall, ballColorMap.map(j => BALL_COLORS[i][j]), PALETTE));
    }
    generateAudio(event);
};

;// ./src/game/audiointro.ts
const TEXT = `ENABLE AUDIO? PRESS
ENTER TO CONFIRM.

WARNING: AUDIO DOES
NOT WORK ON SAFARI!`;
class AudioIntro {
    constructor() {
        // private menu : Menu;
        this.cursorPos = 0;
        const lines = TEXT.split("\n");
        this.width = Math.max(...lines.map(s => s.length));
        this.height = lines.length;
    }
    drawBox(canvas, x, y, w, h) {
        const SHADOW_OFFSET = 4;
        const COLORS = ["#000000", "#ffffff", "#000000"];
        x -= w / 2;
        y -= h / 2;
        canvas.fillColor("#00000055");
        canvas.fillRect(x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h);
        for (let i = 0; i < COLORS.length; ++i) {
            canvas.fillColor(COLORS[i]);
            canvas.fillRect(x + i, y + i, w - i * 2, h - i * 2);
        }
    }
    update(event) {
        if (event.input.getAction("u") == 3 /* InputState.Pressed */ ||
            event.input.getAction("d") == 3 /* InputState.Pressed */) {
            this.cursorPos = 1 - this.cursorPos;
        }
        if (event.input.getAction("s") == 3 /* InputState.Pressed */) {
            event.audio.toggle(this.cursorPos == 0);
            event.scenes.changeScene("g");
            // Playing the first sound here makes sure the next sound is
            // played with 100% probability...
            event.audio.playSample(event.assets.getSample("ac"), 0.60);
        }
    }
    redraw(canvas, assets) {
        const CENTER_Y = 48;
        const CONFIRM_BOX_CENTER_Y = 112;
        const MARGIN = 12;
        const fonts = [assets.getBitmap("fw"), assets.getBitmap("fy")];
        canvas.clear("#0055aa");
        const w = this.width * 7;
        const h = this.height * 10;
        this.drawBox(canvas, canvas.width / 2, CENTER_Y, w + MARGIN, h + MARGIN);
        canvas.drawText(fonts[0], TEXT, canvas.width / 2 - w / 2, CENTER_Y - h / 2, -1, 2);
        this.drawBox(canvas, canvas.width / 2, CONFIRM_BOX_CENTER_Y, 40, 32);
        let text;
        let active;
        for (let i = 0; i < 2; ++i) {
            active = i == this.cursorPos;
            text = (active ? "&" : " ") + ["YES", "NO"][i];
            canvas.drawText(fonts[Number(active)], text, canvas.width / 2 - 18, CONFIRM_BOX_CENTER_Y - 10 + i * 10, -1, 0);
        }
    }
}

;// ./src/main.ts





// Make funticoManager available globally
window.funticoManager = funticoManager;
const initialEvent = (event) => {
    event.audio.setGlobalVolume(0.40);
    // Enable audio by default since we skip audio selection
    event.audio.toggle(true);
    // Yes, I had to manually shorten these names to save
    // some bytes. It's ugly, but necessary
    event.input.addAction("l", ["ArrowLeft", "KeyA"]);
    event.input.addAction("r", ["ArrowRight", "KeyD"]);
    event.input.addAction("u", ["ArrowUp", "KeyW"]);
    event.input.addAction("d", ["ArrowDown", "KeyS"]);
    event.input.addAction("s", ["Enter", "Space"]);
    event.input.addAction("j", ["ArrowUp", "KeyW"]);
    event.input.addAction("t", ["Space"]);
    event.input.addAction("p", ["Enter"]);
    event.input.addAction("login", ["KeyL"]);
    event.input.addAction("leaderboard", ["KeyB"]);
    event.scenes.addScene("g", new Game(event));
    event.scenes.addScene("a", new AudioIntro());
    // Set Game scene as active (skip audio selection)
    event.scenes.changeScene("g");
    event.assets.loadBitmap("_f", "f.png");
    event.assets.loadBitmap("_b", "b.png");
};
window.onload = () => (new Program(192, 144)).run(initialEvent, generateAssets);

/******/ })()
;