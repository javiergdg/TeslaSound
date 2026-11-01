/**
 * audio-engine.js — Next-Gen Procedural Engine Synthesizer for TeslaSound
 * 
 * Powered by physical combustion-engine acoustic waveguide modeling:
 * - AudioWorklet with ScriptProcessorNode fallback
 * - Discrete 4-stroke crank phase (720°) cylinder firing pulses (Hann pressure pulse + decaying noise burst)
 * - Acoustic exhaust pipe delay waveguides (feedback comb filter with lossy open-end reflection)
 * - Multi-stage resonant formants and low-frequency body resonance (giving the sound its "contundencia")
 * - Dynamic 4th-order muffler lowpass tracking throttle & RPM
 * - Helmholtz intake induction roar & supercharger whine
 * - Overrun backfires ("petardeos") and ignition-cut rev limiter bangs
 * - Mastering dynamics compressor (keeps peaks in check, thickens bass & perceived loudness)
 * - Instant responsive engine ignition & shutdown sequence
 */

class VehicleAudioEngine {
    constructor() {
        this.ctx = null;
        this.node = null;
        this.masterGain = null;
        this.engineMasterGain = null;
        this.compressor = null;
        this.analyser = null;

        this.currentProfile = null;
        this.isStarted = false;
        this.isRunning = false;
        this.workletLoaded = false;
        this.dspKind = '';

        // Exhaust modes: 'quiet', 'sport', 'race', 'straight_pipe'
        this.exhaustMode = 'race';
        this.masterVolume = 0.85;

        // Dynamics state
        this.heat = 0.0;
        this.isShifting = false;
        this.isCuttingIgnition = false;
        this.lastRpm = 0;
        this.lastThrottle = 0;

        // Post function placeholder
        this.post = () => {};
    }

    /**
     * Volume conversion curve (smooth logarithmic perceptual response)
     */
    _gainFor(v) {
        return Math.pow(Math.max(0, Math.min(1, v)), 1.6) * 1.4;
    }

    /**
     * Initialize Web Audio Context on user gesture
     */
    async init() {
        if (this.ctx && this.ctx.state !== 'closed') {
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error('Web Audio is not supported by this browser.');
        }

        // iOS: play through media channel so silent switch doesn't mute
        try {
            if (navigator.audioSession) {
                navigator.audioSession.type = 'playback';
            }
        } catch (e) { /* ignore */ }

        this.ctx = new AudioContext({ latencyHint: 'interactive' });

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // 1. Mastering Dynamics Compressor
        // Keeps peaks in check on car speakers and thickens perceived bass punch ("contundencia")
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(5.0, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        // 2. Output Analyser Node for UI Spectrum Visualizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.70;

        // 3. Master Volume Fader
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this._gainFor(this.masterVolume), this.ctx.currentTime);

        // 4. Engine Master Fader
        this.engineMasterGain = this.ctx.createGain();
        this.engineMasterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        // Chain: engineNode -> engineMasterGain -> compressor -> masterGain -> analyser -> destination
        this.engineMasterGain.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // 5. Initialize Engine DSP Audio Node
        await this._initEngineNode();

        this.isStarted = true;
    }

    /**
     * Create AudioWorkletNode with fallback to ScriptProcessorNode
     */
    async _initEngineNode() {
        const seed = (Math.random() * 4294967295) >>> 0;
        const config = (this.currentProfile && this.currentProfile.engine) ? this.currentProfile.engine : null;

        if (this.ctx.audioWorklet && window.AudioWorkletNode) {
            try {
                if (!this.workletLoaded) {
                    try {
                        await this.ctx.audioWorklet.addModule('engine-dsp.js');
                    } catch (fetchErr) {
                        // If relative path fails (e.g. file:// or bundling), load via embedded script tag source
                        console.warn('Direct addModule failed, attempting script source fallback:', fetchErr);
                        await this._loadWorkletFromScript();
                    }
                    this.workletLoaded = true;
                }

                const node = new AudioWorkletNode(this.ctx, 'engine-processor', {
                    numberOfInputs: 0,
                    numberOfOutputs: 1,
                    outputChannelCount: [2],
                    processorOptions: { config: config, seed: seed }
                });

                this.post = (msg) => { node.port.postMessage(msg); };
                this.dspKind = 'AudioWorklet';
                this.node = node;
                node.connect(this.engineMasterGain);
                return;
            } catch (err) {
                console.warn('AudioWorklet initialization failed, falling back to ScriptProcessor:', err);
            }
        }

        // ScriptProcessorNode Fallback (works everywhere including legacy browsers)
        this._initScriptNode(config, seed);
    }

    /**
     * Fallback worklet loader if addModule URL fetch has issues
     */
    async _loadWorkletFromScript() {
        if (typeof window.EngineDSP === 'function') {
            const code = `
                var EngineDSP = (${window.EngineDSP.toString()})();
                registerProcessor('engine-processor', class extends AudioWorkletProcessor {
                    constructor(options) {
                        super();
                        var o = options && options.processorOptions ? options.processorOptions : {};
                        this.dsp = new EngineDSP(sampleRate, o.config, o.seed);
                        this.port.onmessage = (e) => this.dsp.message(e.data);
                    }
                    process(inputs, outputs) {
                        var out = outputs[0];
                        if (!out || !out[0]) return true;
                        this.dsp.process(out[0], out[1] || out[0], out[0].length);
                        return true;
                    }
                });
            `;
            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await this.ctx.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);
        } else {
            throw new Error('window.EngineDSP not available for worklet reflection');
        }
    }

    /**
     * ScriptProcessor fallback for 100% compatibility
     */
    _initScriptNode(config, seed) {
        if (typeof window.EngineDSP !== 'function') {
            console.error('EngineDSP is not loaded in window scope');
            return;
        }

        const dsp = new window.EngineDSP(this.ctx.sampleRate, config, seed);
        const node = this.ctx.createScriptProcessor(1024, 1, 2);
        node.onaudioprocess = (e) => {
            const out = e.outputBuffer;
            dsp.process(out.getChannelData(0), out.getChannelData(1), out.length);
        };

        this.post = (msg) => { dsp.message(msg); };
        this.dspKind = 'ScriptProcessor';
        this.node = node;
        node.connect(this.engineMasterGain);
    }

    /**
     * Load vehicle acoustic profile
     */
    loadProfile(profile) {
        if (!profile) return;
        this.currentProfile = profile;

        if (profile.engine) {
            this.post({
                type: 'config',
                config: profile.engine
            });
        }
    }

    /**
     * Real-time Physics & Audio Tick (called at 60 FPS)
     * Maps engine state to procedural physical waveguide parameters
     */
    update(currentRpm, throttle, currentSpeedKmh = 0, acceleration = 0) {
        if (!this.isRunning || !this.currentProfile) return;

        const profile = this.currentProfile;
        const idleRpm = profile.idleRpm || 800;
        const redlineRpm = profile.redlineRpm || 7000;
        const rpmN = Math.max(0, Math.min(1, (currentRpm - idleRpm) / (redlineRpm - idleRpm)));

        // 1. Exhaust Mode character, gain, muffler, and crackle tuning
        let character = 0.85;
        let crackle = 0.95;
        let exhaustGain = 1.18;
        let mufflerMinHz = 2800;
        let mufflerMaxHz = 11000;
        let driveMult = 1.30;
        let bodyDbOffset = 2.5;

        if (this.exhaustMode === 'quiet') {
            character = 0.15;
            crackle = 0.0;
            exhaustGain = 0.55;
            mufflerMinHz = 350;
            mufflerMaxHz = 1100;
            driveMult = 0.40;
            bodyDbOffset = -3.5;
        } else if (this.exhaustMode === 'sport') {
            character = 0.55;
            crackle = 0.45;
            exhaustGain = 0.88;
            mufflerMinHz = 950;
            mufflerMaxHz = 4800;
            driveMult = 0.85;
            bodyDbOffset = 0.0;
        } else if (this.exhaustMode === 'race') {
            character = 0.85;
            crackle = 0.95;
            exhaustGain = 1.18;
            mufflerMinHz = 2800;
            mufflerMaxHz = 11000;
            driveMult = 1.30;
            bodyDbOffset = 2.5;
        } else if (this.exhaustMode === 'straight_pipe') {
            character = 1.0;
            crackle = 1.80;
            exhaustGain = 1.45;
            mufflerMinHz = 9000;
            mufflerMaxHz = 20000;
            driveMult = 1.75;
            bodyDbOffset = 4.5;
        }

        // 2. Combustion Load
        // At idle, keep a subtle positive load so cylinder pressure pulses remain rich and "contundente"
        const idleLoad = 0.12 * Math.max(0, 1 - (currentRpm - idleRpm) / 1500);
        let load = Math.max(throttle, idleLoad);

        // 3. Exhaust Heat Accumulation for Overrun Backfires
        const fuel = Math.max(throttle, 0.05) * (0.3 + 0.7 * rpmN);
        const dt = 0.016; // 60 FPS tick
        const heatTau = fuel > this.heat ? 1.0 : 2.5;
        this.heat += (fuel - this.heat) * (1 - Math.exp(-dt / heatTau));

        // 4. Overrun Detection (throttle closed at elevated RPM with hot exhaust)
        const isCoasting = throttle < 0.06 && !this.isShifting;
        let overrun = 0;
        if (isCoasting && currentRpm > (idleRpm + 400)) {
            const rpmFactor = Math.max(0, Math.min(1, (currentRpm - idleRpm - 400) / 1600));
            const heatFactor = Math.max(0, Math.min(1, this.heat * 1.5));
            overrun = rpmFactor * heatFactor;
        }

        // 5. Ignition Cut (rev limiter or full-throttle shift)
        let cut = 0;
        if (this.isCuttingIgnition) {
            cut = 1;
            load = 0;
        }

        this.lastRpm = currentRpm;
        this.lastThrottle = throttle;

        // Send smoothed parameters to the physical DSP synthesis loop
        this.post({
            type: 'params',
            rpm: currentRpm,
            load: cut ? 0 : load,
            overrun: overrun,
            cut: cut,
            character: character,
            crackle: crackle,
            exhaustGain: exhaustGain,
            mufflerMinHz: mufflerMinHz,
            mufflerMaxHz: mufflerMaxHz,
            driveMult: driveMult,
            bodyDbOffset: bodyDbOffset
        });
    }

    /**
     * Gear Shift Mechanical Dynamics
     * Triggers shift click and momentary ignition cut for authentic exhaust pop ("petardeo")
     */
    triggerGearShift(isUpshift = true) {
        if (!this.isRunning) return;
        this.isShifting = true;

        // Mechanical shift lever click in cabin
        this.click(isUpshift ? 1.0 : 0.8);

        // Full-throttle upshift ignition cut produces unburnt fuel crack in exhaust
        if (isUpshift && this.lastThrottle > 0.45 && this.exhaustMode !== 'quiet') {
            this.isCuttingIgnition = true;
        }

        setTimeout(() => {
            this.isShifting = false;
            this.isCuttingIgnition = false;
        }, isUpshift ? 85 : 120);
    }

    /**
     * Rev Limiter Stutter ("tatatata" cortador)
     */
    triggerRevLimiter() {
        if (!this.isRunning) return;
        this.isCuttingIgnition = true;
        setTimeout(() => {
            this.isCuttingIgnition = false;
        }, 40);
    }

    /**
     * Trigger mechanical gear click (strength 0..1)
     */
    click(strength = 1.0) {
        this.post({ type: 'click', strength: strength });
    }

    /**
     * Clutch down state (1 = down, 0 = up)
     */
    clutch(isDown = false) {
        this.post({ type: 'clutch', down: isDown ? 1 : 0 });
    }

    /**
     * Start Engine Audio (Instant ignition & immediate idle engagement)
     */
    triggerIgnitionAudio(profile, onComplete) {
        if (!this.ctx) return;
        this.isRunning = true;
        this.isCuttingIgnition = false;
        const now = this.ctx.currentTime;

        // Bring engine master fader smoothly to full presence
        this.engineMasterGain.gain.cancelScheduledValues(now);
        this.engineMasterGain.gain.setValueAtTime(this.engineMasterGain.gain.value, now);
        this.engineMasterGain.gain.linearRampToValueAtTime(1.0, now + 0.05);

        if (typeof onComplete === 'function') {
            onComplete();
        }
    }

    /**
     * Shutdown Audio (Fuel cut & compression rundown)
     */
    triggerShutdownAudio(onComplete) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Smooth fade out of engine master gain
        this.engineMasterGain.gain.cancelScheduledValues(now);
        this.engineMasterGain.gain.setValueAtTime(this.engineMasterGain.gain.value, now);
        this.engineMasterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        setTimeout(() => {
            this.isRunning = false;
            this.post({
                type: 'params',
                rpm: 0,
                load: 0,
                overrun: 0,
                cut: 1
            });
            if (onComplete) onComplete();
        }, 360);
    }

    /**
     * Stop Audio Engine
     */
    stop() {
        this.isRunning = false;
        this.isCuttingIgnition = false;
        if (this.ctx && this.ctx.state === 'running') {
            this.engineMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.engineMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
    }

    /**
     * Set Exhaust Mode ('quiet', 'sport', 'race', 'straight_pipe')
     */
    setExhaustMode(mode) {
        this.exhaustMode = mode;
        if (this.isRunning && this.currentProfile) {
            this.update(this.lastRpm, this.lastThrottle);
        }
    }

    /**
     * Set Master Volume (0.0 to 1.0)
     */
    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.ctx && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this._gainFor(this.masterVolume), this.ctx.currentTime, 0.05);
        }
    }
}

window.VehicleAudioEngine = VehicleAudioEngine;
