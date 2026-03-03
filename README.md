# 🏋️ Physio 3D Training Engine

A browser-based 3D physiotherapy exercise trainer. It displays a rigged 3D human model that performs clinically defined physiotherapy exercises with **smooth animations**, **real-time step-by-step text instructions**, and an **AI voice-over** that narrates how to perform each movement.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🦴 **3D Human Model** | A fully rigged Xbot skeleton that performs real physiotherapy movements |
| 📋 **Exercise Library** | A data-driven system where exercises are defined as sequences of joint angles |
| 🔊 **AI Voice-Over** | Browser-native Text-to-Speech narrates each exercise description on click |
| 📟 **Live Step Display** | Top-left overlay shows the current exercise name and active step |
| 🛑 **Emergency Rest** | One-click button to instantly stop any exercise and return model to neutral pose |
| ⚡ **CPU Optimized** | Runs on any laptop — no GPU or graphics card required |
| 🔄 **Auto Reset** | Model smoothly returns to standing pose before every new exercise |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Three.js](https://threejs.org/) | 3D rendering engine |
| [GSAP](https://greensock.com/gsap/) | Smooth bone animation and timeline sequencing |
| [Vite](https://vitejs.dev/) | Fast development server and bundler |
| Web Speech API | Browser-native voice-over (no API key needed) |
| GLTF / Xbot Model | Rigged 3D human character |

---

## 📁 Project Structure

```
exercise-training-model/
│
├── index.html          # Main HTML — UI panels, canvas, buttons
├── package.json        # Project dependencies
├── vite.config.js      # Vite configuration (if added)
│
└── src/
    ├── main.js         # Core application logic
    │                   #   ├── EXERCISE_LIBRARY  → All exercise definitions
    │                   #   ├── App.loadModel()   → Load and map the 3D skeleton
    │                   #   ├── App.playExercise()→ Animation + voice engine
    │                   #   └── App.setupUI()     → Button wiring + Rest button
    │
    └── style.css       # All UI styling (dark theme, panels, buttons)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** installed. You can download it from [nodejs.org](https://nodejs.org/).

To verify:
```bash
node -v
npm -v
```

---

### 1. Install Dependencies

Open a terminal inside the project folder and run:

```bash
npm install
```

This will install Three.js, GSAP, Vite, and all other packages listed in `package.json`.

---

### 2. Start the Development Server

```bash
npm run dev
```

The terminal will show a local URL, usually:

```
http://localhost:5173
```

Open this URL in your browser (preferably **Google Chrome** for best Speech API support).

---

### 3. Using the Application

1. **Wait** for the "LOADING SKELETON..." screen to disappear.
2. The **Exercise Library** panel will appear on the **left side**.
3. **Click any exercise button** to:
   - See the 3D model reset to a neutral standing pose.
   - Watch the model perform the physiotherapy movement step-by-step.
   - Hear the AI voice read out the exercise description.
   - See the current step name update in the **top-left instruction panel**.
4. Click **"GO TO REST"** (bottom-right red button) at any time to:
   - Immediately stop the current exercise.
   - Silence the voice-over.
   - Return the model to its neutral stance.

---

## ➕ How to Add a New Exercise

All exercises are defined in the `EXERCISE_LIBRARY` object at the top of `src/main.js`.

### Exercise Format

```javascript
'Exercise Name Here': {
  info: 'Spoken description of the exercise. This is read aloud by the AI voice.',
  steps: [
    {
      name: 'Step Name (shown in the UI)',
      boneName: { x: 0, y: 0, z: 0 },  // Rotation in radians
      duration: 2                         // Duration of this step in seconds
    },
    // Add more steps...
  ]
}
```

### Available Bone Names

| Bone Key | Body Part |
|---|---|
| `hips` | Root / Pelvis |
| `spine` | Lower back |
| `spine1` | Mid back |
| `neck` | Neck |
| `head` | Head |
| `leftArm` | Left upper arm |
| `leftForeArm` | Left forearm |
| `rightArm` | Right upper arm |
| `rightForeArm` | Right forearm |
| `leftUpLeg` | Left thigh |
| `leftLeg` | Left lower leg |
| `rightUpLeg` | Right thigh |
| `rightLeg` | Right lower leg |

### Position Override (for lying / sitting on floor)

To move the model's entire body to the floor, use the `pos` key inside a bone definition:

```javascript
hips: {
  rot: { x: -1.57, y: 0 },   // Rotation (in radians)
  pos: { y: 0.1, z: 0.5 }    // World position override
}
```

### Example: Adding a "Neck Side Stretch"

```javascript
'Neck Side Stretch': {
  info: 'Gently tilt your head to the right, bringing your ear toward your shoulder. Hold and return.',
  steps: [
    { name: 'Neutral Head Position', neck: { z: 0 }, duration: 1 },
    { name: 'Tilt Right',            neck: { z: -0.5 }, duration: 2 },
    { name: 'Hold',                  duration: 3 },
    { name: 'Return to Center',      neck: { z: 0 }, duration: 2 }
  ]
}
```

After adding it, **save the file** — Vite auto-reloads the browser and the new exercise button will appear instantly.

---

## 🔧 Build for Production

To create an optimized production bundle:

```bash
npm run build
```

Output will be in the `dist/` folder. You can then deploy it to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

To preview the production build locally:

```bash
npm run preview
```

---

## ⚡ CPU Optimization Notes

This project is specifically designed to run on **CPU-only laptops** (no dedicated GPU needed):

- **No shadow maps**: Shadow rendering is disabled.
- **No antialiasing**: Disabled to reduce GPU/CPU overhead.
- **Standard pixel ratio**: Forces 1x resolution to reduce rendering workload.
- **Simple lighting**: Only ambient + single directional light.
- **GSAP-driven animations**: Bone animations are handled by GSAP (not heavy physics).

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| Model doesn't load | Check your internet connection — the Xbot model loads from `threejs.org` |
| No voice audio | Make sure your browser is **Google Chrome** and volume is on |
| Buttons do nothing | Refresh the page and wait for the full skeleton to load |
| Model starts exercise without resetting | Click "GO TO REST" first, then select the new exercise |
| Black screen on start | Check the browser console (F12) for any error messages |

---

## 📄 License

This project is for educational and physiotherapy training purposes. The 3D character model (Xbot) is sourced from [Three.js examples](https://threejs.org/examples/models/gltf/Xbot.glb).
