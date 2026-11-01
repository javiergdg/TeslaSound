/**
 * vehicles.js — High-Fidelity Automotive Sound Profiles & Physical Specifications
 * 
 * Powered by physical combustion-engine waveguide synthesis:
 * - Discrete 4-stroke crank phase (720°) firing order
 * - Exhaust pipe delay waveguides (feedback comb filter with inverting reflection)
 * - Multi-stage acoustic formants & low-frequency body resonance (giving the sound its "contundencia")
 * - Dynamic 4th-order muffler lowpass tracking throttle & RPM
 * - Helmholtz intake induction roar & supercharger/turbo whine
 * - Overrun backfire crackles ("petardeos") and ignition-cut pops
 */

const VEHICLE_PROFILES = [
    {
        id: 'porsche_gt3',
        name: 'Porsche 911 GT3 RS',
        type: '4.0L Naturally Aspirated Flat-6 (9,000 RPM PDK)',
        badge: '9,000 RPM',
        accentColor: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.45)',
        cylinders: 6,
        idleRpm: 850,
        redlineRpm: 9000,
        shiftRpm: 8800,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 3.75, maxSpeed: 28 },
            { ratio: 2.38, maxSpeed: 52 },
            { ratio: 1.72, maxSpeed: 76 },
            { ratio: 1.34, maxSpeed: 102 },
            { ratio: 1.11, maxSpeed: 130 },
            { ratio: 0.96, maxSpeed: 175 },
            { ratio: 0.84, maxSpeed: 285 }
        ],
        finalDrive: 3.97,
        soundDescription: 'Motor de competición Flat-6 atmosférico puro de 4.0L, resonancia de cuerpo contundente a 110Hz, grito de carreras cristalino a 9.000 rpm y petardeos de cambio del PDK.',
        engine: {
            idleRpm: 850,
            redlineRpm: 9000,
            limiterRpm: 9200,
            firing: [
                [0, 1, 0], [120, 6, 1], [240, 2, 0], [360, 4, 1], [480, 3, 0], [600, 5, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.6, pan: -0.4, tune: 1 },
                    { pipeMs: 4.8, pan: 0.4, tune: 1.03 }
                ],
                pipeReflection: -0.45,
                pipeDamping: 0.3,
                formants: [
                    { hz: 150, q: 1.0, gain: 0.8 },
                    { hz: 620, q: 2.2, gain: 0.6 },
                    { hz: 1900, q: 2.5, gain: 0.4 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 3.0,
                pulseMsRedline: 0.7,
                noise: 0.5,
                jitter: 0.025,
                cylinderTrim: 0.03,
                lope: 0.06,
                mufflerHz: [1100, 7000],
                bodyHz: 110,
                bodyDb: 3,
                intake: 0.14,
                intakeHz: 900,
                whine: 0.05,
                whineRatio: 4.5,
                crackle: 0.6,
                popGain: 0.45,
                drive: 3.2,
                gain: 0.58
            }
        }
    },
    {
        id: 'mercedes_c63_amg',
        name: 'Mercedes-Benz C63 AMG',
        type: '6.2L Naturally Aspirated V8 (M156 Safkan Canavar)',
        badge: '7,400 RPM',
        accentColor: '#E11D48',
        glowColor: 'rgba(225, 29, 72, 0.45)',
        cylinders: 8,
        idleRpm: 700,
        redlineRpm: 7400,
        shiftRpm: 7200,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 4.38, maxSpeed: 25 },
            { ratio: 2.86, maxSpeed: 46 },
            { ratio: 1.92, maxSpeed: 70 },
            { ratio: 1.37, maxSpeed: 98 },
            { ratio: 1.00, maxSpeed: 135 },
            { ratio: 0.82, maxSpeed: 185 },
            { ratio: 0.73, maxSpeed: 290 }
        ],
        finalDrive: 2.82,
        soundDescription: 'Legendario V8 atmosférico M156 de 6.2L, enorme trueno alemán contundente a 65Hz +8dB, rugido denso y petardeos de cambio del Speedshift.',
        engine: {
            idleRpm: 700,
            redlineRpm: 7400,
            limiterRpm: 7500,
            firing: [
                [0, 1, 0], [90, 8, 1], [180, 7, 0], [270, 2, 1],
                [360, 6, 1], [450, 5, 0], [540, 4, 1], [630, 3, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 6.2, pan: -0.55, tune: 1 },
                    { pipeMs: 7.2, pan: 0.55, tune: 1.05 }
                ],
                pipeReflection: -0.52,
                pipeDamping: 0.32,
                formants: [
                    { hz: 58, q: 1.2, gain: 1.3 },
                    { hz: 210, q: 1.2, gain: 1.0 },
                    { hz: 880, q: 1.8, gain: 0.7 },
                    { hz: 1600, q: 2.2, gain: 0.4 }
                ],
                formantDry: 0.35,
                pulseMsIdle: 4.5,
                pulseMsRedline: 0.8,
                noise: 0.6,
                jitter: 0.04,
                cylinderTrim: 0.07,
                lope: 0.16,
                mufflerHz: [650, 5500],
                bodyHz: 65,
                bodyDb: 8,
                intake: 0.12,
                intakeHz: 600,
                whine: 0,
                whineRatio: 6.0,
                crackle: 0.95,
                popGain: 0.55,
                burble: 1.2,
                shiftClick: 0.5,
                drive: 3.4,
                gain: 0.65
            }
        }
    },
    {
        id: 'hellcat',
        name: 'Dodge Charger / Challenger Hellcat',
        type: '6.2L Supercharged HEMI V8 (55 Hz Derin Tok Bas)',
        badge: '6,200 RPM',
        accentColor: '#F97316',
        glowColor: 'rgba(249, 115, 22, 0.45)',
        cylinders: 8,
        idleRpm: 750,
        redlineRpm: 6200,
        shiftRpm: 5900,
        hasTurbo: false,
        hasSupercharger: true,
        gears: [
            { ratio: 2.97, maxSpeed: 27 },
            { ratio: 2.10, maxSpeed: 50 },
            { ratio: 1.46, maxSpeed: 76 },
            { ratio: 1.00, maxSpeed: 108 },
            { ratio: 0.74, maxSpeed: 148 },
            { ratio: 0.50, maxSpeed: 290 }
        ],
        finalDrive: 3.70,
        soundDescription: 'V8 HEMI de 6.2L con compresor, graves de cuerpo súper contundentes a 55 Hz +9dB, silbido mecánico del supercharger y un áspero rugido mecánico en los cambios de marcha.',
        engine: {
            idleRpm: 750,
            redlineRpm: 6200,
            limiterRpm: 6400,
            softLimiter: true,
            firing: [
                [0, 1, 0], [90, 8, 1], [180, 4, 1], [270, 3, 0],
                [360, 6, 1], [450, 5, 0], [540, 7, 0], [630, 2, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 2.8, pan: -0.55, tune: 1 },
                    { pipeMs: 2.5, pan: 0.55, tune: 1.1 }
                ],
                pipeReflection: -0.55,
                pipeDamping: 0.3,
                formants: [
                    { hz: 48, q: 1.2, gain: 1.0 },
                    { hz: 180, q: 0.9, gain: 1.0 },
                    { hz: 700, q: 1.4, gain: 1.9 },
                    { hz: 1450, q: 1.6, gain: 2.4 },
                    { hz: 2700, q: 2.2, gain: 0.3 },
                    { hz: 4500, q: 2.0, gain: 0.2 }
                ],
                formantDry: 0.38,
                pulseMsIdle: 5.5,
                pulseMsRedline: 0.5,
                noise: 0.8,
                jitter: 0.03,
                cylinderTrim: 0.08,
                lope: 0.08,
                mufflerHz: [1400, 8000],
                bodyHz: 55,
                bodyDb: 9,
                intake: 0.08,
                intakeHz: 640,
                whine: 0.02,
                whineRatio: 9.5,
                crackle: 0.7,
                popGain: 0.45,
                burble: 1.4,
                shiftClick: 0.55,
                drive: 3.6,
                gain: 0.6
            }
        }
    },
    {
        id: 'v8_muscle',
        name: 'V8 Muscle (American Classic)',
        type: '6.2L Crossplane Small-Block V8 (Doble escape)',
        badge: '6,500 RPM',
        accentColor: '#EAB308',
        glowColor: 'rgba(234, 179, 8, 0.45)',
        cylinders: 8,
        idleRpm: 760,
        redlineRpm: 6500,
        shiftRpm: 6300,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 2.66, maxSpeed: 28 },
            { ratio: 1.78, maxSpeed: 52 },
            { ratio: 1.30, maxSpeed: 78 },
            { ratio: 1.00, maxSpeed: 110 },
            { ratio: 0.74, maxSpeed: 155 },
            { ratio: 0.50, maxSpeed: 280 }
        ],
        finalDrive: 3.73,
        soundDescription: 'Rugido clásico de V8 americano crossplane de 6.2L, golpe de graves contundente a 85Hz, bamboleo del árbol de levas al ralentí y petardeos intermedios del acelerador.',
        engine: {
            idleRpm: 760,
            redlineRpm: 6500,
            limiterRpm: 6600,
            firing: [
                [0, 1, 0], [90, 8, 1], [180, 7, 0], [270, 2, 1],
                [360, 6, 1], [450, 5, 0], [540, 4, 1], [630, 3, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 6.8, pan: -0.55, tune: 1 },
                    { pipeMs: 7.9, pan: 0.55, tune: 1.06 }
                ],
                pipeReflection: -0.5,
                pipeDamping: 0.35,
                formants: [
                    { hz: 110, q: 1.0, gain: 1.1 },
                    { hz: 380, q: 2.0, gain: 0.6 },
                    { hz: 1150, q: 2.5, gain: 0.25 }
                ],
                formantDry: 0.35,
                pulseMsIdle: 3.6,
                pulseMsRedline: 1.0,
                noise: 0.45,
                jitter: 0.05,
                cylinderTrim: 0.06,
                lope: 0.22,
                mufflerHz: [700, 4800],
                bodyHz: 85,
                bodyDb: 5,
                intake: 0.05,
                intakeHz: 520,
                whine: 0,
                whineRatio: 6.5,
                crackle: 1.0,
                popGain: 0.5,
                drive: 3.0,
                gain: 0.6
            }
        }
    },
    {
        id: 'tofas_dogan_slx',
        name: 'Tofaş Doğan SLX 1.6',
        type: '1.6L 8V SOHC (Escape Abart / Tubo recto)',
        badge: '6,800 RPM',
        accentColor: '#DC2626',
        glowColor: 'rgba(220, 38, 38, 0.45)',
        cylinders: 4,
        idleRpm: 850,
        redlineRpm: 6800,
        shiftRpm: 6500,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 3.91, maxSpeed: 28 },
            { ratio: 2.17, maxSpeed: 55 },
            { ratio: 1.41, maxSpeed: 88 },
            { ratio: 1.00, maxSpeed: 128 },
            { ratio: 0.81, maxSpeed: 215 }
        ],
        finalDrive: 4.10,
        soundDescription: 'Sonido contundente y vivo del motor 1.6 SLX del Tempra, solidez de cuerpo a 78Hz, subida de régimen limpia y sin ahogos, desgarro del escape Abart y petardeos traqueteantes.',
        engine: {
            idleRpm: 850,
            redlineRpm: 6800,
            limiterRpm: 6900,
            firing: [
                [0, 1, 0], [180, 3, 0], [360, 4, 0], [540, 2, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 5.6, pan: 0.0, tune: 1.0 }
                ],
                pipeReflection: -0.52,
                pipeDamping: 0.32,
                formants: [
                    { hz: 78, q: 1.1, gain: 1.25 },
                    { hz: 280, q: 1.8, gain: 0.8 },
                    { hz: 1250, q: 2.2, gain: 0.5 }
                ],
                formantDry: 0.38,
                pulseMsIdle: 4.2,
                pulseMsRedline: 0.9,
                noise: 0.55,
                jitter: 0.045,
                cylinderTrim: 0.06,
                lope: 0.14,
                mufflerHz: [650, 4800],
                bodyHz: 78,
                bodyDb: 6.5,
                intake: 0.08,
                intakeHz: 580,
                whine: 0,
                whineRatio: 3.5,
                crackle: 0.9,
                popGain: 0.55,
                drive: 3.1,
                gain: 0.62
            }
        }
    },
    {
        id: 'tofas_sahin_varex',
        name: 'Tofaş Şahin S (Varex abierto y cortador)',
        type: '1.6L con carburador (Varex abierto, tubo recto)',
        badge: '7,000 RPM',
        accentColor: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.45)',
        cylinders: 4,
        idleRpm: 800,
        redlineRpm: 7000,
        shiftRpm: 6700,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 4.00, maxSpeed: 28 },
            { ratio: 2.22, maxSpeed: 54 },
            { ratio: 1.44, maxSpeed: 86 },
            { ratio: 1.02, maxSpeed: 126 },
            { ratio: 0.83, maxSpeed: 210 }
        ],
        finalDrive: 4.10,
        soundDescription: 'Desgarro de tubo recto con Varex abierto, cuerpo de escape ultracontundente a 72Hz, cortador nítido ("tatatata") en 2.ª marcha y llamaradas al soltar el acelerador.',
        engine: {
            idleRpm: 800,
            redlineRpm: 7000,
            limiterRpm: 7100,
            firing: [
                [0, 1, 0], [180, 3, 0], [360, 4, 0], [540, 2, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 5.0, pan: 0.0, tune: 1.0 }
                ],
                pipeReflection: -0.55,
                pipeDamping: 0.28,
                formants: [
                    { hz: 72, q: 1.0, gain: 1.35 },
                    { hz: 260, q: 1.6, gain: 0.9 },
                    { hz: 1450, q: 2.5, gain: 0.7 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 4.4,
                pulseMsRedline: 0.75,
                noise: 0.65,
                jitter: 0.05,
                cylinderTrim: 0.07,
                lope: 0.20,
                mufflerHz: [750, 6800],
                bodyHz: 72,
                bodyDb: 7.5,
                intake: 0.10,
                intakeHz: 650,
                whine: 0,
                whineRatio: 3.5,
                crackle: 1.0,
                popGain: 0.65,
                drive: 3.3,
                gain: 0.64
            }
        }
    },
    {
        id: 'bmw_m3_e46',
        name: 'BMW M3 E46 (S54)',
        type: '3.2L 24V DOHC atmosférico de 6 cilindros en línea (Rasp metálico CSL)',
        badge: '8,200 RPM',
        accentColor: '#2563EB',
        glowColor: 'rgba(37, 99, 235, 0.45)',
        cylinders: 6,
        idleRpm: 800,
        redlineRpm: 8200,
        shiftRpm: 8000,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 4.23, maxSpeed: 30 },
            { ratio: 2.53, maxSpeed: 55 },
            { ratio: 1.67, maxSpeed: 84 },
            { ratio: 1.23, maxSpeed: 115 },
            { ratio: 1.00, maxSpeed: 155 },
            { ratio: 0.83, maxSpeed: 280 }
        ],
        finalDrive: 3.62,
        soundDescription: 'Legendario 6 cilindros en línea atmosférico S54, famoso zumbido metálico de escape CSL ("rasp"), rugido de admisión de carbono CSL y grito a 8.200 rpm.',
        engine: {
            idleRpm: 800,
            redlineRpm: 8200,
            limiterRpm: 8300,
            firing: [
                [0, 1, 0], [120, 5, 1], [240, 3, 0], [360, 6, 1], [480, 2, 0], [600, 4, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.4, pan: -0.4, tune: 1 },
                    { pipeMs: 4.6, pan: 0.4, tune: 1.03 }
                ],
                pipeReflection: -0.46,
                pipeDamping: 0.28,
                formants: [
                    { hz: 110, q: 1.1, gain: 0.9 },
                    { hz: 580, q: 2.0, gain: 0.65 },
                    { hz: 2400, q: 2.8, gain: 0.65 }
                ],
                formantDry: 0.38,
                pulseMsIdle: 3.2,
                pulseMsRedline: 0.65,
                noise: 0.45,
                jitter: 0.025,
                cylinderTrim: 0.035,
                lope: 0.06,
                mufflerHz: [1000, 7500],
                bodyHz: 92,
                bodyDb: 4.5,
                intake: 0.18,
                intakeHz: 920,
                whine: 0.02,
                whineRatio: 4.0,
                crackle: 0.75,
                popGain: 0.5,
                drive: 3.1,
                gain: 0.60
            }
        }
    },
    {
        id: 'shelby_v8',
        name: 'Shelby Mustang GT500',
        type: '5.2L Supercharged Crossplane V8',
        badge: '7,500 RPM',
        accentColor: '#3B82F6',
        glowColor: 'rgba(59, 130, 246, 0.45)',
        cylinders: 8,
        idleRpm: 750,
        redlineRpm: 7500,
        shiftRpm: 7300,
        hasTurbo: false,
        hasSupercharger: true,
        gears: [
            { ratio: 3.14, maxSpeed: 26 },
            { ratio: 2.05, maxSpeed: 48 },
            { ratio: 1.43, maxSpeed: 72 },
            { ratio: 1.10, maxSpeed: 98 },
            { ratio: 0.86, maxSpeed: 126 },
            { ratio: 0.68, maxSpeed: 170 },
            { ratio: 0.56, maxSpeed: 270 }
        ],
        finalDrive: 3.73,
        soundDescription: 'Fuerza bruta de V8 Crossplane de 5.2L, resonancia de graves contundente a 72Hz, silbido del compresor y petardeos de doble embrague en los cambios de marcha.',
        engine: {
            idleRpm: 750,
            redlineRpm: 7500,
            limiterRpm: 7600,
            firing: [
                [0, 1, 0], [90, 8, 1], [180, 7, 0], [270, 2, 1],
                [360, 6, 1], [450, 5, 0], [540, 4, 1], [630, 3, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 5.8, pan: -0.5, tune: 1 },
                    { pipeMs: 6.8, pan: 0.5, tune: 1.04 }
                ],
                pipeReflection: -0.52,
                pipeDamping: 0.32,
                formants: [
                    { hz: 72, q: 1.1, gain: 1.25 },
                    { hz: 280, q: 1.6, gain: 0.8 },
                    { hz: 1100, q: 2.2, gain: 0.35 }
                ],
                formantDry: 0.36,
                pulseMsIdle: 4.2,
                pulseMsRedline: 0.85,
                noise: 0.55,
                jitter: 0.04,
                cylinderTrim: 0.06,
                lope: 0.14,
                mufflerHz: [750, 5500],
                bodyHz: 72,
                bodyDb: 6.5,
                intake: 0.10,
                intakeHz: 620,
                whine: 0.04,
                whineRatio: 7.2,
                crackle: 0.9,
                popGain: 0.5,
                drive: 3.2,
                gain: 0.62
            }
        }
    },
    {
        id: 'nissan_gtr_r34',
        name: 'Nissan Skyline GT-R R34',
        type: '2.6L Twin-Turbo DOHC 6 cilindros en línea (RB26DETT Godzilla)',
        badge: '8,200 RPM',
        accentColor: '#8B5CF6',
        glowColor: 'rgba(139, 92, 246, 0.45)',
        cylinders: 6,
        idleRpm: 850,
        redlineRpm: 8200,
        shiftRpm: 8000,
        hasTurbo: true,
        hasSupercharger: false,
        gears: [
            { ratio: 3.82, maxSpeed: 29 },
            { ratio: 2.36, maxSpeed: 53 },
            { ratio: 1.68, maxSpeed: 80 },
            { ratio: 1.31, maxSpeed: 110 },
            { ratio: 1.00, maxSpeed: 155 },
            { ratio: 0.79, maxSpeed: 285 }
        ],
        finalDrive: 3.54,
        soundDescription: 'Sonido legendario japonés del 6 cilindros en línea twin-turbo RB26DETT, cuerpo contundente a 82Hz, silbido de doble turbo y llamaradas de Godzilla en los cambios de marcha.',
        engine: {
            idleRpm: 850,
            redlineRpm: 8200,
            limiterRpm: 8300,
            firing: [
                [0, 1, 0], [120, 5, 1], [240, 3, 0], [360, 6, 1], [480, 2, 0], [600, 4, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.8, pan: -0.4, tune: 1 },
                    { pipeMs: 5.1, pan: 0.4, tune: 1.02 }
                ],
                pipeReflection: -0.48,
                pipeDamping: 0.28,
                formants: [
                    { hz: 90, q: 1.1, gain: 1.0 },
                    { hz: 480, q: 2.0, gain: 0.7 },
                    { hz: 1850, q: 2.6, gain: 0.55 }
                ],
                formantDry: 0.38,
                pulseMsIdle: 3.4,
                pulseMsRedline: 0.7,
                noise: 0.5,
                jitter: 0.03,
                cylinderTrim: 0.04,
                lope: 0.08,
                mufflerHz: [850, 7200],
                bodyHz: 82,
                bodyDb: 5,
                intake: 0.15,
                intakeHz: 800,
                whine: 0.03,
                whineRatio: 5.0,
                crackle: 0.95,
                popGain: 0.6,
                drive: 3.2,
                gain: 0.60
            }
        }
    },
    {
        id: 'subaru_wrx_sti',
        name: 'Subaru Impreza WRX STI',
        type: '2.5L Turbo Boxer-4 (UEL Headers & Boxer Rumble)',
        badge: '7,500 RPM',
        accentColor: '#0284C7',
        glowColor: 'rgba(2, 132, 199, 0.45)',
        cylinders: 4,
        idleRpm: 750,
        redlineRpm: 7500,
        shiftRpm: 7200,
        hasTurbo: true,
        hasSupercharger: false,
        gears: [
            { ratio: 3.63, maxSpeed: 28 },
            { ratio: 2.23, maxSpeed: 52 },
            { ratio: 1.52, maxSpeed: 76 },
            { ratio: 1.13, maxSpeed: 105 },
            { ratio: 0.89, maxSpeed: 145 },
            { ratio: 0.70, maxSpeed: 265 }
        ],
        finalDrive: 3.90,
        soundDescription: 'Leyenda del WRC: con el colector de escape de longitudes desiguales (UEL), profundo rumor bóxer de Subaru ultracontundente a 68Hz, silbido del turbo y chasquidos del blow-off.',
        engine: {
            idleRpm: 750,
            redlineRpm: 7500,
            limiterRpm: 7600,
            firing: [
                [0, 1, 0], [180, 3, 0], [360, 2, 1], [540, 4, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 7.4, pan: -0.5, tune: 0.96 },
                    { pipeMs: 3.6, pan: 0.5, tune: 1.08 }
                ],
                pipeReflection: -0.52,
                pipeDamping: 0.32,
                formants: [
                    { hz: 68, q: 1.1, gain: 1.35 },
                    { hz: 240, q: 1.7, gain: 0.85 },
                    { hz: 960, q: 2.0, gain: 0.35 }
                ],
                formantDry: 0.35,
                pulseMsIdle: 4.6,
                pulseMsRedline: 0.85,
                noise: 0.55,
                jitter: 0.045,
                cylinderTrim: 0.06,
                lope: 0.16,
                mufflerHz: [650, 5200],
                bodyHz: 68,
                bodyDb: 7.5,
                intake: 0.12,
                intakeHz: 650,
                whine: 0.035,
                whineRatio: 4.5,
                crackle: 0.85,
                popGain: 0.55,
                drive: 3.2,
                gain: 0.62
            }
        }
    },
    {
        id: 'ferrari_v12',
        name: 'Ferrari 812 Superfast',
        type: '6.5L Naturally Aspirated V12 (8,900 RPM F1 Howl)',
        badge: '8,900 RPM',
        accentColor: '#EAB308',
        glowColor: 'rgba(234, 179, 8, 0.45)',
        cylinders: 12,
        idleRpm: 900,
        redlineRpm: 8900,
        shiftRpm: 8700,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 3.40, maxSpeed: 30 },
            { ratio: 2.19, maxSpeed: 55 },
            { ratio: 1.63, maxSpeed: 82 },
            { ratio: 1.29, maxSpeed: 108 },
            { ratio: 1.03, maxSpeed: 135 },
            { ratio: 0.84, maxSpeed: 180 },
            { ratio: 0.63, maxSpeed: 290 }
        ],
        finalDrive: 4.38,
        soundDescription: 'Sinfonía cristalina de V12 de 6.5L, puro grito de F1 a altas revoluciones y cambios de doble embrague quirúrgicos.',
        engine: {
            idleRpm: 900,
            redlineRpm: 8900,
            limiterRpm: 9000,
            firing: [
                [0, 1, 0], [60, 7, 1], [120, 5, 0], [180, 11, 1], [240, 3, 0], [300, 9, 1],
                [360, 6, 0], [420, 12, 1], [480, 2, 0], [540, 8, 1], [600, 4, 0], [660, 10, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.2, pan: -0.45, tune: 1 },
                    { pipeMs: 4.3, pan: 0.45, tune: 1.02 }
                ],
                pipeReflection: -0.4,
                pipeDamping: 0.25,
                formants: [
                    { hz: 130, q: 1.0, gain: 0.7 },
                    { hz: 700, q: 2.4, gain: 0.55 },
                    { hz: 2300, q: 2.8, gain: 0.5 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 2.4,
                pulseMsRedline: 0.55,
                noise: 0.4,
                jitter: 0.015,
                cylinderTrim: 0.02,
                lope: 0.03,
                mufflerHz: [1300, 8500],
                bodyHz: 100,
                bodyDb: 2,
                intake: 0.1,
                intakeHz: 1100,
                whine: 0.03,
                whineRatio: 5,
                crackle: 0.7,
                popGain: 0.5,
                drive: 2.8,
                gain: 0.55
            }
        }
    },
    {
        id: 'lambo_v10',
        name: 'Lamborghini Huracán V10',
        type: '5.2L Naturally Aspirated V10 (Grito italiano)',
        badge: '8,500 RPM',
        accentColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        cylinders: 10,
        idleRpm: 900,
        redlineRpm: 8500,
        shiftRpm: 8300,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 3.91, maxSpeed: 28 },
            { ratio: 2.44, maxSpeed: 52 },
            { ratio: 1.81, maxSpeed: 78 },
            { ratio: 1.40, maxSpeed: 104 },
            { ratio: 1.13, maxSpeed: 132 },
            { ratio: 0.94, maxSpeed: 175 },
            { ratio: 0.79, maxSpeed: 280 }
        ],
        finalDrive: 3.73,
        soundDescription: 'Grito feroz de V10 italiano de 5.2L, cuerpo contundente a 88Hz, altas revoluciones nítidas y petardeos de cambio DCT precisos.',
        engine: {
            idleRpm: 900,
            redlineRpm: 8500,
            limiterRpm: 8600,
            firing: [
                [0, 1, 0], [72, 6, 1], [144, 5, 0], [216, 10, 1], [288, 2, 0],
                [360, 7, 1], [432, 4, 0], [504, 9, 1], [576, 3, 0], [648, 8, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.4, pan: -0.45, tune: 1 },
                    { pipeMs: 4.5, pan: 0.45, tune: 1.02 }
                ],
                pipeReflection: -0.44,
                pipeDamping: 0.26,
                formants: [
                    { hz: 115, q: 1.0, gain: 0.85 },
                    { hz: 650, q: 2.2, gain: 0.6 },
                    { hz: 2100, q: 2.6, gain: 0.5 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 2.8,
                pulseMsRedline: 0.6,
                noise: 0.45,
                jitter: 0.02,
                cylinderTrim: 0.03,
                lope: 0.05,
                mufflerHz: [1100, 8000],
                bodyHz: 88,
                bodyDb: 4,
                intake: 0.14,
                intakeHz: 950,
                whine: 0.02,
                whineRatio: 5.5,
                crackle: 0.85,
                popGain: 0.55,
                drive: 3.0,
                gain: 0.58
            }
        }
    },
    {
        id: 'audi_rs3_turbo',
        name: 'Audi RS3 / Golf R (Turbo)',
        type: '2.5L Turbo Inline-5 (DSG Farts & Popcorn)',
        badge: '7,200 RPM',
        accentColor: '#06B6D4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        cylinders: 5,
        idleRpm: 800,
        redlineRpm: 7200,
        shiftRpm: 7000,
        hasTurbo: true,
        hasSupercharger: false,
        gears: [
            { ratio: 3.56, maxSpeed: 25 },
            { ratio: 2.14, maxSpeed: 48 },
            { ratio: 1.48, maxSpeed: 72 },
            { ratio: 1.11, maxSpeed: 98 },
            { ratio: 0.87, maxSpeed: 128 },
            { ratio: 0.69, maxSpeed: 168 },
            { ratio: 0.57, maxSpeed: 260 }
        ],
        finalDrive: 4.05,
        soundDescription: 'Célebre timbre de 5 cilindros con orden de encendido 1-2-4-5-3, cuerpo contundente a 78Hz, silbido del turbo, blow-off y petardeos de cambio del DSG.',
        engine: {
            idleRpm: 800,
            redlineRpm: 7200,
            limiterRpm: 7300,
            firing: [
                [0, 1, 0], [144, 2, 0], [288, 4, 0], [432, 5, 0], [576, 3, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 5.4, pan: -0.2, tune: 1.0 }
                ],
                pipeReflection: -0.48,
                pipeDamping: 0.3,
                formants: [
                    { hz: 85, q: 1.1, gain: 1.2 },
                    { hz: 420, q: 2.0, gain: 0.7 },
                    { hz: 1650, q: 2.4, gain: 0.45 }
                ],
                formantDry: 0.38,
                pulseMsIdle: 3.8,
                pulseMsRedline: 0.75,
                noise: 0.5,
                jitter: 0.03,
                cylinderTrim: 0.04,
                lope: 0.10,
                mufflerHz: [800, 6500],
                bodyHz: 78,
                bodyDb: 5.5,
                intake: 0.14,
                intakeHz: 780,
                whine: 0.03,
                whineRatio: 4.8,
                crackle: 0.9,
                popGain: 0.55,
                drive: 3.1,
                gain: 0.60
            }
        }
    },
    {
        id: 'city_shifter',
        name: 'Shift Maniac (10-Gear Screamer)',
        type: 'Flat-Six 9,000 RPM (10 marchas cortas · Bestia urbana)',
        badge: '9,000 RPM',
        accentColor: '#14B8A6',
        glowColor: 'rgba(20, 184, 166, 0.45)',
        cylinders: 6,
        idleRpm: 850,
        redlineRpm: 9000,
        shiftRpm: 8000,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 8.94, maxSpeed: 12 },
            { ratio: 3.58, maxSpeed: 30 },
            { ratio: 3.06, maxSpeed: 35 },
            { ratio: 2.68, maxSpeed: 40 },
            { ratio: 2.15, maxSpeed: 50 },
            { ratio: 1.95, maxSpeed: 55 },
            { ratio: 1.79, maxSpeed: 60 },
            { ratio: 1.53, maxSpeed: 70 },
            { ratio: 1.34, maxSpeed: 80 },
            { ratio: 1.16, maxSpeed: 120 }
        ],
        finalDrive: 8.0,
        soundDescription: '¡Grito constante a 9.000 rpm a velocidades urbanas (0-120 km/h) y el máximo disfrute de cambiar de marcha con 10 marchas cortas!',
        engine: {
            idleRpm: 850,
            redlineRpm: 9000,
            limiterRpm: 9000,
            cruiseUpshiftRpm: 6300,
            upshiftRpm: 8000,
            hardCap: true,
            firing: [
                [0, 1, 0], [120, 6, 1], [240, 2, 0], [360, 4, 1], [480, 3, 0], [600, 5, 1]
            ],
            sound: {
                banks: [
                    { pipeMs: 4.6, pan: -0.4, tune: 1 },
                    { pipeMs: 4.8, pan: 0.4, tune: 1.03 }
                ],
                pipeReflection: -0.45,
                pipeDamping: 0.3,
                formants: [
                    { hz: 150, q: 1.0, gain: 0.8 },
                    { hz: 620, q: 2.2, gain: 0.6 },
                    { hz: 1900, q: 2.5, gain: 0.45 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 3.0,
                pulseMsRedline: 0.7,
                noise: 0.5,
                jitter: 0.025,
                cylinderTrim: 0.03,
                lope: 0.06,
                mufflerHz: [1100, 7000],
                bodyHz: 110,
                bodyDb: 2,
                intake: 0.16,
                intakeHz: 900,
                whine: 0.05,
                whineRatio: 4.5,
                crackle: 0.9,
                popGain: 0.5,
                drive: 3.2,
                gain: 0.58
            }
        }
    },
    {
        id: 'cyber_speeder',
        name: 'Cyber Falcon (Sci-Fi EV)',
        type: 'Quantum Ion Hyperdrive (45 Hz Sub-Bass Warp Drive)',
        badge: '14,000 RPM',
        accentColor: '#A855F7',
        glowColor: 'rgba(168, 85, 247, 0.45)',
        cylinders: 4,
        idleRpm: 1200,
        redlineRpm: 14000,
        shiftRpm: 13500,
        hasTurbo: false,
        hasSupercharger: false,
        gears: [
            { ratio: 1.0, maxSpeed: 260 }
        ],
        finalDrive: 1.0,
        soundDescription: 'Graves profundos de warp cuántico a 45Hz, resonancia limpia y sonido de propulsión de iones de alta frecuencia (0-260 km/h).',
        engine: {
            idleRpm: 1200,
            redlineRpm: 14000,
            limiterRpm: 14200,
            firing: [
                [0, 1, 0], [180, 2, 0], [360, 3, 0], [540, 4, 0]
            ],
            sound: {
                banks: [
                    { pipeMs: 3.2, pan: 0.0, tune: 1.0 }
                ],
                pipeReflection: -0.3,
                pipeDamping: 0.2,
                formants: [
                    { hz: 45, q: 1.4, gain: 1.4 },
                    { hz: 320, q: 2.0, gain: 0.6 },
                    { hz: 2800, q: 3.0, gain: 0.4 }
                ],
                formantDry: 0.4,
                pulseMsIdle: 2.5,
                pulseMsRedline: 0.4,
                noise: 0.2,
                jitter: 0.01,
                cylinderTrim: 0.01,
                lope: 0.0,
                mufflerHz: [1500, 9500],
                bodyHz: 45,
                bodyDb: 9,
                intake: 0.05,
                intakeHz: 1200,
                whine: 0.08,
                whineRatio: 3.0,
                crackle: 0.2,
                popGain: 0.3,
                drive: 2.5,
                gain: 0.55
            }
        }
    }
];

window.VEHICLE_PROFILES = VEHICLE_PROFILES;
