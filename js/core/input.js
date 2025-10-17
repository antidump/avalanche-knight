class InputAction {
    // gamepadButtons : number[]
    constructor(keys) {
        this.keys = Array.from(keys);
    }
}
export class InputManager {
    get anyPressed() {
        return this.anyKeyPressed; // || this.anyGamepadButtonPressed;
    }
    constructor() {
        this.anyKeyPressed = false;
        this.keys = new Map();
        this.prevent = new Array();
        this.actions = new Map();
        this.touchState = new Map();
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
        // Touch events for mobile support
        window.addEventListener("touchstart", (e) => {
            e.preventDefault();
            window.focus();
            this.touchEvent(e, 3 /* InputState.Pressed */);
        });
        window.addEventListener("touchend", (e) => {
            e.preventDefault();
            this.touchEvent(e, 2 /* InputState.Released */);
        });
        window.addEventListener("touchmove", (e) => {
            e.preventDefault();
        });
    }
    keyEvent(key, state) {
        if (this.keys.get(key) === state - 2)
            return;
        this.keys.set(key, state);
        this.anyKeyPressed || (this.anyKeyPressed = Boolean(state & 1));
    }
    touchEvent(e, state) {
        const canvas = document.querySelector('canvas');
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = (touch.clientX - rect.left) * (canvasWidth / rect.width);
            const y = (touch.clientY - rect.top) * (canvasHeight / rect.height);
            // Define touch zones
            const leftZone = x < canvasWidth * 0.3;
            const rightZone = x > canvasWidth * 0.7;
            const jumpZone = x >= canvasWidth * 0.3 && x <= canvasWidth * 0.7 && y > canvasHeight * 0.5;
            const attackZone = x >= canvasWidth * 0.3 && x <= canvasWidth * 0.7 && y <= canvasHeight * 0.5;
            if (leftZone) {
                this.touchState.set('left', state);
            }
            else if (rightZone) {
                this.touchState.set('right', state);
            }
            else if (jumpZone) {
                this.touchState.set('jump', state);
            }
            else if (attackZone) {
                this.touchState.set('attack', state);
            }
        }
    }
    update() {
        let v;
        for (let k of this.keys.keys()) {
            if ((v = this.keys.get(k)) > 1) {
                this.keys.set(k, v - 2);
            }
        }
        // Update touch states
        for (let k of this.touchState.keys()) {
            if ((v = this.touchState.get(k)) > 1) {
                this.touchState.set(k, v - 2);
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
        // If no keyboard input, check touch input
        if (state === 0 /* InputState.Up */) {
            if (name === 'l' && this.touchState.get('left')) {
                state = this.touchState.get('left');
            }
            else if (name === 'r' && this.touchState.get('right')) {
                state = this.touchState.get('right');
            }
            else if (name === 'j' && this.touchState.get('jump')) {
                state = this.touchState.get('jump');
            }
            else if (name === 't' && this.touchState.get('attack')) {
                state = this.touchState.get('attack');
            }
        }
        return state;
    }
}
