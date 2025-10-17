

export const enum InputState {

    Up = 0,
    Down = 1,
    Released = 2,
    Pressed = 3,

    DownOrPressed = 1,
}


class InputAction {


    public readonly keys : string[];
    // gamepadButtons : number[]


    constructor(keys : string[]) {

        this.keys = Array.from(keys);
    }
}


export class InputManager {


    private keys : Map<string, InputState>;
    private prevent : Array<string>;
    private actions : Map<string, InputAction>;
    private touchState : Map<string, InputState>;

    private anyKeyPressed : boolean = false;


    public get anyPressed() : boolean {

        return this.anyKeyPressed; // || this.anyGamepadButtonPressed;
    }


    constructor() {

        this.keys = new Map<string, InputState> ();
        this.prevent = new Array<string> ();
        this.actions = new Map<string, InputAction> ();
        this.touchState = new Map<string, InputState> ();

        window.addEventListener("keydown", (e : KeyboardEvent) => {

            if (this.prevent.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Pressed);
        });

        window.addEventListener("keyup", (e : KeyboardEvent) => {

            if (this.prevent.includes(e.code)) {

                e.preventDefault();
            }
            this.keyEvent(e.code, InputState.Released);
        });

        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());
        // The bottom two are mostly needed if this game is ever being
        // run inside an iframe
        window.addEventListener("mousemove", () => window.focus());
        window.addEventListener("mousedown", () => window.focus());
        
        // Touch events for mobile support
        window.addEventListener("touchstart", (e : TouchEvent) => {
            e.preventDefault();
            window.focus();
            this.touchEvent(e, InputState.Pressed);
        });
        
        window.addEventListener("touchend", (e : TouchEvent) => {
            e.preventDefault();
            this.touchEvent(e, InputState.Released);
        });
        
        window.addEventListener("touchmove", (e : TouchEvent) => {
            e.preventDefault();
        });
    }


    private keyEvent(key : string, state : InputState) : void {

        if (this.keys.get(key) === state-2)
            return;

        this.keys.set(key, state);
        this.anyKeyPressed ||= Boolean(state & 1);
    }


    private touchEvent(e : TouchEvent, state : InputState) : void {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
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
            } else if (rightZone) {
                this.touchState.set('right', state);
            } else if (jumpZone) {
                this.touchState.set('jump', state);
            } else if (attackZone) {
                this.touchState.set('attack', state);
            }
        }
    }


    public update() : void {

        let v : InputState | undefined;

        for (let k of this.keys.keys()) {

            if ((v = this.keys.get(k) as InputState) > 1) {
                
                this.keys.set(k, v-2);
            }
        }
        
        // Update touch states
        for (let k of this.touchState.keys()) {
            if ((v = this.touchState.get(k) as InputState) > 1) {
                this.touchState.set(k, v-2);
            }
        }

        this.anyKeyPressed = false;
    }


    public addAction(name : string, keys : string[]) : void {

        this.actions.set(name, new InputAction(keys));
    }


    public getAction(name : string) : InputState {

        const a = this.actions.get(name);
        if (a === undefined)
            return InputState.Up;

        let state = InputState.Up;
        
        // Check keyboard input first
        for (let k of a.keys) {
            if ( ( state = (this.keys.get(k) ?? InputState.Up) ) != InputState.Up)
                break;
        }
        
        // If no keyboard input, check touch input
        if (state === InputState.Up) {
            if (name === 'l' && this.touchState.get('left')) {
                state = this.touchState.get('left')!;
            } else if (name === 'r' && this.touchState.get('right')) {
                state = this.touchState.get('right')!;
            } else if (name === 'j' && this.touchState.get('jump')) {
                state = this.touchState.get('jump')!;
            } else if (name === 't' && this.touchState.get('attack')) {
                state = this.touchState.get('attack')!;
            }
        }
        
        return state;
    }
}
