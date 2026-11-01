# 🏎️ TeslaSound - Cockpit Virtual de Sonido de Motor (EV Engine Sound Cockpit)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Procedural%20Synthesis-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Tesla Browser](https://img.shields.io/badge/Tesla%20In--Car%20Browser-Compatible-red.svg)](https://www.tesla.com)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://teslasound.pages.dev/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-teslasound.pages.dev-success.svg)](https://teslasound.pages.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-blue.svg)](https://teslasound.pages.dev/)
[![AI-Assisted](https://img.shields.io/badge/Developed%20with-AI%20Pair%20Programming-8A2BE2.svg)](#)

**TeslaSound** es un **cockpit virtual de sonido de motor** en tiempo real, sensible al GPS y a la aceleración, desarrollado para todos los vehículos eléctricos (EV), empezando por **Tesla**.

Funciona sin ningún hardware externo ni adaptador OBD, en el navegador integrado del vehículo (Tesla Browser) o en un smartphone/tablet. Analizando la velocidad GPS y la aceleración (fuerza G) del vehículo en tiempo real, genera con latencia cero el sonido de motores de combustión puros (V8, V10, V12, Boxer Flat-6, 5 cilindros turbo y el legendario Tofaş SLX / Şahin Varex) mediante el **motor de síntesis procedural de audio de la Web Audio API**.

---

## 🌐 Demo en vivo (EV Cockpit)

Puedes probar la aplicación directamente desde tu navegador o desde la pantalla de tu Tesla/EV:  
👉 **[https://teslasound.pages.dev/](https://teslasound.pages.dev/)**

---

## ✨ Características destacadas

- 🔊 **Síntesis de sonido procedural (Web Audio API):**
  - En lugar de grabaciones prefabricadas o bucles de MP3 repetitivos, utiliza osciladores en tiempo real, modulación armónica de frecuencia, moldeadores de onda (waveshapers) y filtros de resonancia de escape.
  - Los cambios de régimen, la respuesta del acelerador, los petardeos de escape (pops & bangs), el silbido del turbo, el sonido de la válvula blow-off y el cortador de encendido (tatatata) se sintetizan de forma totalmente dinámica.

- ⚡ **Motor de física predictiva a 60 FPS:**
  - Procesa en tiempo real la velocidad GPS y los datos de aceleración (m/s²).
  - Ofrece relaciones de marcha realistas, caídas/subidas de régimen, kickdown (reducción de marcha con acelerón repentino) y física del cortador en la línea roja.
  - Cambios de marcha agresivos en aceleraciones urbanas/intermedias de 0 a 130 km/h y marchas overdrive en autopista por encima de 130 km/h, con una subida ininterrumpida hasta más de 280 km/h.

- 🚗 **Control con el volante de Tesla (Paddle Shift):**
  - Durante la conducción en la pantalla de Tesla, al deslizar hacia arriba la rueda de desplazamiento izquierda del volante (scroll wheel) se sube de marcha, y al deslizarla hacia abajo se reduce.

- 🚨 **Barra LED Shift Lights estilo F1 / GT3:**
  - Indicador de régimen al estilo de los coches de carreras, sobre el volante (Verde ➡️ Amarillo ➡️ Rojo ➡️ Destellos intermitentes).

- 💥 **Modo de válvula de escape de 3 niveles:**
  - **Estándar:** Escape de fábrica, silencioso y de uso diario.
  - **Sport:** Válvulas abiertas, rugido contundente y respuesta intermedia del acelerador.
  - **Tubo recto / Varex:** Máximos decibelios, petardeos de escape en serie (backfire / pops & bangs) al soltar el acelerador y cortador a fondo.

- 🖥️ **Modo en casa / banco de pruebas (Test Bench):**
  - Modo de conducción manual para poder probarlo sin subirte al coche.
  - Simulación completa con los pedales de Acelerador / Freno en pantalla o con las teclas <kbd>W</kbd> (Acelerador) y <kbd>S</kbd> (Freno) del teclado.

- 🚀 **Cero dependencias e inicio rápido:**
  - No requiere paquetes de Node, pasos de compilación ni instalaciones complejas. HTML5, CSS3 y JavaScript puro (Vanilla).

- 📱 **PWA completa y soporte sin conexión (offline):**
  - Arquitectura de Service Worker y Web App Manifest con protección frente a redirecciones de Safari WebKit.
  - En iPhone o Android se puede ejecutar como aplicación independiente a pantalla completa mediante *"Añadir a pantalla de inicio"*; en túneles y cortes de internet, el motor de sonido sigue funcionando con latencia cero.

---

## 🏎️ Perfiles de vehículo y de sonido del motor

| Vehículo / Motor | Tipo y características | Régimen máx. | Detalle del carácter del sonido |
| :--- | :--- | :--- | :--- |
| **Tofaş Doğan SLX 1.6** | 1.6L 8V SOHC (escape Abart / tubo recto) | 6.800 RPM | El legendario motor del Tempra, rugido en 2.ª marcha, petardeos traqueteantes del escape. |
| **Tofaş Şahin S (Varex)** | 1.6L con carburador (Varex abierto y cortador) | 7.000 RPM | Desgarro de tubo recto con Varex abierto, cortador a fondo (tatatata) y petardeos. |
| **BMW M3 E46 (S54)** | 3.2L atmosférico de 6 cilindros en línea (rasp metálico CSL) | 8.200 RPM | El legendario zumbido metálico de escape del S54 ("CSL rasp"), el grito a 8.200 rpm y los petardeos de cambio del SMG. |
| **Shelby Mustang GT500** | 5.2L V8 Crossplane con supercharger | 7.500 RPM | Rugido contundente de V8 americano y silbido agresivo del compresor (supercharger) a altas revoluciones. |
| **Mercedes-Benz C63 AMG** | 6.2L V8 atmosférico (M156, bestia pura) | 7.400 RPM | El trueno del legendario V8 atmosférico M156 de 6.2L, un rugido alemán denso y musculoso, y petardeos intermedios del Speedshift. |
| **Nissan Skyline GT-R R34** | 2.6L Twin-Turbo de 6 cilindros en línea (RB26DETT Godzilla) | 8.200 RPM | El sonido legendario JDM del RB26 twin-turbo, desgarro de tubo recto, silbido de doble turbo y llamaradas de Godzilla. |
| **Subaru Impreza WRX STI** | 2.5L Turbo Boxer-4 (colectores UEL, rumble Boxer) | 7.500 RPM | Famoso por su colector de escape UEL (longitudes desiguales), leyenda del WRC: profundo rumor bóxer de Subaru y "pufff" del turbo. |
| **Porsche 911 GT3 RS** | 4.0L Flat-6 atmosférico | 9.000 RPM | Rugido bóxer atmosférico puro y grito de competición a 9.000 rpm. |
| **Lamborghini Huracán** | 5.2L V10 de aspiración natural | 8.500 RPM | Grito feroz de V10 italiano, duros petardeos de cambio del DCT. |
| **Ferrari 812 Superfast** | 6.5L V12 de aspiración natural | 8.900 RPM | Pura sinfonía de F1, armónicos a altas revoluciones y cambios de marcha impecables. |
| **Audi RS3 / Golf R** | 2.5L Turbo de 5 cilindros en línea / TSI | 7.200 RPM | Rugido denso de 5 cilindros, silbido del turbo que se llena al instante, blow-off (psshhh) y chasquidos del DSG. |
| **Cyber Falcon (Sci-Fi)** | Hiperpropulsor de iones cuánticos | 14.000 RPM | Vibración warp de baja frecuencia y sonido futurista de propulsión EV de ciencia ficción. |

---

## 🎮 Controles y guía de uso

### Uso en el vehículo (Tesla / EV):
1. Abre el proyecto desde el navegador de la pantalla de tu vehículo (o desde tu teléfono).
2. Conéctate al sistema de sonido del vehículo por Bluetooth.
3. Pulsa el botón rojo **"START ENGINE"** (o toca la tecla <kbd>Space</kbd>).
4. Con un realista motor de arranque y el primer acelerón, el motor se estabiliza al ralentí.
5. Pasa a pantalla completa y permite el acceso del navegador al **GPS (Ubicación)**.
6. Cuando pises el acelerador y aceleres, ¡el sonido se moldeará automáticamente según la carga del motor y las relaciones de régimen!

### Banco de pruebas / Atajos de teclado (Escritorio):
- **Botón START / STOP** o <kbd>Space</kbd> : Arrancar / Parar el motor (Arranque y apagado del contacto)
- <kbd>W</kbd> o <kbd>↑</kbd> : Acelerador (Aceleración / Throttle)
- <kbd>S</kbd> o <kbd>↓</kbd> : Freno (Deceleración / Brake)
- <kbd>E</kbd> / <kbd>Q</kbd> : Subir / Reducir marcha
- <kbd>M</kbd> : Activar / Desactivar el sonido (Mute)
- **Rueda del ratón (Scroll):** Subir / reducir marcha en modo manual
- **Control deslizante de velocidad:** Salto directo a la velocidad deseada

---

## 🛠️ Ejecución en local

Puedes ejecutarlo directamente sin instalar ninguna dependencia:

### Opción 1: Con Python
```bash
# En el directorio del proyecto:
python -m http.server 3000
```
Ábrelo en tu navegador: `http://localhost:3000`

### Opción 2: Con Node.js / npx
```bash
npx serve . -p 3000
```

### Opción 3: Directamente en el navegador
Puedes abrir el archivo `index.html` haciendo doble clic en un navegador moderno (para las funciones de GPS se recomienda un servidor HTTP local o HTTPS).

---

## 📁 Arquitectura del proyecto

```text
TeslaSound/
├── index.html         # Interfaz del cockpit, indicadores, barra LED y modales
├── styles.css         # Tema oscuro moderno glassmorphic (cristal) y diseño adaptable
├── audio-engine.js    # Motor de síntesis procedural de sonido basado en la Web Audio API
├── physics.js         # Dinámica del vehículo a 60 FPS, procesamiento de GPS, simulación de marchas y régimen
├── vehicles.js        # Perfiles de vehículos, relaciones de transmisión y configuraciones acústicas armónicas
└── app.js             # Gestión de eventos de la UI, dibujo de telemetría y gestión de estado
```

---

## 🤖 Proceso de desarrollo (AI-Assisted Engineering)

Los algoritmos de síntesis de sonido DSP de Web Audio, las frecuencias armónicas del motor, el modelado de filtros acústicos y la física de la dinámica del vehículo predictiva a 60 FPS de este proyecto se diseñaron desde cero y se optimizaron con una arquitectura de **programación en pareja asistida por inteligencia artificial (AI Pair Programming)**.

---

## 📄 Licencia

Este proyecto está licenciado como código abierto bajo la [Licencia MIT](LICENSE).
