/**
 * TeslaSound - Physics & Vehicle Dynamics Simulation
 * Progressive, Realistic Engine Acceleration:
 * - Smooth, authentic tachometer sweep (RPM climbs progressively through the gears, NO instant jump to 9!)
 * - Natural torque flare (+250 to +450 RPM on pedal touch) without shooting to redline
 * - 60 Hz Accelerometer (DeviceMotion) + GPS dead-reckoning for zero-lag throttle attack
 * - Realistic gear progression and satisfying shift drops
 */

class VehiclePhysics {
    constructor(audioEngine) {
        this.audio = audioEngine;
        this.profile = null;

        // Dynamic State
        this.currentSpeedKmh = 0;       // Displayed / simulated speed in km/h
        this.targetSpeedKmh = 0;        // Target speed from GPS or manual slider
        this.currentRpm = 900;
        this.targetRpm = 900;
        this.throttle = 0.0;            // 0.0 (idle/brake) to 1.0 (WOT)
        this.targetThrottle = 0.0;
        this.acceleration = 0.0;        // m/s^2
        this.currentGear = 1;           // 1 to N
        this.transmissionMode = 'auto'; // 'auto' or 'manual'

        // Shifting state
        this.isShifting = false;
        this.shiftStartTime = 0;
        this.shiftDurationMs = 85;      // Crisp shift pause

        // GPS & Accelerometer metadata
        this.lastGpsTimestamp = 0;
        this.lastGpsSpeedMs = 0;
        this.gpsAccuracy = null;
        this.gpsActive = false;

        // Simulation parameters
        this.isSimulating = false;
        this.simPedalDown = false;
        this.simBrakeDown = false;
        this.isEngineRunning = false;
        this.isStarting = false;
    }

    /**
     * Start engine immediately with instant idle engagement
     */
    startEngineSequence(onComplete) {
        if (!this.profile) return;
        this.isStarting = false;
        this.isEngineRunning = true;
        this.currentRpm = this.profile.idleRpm;
        this.targetRpm = this.profile.idleRpm;
        this.throttle = 0;
        this.targetThrottle = 0;

        this.audio.triggerIgnitionAudio(this.profile, () => {
            if (onComplete) onComplete();
        });
    }

    /**
     * Stop engine with rundown decel
     */
    stopEngine(onComplete) {
        this.isStarting = false;
        this.isEngineRunning = false;
        this.targetThrottle = 0;
        this.throttle = 0;
        this.simPedalDown = false;
        this.simBrakeDown = false;

        this.audio.triggerShutdownAudio(() => {
            this.currentRpm = 0;
            this.currentSpeedKmh = 0;
            if (onComplete) onComplete();
        });
    }

    setProfile(profile) {
        this.profile = profile;
        this.currentGear = 1;
        this.currentRpm = this.isEngineRunning ? profile.idleRpm : 0;
        this.targetRpm = this.isEngineRunning ? profile.idleRpm : 0;
    }

    /**
     * Real-time hardware accelerometer (60 Hz IMU)
     * Responds to vehicle forward G-force without waiting for GPS delay
     */
    handleMotionUpdate(event) {
        if (!this.isEngineRunning || this.isSimulating) return;

        const acc = event.acceleration || event.accelerationIncludingGravity;
        if (!acc) return;

        const x = acc.x || 0;
        const y = acc.y || 0;
        const z = acc.z || 0;

        let dynamicAccel = 0;
        if (event.acceleration && event.acceleration.x !== null) {
            dynamicAccel = Math.sqrt(x * x + y * y + z * z);
        } else if (event.accelerationIncludingGravity) {
            const mag = Math.sqrt(x * x + y * y + z * z);
            dynamicAccel = Math.max(0, mag - 9.81);
        }

        if (dynamicAccel > 0.20) {
            this.acceleration = Math.max(this.acceleration, dynamicAccel);

            if (dynamicAccel > 1.4) {
                this.targetThrottle = 1.0;
            } else if (dynamicAccel > 0.7) {
                this.targetThrottle = Math.max(this.targetThrottle, 0.80);
            } else if (dynamicAccel > 0.3) {
                this.targetThrottle = Math.max(this.targetThrottle, 0.55);
            }
        }
    }

    /**
     * Ingest GPS position data with responsive speed tracking
     */
    handleGpsUpdate(position) {
        if (!this.isEngineRunning) return;
        const coords = position.coords;
        const now = position.timestamp || Date.now();
        this.gpsActive = true;
        this.gpsAccuracy = coords.accuracy;

        let speedMs = coords.speed;
        if (speedMs === null || isNaN(speedMs) || speedMs < 0) {
            speedMs = 0;
        }

        const speedKmh = Math.max(0, speedMs * 3.6);
        this.targetSpeedKmh = speedKmh;

        if (this.lastGpsTimestamp > 0 && now > this.lastGpsTimestamp) {
            const dtSeconds = (now - this.lastGpsTimestamp) / 1000;
            if (dtSeconds > 0.1 && dtSeconds < 3.5) {
                const dv = speedMs - this.lastGpsSpeedMs;
                const calcAccel = dv / dtSeconds;
                this.acceleration = calcAccel;

                if (dv > 0.12) {
                    const surge = Math.min(1.0, 0.45 + calcAccel * 0.4);
                    this.targetThrottle = Math.max(this.targetThrottle, surge);
                } else if (dv < -0.30) {
                    this.targetThrottle = 0.0;
                } else if (speedKmh > 5) {
                    this.targetThrottle = 0.18;
                } else {
                    this.targetThrottle = 0.0;
                }
            }
        }

        this.lastGpsTimestamp = now;
        this.lastGpsSpeedMs = speedMs;
    }

    /**
     * Physics tick called every animation frame (60 FPS)
     */
    update(dt) {
        if (!this.profile) return;

        if (!this.isEngineRunning) {
            this.targetThrottle = 0;
            this.throttle = 0;
            this.simPedalDown = false;
            this.simBrakeDown = false;
            this.currentRpm = Math.max(0, this.currentRpm - dt * 3500);
            this.currentSpeedKmh = Math.max(0, this.currentSpeedKmh - dt * 35);
            this.targetSpeedKmh = 0;
            this.acceleration = 0;
            return;
        }

        // Handle Simulator Controls if in Test Bench Mode
        if (this.isSimulating) {
            this._updateSimulation(dt);
        } else {
            // Real-time dead-reckoning speed integration between GPS updates (only while in motion)
            if (this.targetSpeedKmh > 1.0 && this.acceleration > 0.2) {
                this.currentSpeedKmh = Math.min(260, this.currentSpeedKmh + this.acceleration * dt * 3.6);
            }
            const speedSmoothingFactor = Math.min(1.0, dt * 10.0);
            this.currentSpeedKmh += (this.targetSpeedKmh - this.currentSpeedKmh) * speedSmoothingFactor;
            if (this.targetSpeedKmh < 0.5 && this.currentSpeedKmh < 0.5) {
                this.currentSpeedKmh = 0;
                this.acceleration = 0;
            }
        }

        // Throttle response smoothing
        const throttleSmoothing = this.targetThrottle > this.throttle 
            ? Math.min(1.0, dt * 25.0) 
            : Math.min(1.0, dt * 10.0);
        this.throttle += (this.targetThrottle - this.throttle) * throttleSmoothing;
        this.throttle = Math.max(0, Math.min(1, this.throttle));

        // 1. Calculate Gear & Road Speed Base RPM
        if (this.currentSpeedKmh < 0.8) {
            // Vehicle stopped: subtle rev flare proportional to throttle at standstill (up to ~3,200 RPM launch rev)
            this.targetRpm = this.profile.idleRpm + (this.throttle * 2400);
            this.currentGear = 1;
        } else {
            const gears = this.profile.gears;
            const isTopGear = this.currentGear >= gears.length;
            const gearConfig = gears[this.currentGear - 1] || gears[0];
            const maxSpeed = gearConfig.maxSpeed || 50;

            // Road speed ratio in current gear (0.0 to 1.0)
            const speedRatio = Math.max(0, Math.min(1.0, this.currentSpeedKmh / maxSpeed));
            
            // Progressive RPM climb through current gear:
            const gearRpmRange = (this.profile.redlineRpm - this.profile.idleRpm);
            const baseGearRpm = this.profile.idleRpm + (speedRatio * gearRpmRange);

            // Subtle throttle torque flare (+200 to +450 RPM) gives responsive bite WITHOUT jumping to 9000!
            const throttleFlare = this.throttle * Math.min(450, gearRpmRange * 0.075);
            const accelFlare = Math.max(0, this.acceleration * 35);

            let calculatedRpm = baseGearRpm + throttleFlare + accelFlare;

            if (isTopGear && calculatedRpm >= (this.profile.redlineRpm - 120)) {
                calculatedRpm = this.profile.redlineRpm - 120;
            }

            this.targetRpm = Math.max(this.profile.idleRpm, Math.min(this.profile.redlineRpm, calculatedRpm));

            // Automatic transmission logic with progressive shift points
            if (this.transmissionMode === 'auto' && !this.isShifting) {
                this._handleAutoShifting();
            }

            // Rev limiter check ("tatatata" kesici)
            if (!isTopGear && this.currentRpm >= this.profile.redlineRpm) {
                this.audio.triggerRevLimiter();
                this.currentRpm = this.profile.redlineRpm - 100;
            }
        }

        // Realistic RPM inertia: smooth, satisfying tachometer sweep
        const rpmSmoothing = this.targetRpm > this.currentRpm 
            ? Math.min(1.0, dt * 18.0) 
            : Math.min(1.0, dt * 14.0);
        this.currentRpm += (this.targetRpm - this.currentRpm) * rpmSmoothing;

        // Send state to audio engine
        this.audio.update(this.currentRpm, this.throttle, this.currentSpeedKmh, this.acceleration);
    }

    /**
     * Automatic Transmission with realistic gear shift progression
     */
    _handleAutoShifting() {
        const gears = this.profile.gears;
        const totalGears = gears.length;

        const isAccelerating = this.acceleration > 0.35 || this.throttle > 0.40;
        
        // Dynamic shift point: shifts around 82% RPM normally, holds up to 94% on heavy throttle
        const dynamicShiftRpm = isAccelerating 
            ? (this.profile.redlineRpm - 250) 
            : (this.profile.shiftRpm || this.profile.redlineRpm * 0.82);

        // KICKDOWN: If accelerating hard and current gear is 2+, downshift if it won't blow redline
        if (isAccelerating && this.currentGear > 1) {
            const lowerGearConfig = gears[this.currentGear - 2];
            const lowerRatio = this.currentSpeedKmh / lowerGearConfig.maxSpeed;
            const projectedRpm = this.profile.idleRpm + lowerRatio * (this.profile.redlineRpm - this.profile.idleRpm);
            if (projectedRpm < (this.profile.redlineRpm - 400)) {
                this.shiftDown();
                return;
            }
        }

        // Upshift condition
        if (this.currentRpm >= dynamicShiftRpm && this.currentGear < totalGears) {
            this.shiftUp();
            return;
        }

        // Downshift condition when decelerating
        if (this.currentGear > 1) {
            const lowerGearConfig = gears[this.currentGear - 2];
            const lowerRatio = this.currentSpeedKmh / lowerGearConfig.maxSpeed;
            const projectedRpm = this.profile.idleRpm + lowerRatio * (this.profile.redlineRpm - this.profile.idleRpm);
            if (this.currentRpm < (this.profile.idleRpm + 600) && projectedRpm < (this.profile.redlineRpm - 600)) {
                this.shiftDown();
            }
        }
    }

    shiftUp() {
        if (this.currentGear >= this.profile.gears.length || this.isShifting) return;

        this.isShifting = true;
        this.currentGear++;
        this.audio.triggerGearShift(true);

        setTimeout(() => {
            this.isShifting = false;
        }, this.shiftDurationMs);
    }

    shiftDown() {
        if (this.currentGear <= 1 || this.isShifting) return;

        this.isShifting = true;
        this.currentGear--;
        this.audio.triggerGearShift(false);

        // Rev-match throttle blip
        const originalThrottle = this.throttle;
        this.throttle = Math.min(1.0, this.throttle + 0.35);

        setTimeout(() => {
            this.isShifting = false;
            this.throttle = originalThrottle;
        }, this.shiftDurationMs + 40);
    }

    /**
     * Simulator test bench physics with realistic sports car acceleration
     */
    _updateSimulation(dt) {
        let targetAccel = 0;

        if (this.simPedalDown) {
            this.targetThrottle = 1.0;
            // Realistic sports acceleration: 0 to 100 km/h in ~6.5 seconds (gives plenty of time to enjoy each gear!)
            targetAccel = 4.2;
            this.currentSpeedKmh = Math.min(260, this.currentSpeedKmh + targetAccel * dt * 3.6);
        } else if (this.simBrakeDown) {
            this.targetThrottle = 0.0;
            targetAccel = -9.5;
            this.currentSpeedKmh = Math.max(0, this.currentSpeedKmh + targetAccel * dt * 3.6);
        } else {
            // Coasting
            this.targetThrottle = 0.0;
            targetAccel = -1.2;
            this.currentSpeedKmh = Math.max(0, this.currentSpeedKmh + targetAccel * dt * 3.6);
        }

        this.acceleration = targetAccel;
        this.targetSpeedKmh = this.currentSpeedKmh;
    }

    setSimPedal(isPressed) {
        if (!this.isSimulating) {
            this.simPedalDown = false;
            return;
        }
        this.simPedalDown = isPressed;
        this.targetThrottle = isPressed ? 1.0 : 0.0;
    }

    setSimBrake(isPressed) {
        if (!this.isSimulating) {
            this.simBrakeDown = false;
            return;
        }
        this.simBrakeDown = isPressed;
        if (isPressed) {
            this.targetThrottle = 0.0;
        }
    }

    setTransmissionMode(mode) {
        this.transmissionMode = mode;
    }

    setManualSpeedKmh(val) {
        this.targetSpeedKmh = Math.max(0, Math.min(260, val));
        this.currentSpeedKmh = this.targetSpeedKmh;
    }
}

window.VehiclePhysics = VehiclePhysics;
