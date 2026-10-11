/*
 * engine-dsp.js — Physical combustion-engine waveguide synthesizer.
 * Based on acoustic pulse waveguide modeling.
 *
 * This file is loaded:
 *   1. as an AudioWorklet module, registering "engine-processor";
 *   2. as a classic <script> on the page, exposing window.EngineDSP
 *      for ScriptProcessorNode fallback.
 *
 * Model (per sample):
 *   crank phase (one 4-stroke cycle = 720°) -> firing events from firing order ->
 *   each firing drops an exhaust pressure pulse (Hann pulse + decaying noise burst) ->
 *   per-bank pipe waveguide (feedback comb with lossy reflection) -> exhaust formants ->
 *   stereo mix -> intake roar, supercharger whine and afterfire pops ->
 *   cabin reflections -> body resonance -> 4th-order muffler low-pass -> soft saturation.
 */
var EngineDSP = (function () {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var BLOCK = 128;
  var MAX_PULSES = 8;

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function onePole(sr, seconds) { return 1 - Math.exp(-1 / (sr * seconds)); }

  // Rational tanh approximation for smooth, warm non-linear saturation
  function softClip(x) {
    if (x > 3) return 1;
    if (x < -3) return -1;
    var x2 = x * x;
    return x * (27 + x2) / (27 + 9 * x2);
  }

  var HANN_SIZE = 1024;
  var HANN = new Float32Array(HANN_SIZE + 1);
  for (var h = 0; h <= HANN_SIZE; h++) {
    HANN[h] = 0.5 - 0.5 * Math.cos(TWO_PI * h / HANN_SIZE);
  }

  // xorshift32 — deterministic, allocation-free RNG
  function Rng(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  Rng.prototype.next = function () {
    var x = this.s;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x >>> 0;
    return this.s / 4294967296;
  };
  Rng.prototype.white = function () { return this.next() * 2 - 1; };
  // Approximately standard normal (Irwin–Hall with 4 terms)
  Rng.prototype.gauss = function () {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.7320508;
  };

  // RBJ biquad filter, transposed direct form II
  function Biquad() {
    this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
    this.z1 = 0; this.z2 = 0;
  }
  Biquad.prototype.set = function (type, freq, q, gainDb, sr) {
    var w = TWO_PI * clamp(freq, 10, sr * 0.45) / sr;
    var cw = Math.cos(w), sw = Math.sin(w);
    var alpha = sw / (2 * q);
    var A = Math.pow(10, (gainDb || 0) / 40);
    var b0, b1, b2, a0, a1, a2;
    if (type === 'lowpass') {
      b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else if (type === 'highpass') {
      b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else if (type === 'bandpass') {
      b0 = alpha; b1 = 0; b2 = -alpha;
      a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    } else { // peaking
      b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A;
      a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = a1 / a0; this.a2 = a2 / a0;
  };
  Biquad.prototype.process = function (x) {
    var y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  };

  // Cylinder bank: pulse pool -> exhaust pipe waveguide -> formants
  function Bank(sr, bankCfg, sound) {
    this.age = new Float32Array(MAX_PULSES);
    this.len = new Float32Array(MAX_PULSES);
    this.amp = new Float32Array(MAX_PULSES);
    this.noise = new Float32Array(MAX_PULSES);
    this.decay = new Float32Array(MAX_PULSES);
    this.slot = 0;

    this.pipeD = Math.max(2, Math.round(bankCfg.pipeMs * sr / 1000));
    var size = 1;
    while (size <= this.pipeD + 2) size <<= 1;
    this.pipe = new Float32Array(size);
    this.mask = size - 1;
    this.w = 0;
    this.pipeLp = 0;
    this.refl = sound.pipeReflection;
    this.damp = sound.pipeDamping;

    this.formants = [];
    var formantsList = sound.formants || [];
    for (var i = 0; i < formantsList.length; i++) {
      var f = formantsList[i];
      var bq = new Biquad();
      bq.set('bandpass', f.hz * (bankCfg.tune || 1), f.q, 0, sr);
      this.formants.push({ bq: bq, gain: f.gain });
    }
    this.dry = sound.formantDry || 0.4;
    this.panL = Math.sqrt(0.5 * (1 - (bankCfg.pan || 0)));
    this.panR = Math.sqrt(0.5 * (1 + (bankCfg.pan || 0)));
    this.exc = 0;
  }
  Bank.prototype.add = function (lenSamples, amp, noiseAmp, noiseDecay) {
    var k = this.slot;
    this.slot = (k + 1) % MAX_PULSES;
    this.age[k] = 0;
    this.len[k] = Math.max(4, lenSamples);
    this.amp[k] = amp;
    this.noise[k] = noiseAmp;
    this.decay[k] = noiseDecay;
  };
  Bank.prototype.tick = function (rng) {
    var exc = 0;
    var age = this.age, len = this.len, amp = this.amp, noise = this.noise;
    for (var k = 0; k < MAX_PULSES; k++) {
      var l = len[k];
      if (l === 0) continue;
      var a = age[k];
      if (a < l) exc += amp[k] * HANN[(a / l * HANN_SIZE) | 0];
      var n = noise[k];
      if (n > 1e-4) {
        exc += n * rng.white();
        noise[k] = n * this.decay[k];
      }
      age[k] = a + 1;
      if (a + 1 >= l && n <= 1e-4) len[k] = 0;
    }
    this.exc = exc;

    // Pipe waveguide: feedback comb with a lossy (low-passed), inverting open-end reflection
    var fb = this.pipe[(this.w - this.pipeD) & this.mask];
    this.pipeLp += this.damp * (fb - this.pipeLp);
    var y = exc + this.refl * this.pipeLp;
    this.pipe[this.w] = y;
    this.w = (this.w + 1) & this.mask;

    var out = y * this.dry;
    for (var i = 0; i < this.formants.length; i++) {
      var f = this.formants[i];
      out += f.bq.process(y) * f.gain;
    }
    return out;
  };

  // Gear lever click (manual / DCT shift)
  var CLICK_MODES = [[4800, 0.0015, 0.3], [7600, 0.0012, 0.25]];

  function GearClick(sr, gain) {
    this.gain = gain || 0;
    this.modes = [];
    for (var i = 0; i < CLICK_MODES.length; i++) {
      var m = CLICK_MODES[i], w = TWO_PI * m[0] / sr, r = Math.exp(-1 / (sr * m[1]));
      if (m[0] > sr * 0.45) continue;
      this.modes.push({ c1: 2 * r * Math.cos(w), c2: -r * r, sw: Math.sin(w), g: m[2], kick: 0, y1: 0, y2: 0 });
    }
    this.snap = 0;
    this.snapDecay = Math.exp(-1 / (sr * 0.0015));
    this.hpK = 1 - Math.exp(-TWO_PI * 2500 / sr);
    this.lp1 = 0; this.lp2 = 0;
    this.left = 0;
    this.tail = Math.round(sr * 0.04);
  }
  GearClick.prototype.trigger = function (strength, rng) {
    if (!this.gain) return;
    var a = strength * this.gain;
    for (var i = 0; i < this.modes.length; i++) {
      var m = this.modes[i];
      m.kick = a * m.g * (0.85 + 0.3 * rng.next());
    }
    this.snap = a;
    this.left = this.tail;
  };
  GearClick.prototype.next = function (rng) {
    if (this.left <= 0) return 0;
    this.left--;
    var w = this.snap * rng.white();
    this.snap *= this.snapDecay;
    this.lp1 += this.hpK * (w - this.lp1);
    var h = w - this.lp1;
    this.lp2 += this.hpK * (h - this.lp2);
    var out = h - this.lp2;
    for (var i = 0; i < this.modes.length; i++) {
      var m = this.modes[i];
      var y = m.c1 * m.y1 + m.c2 * m.y2 + m.kick * m.sw;
      m.kick = 0;
      m.y2 = m.y1; m.y1 = y;
      out += y;
    }
    return out;
  };

  function EngineDSP(sampleRate, engineCfg, seed) {
    this.sr = sampleRate;
    this.rng = new Rng(seed || 0x2545f491);
    this.target = { rpm: 0, load: 0, overrun: 0, cut: 0, character: 0.6, crackle: 1 };
    this.rpm = 0;
    this.load = 0;
    this.overrun = 0;
    this.cut = 0;
    this.character = 0.6;
    this.crackleAmt = 1;
    this.kRpm = onePole(sampleRate, 0.03);
    this.kLoad = onePole(sampleRate, 0.05);
    this.blockPos = 0;
    if (engineCfg) {
      this.configure(engineCfg);
    }
  }

  EngineDSP.prototype.configure = function (cfg) {
    if (!cfg || !cfg.sound) return;
    var sr = this.sr, s = cfg.sound, i;
    this.cfg = cfg;
    this.s = s;

    var ev = (cfg.firing || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    this.nEv = ev.length;
    this.evPos = new Float64Array(ev.length + 1);
    this.evCyl = new Int32Array(ev.length);
    this.evBank = new Int32Array(ev.length);
    var maxCyl = 0;
    for (i = 0; i < ev.length; i++) {
      this.evPos[i] = (ev[i][0] % 720) / 720;
      this.evCyl[i] = ev[i][1];
      this.evBank[i] = ev[i][2];
      if (ev[i][1] > maxCyl) maxCyl = ev[i][1];
    }
    this.evPos[ev.length] = 1;
    this.ne = 0;
    this.phase = 0;

    // Per-cylinder individual trim variations (organic mechanical texture)
    this.trim = new Float32Array(maxCyl + 1);
    for (i = 0; i <= maxCyl; i++) {
      this.trim[i] = 1 + (s.cylinderTrim || 0.03) * this.rng.gauss();
    }

    this.banks = [];
    var banksList = s.banks || [{ pipeMs: 5.0, pan: 0, tune: 1 }];
    for (i = 0; i < banksList.length; i++) {
      this.banks.push(new Bank(sr, banksList[i], s));
    }

    this.hpL = new Biquad(); this.hpR = new Biquad();
    this.hpL.set('highpass', 26, 0.707, 0, sr);
    this.hpR.set('highpass', 26, 0.707, 0, sr);

    this.mufL = new Biquad(); this.mufR = new Biquad();
    this.muf2L = new Biquad(); this.muf2R = new Biquad();

    // Cabin / Room reflections delay network (parallel, damped)
    var rd = [0.0073, 0.0111, 0.0097, 0.0137];
    this.room = [];
    for (i = 0; i < 4; i++) {
      var len = Math.round(rd[i] * sr);
      this.room.push({ buf: new Float32Array(len), pos: 0, lp: 0 });
    }

    // Body / Cabin resonance peaking filter (the core "tokluk" parameter!)
    this.bodyL = new Biquad(); this.bodyR = new Biquad();
    this.bodyL.set('peaking', s.bodyHz || 90, 0.9, s.bodyDb || 4, sr);
    this.bodyR.set('peaking', s.bodyHz || 90, 0.9, s.bodyDb || 4, sr);

    // Helmholtz intake induction roar
    this.intakeBp = new Biquad();
    this.intakeBp.set('bandpass', s.intakeHz || 750, 1.1, 0, sr);
    this.intakeEnv = 0;
    this.kIntakeEnv = onePole(sr, 0.004);

    // Afterfire backfire pop bandpass
    this.popBp = new Biquad();
    this.popBp.set('bandpass', 1400, 0.9, 0, sr);
    this.popEnv = 0;
    this.popDecay = Math.exp(-1 / (sr * 0.012));

    this.whinePh = 0;
    this.crackleOn = false;
    this.crackleTimer = 0;
    this.click = new GearClick(sr, s.shiftClick || 0);
    this.clutchDown = 0;
    this.clutchAmt = 0;
  };

  EngineDSP.prototype.message = function (msg) {
    if (!msg) return;
    if (msg.type === 'params') {
      var t = this.target;
      if (typeof msg.rpm === 'number') t.rpm = msg.rpm;
      if (typeof msg.load === 'number') t.load = msg.load;
      if (typeof msg.overrun === 'number') t.overrun = msg.overrun;
      if (typeof msg.cut === 'number') t.cut = msg.cut;
      if (typeof msg.character === 'number') t.character = msg.character;
      if (typeof msg.crackle === 'number') t.crackle = clamp(msg.crackle, 0, 2);
      if (typeof msg.exhaustGain === 'number') t.exhaustGain = msg.exhaustGain;
      if (typeof msg.mufflerMinHz === 'number') t.mufflerMinHz = msg.mufflerMinHz;
      if (typeof msg.mufflerMaxHz === 'number') t.mufflerMaxHz = msg.mufflerMaxHz;
      if (typeof msg.driveMult === 'number') t.driveMult = msg.driveMult;
      if (typeof msg.bodyDbOffset === 'number') t.bodyDbOffset = msg.bodyDbOffset;
    } else if (msg.type === 'config') {
      this.configure(msg.config);
    } else if (msg.type === 'click') {
      this.click.trigger(msg.strength || 1, this.rng);
    } else if (msg.type === 'clutch') {
      this.clutchDown = msg.down ? 1 : 0;
    }
  };

  // Block-rate parameter derivation (every 128 samples)
  EngineDSP.prototype._updateBlock = function () {
    var cfg = this.cfg;
    if (!cfg) return;
    var s = this.s, sr = this.sr, t = this.target, r = this.rng;
    this.overrun = t.overrun;
    this.cut = t.cut;
    this.character += (t.character - this.character) * 0.05;
    this.crackleAmt = t.crackle;

    var eg = typeof t.exhaustGain === 'number' ? t.exhaustGain : 1.0;
    var dm = typeof t.driveMult === 'number' ? t.driveMult : 1.0;
    var mMin = typeof t.mufflerMinHz === 'number' ? t.mufflerMinHz : (s.mufflerHz ? s.mufflerHz[0] : 800);
    var mMax = typeof t.mufflerMaxHz === 'number' ? t.mufflerMaxHz : (s.mufflerHz ? s.mufflerHz[1] : 6000);
    var bOffset = typeof t.bodyDbOffset === 'number' ? t.bodyDbOffset : 0;

    var ch = this.character, load = this.load;
    var idleRpm = cfg.idleRpm || 800;
    var redlineRpm = cfg.redlineRpm || 7000;
    var rpmN = clamp((this.rpm - idleRpm) / (redlineRpm - idleRpm), 0, 1);
    this.rpmN = rpmN;

    // Clutch down burble
    this.clutchAmt += (this.clutchDown - this.clutchAmt) * 0.2;
    this.burble = (s.burble || 0) * this.clutchAmt * (1 - clamp(load * 3, 0, 1)) * clamp(rpmN * 6, 0, 1);

    this.ampBase = (s.gain || 0.6) * eg * (0.28 + 0.72 * Math.pow(load, 0.8)) * (0.8 + 0.35 * rpmN);
    this.pulseLen = sr / 1000 * lerp(s.pulseMsIdle || 3.5, s.pulseMsRedline || 0.8, Math.sqrt(rpmN)) * (1.12 - 0.3 * load);
    this.noiseAmt = (s.noise || 0.5) * (0.3 + 0.7 * load + 1.2 * this.burble) * (0.55 + 0.9 * ch);
    this.noiseDecay = Math.exp(-1 / (sr * lerp(0.0045, 0.0012, rpmN)));
    this.jitter = (s.jitter || 0.03) * (1 + 1.5 * ch * (1 - rpmN));

    // Lumpy cam lope at idle
    this.lope = (s.lope || 0.05) * ch * (1 - clamp(rpmN * 5, 0, 1)) * (1 - load) * this.crackleAmt;

    // Dynamic 4th-order muffler lowpass tracking exhaust valve mode
    var open = clamp(load * (0.35 + 0.65 * ch) + 0.35 * rpmN, 0, 1);
    var mufHz = lerp(mMin, mMax, open);
    this.mufL.set('lowpass', mufHz, 0.75, 0, sr);
    this.mufR.set('lowpass', mufHz, 0.75, 0, sr);
    this.muf2L.set('lowpass', mufHz * 1.15, 0.6, 0, sr);
    this.muf2R.set('lowpass', mufHz * 1.15, 0.6, 0, sr);

    // Non-linear exhaust drive & saturation
    this.drive = 1 + ((s.drive || 3.0) * dm - 1) * (0.25 + 0.75 * load) * (0.4 + 0.6 * ch);
    this.driveNorm = 1 / softClip(this.drive * 0.6) * 0.6;

    // Dynamic body resonance peaking (the core "tokluk" parameter!)
    var targetBodyDb = (s.bodyDb || 4) + bOffset;
    this.bodyL.set('peaking', s.bodyHz || 90, 0.9, targetBodyDb, sr);
    this.bodyR.set('peaking', s.bodyHz || 90, 0.9, targetBodyDb, sr);

    this.intakeAmp = (s.intake || 0.12) * load * (0.25 + 0.75 * rpmN);
    this.whineAmp = (s.whine || 0) * load * rpmN * rpmN;

    // Afterfire crackle burst timing
    this.crackleTimer -= BLOCK;
    if (this.crackleTimer <= 0) {
      this.crackleOn = !this.crackleOn;
      this.crackleTimer = sr * (this.crackleOn ? 0.04 + 0.16 * r.next() : 0.08 + 0.45 * r.next());
    }
    var crackleBase = (s.crackle || 0.8) * this.overrun * (0.3 + 0.7 * ch) * this.crackleAmt;
    this.crackleProb = crackleBase * (this.crackleOn ? 0.35 : 0.03);
  };

  EngineDSP.prototype._pop = function (bank, strength) {
    var sr = this.sr, r = this.rng, s = this.s;
    bank.add(sr * 0.0012, strength * (s.gain || 0.6) * 1.6, strength * (s.gain || 0.6) * 1.2,
      Math.exp(-1 / (sr * (0.002 + 0.004 * r.next()))));
    if (strength * 0.9 > this.popEnv) {
      this.popEnv = strength * 0.9;
      this.popBp.set('bandpass', 700 + 1800 * r.next(), 0.8, 0, sr);
      this.popDecay = Math.exp(-1 / (sr * (0.006 + 0.012 * r.next())));
    }
  };

  EngineDSP.prototype._fire = function (e) {
    var r = this.rng, s = this.s;
    var bank = this.banks[this.evBank[e] % this.banks.length];
    if (this.cut > 0.5) {
      // Ignition cut: pumping air, plus unburnt fuel igniting in hot exhaust
      bank.add(this.pulseLen, this.ampBase * 0.18, 0, 0);
      if (r.next() < 0.14 * (s.crackle || 0.8) * (0.4 + this.character) * this.crackleAmt) {
        this._pop(bank, 0.5 + 0.5 * r.next());
      }
      return;
    }
    var amp = this.ampBase * this.trim[this.evCyl[e]] * (1 + this.jitter * r.gauss());
    if (this.lope > 0 && r.next() < this.lope) amp *= 0.35 + 0.3 * r.next();
    if (this.burble > 0) {
      amp *= clamp(1 + 0.6 * this.burble * r.gauss(), 0.1, 1.5);
      if (r.next() < 0.35 * this.burble) amp *= 0.2 + 0.3 * r.next();
    }
    if (amp < 0) amp = 0;
    var len = this.pulseLen * (0.85 + 0.3 * r.next());
    bank.add(len, amp, amp * this.noiseAmt, this.noiseDecay);
    if (this.crackleProb > 0 && r.next() < this.crackleProb) {
      this._pop(bank, 0.25 + 0.75 * r.next());
    }
  };

  EngineDSP.prototype.process = function (outL, outR, n) {
    if (!this.cfg) return;
    var sr = this.sr, t = this.target, r = this.rng, banks = this.banks, nb = banks.length;
    var cycPerSample = 1 / (120 * sr);

    for (var i = 0; i < n; i++) {
      if (this.blockPos === 0) this._updateBlock();
      this.blockPos = (this.blockPos + 1) % BLOCK;

      this.rpm += (t.rpm - this.rpm) * this.kRpm;
      this.load += (t.load - this.load) * this.kLoad;

      this.phase += this.rpm * cycPerSample;
      while (this.phase >= this.evPos[this.ne]) {
        if (this.ne === this.nEv) {
          this.phase -= 1;
          this.ne = 0;
        } else {
          this._fire(this.ne);
          this.ne++;
        }
      }

      var L = 0, R = 0, excSum = 0;
      for (var b = 0; b < nb; b++) {
        var bank = banks[b];
        var y = bank.tick(r);
        L += y * bank.panL;
        R += y * bank.panR;
        excSum += bank.exc;
      }

      // Intake roar: band-limited noise that breathes with firing pulses
      this.intakeEnv += (Math.abs(excSum) - this.intakeEnv) * this.kIntakeEnv;
      if (this.intakeAmp > 1e-4) {
        var intake = this.intakeBp.process(r.white() * this.intakeAmp * (0.35 + 2.5 * this.intakeEnv));
        L += intake; R += intake;
      }

      // Supercharger / gearbox whine
      if (this.whineAmp > 1e-4) {
        this.whinePh += this.rpm / 60 * (this.s.whineRatio || 4.5) / sr;
        if (this.whinePh >= 1) this.whinePh -= 1;
        var wv = this.whineAmp * (Math.sin(TWO_PI * this.whinePh) + 0.35 * Math.sin(2 * TWO_PI * this.whinePh));
        L += wv; R += wv;
      }

      // Body resonance and muffler stages
      L = this.bodyL.process(this.muf2L.process(this.mufL.process(this.hpL.process(L))));
      R = this.bodyR.process(this.muf2R.process(this.mufR.process(this.hpR.process(R))));

      // Cabin reflections (parallel damped delay network)
      var rm = this.room, rl = 0, rr = 0;
      for (var q = 0; q < 4; q++) {
        var d = rm[q], inp = (q & 1 ? R : L);
        var o = d.buf[d.pos];
        d.lp += 0.35 * (o - d.lp);
        d.buf[d.pos] = inp + d.lp * 0.42;
        d.pos = (d.pos + 1) % d.buf.length;
        if (q < 2) rl += d.lp; else rr += d.lp;
      }
      L += rl * 0.22; R += rr * 0.22;

      // Afterfire cracks (bypasses muffler low-pass for razor-sharp crackles)
      if (this.popEnv > 1e-4) {
        var pop = this.popBp.process(r.white() * this.popEnv) * (this.s.popGain || 0.5);
        this.popEnv *= this.popDecay;
        L += pop; R += pop;
      }

      // Gear lever mechanical click
      var click = this.click.next(r);
      outL[i] = softClip(L * this.drive) * this.driveNorm + click;
      outR[i] = softClip(R * this.drive) * this.driveNorm + click;
    }
  };

  return EngineDSP;
})();

if (typeof registerProcessor === 'function') {
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
} else if (typeof window !== 'undefined') {
  window.EngineDSP = EngineDSP;
}
