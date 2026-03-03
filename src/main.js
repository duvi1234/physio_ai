import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import gsap from 'gsap';
import './style.css';

// --- Exercise Library: Physio Movements ---
const EXERCISE_LIBRARY = {
  '360° Turn Test': {
    info: 'Stand upright with feet shoulder-width apart. Slowly turn around in a full 360 degree circle while maintaining balance. Repeat the turn in the opposite direction without losing stability.',
    steps: [
      { name: 'Upright Start', hips: { rot: { y: 0 } }, duration: 1 },
      { name: 'Slow Turn Clockwise', hips: { rot: { y: Math.PI * 2 } }, duration: 4 },
      { name: 'Pause & Stabilize', duration: 1 },
      { name: 'Turn Counter-Clockwise', hips: { rot: { y: 0 } }, duration: 4 },
      { name: 'Stable Finish', duration: 1 }
    ]
  },
  'Active Assisted Knee Flexion': {
    info: 'Lie face down on a bed or mat with legs straight. Bend the affected knee by bringing the heel toward the buttocks. Hold briefly and slowly return the leg to the starting position.',
    steps: [
      { name: 'Step 1: Turn 180°', hips: { rot: { y: Math.PI } }, duration: 1.5 },
      {
        name: 'Step 2: Lie Down Prone',
        hips: { rot: { x: -Math.PI / 2, y: Math.PI }, pos: { y: 0.1, z: -0.8 } },
        neck: { y: 1.0 },
        duration: 2.5
      },
      { name: 'Step 3: Lift Leg (Bending Knee)', leftLeg: { x: 1.8 }, duration: 3 },
      { name: 'Hold Stretch', duration: 2 },
      { name: 'Lower Leg Slowly', leftLeg: { x: 0 }, duration: 3 },
      { name: 'Return to Standing', hips: { rot: { x: 0, y: 0 }, pos: { z: 0 } }, neck: { y: 0 }, duration: 2 }
    ]
  },
  'Active Isometric Quads': {
    info: 'Sit with the leg straight on the floor. Tighten the thigh quadriceps muscle by pressing the back of the knee downward. Hold the contraction for 5 seconds and then relax.',
    steps: [
      {
        name: 'Step 1: Sit on Floor (Legs Forward)',
        hips: { rot: { x: 0 }, pos: { y: 0.1, z: 0.8 } },
        spine: { x: 0.2 },
        leftUpLeg: { x: -1.55 },
        rightUpLeg: { x: -1.55 },
        leftLeg: { x: 0 },
        rightLeg: { x: 0 },
        duration: 2
      },
      { name: 'Step 2: Press Knee Down (Tighten Quads)', leftLeg: { x: 0.05 }, duration: 1.5 },
      { name: 'Step 3: Hold Contraction (5s)', duration: 5 },
      { name: 'Step 4: Relax Leg', leftLeg: { x: 0 }, duration: 1 },
      {
        name: 'Return to Standing',
        hips: { rot: { x: 0 }, pos: { z: 0 } },
        spine: { x: 0 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 2
      }
    ]
  },
  'Alt Arm & Leg Extension': {
    info: 'Lie face down on the floor. Extend your left arm forward and your right leg backward at the same time. Hold, return, then repeat with the right arm and left leg.',
    steps: [
      { name: 'Step 1: Turn 180°', modelRot: Math.PI, duration: 1.5 },
      {
        name: 'Step 2: Lie Face Down',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 0.1, z: -0.8 } },
        leftShoulder: { x: 0, z: 0 }, rightShoulder: { x: 0, z: 0 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        duration: 2.5
      },
      {
        name: 'Step 3: Extend Left Arm & Right Leg',
        spine: { x: -0.3 }, // Arch back to lift chest
        leftShoulder: { x: -2.0, y: 0, z: 0 }, // Lift arm higher UP
        rightUpLeg: { x: 1.2 }, // Lift leg higher UP
        duration: 2.5
      },
      { name: 'Hold', duration: 2 },
      {
        name: 'Step 4: Return to Prone Neutral',
        spine: { x: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 },
        rightUpLeg: { x: 0 },
        duration: 1.5
      },
      {
        name: 'Step 5: Extend Right Arm & Left Leg',
        spine: { x: -0.3 }, // Arch back to lift chest
        rightShoulder: { x: -2.0, y: 0, z: 0 }, // Lift arm higher UP
        leftUpLeg: { x: 1.2 }, // Lift leg higher UP
        duration: 2.5
      },
      { name: 'Hold', duration: 2 },
      {
        name: 'Step 6: Return to Prone Neutral',
        spine: { x: 0 },
        rightShoulder: { x: 0, y: 0, z: 0 },
        leftUpLeg: { x: 0 },
        duration: 1.5
      }
    ]
  },
  'Ankle Dorsiflexion Stretch': {
    info: 'Position yourself in a half-kneeling stance. Your front foot stays flat as you glide your knee toward the wall boundary to test and improve ankle mobility.',
    steps: [
      {
        name: 'Step 1: Half-Kneeling Stance',
        modelRot: Math.PI / 2,
        // Force neutral upright torso
        hips: { rot: { x: 0, y: 0, z: 0 }, pos: { x: 0, y: 0.52, z: 0 } },
        spine: { x: 0, y: 0, z: 0 }, spine1: { x: 0, y: 0, z: 0 },
        neck: { x: 0, y: 0, z: 0 }, head: { x: 0, y: 0, z: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 }, rightShoulder: { x: 0, y: 0, z: 0 },

        // Front Leg (Standing Foot)
        leftUpLeg: { x: -1.2, y: 0, z: 0.1 },
        leftLeg: { x: 1.2, y: 0, z: 0 },
        leftFoot: { x: 0, y: 0, z: 0 },

        // Back Leg (Kneeling Knee on floor)
        rightUpLeg: { x: 0.2, y: 0, z: -0.1 },
        rightLeg: { x: 1.57, y: 0, z: 0 },
        rightFoot: { x: 0, y: 0, z: 0 },

        camPos: { x: -1.8, y: 0.6, z: 2.2 }, camTarget: { x: 0, y: 0.3, z: 0 },
        duration: 2.5
      },
      {
        name: 'Step 2: Glide Knee Forward',
        hips: { pos: { x: -0.15, y: 0.48, z: 0 } },
        leftLeg: { x: 1.8 }, // Forward knee bend
        leftFoot: { x: -0.5 }, // Ankle stretches forward
        duration: 3
      },
      { name: 'Hold & Measure Range', duration: 4 }
    ]
  },
  'Ankle Pumps (Lying)': {
    info: 'Lie on your back with legs extended. Move your feet up toward your shins and then point your toes away in a continuous cycle.',
    steps: [
      {
        name: 'Step 1: Lie on Back', modelRot: 0,
        hips: { rot: { x: Math.PI / 2 }, pos: { y: 0.1, z: -0.8 } },
        camPos: { x: 1.5, y: 0.8, z: 2.5 }, camTarget: { x: 0, y: 0, z: -0.8 },
        duration: 2.5
      },
      { name: 'Step 2: Toes Up', leftFoot: { x: -0.6 }, rightFoot: { x: -0.6 }, duration: 1.5 },
      { name: 'Step 3: Toes Down', leftFoot: { x: 0.8 }, rightFoot: { x: 0.8 }, duration: 1.5 },
      { name: 'Repeat Cycle', leftFoot: { x: -0.6 }, rightFoot: { x: -0.6 }, duration: 1.5 },
      { name: 'Toes Down', leftFoot: { x: 0.8 }, rightFoot: { x: 0.8 }, duration: 1.5 }
    ]
  },
  'Back Extension': {
    info: 'Lie face down. Slowly lift your upper torso by extending your spine mientras las caderas permanecen en el suelo.',
    steps: [
      {
        name: 'Step 1: Turn & Lie Down', modelRot: Math.PI,
        hips: { rot: { x: Math.PI / 2 }, pos: { y: 0.1, z: 0.8 } },
        duration: 2
      },
      {
        name: 'Step 2: Lift Torso',
        spine: { x: -0.7 }, spine1: { x: -0.7 }, neck: { x: -0.3 },
        camPos: { x: -1.5, y: 0.8, z: 1.5 }, camTarget: { x: 0, y: 0.4, z: 0.8 },
        duration: 3
      },
      { name: 'Hold & Strength', duration: 2 },
      {
        name: 'Step 3: Return to Floor',
        spine: { x: 0 }, spine1: { x: 0 }, neck: { x: 0 },
        duration: 2
      }
    ]
  },
  'Back Stepping': {
    info: 'From a standing position, move one leg backward while keeping the other leg forward. Shift your weight slightly and return to center.',
    steps: [
      {
        name: 'Step 1: Step Back Left',
        leftUpLeg: { x: 0.6 }, leftLeg: { x: 0.4 },
        duration: 2
      },
      {
        name: 'Step 2: Return Center',
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 1.5
      },
      {
        name: 'Step 3: Step Back Right',
        rightUpLeg: { x: 0.6 }, rightLeg: { x: 0.4 },
        duration: 2
      },
      {
        name: 'Step 4: Return Center',
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 1.5
      }
    ]
  },
  'Back Walking': {
    info: 'Walk backward slowly, alternating legs. Keep your hands relaxed at your sides to maintain a steady posture.',
    steps: [
      {
        name: 'Step 1: Left Leg Back',
        modelRot: Math.PI,
        hips: { pos: { x: 0.05 } },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.2 }, leftFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step 2: Right Leg Back',
        hips: { pos: { x: -0.05 } },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 }, leftFoot: { x: 0 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.2 }, rightFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step 3: Left Leg Back',
        hips: { pos: { x: 0.05 } },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 }, rightFoot: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.2 }, leftFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step 4: Right Leg Back',
        hips: { pos: { x: -0.05 } },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 }, leftFoot: { x: 0 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.2 }, rightFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step 5: Left Leg Back',
        hips: { pos: { x: 0.05 } },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 }, rightFoot: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.2 }, leftFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step 6: Right Leg Back',
        hips: { pos: { x: -0.05 } },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 }, leftFoot: { x: 0 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.2 }, rightFoot: { x: -0.3 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 1.8
      }
    ]
  },
  'Backward Lunge': {
    info: 'Step one leg backward and lower your body until both knees reach a 90-degree angle. Keep your chest upright and Return to the start.',
    steps: [
      {
        name: 'Step 1: Left Leg Back',
        modelRot: Math.PI / 2, // Side view to see angles
        hips: { rot: { x: 0, y: 0, z: 0 }, pos: { x: 0, z: 0 } },
        spine: { x: 0 }, leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        // Front (Right)
        rightUpLeg: { x: 0.8 }, rightLeg: { x: 1.0 },
        // Back (Left)
        leftUpLeg: { x: -1.2 }, leftLeg: { x: 1.6 },
        camPos: { x: 2.2, y: 1.0, z: 2.2 }, camTarget: { x: 0, y: 0.4, z: 0 },
        duration: 2.5
      },
      {
        name: 'Step 2: Return Center',
        hips: { pos: { z: 0 } },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 1.5
      },
      {
        name: 'Step 3: Right Leg Back',
        hips: { pos: { y: 65 } },
        // Front (Left)
        leftUpLeg: { x: 0.8 }, leftLeg: { x: 1.0 },
        // Back (Right)
        rightUpLeg: { x: -1.2 }, rightLeg: { x: 1.6 },
        duration: 2.5
      },
      {
        name: 'Step 4: Return Center',
        hips: { pos: { z: 0 } },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 1.5
      }
    ]
  },
  'Backward Walking (Eyes Open)': {
    info: 'Maintain a straight posture and look forward. Take slow, deliberate steps backward while keeping your hands at your sides.',
    steps: [
      {
        name: 'Left Step Back (Slow)',
        modelRot: Math.PI, head: { x: 0, y: 0, z: 0 },
        hips: { pos: { x: 0.03 } },
        leftUpLeg: { x: -0.4 }, leftLeg: { x: 0.1 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 2.5
      },
      {
        name: 'Right Step Back (Slow)',
        hips: { pos: { x: -0.03 } },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: -0.4 }, rightLeg: { x: 0.1 },
        leftShoulder: { x: 0 }, rightShoulder: { x: 0 },
        duration: 2.5
      }
    ]
  },
  'Bicep Chest Stretch': {
    info: 'Stand with one arm back against a wall. Turn your body away from the wall to stretch your chest and arm.',
    steps: [
      {
        name: 'Arm Back',
        modelRot: -Math.PI / 4,
        rightShoulder: { y: -1.57, z: 0.2 },
        spine: { y: 0.5 },
        camPos: { x: 1.5, y: 1.4, z: 2.5 }, camTarget: { x: 0, y: 1.2, z: 0 },
        duration: 2.5
      },
      { name: 'Deepen Stretch', spine: { y: 0.8 }, duration: 3 }
    ]
  },

  'Seated Bilateral Trunk Rotation Stretch': {
    info: 'Rotate your upper torso slowly to one side while keeping your hips facing forward.',
    steps: [
      {
        name: 'Rotate Left',
        spine: { y: 0.6 }, spine1: { y: 0.4 }, neck: { y: 0.3 },
        duration: 2.5
      },
      { name: 'Center', spine: { y: 0 }, spine1: { y: 0 }, neck: { y: 0 }, duration: 1.5 },
      {
        name: 'Rotate Right',
        spine: { y: -0.6 }, spine1: { y: -0.4 }, neck: { y: -0.3 },
        duration: 2.5
      },
      { name: 'Center', spine: { y: 0 }, spine1: { y: 0 }, duration: 1.5 }
    ]
  },
  'Bird Dog': {
    info: 'From a hands-and-knees position, extend one arm forward and the opposite leg backward parallel to the ground.',
    steps: [
      {
        name: 'Tabletop Setup',
        modelRot: Math.PI / 2,
        hips: { rot: { x: Math.PI / 2 }, pos: { y: 0.75 } },
        spine: { x: 0 },
        leftArm: { x: 1.57, y: 0, z: 0 }, rightArm: { x: 1.57, y: 0, z: 0 },
        leftUpLeg: { x: -1.57, y: 0, z: 0.1 }, rightUpLeg: { x: -1.57, y: 0, z: -0.1 },
        leftLeg: { x: 1.57 }, rightLeg: { x: 1.57 },
        camPos: { x: 3.5, y: 1.5, z: 3.5 }, camTarget: { x: 0, y: 0.5, z: 0 },
        duration: 2.5
      },
      {
        name: 'Extend L-Arm & R-Leg',
        leftArm: { x: 0, y: 0, z: 0 }, // Reach FRONT (Flat palm)
        rightUpLeg: { x: 0, y: 0, z: -0.1 }, // Reach BACK
        rightLeg: { x: 0 },
        duration: 2.5
      },
      { name: 'Hold Balance', duration: 2 },
      {
        name: 'Return to Tabletop',
        leftArm: { x: 1.57, z: 0 },
        rightUpLeg: { x: -1.57, z: -0.1 },
        rightLeg: { x: 1.57 },
        duration: 1.5
      },
      {
        name: 'Extend R-Arm & L-Leg',
        rightArm: { x: 0, y: 0, z: 0 }, // Reach FRONT (Flat palm)
        leftUpLeg: { x: 0, y: 0, z: 0.1 },
        leftLeg: { x: 0 },
        duration: 2.5
      },
      { name: 'Hold Balance', duration: 2 }
    ]
  },
  'Bow and Arrow': {
    info: 'Draw one arm back like pulling a bowstring while the other arm stays extended in front.',
    steps: [
      {
        name: 'Start Position',
        modelRot: 0,
        spine: { y: 0 }, spine1: { y: 0 },

        // Arms straight forward (x: 1.57) at chest level
        leftArm: { x: 1.57, y: 0, z: 1.4 },
        rightArm: { x: 1.57, y: 0, z: -1.4 },

        leftForeArm: { x: 0 },
        rightForeArm: { x: 0 },

        camPos: { x: 2.5, y: 1.5, z: 3.5 },
        camTarget: { x: 0, y: 1.2, z: 0 },
        duration: 2,
        band: true
      },

      {
        name: 'Draw Left',
        spine: { y: 0.5 },
        spine1: { y: 0.3 },

        // Path: Backhand (Left) retracts, Forehand (Right) stays pointing front
        leftArm: { x: 1.57, y: 0.8, z: 1.2 },
        leftForeArm: { x: 2.2 },

        rightArm: { x: 1.57, y: -0.5, z: -1.4 },
        rightForeArm: { x: 0 },

        duration: 2.5
      },

      {
        name: 'Return Center',
        spine: { y: 0 },
        spine1: { y: 0 },

        leftArm: { x: 1.57, y: 0, z: 1.4 },
        leftForeArm: { x: 0 },

        rightArm: { x: 1.57, y: 0, z: -1.4 },
        rightForeArm: { x: 0 },

        duration: 2
      },

      {
        name: 'Draw Right',
        spine: { y: -0.5 },
        spine1: { y: -0.3 },

        // Path: Backhand (Right) retracts, Forehand (Left) stays pointing front
        rightArm: { x: 1.57, y: -0.8, z: -1.2 },
        rightForeArm: { x: 2.2 },

        leftArm: { x: 1.57, y: 0.5, z: 1.4 },
        leftForeArm: { x: 0 },

        duration: 2.5
      },

      {
        name: 'Return Center',
        spine: { y: 0 },
        spine1: { y: 0 },

        rightArm: { x: 1.57, y: 0, z: -1.4 },
        rightForeArm: { x: 0 },

        leftArm: { x: 1.57, y: 0, z: 1.4 },
        leftForeArm: { x: 0 },

        duration: 2
      }
    ]
  },

  'Brandt–Daroff Exercise': {
    info: 'Specifically for vestibular rehab. Lie down onto your side quickly with your head angled toward the ceiling, then return to sit.',
    steps: [
      {
        name: 'Sit Upright',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 }, pos: { y: 0.55, z: 0 } },
        spine: { x: 0, z: 0 }, neck: { y: 0, z: 0 },
        leftArm: { z: -1.3 }, rightArm: { z: 1.3 },
        leftUpLeg: { x: -1.57 }, rightUpLeg: { x: -1.57 },
        leftLeg: { x: 1.57 }, rightLeg: { x: 1.57 },
        camPos: { x: 2.5, y: 1.2, z: 3.5 }, camTarget: { x: 0, y: 0.8, z: 0 },
        duration: 2
      },
      {
        name: 'Lie on Right Side',
        hips: { rot: { z: 1.45 }, pos: { x: -0.4, y: 0.15 } }, // Tilt to right
        leftArm: { x: 0, z: -0.3 }, rightArm: { x: 0, z: 0.3 }, // Hands down like legs
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        neck: { y: -0.8, x: 0.3 }, // Head tilted toward ceiling (looking 45 deg up)
        duration: 1.5
      },
      { name: 'Stabilize (Hold 5s)', duration: 5 },
      {
        name: 'Return Upright (Center)',
        hips: { rot: { z: 0 }, pos: { x: 0, y: 0.55 } },
        leftArm: { z: -1.4 }, rightArm: { z: 1.4 },
        leftUpLeg: { x: -1.57 }, rightUpLeg: { x: -1.57 },
        leftLeg: { x: 1.57 }, rightLeg: { x: 1.57 },
        neck: { y: 0, x: 0 },
        duration: 1.8
      },
      { name: 'Pause', duration: 1.5 },
      {
        name: 'Lie on Left Side',
        hips: { rot: { z: -1.45 }, pos: { x: 0.4, y: 0.15 } }, // Tilt to left
        leftArm: { x: 0, z: -0.3 }, rightArm: { x: 0, z: 0.3 }, // Hands down like legs
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        neck: { y: 0.8, x: 0.3 }, // Head tilted toward ceiling
        duration: 1.5
      },
      { name: 'Stabilize (Hold 5s)', duration: 5 },
      {
        name: 'Return Upright (Center)',
        hips: { rot: { z: 0 }, pos: { x: 0, y: 0.55 } },
        leftArm: { z: -1.4 }, rightArm: { z: 1.4 },
        leftUpLeg: { x: -1.57 }, rightUpLeg: { x: -1.57 },
        leftLeg: { x: 1.57 }, rightLeg: { x: 1.57 },
        neck: { y: 0, x: 0 },
        duration: 1.8
      }
    ]
  },

  'Camel and Cat Stretch': {
    info: 'From an all-fours position, alternate between rounding your back toward the ceiling and arching it toward the floor. Maintain a stable quadruped position like an animal.',
    steps: [
      {
        name: 'Initial Standing Pose',
        modelRot: 0,
        hips: { rot: { x: 0 } },
        leftArm: { x: 0, z: 1.4 }, rightArm: { x: 0, z: -1.4 }, // Hands at sides
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        camPos: { x: 2.2, y: 1.4, z: 3.5 }, camTarget: { x: 0, y: 1.0, z: 0 },
        duration: 2
      },
      {
        name: 'Descending to Floor',
        modelRot: Math.PI / 2,
        hips: { rot: { x: Math.PI / 2 }, pos: { y: 0.75 } },
        leftArm: { x: 0, z: 1.4 }, rightArm: { x: 0, z: -1.4 }, // Hands tucked near legs
        leftUpLeg: { x: -1.57, z: 0.1 }, rightUpLeg: { x: -1.57, z: -0.1 },
        leftLeg: { x: 1.57 }, rightLeg: { x: 1.57 },
        duration: 2
      },
      {
        name: 'Neutral Tabletop',
        spine: { x: 0, y: 0 }, spine1: { x: 0 },
        // Hands move forward, perpendicular to spine but tucked under shoulders
        leftArm: { x: 1.57, z: 1.4 }, rightArm: { x: 1.57, z: -1.4 },
        leftForeArm: { x: 0 }, rightForeArm: { x: 0 },
        camPos: { x: 2.5, y: 1.5, z: 3.0 }, camTarget: { x: 0, y: 0.5, z: 0 },
        duration: 1.5
      },
      {
        name: 'Cat Position (Round UP)',
        spine: { x: 0.8 }, spine1: { x: 0.6 },
        neck: { x: 0 },
        // Tucked vertical hands
        leftArm: { x: 0.77, z: 1.4 }, rightArm: { x: 0.77, z: -1.4 },
        duration: 2.5
      },
      { name: 'Hold Cat Stretch', duration: 1.5 },
      {
        name: 'Camel Position (Arch DOWN)',
        spine: { x: -0.6 }, spine1: { x: -0.4 },
        neck: { x: 0 },
        // Tucked vertical hands
        leftArm: { x: 2.17, z: 1.4 }, rightArm: { x: 2.17, z: -1.4 },
        duration: 3
      },
      { name: 'Hold Camel Stretch', duration: 1.5 },
      {
        name: 'Return to Neutral',
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { x: 1.57, z: 1.4 }, rightArm: { x: 1.57, z: -1.4 },
        neck: { x: 0 },
        duration: 2
      }
    ]
  },

  'Chest Stretch': {
    info: 'Stand tall and open your chest by pulling your arms back and together behind you.',
    steps: [
      {
        name: 'Stand Neutral',
        modelRot: 0,
        hips: { rot: { x: 0 }, pos: { z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { x: 0, z: 1.4 }, rightArm: { x: 0, z: -1.4 },
        camPos: { x: 2.2, y: 1.4, z: 3.5 }, camTarget: { x: 0, y: 1.2, z: 0 },
        duration: 2
      },
      {
        name: 'Expand Chest',
        leftArm: { x: -0.4, y: 0.5, z: 1.3 }, // Pull back & out
        rightArm: { x: -0.4, y: -0.5, z: -1.3 },
        leftShoulder: { y: 0.3 }, rightShoulder: { y: -0.3 }, // Scapular retraction
        spine1: { x: -0.1 }, // Chest opens up
        duration: 3
      },
      { name: 'Hold Stretch (5s)', duration: 5 },
      {
        name: 'Relax',
        leftArm: { x: 0, z: 1.4 }, rightArm: { x: 0, z: -1.4 },
        leftShoulder: { y: 0 }, rightShoulder: { y: 0 },
        spine1: { x: 0 },
        duration: 2
      }
    ]
  },

  'Cobra': {
    info: 'Lying face down, press your hands against the floor to lift your chest while keeping your hips on the ground.',
    steps: [
      {
        name: 'Prone Setup',
        modelRot: Math.PI / 2,
        hips: { rot: { x: Math.PI / 2 }, pos: { y: 0.15 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Hands tucked near shoulders, palms flat on floor
        leftArm: { x: 0.5, z: 1.4 }, rightArm: { x: 0.5, z: -1.4 },
        leftForeArm: { x: 1.0 }, rightForeArm: { x: 1.0 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        camPos: { x: 2.5, y: 1.0, z: 2.5 }, camTarget: { x: 0, y: 0.3, z: 0 },
        duration: 2
      },
      {
        name: 'Lift Upper Torso',
        spine: { x: -0.7 }, spine1: { x: -0.5 }, // Deep extension
        // Push hands down into floor (counter-rotate)
        leftArm: { x: 1.5, z: 1.4 }, rightArm: { x: 1.5, z: -1.4 },
        leftForeArm: { x: 0.5 }, rightForeArm: { x: 0.5 },
        neck: { x: -0.2 }, // Look forward
        duration: 3
      },
      { name: 'Hold Stretch (3s)', duration: 3 },
      {
        name: 'Return to Floor',
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { x: 0.5 }, rightArm: { x: 0.5 },
        leftForeArm: { x: 1.0 }, rightForeArm: { x: 1.0 },
        neck: { x: 0 },
        duration: 3
      }
    ]
  },

  'Corner Stretch': {
    info: 'Stand in a corner with arms raised to shoulder height on the walls, and reach forward into the corner while maintaining a stable posture.',
    steps: [
      {
        name: 'Face Corner Setup',
        modelRot: 0.5,
        hips: { rot: { x: 0 }, pos: { z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Arms reaching forward into the corner walls
        leftArm: { x: 1.4, y: -0.7, z: 1.0 },
        rightArm: { x: 1.4, y: 0.7, z: -1.0 },
        leftForeArm: { x: 0.6 }, rightForeArm: { x: 0.6 },
        camPos: { x: 3.2, y: 1.5, z: 2.0 }, camTarget: { x: 0, y: 1.3, z: 0 },
        duration: 2.5
      },
      {
        name: 'Reach Forward',
        hips: { pos: { x: -0.1, z: -0.2 } }, // Body leans forward into the corner
        spine: { x: 0.2 }, // Slight lean forward for realism
        spine1: { x: 0.1 },
        leftArm: { x: 1.57, y: -0.7, z: 1.0 },
        rightArm: { x: 1.57, y: 0.7, z: -1.0 },
        leftForeArm: { x: 0.6 }, rightForeArm: { x: 0.6 },
        duration: 3
      },
      {
        name: 'Hold Stretch (5s)',
        hips: { pos: { x: -0.1, z: -0.2 } },
        spine: { x: 0.2 },
        spine1: { x: 0.1 },
        leftArm: { x: 1.57, y: -0.7, z: 1.0 },
        rightArm: { x: 1.57, y: 0.7, z: -1.0 },
        leftForeArm: { x: 0.6 }, rightForeArm: { x: 0.6 },
        duration: 5
      },
      {
        name: 'Return to Setup',
        hips: { pos: { x: 0, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { x: 1.4, y: -0.7, z: 1.0 },
        rightArm: { x: 1.4, y: 0.7, z: -1.0 },
        leftForeArm: { x: 0.6 }, rightForeArm: { x: 0.6 },
        duration: 2
      }
    ]
  },

  'Crook Lying Pelvic Tilt': {
    info: 'Lie on your back with knees bent and feet flat. Gently tilt your pelvis to flatten your lower back against the floor by engaging your abdominal muscles.',
    steps: [
      {
        name: 'Supine Setup (Knees Bent)',
        modelRot: Math.PI,
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 0.1, z: 0 } },
        // Arms at sides (Z-rotation brings them down from T-pose)
        leftArm: { z: -1.3, y: 0, x: 0 },
        rightArm: { z: 1.3, y: 0, x: 0 },
        // Crook position: Thighs toward torso (Negative X), Knees bent (Positive X)
        leftUpLeg: { x: -1.1, y: 0, z: 0 },
        rightUpLeg: { x: -1.1, y: 0, z: 0 },
        leftLeg: { x: 1.8, y: 0, z: 0 },
        rightLeg: { x: 1.8, y: 0, z: 0 },
        leftFoot: { x: -0.4, y: 0, z: 0 },
        rightFoot: { x: -0.4, y: 0, z: 0 },
        camPos: { x: 2.2, y: 1.4, z: 2.2 }, camTarget: { x: 0, y: 0.4, z: 0 },
        duration: 3
      },
      {
        name: 'Tilt Pelvis (Flatten Back)',
        // Isolate movement to pelvis: subtle rotation, no translation
        hips: { rot: { x: -1.68 } },
        spine: { x: 0.12 },
        duration: 2.5
      },
      { name: 'Hold Contraction', duration: 2 },
      {
        name: 'Relax to Neutral',
        hips: { rot: { x: -Math.PI / 2 } },
        spine: { x: 0 },
        duration: 2
      }
    ]
  },
  'Diagonal Stepping To The Back': {
    info: 'Stand upright with feet hip-width apart. Step one leg diagonally backward at a 45° angle while keeping your torso upright. Shift your weight slightly onto the back leg, then return to the starting position.',
    steps: [
      {
        name: 'Neutral Start',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        leftUpLeg: { x: 0, y: 0, z: 0 }, rightUpLeg: { x: 0, y: 0, z: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 2
      },
      {
        name: 'Step Right Diagonal Back',
        // Corrected to Positive X for BACKWARD movement in this model
        rightUpLeg: { x: 0.7, y: 0, z: -0.2 },
        rightLeg: { x: 0.35 },
        hips: { pos: { x: 0.04, z: -0.15 } },
        duration: 2.5
      },
      { name: 'Hold & Weight Shift', duration: 2 },
      {
        name: 'Return to Center',
        rightUpLeg: { x: 0, z: 0 },
        rightLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      },
      {
        name: 'Step Left Diagonal Back',
        // Corrected to Positive X for BACKWARD movement
        leftUpLeg: { x: 0.7, y: 0, z: 0.2 },
        leftLeg: { x: 0.35 },
        hips: { pos: { x: -0.04, z: -0.15 } },
        duration: 2.5
      },
      { name: 'Hold & Weight Shift', duration: 2 },
      {
        name: 'Return to Center',
        leftUpLeg: { x: 0, z: 0 },
        leftLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      }
    ]
  },
  'Diagonal Stepping To The Back Both Side': {
    info: 'Stand upright with feet shoulder-width apart. Step diagonally backward with your right leg at a 45° angle, return to center, and then repeat with your left leg. Maintain an upright torso throughout.',
    steps: [
      {
        name: 'Neutral Setup',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        leftUpLeg: { x: 0, y: 0, z: 0 }, rightUpLeg: { x: 0, y: 0, z: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        leftArm: { z: 1.4 }, rightArm: { z: -1.4 }, // Arms relaxed at sides
        duration: 2
      },
      {
        name: 'Right Diagonal Step',
        // Step back (Positive X) and out (Negative Z)
        rightUpLeg: { x: 0.65, y: 0, z: -0.35 },
        rightLeg: { x: 0.3 },
        hips: { pos: { x: 0.04, z: -0.12 } }, // Balanced weight shift
        duration: 2.5
      },
      {
        name: 'Return Center',
        rightUpLeg: { x: 0, z: 0 }, rightLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      },
      {
        name: 'Left Diagonal Step',
        // Step back (Positive X) and out (Positive Z)
        leftUpLeg: { x: 0.65, y: 0, z: 0.35 },
        leftLeg: { x: 0.3 },
        hips: { pos: { x: -0.04, z: -0.12 } },
        duration: 2.5
      },
      {
        name: 'Return Center',
        leftUpLeg: { x: 0, z: 0 }, leftLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      }
    ]
  },
  'Diagonal Stepping To The Front': {
    info: 'Stand upright with arms relaxed. Step one leg diagonally forward at a 45° angle, shifting your weight onto the front leg while keeping your torso straight. Return to the start and repeat.',
    steps: [
      {
        name: 'Neutral Start',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        leftUpLeg: { x: 0, y: 0, z: 0 }, rightUpLeg: { x: 0, y: 0, z: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 2
      },
      {
        name: 'Right Forward Diagonal Step',
        // Step forward (Negative X) and out (Negative Z)
        rightUpLeg: { x: -0.7, y: 0, z: -0.35 },
        rightLeg: { x: 0.4 }, // Knee bend for weight shift support
        hips: { pos: { x: 0.05, z: 0.15 } }, // Forward weight shift
        duration: 2.5
      },
      {
        name: 'Return',
        rightUpLeg: { x: 0, z: 0 }, rightLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      },
      {
        name: 'Left Forward Diagonal Step',
        // Step forward (Negative X) and out (Positive Z)
        leftUpLeg: { x: -0.7, y: 0, z: 0.35 },
        leftLeg: { x: 0.4 },
        hips: { pos: { x: -0.05, z: 0.15 } },
        duration: 2.5
      },
      {
        name: 'Return',
        leftUpLeg: { x: 0, z: 0 }, leftLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      }
    ]
  },
  'Diagonal Stepping To The Front Both Side': {
    info: 'Stand upright with feet hip-width apart. Step diagonally forward with the right leg, return to center, and then step diagonally forward with the left leg. Alternate sides smoothly while maintaining a stable torso.',
    steps: [
      {
        name: 'Neutral Setup',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        leftUpLeg: { x: 0, y: 0, z: 0 }, rightUpLeg: { x: 0, y: 0, z: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 2
      },
      {
        name: 'Right Diagonal Step',
        rightUpLeg: { x: -0.65, y: 0, z: -0.35 },
        rightLeg: { x: 0.35 },
        hips: { pos: { x: 0.04, z: 0.12 } }, // Forward weight shift
        duration: 2.5
      },
      {
        name: 'Return Center',
        rightUpLeg: { x: 0, z: 0 }, rightLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      },
      {
        name: 'Left Diagonal Step',
        leftUpLeg: { x: -0.65, y: 0, z: 0.35 },
        leftLeg: { x: 0.35 },
        hips: { pos: { x: -0.04, z: 0.12 } },
        duration: 2.5
      },
      {
        name: 'Return Center',
        leftUpLeg: { x: 0, z: 0 }, leftLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        duration: 1.5
      }
    ]
  },
  'Diagonal Trunk Rotation': {
    info: 'Stand with feet shoulder-width apart. Rotate your upper torso diagonally to one side while keeping your hips stable. This movement stretches and strengthens the core and spine.',
    steps: [
      {
        name: 'Start Position',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        spine1: { x: 0, y: 0, z: 0 },
        // Arms positioned slightly forward
        leftArm: { x: 0.8, y: 0.2, z: 1.2 },
        rightArm: { x: 0.8, y: -0.2, z: -1.2 },
        leftForeArm: { x: 0.5 },
        rightForeArm: { x: 0.5 },
        duration: 2
      },
      {
        name: 'Rotate Left Diagonal',
        // Rotate spine (twist) and slight lean (diagonal)
        spine: { y: 0.7, x: 0.1 },
        spine1: { y: 0.5, x: 0.1 },
        // Hips stay mostly forward (slight reaction for realism)
        hips: { rot: { y: 0.1 } },
        duration: 3
      },
      {
        name: 'Return to Center',
        spine: { y: 0, x: 0 },
        spine1: { y: 0, x: 0 },
        hips: { rot: { y: 0 } },
        duration: 2
      },
      {
        name: 'Rotate Right Diagonal',
        spine: { y: -0.7, x: 0.1 },
        spine1: { y: -0.5, x: 0.1 },
        hips: { rot: { y: -0.1 } },
        duration: 3
      },
      {
        name: 'Return to Center',
        spine: { y: 0, x: 0 },
        spine1: { y: 0, x: 0 },
        hips: { rot: { y: 0 } },
        duration: 2
      }
    ]
  },
  'Diaphragmatic Breathing': {
    info: 'Lie on your back with knees bent and your right hand on your abdomen. Breathe in deeply through your nose, letting your belly rise while keeping your chest stable. Breathe out slowly through your mouth, feeling your belly fall.',
    steps: [
      {
        name: 'Supine Crook-Lying Setup',
        modelRot: Math.PI,
        // Lie flat, knees bent (Hip height adjusted to 15 to clear torso thickness)
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 15 } },
        leftUpLeg: { x: -1.0, y: 0, z: 0.2 },
        rightUpLeg: { x: -1.0, y: 0, z: -0.2 },
        leftLeg: { x: 1.6 },
        rightLeg: { x: 1.6 },
        // Right hand on abdomen
        rightArm: { x: 0.8, y: -0.5, z: -0.8 },
        rightForeArm: { x: 1.4 },
        // Left arm at side
        leftArm: { z: 1.3 },
        camPos: { x: 3.5, y: 2.2, z: 3.5 }, camTarget: { x: 0, y: 0.2, z: 0 },
        duration: 3
      },
      {
        name: 'Inhale (Belly Rises)',
        // Simulate abdominal rise
        spine: { pos: { y: 0.12 } },
        duration: 2.5
      },
      {
        name: 'Exhale (Belly Falls)',
        spine: { pos: { y: 0.091 } }, // Return to neutral
        duration: 2.5
      },
      {
        name: 'Slow Rhythmic Inhale',
        spine: { pos: { y: 0.12 } },
        duration: 2.5
      },
      {
        name: 'Slow Rhythmic Exhale',
        spine: { pos: { y: 0.091 } },
        duration: 2.5
      }
    ]
  },
  'Dynamic Hamstring Sweep': {
    info: 'Stand tall. Step one foot forward on the heel with toes pointing up. Keep that leg straight as you bend at your hips and sweep your hands down toward your toes in a fluid motion. Return to standing and repeat with the other leg.',
    steps: [
      {
        name: 'Neutral Standing',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 },
        leftArm: { z: 1.3 }, rightArm: { z: -1.3 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftFoot: { x: 0 }, rightFoot: { x: 0 },
        duration: 1.5
      },
      {
        name: 'Right Heel Step & Toe Up',
        rightUpLeg: { x: -0.4 }, // Step forward
        rightFoot: { x: -0.6 },  // Toe UP
        leftUpLeg: { x: 0.1 },   // Slight back shift for balance
        leftLeg: { x: 0.3 },     // Slight knee bend on back leg
        duration: 1.5
      },
      {
        name: 'The Sweep (Downward)',
        spine: { x: 0.9 }, spine1: { x: 0.5 }, // Bend forward at hips
        leftArm: { x: 1.3, z: 0.6 },  // Arms move down to reach foot
        rightArm: { x: 1.3, z: -0.6 },
        leftForeArm: { x: 0.8 },
        rightForeArm: { x: 0.8 },
        duration: 2.5
      },
      {
        name: 'Return Upright',
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { z: 1.3 }, rightArm: { z: -1.3 },
        leftForeArm: { x: 0 }, rightForeArm: { x: 0 },
        rightUpLeg: { x: 0 }, leftUpLeg: { x: 0 },
        rightFoot: { x: 0 }, rightLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 2
      },
      {
        name: 'Left Heel Step & Toe Up',
        leftUpLeg: { x: -0.4 },
        leftFoot: { x: -0.6 },
        rightUpLeg: { x: 0.1 },
        rightLeg: { x: 0.3 },
        duration: 1.5
      },
      {
        name: 'The Sweep (Downward)',
        spine: { x: 0.9 }, spine1: { x: 0.5 },
        leftArm: { x: 1.3, z: 0.6 },
        rightArm: { x: 1.3, z: -0.6 },
        leftForeArm: { x: 0.8 },
        rightForeArm: { x: 0.8 },
        duration: 2.5
      },
      {
        name: 'Final Recovery',
        spine: { x: 0 }, spine1: { x: 0 },
        leftArm: { z: 1.3 }, rightArm: { z: -1.3 },
        leftForeArm: { x: 0 }, rightForeArm: { x: 0 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftFoot: { x: 0 }, leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 2
      }
    ]
  },

  'Elbow Forward Reach': {
    info: 'Stand upright with arms bent. Reach your elbows forward, rounding your upper back slightly and pushing your shoulder blades apart. Return to a tall posture and repeat.',
    steps: [
      {
        name: 'Neutral Setup',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 } },
        spine: { x: 0, y: 0, z: 0 }, spine1: { x: 0, y: 0, z: 0 },
        // Relaxed at sides (Down)
        leftArm: { x: 0, y: 0, z: -1.5 }, rightArm: { x: 0, y: 0, z: 1.5 },
        leftForeArm: { x: 0, y: 0, z: 0 }, rightForeArm: { x: 0, y: 0, z: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 }, rightShoulder: { x: 0, y: 0, z: 0 },
        camPos: { x: 2.0, y: 1.4, z: 3.0 }, camTarget: { x: 0, y: 1.2, z: 0 },
        duration: 2
      },
      {
        name: 'Arms in Position',
        // Raise arms forward (X negative) to chest level (Z near 0)
        leftArm: { x: -1.2, y: -0.2, z: -0.1 },
        rightArm: { x: -1.2, y: 0.2, z: 0.1 },
        leftForeArm: { x: 1.3, y: 0, z: 0 },
        rightForeArm: { x: 1.3, y: 0, z: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 },
        rightShoulder: { x: 0, y: 0, z: 0 },
        duration: 2
      },
      {
        name: 'Forward Reach',
        // PROTRACT shoulders (Left Y negative, Right Y positive)
        leftShoulder: { x: 0, y: -0.4, z: 0.1 },
        rightShoulder: { x: 0, y: 0.4, z: -0.1 },
        spine: { x: 0.2, y: 0, z: 0 },
        spine1: { x: 0.3, y: 0, z: 0 }, // Rounds the upper back forward
        // Push arms slightly further forward
        leftArm: { x: -1.4, y: -0.3, z: 0 },
        rightArm: { x: -1.4, y: 0.3, z: 0 },
        leftForeArm: { x: 1.3, y: 0, z: 0 },
        rightForeArm: { x: 1.3, y: 0, z: 0 },
        duration: 3
      },
      {
        name: 'Hold Stretch',
        leftShoulder: { x: 0, y: -0.4, z: 0.1 },
        rightShoulder: { x: 0, y: 0.4, z: -0.1 },
        spine: { x: 0.2, y: 0, z: 0 },
        spine1: { x: 0.3, y: 0, z: 0 },
        leftArm: { x: -1.4, y: -0.3, z: 0 },
        rightArm: { x: -1.4, y: 0.3, z: 0 },
        leftForeArm: { x: 1.3, y: 0, z: 0 },
        rightForeArm: { x: 1.3, y: 0, z: 0 },
        duration: 3
      },
      {
        name: 'Return Center',
        leftShoulder: { x: 0, y: 0, z: 0 },
        rightShoulder: { x: 0, y: 0, z: 0 },
        spine: { x: 0, y: 0, z: 0 },
        spine1: { x: 0, y: 0, z: 0 },
        leftArm: { x: -1.2, y: -0.2, z: -0.1 },
        rightArm: { x: -1.2, y: 0.2, z: 0.1 },
        leftForeArm: { x: 1.3, y: 0, z: 0 },
        rightForeArm: { x: 1.3, y: 0, z: 0 },
        duration: 2
      },
      {
        name: 'Final Relax',
        leftArm: { x: 0, y: 0, z: -1.5 },
        rightArm: { x: 0, y: 0, z: 1.5 },
        leftForeArm: { x: 0, y: 0, z: 0 },
        rightForeArm: { x: 0, y: 0, z: 0 },
        leftShoulder: { x: 0, y: 0, z: 0 },
        rightShoulder: { x: 0, y: 0, z: 0 },
        spine: { x: 0, y: 0, z: 0 },
        spine1: { x: 0, y: 0, z: 0 },
        duration: 2
      }
    ]
  },
  'Eversion': {
    info: 'Sit with legs extended forward and heels resting on the ground. Rotate your foot outward at the ankle so the sole tilts away from your body. Keep the leg still and repeat.',
    steps: [
      {
        name: 'Seated Setup',
        modelRot: 0,
        hips: { rot: { x: 0, y: 0, z: 0 }, pos: { y: 0.1, z: 0.8 } },
        spine: { x: 0.1, y: 0, z: 0 },
        // Legs extended forward
        leftUpLeg: { x: -1.55, y: 0, z: 0.1 },
        rightUpLeg: { x: -1.55, y: 0, z: -0.1 },
        leftLeg: { x: 0, y: 0, z: 0 },
        rightLeg: { x: 0, y: 0, z: 0 },
        leftFoot: { x: 0, y: 0, z: 0 },
        rightFoot: { x: 0, y: 0, z: 0 },
        camPos: { x: 1.5, y: 1.2, z: 2.2 }, camTarget: { x: 0, y: 0, z: 0.8 },
        duration: 2.5
      },
      {
        name: 'Right Foot Eversion',
        // Outward rotation (away from midline) for mirrored rig
        rightFoot: { x: 0.1, y: -0.6, z: 0 }, // x: 0.1 for slight dorsiflexion
        leftFoot: { x: 0, y: 0, z: 0 },
        duration: 2
      },
      { name: 'Hold', duration: 1.5 },
      {
        name: 'Return Neutral',
        rightFoot: { x: 0, y: 0, z: 0 },
        duration: 1.5
      },
      {
        name: 'Left Foot Eversion',
        // Outward rotation for left foot
        leftFoot: { x: 0.1, y: 0.6, z: 0 },
        rightFoot: { x: 0, y: 0, z: 0 },
        duration: 2
      },
      { name: 'Hold', duration: 1.5 },
      {
        name: 'Return Neutral',
        leftFoot: { x: 0, y: 0, z: 0 },
        duration: 1.5
      }
    ]
  },
  'Finger Extension': {
    info: 'Position your hand in front of you. Start with fingers relaxed and slowly straighten them as far as possible, spreading them slightly. Hold, then relax.',
    steps: [
      {
        name: 'Hand Position',
        modelRot: 0,
        // Lift left arm up and forward to see hand clearly
        leftShoulder: { x: 0.1, y: 0.2, z: 0.1 },
        leftArm: { x: -1.2, y: -0.4, z: -0.2 },
        leftForeArm: { x: 0.8, y: 0, z: 1.2 },
        leftHand: { x: 0, y: 0, z: 0 },
        // Start Curled
        mixamorigLeftHandIndex1: { z: 0.6 }, mixamorigLeftHandIndex2: { z: 0.6 }, mixamorigLeftHandIndex3: { z: 0.6 },
        mixamorigLeftHandMiddle1: { z: 0.6 }, mixamorigLeftHandMiddle2: { z: 0.6 }, mixamorigLeftHandMiddle3: { z: 0.6 },
        mixamorigLeftHandRing1: { z: 0.6 }, mixamorigLeftHandRing2: { z: 0.6 }, mixamorigLeftHandRing3: { z: 0.6 },
        mixamorigLeftHandPinky1: { z: 0.6 }, mixamorigLeftHandPinky2: { z: 0.6 }, mixamorigLeftHandPinky3: { z: 0.6 },
        camPos: { x: -0.8, y: 1.5, z: 1.2 }, camTarget: { x: -0.4, y: 1.3, z: 0 },
        duration: 2.5
      },
      {
        name: 'Extend & Spread fingers',
        // Straighten (Z -> 0) and Spread (X/Y)
        mixamorigLeftHandIndex1: { y: -0.15, z: 0 }, mixamorigLeftHandIndex2: { z: 0 }, mixamorigLeftHandIndex3: { z: 0 },
        mixamorigLeftHandMiddle1: { y: 0, z: 0 }, mixamorigLeftHandMiddle2: { z: 0 }, mixamorigLeftHandMiddle3: { z: 0 },
        mixamorigLeftHandRing1: { y: 0.15, z: 0 }, mixamorigLeftHandRing2: { z: 0 }, mixamorigLeftHandRing3: { z: 0 },
        mixamorigLeftHandPinky1: { y: 0.3, z: 0 }, mixamorigLeftHandPinky2: { z: 0 }, mixamorigLeftHandPinky3: { z: 0 },
        duration: 2
      },
      { name: 'Hold Extension', duration: 2 },
      {
        name: 'Relax Fingers',
        mixamorigLeftHandIndex1: { y: 0, z: 0.6 }, mixamorigLeftHandIndex2: { z: 0.6 }, mixamorigLeftHandIndex3: { z: 0.6 },
        mixamorigLeftHandMiddle1: { y: 0, z: 0.6 }, mixamorigLeftHandMiddle2: { z: 0.6 }, mixamorigLeftHandMiddle3: { z: 0.6 },
        mixamorigLeftHandRing1: { y: 0, z: 0.6 }, mixamorigLeftHandRing2: { z: 0.6 }, mixamorigLeftHandRing3: { z: 0.6 },
        mixamorigLeftHandPinky1: { y: 0, z: 0.6 }, mixamorigLeftHandPinky2: { z: 0.6 }, mixamorigLeftHandPinky3: { z: 0.6 },
        duration: 1.5
      }
    ]
  },
  'Finger Grip': {
    info: 'Hold a ball or grip trainer in your hand. Slowly squeeze your fingers and thumb around the object for a firm grip. Hold, then release slowly.',
    steps: [
      {
        name: 'Position Hand & Ball',
        modelRot: 0,
        gripBall: true,
        // Lift left arm up and forward to see hand clearly
        leftShoulder: { x: 0.1, y: 0.2, z: 0.1 },
        leftArm: { x: -1.2, y: -0.4, z: -0.2 },
        leftForeArm: { x: 0.8, y: 0, z: 1.2 },
        leftHand: { x: 0.2, y: 0, z: 0 },
        // Fingers open/extended to start
        mixamorigLeftHandIndex1: { z: 0 }, mixamorigLeftHandIndex2: { z: 0 }, mixamorigLeftHandIndex3: { z: 0 },
        mixamorigLeftHandMiddle1: { z: 0 }, mixamorigLeftHandMiddle2: { z: 0 }, mixamorigLeftHandMiddle3: { z: 0 },
        mixamorigLeftHandRing1: { z: 0 }, mixamorigLeftHandRing2: { z: 0 }, mixamorigLeftHandRing3: { z: 0 },
        mixamorigLeftHandPinky1: { z: 0 }, mixamorigLeftHandPinky2: { z: 0 }, mixamorigLeftHandPinky3: { z: 0 },
        mixamorigLeftHandThumb1: { x: 0, y: 0, z: 0 }, mixamorigLeftHandThumb2: { z: 0 }, mixamorigLeftHandThumb3: { z: 0 },
        camPos: { x: -0.8, y: 1.5, z: 1.2 }, camTarget: { x: -0.4, y: 1.3, z: 0 },
        duration: 2.5
      },
      {
        name: 'Firm Grip',
        // Curl fingers around ball
        mixamorigLeftHandIndex1: { z: 0.8 }, mixamorigLeftHandIndex2: { z: 0.8 }, mixamorigLeftHandIndex3: { z: 0.8 },
        mixamorigLeftHandMiddle1: { z: 0.8 }, mixamorigLeftHandMiddle2: { z: 0.8 }, mixamorigLeftHandMiddle3: { z: 0.8 },
        mixamorigLeftHandRing1: { z: 0.8 }, mixamorigLeftHandRing2: { z: 0.8 }, mixamorigLeftHandRing3: { z: 0.8 },
        mixamorigLeftHandPinky1: { z: 0.8 }, mixamorigLeftHandPinky2: { z: 0.8 }, mixamorigLeftHandPinky3: { z: 0.8 },
        // Thumb opposition
        mixamorigLeftHandThumb1: { x: 0.4, y: 0.4, z: 0.3 }, mixamorigLeftHandThumb2: { z: 0.4 }, mixamorigLeftHandThumb3: { z: 0.4 },
        duration: 2
      },
      { name: 'Hold Squeeze', duration: 2 },
      {
        name: 'Slow Release',
        mixamorigLeftHandIndex1: { z: 0 }, mixamorigLeftHandIndex2: { z: 0 }, mixamorigLeftHandIndex3: { z: 0 },
        mixamorigLeftHandMiddle1: { z: 0 }, mixamorigLeftHandMiddle2: { z: 0 }, mixamorigLeftHandMiddle3: { z: 0 },
        mixamorigLeftHandRing1: { z: 0 }, mixamorigLeftHandRing2: { z: 0 }, mixamorigLeftHandRing3: { z: 0 },
        mixamorigLeftHandPinky1: { z: 0 }, mixamorigLeftHandPinky2: { z: 0 }, mixamorigLeftHandPinky3: { z: 0 },
        mixamorigLeftHandThumb1: { x: 0, y: 0, z: 0 }, mixamorigLeftHandThumb2: { z: 0 }, mixamorigLeftHandThumb3: { z: 0 },
        duration: 2
      }
    ]
  },

  'Forward Backward Step': {
    info: 'Stand upright with feet hip-width apart. Step one leg forward, shifting weight onto it, then step backward to return to the original standing position. Alternate legs and maintain a natural arm swing.',
    steps: [
      {
        name: 'Neutral Start',
        modelRot: 0,
        hips: { pos: { x: 0, z: 0 } },
        spine: { x: 0 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        leftArm: { x: 0, z: -1.4 }, rightArm: { x: 0, z: 1.4 },
        duration: 1.5
      },
      {
        name: 'Right Leg Forward',
        // Step forward (Negative X)
        rightUpLeg: { x: -0.6 },
        rightLeg: { x: 0.3 }, // Slight knee bend
        // Weight shift (Forward is +Z in this model if modelRot is 0)
        hips: { pos: { x: 0.04, z: 0.15 } },
        // Arm swing (Opposite arm forward: left arm)
        leftArm: { x: 0.5, z: -1.4 },
        rightArm: { x: -0.4, z: 1.4 },
        duration: 2
      },
      {
        name: 'Shift Weight & Hold',
        duration: 1.5
      },
      {
        name: 'Return to Center',
        rightUpLeg: { x: 0 },
        rightLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        leftArm: { x: 0, z: -1.4 },
        rightArm: { x: 0, z: 1.4 },
        duration: 1.5
      },
      {
        name: 'Left Leg Forward',
        // Step forward (Negative X)
        leftUpLeg: { x: -0.6 },
        leftLeg: { x: 0.3 },
        // Weight shift
        hips: { pos: { x: -0.04, z: 0.15 } },
        // Arm swing (Opposite arm forward: right arm)
        rightArm: { x: 0.5, z: 1.4 },
        leftArm: { x: -0.4, z: -1.4 },
        duration: 2
      },
      {
        name: 'Shift Weight & Hold',
        duration: 1.5
      },
      {
        name: 'Return to Center',
        leftUpLeg: { x: 0 },
        leftLeg: { x: 0 },
        hips: { pos: { x: 0, z: 0 } },
        leftArm: { x: 0, z: -1.4 },
        rightArm: { x: 0, z: 1.4 },
        duration: 1.5
      }
    ]
  },

  'Forward Lunge': {
    info: 'Stand upright with feet shoulder-width apart. Take a large step forward with one leg and lower your hips until both knees are bent at approximately a 90-degree angle. Keep your torso upright and push back to return to the start.',
    steps: [
      {
        name: 'Neutral Setup',
        modelRot: Math.PI / 2, // Side view to show the lunge depth
        hips: { pos: { x: 0, z: 0 } },
        leftArm: { x: 0.1, z: -1.4 }, rightArm: { x: 0.1, z: 1.4 },
        leftUpLeg: { x: 0 }, rightUpLeg: { x: 0 },
        leftLeg: { x: 0 }, rightLeg: { x: 0 },
        duration: 1.5
      },
      {
        name: 'Step Forward & Lunge (Right)',
        // Lower hips for the lunge (model scale is ~100cm for standing)
        hips: { pos: { y: 65, z: 0.1 } },
        // Front Leg (Right) - Stepping forward
        rightUpLeg: { x: -1.1 }, // Forward
        rightLeg: { x: 1.6 },    // Knee bend
        // Back Leg (Left) - Staying back
        leftUpLeg: { x: 0.4 },   // Extension
        leftLeg: { x: 1.5 },     // Knee bend towards floor
        duration: 2.5
      },
      { name: 'Hold Lunge', duration: 1.5 },
      {
        name: 'Push Back to Center',
        hips: { pos: { y: 104 } }, // Return to standing height
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 1.8
      },
      {
        name: 'Step Forward & Lunge (Left)',
        hips: { pos: { y: 65, z: -0.1 } },
        // Front Leg (Left)
        leftUpLeg: { x: -1.1 },
        leftLeg: { x: 1.6 },
        // Back Leg (Right)
        rightUpLeg: { x: 0.4 },
        rightLeg: { x: 1.5 },
        duration: 2.5
      },
      { name: 'Hold Lunge', duration: 1.5 },
      {
        name: 'Final Return',
        hips: { pos: { y: 104 } },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        duration: 1.8
      }
    ]
  },

  'Forward Walking with Head Turns': {
    info: 'Walk forward slowly with a natural gait. As you walk, turn your head gently to the left and right alternately while keeping your torso stable and balanced.',
    steps: [
      {
        name: 'Neutral Start',
        modelRot: 0,
        hips: { pos: { y: 104, z: 0 } },
        leftArm: { x: 0.1, z: -1.4 }, rightArm: { x: 0.1, z: 1.4 },
        head: { y: 0 },
        duration: 1.5
      },
      {
        name: 'Step 1: Left Forward & Head Left',
        // Gait: Left Leg Forward, Right Arm Forward
        leftUpLeg: { x: -0.4 }, leftLeg: { x: 0.2 },
        rightUpLeg: { x: 0.2 }, rightLeg: { x: 0.1 },
        leftArm: { x: -0.3, z: -1.4 }, rightArm: { x: 0.5, z: 1.4 },
        // Head Turn
        head: { y: 0.6 },
        duration: 1.5
      },
      {
        name: 'Step 2: Right Forward & Head Right',
        // Gait: Right Leg Forward, Left Arm Forward
        leftUpLeg: { x: 0.2 }, leftLeg: { x: 0.1 },
        rightUpLeg: { x: -0.4 }, rightLeg: { x: 0.2 },
        leftArm: { x: 0.5, z: -1.4 }, rightArm: { x: -0.3, z: 1.4 },
        // Head Turn
        head: { y: -0.6 },
        duration: 2.0 // Slow for head turn stability
      },
      {
        name: 'Step 3: Left Forward & Head Left',
        leftUpLeg: { x: -0.4 }, leftLeg: { x: 0.2 },
        rightUpLeg: { x: 0.2 }, rightLeg: { x: 0.1 },
        leftArm: { x: -0.3, z: -1.4 }, rightArm: { x: 0.5, z: 1.4 },
        head: { y: 0.6 },
        duration: 2.0
      },
      {
        name: 'Step 4: Right Forward & Center Head',
        leftUpLeg: { x: 0.2 }, leftLeg: { x: 0.1 },
        rightUpLeg: { x: -0.4 }, rightLeg: { x: 0.2 },
        leftArm: { x: 0.5, z: -1.4 }, rightArm: { x: -0.3, z: 1.4 },
        head: { y: 0 },
        duration: 2.0
      },
      {
        name: 'Return to Neutral',
        leftUpLeg: { x: 0 }, leftLeg: { x: 0 },
        rightUpLeg: { x: 0 }, rightLeg: { x: 0 },
        leftArm: { x: 0.1, z: -1.4 }, rightArm: { x: 0.1, z: 1.4 },
        head: { y: 0 },
        duration: 1.5
      }
    ]
  },

  'Glute Assisted Single Leg Bridging': {
    info: 'Lie on your back with knees bent and feet flat. Extend one leg forward. Push through the planted foot to lift your hips until your torso and thigh form a straight line. Lower slowly and repeat.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 2, // Side view
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Left Leg Planted (Bent)
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        // Right Leg Extended
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 0.1 },
        // Arms at sides for stability
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        duration: 2
      },
      {
        name: 'Lift Straight Leg',
        // Only the extended leg rises; the entire body and hips remain perfectly static
        rightUpLeg: { x: -1.0 },
        duration: 2.5
      },
      { name: 'Hold Position', duration: 1.5 },
      {
        name: 'Lower Straight Leg',
        rightUpLeg: { x: -0.1 },
        duration: 2
      },
      {
        name: 'Final Lift',
        rightUpLeg: { x: -1.0 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        rightUpLeg: { x: -0.1 },
        duration: 1.5
      }
    ]
  },

  'Glute Single Leg Bridging': {
    info: 'Lie on your back with one knee bent and the foot flat on the floor, while the other leg is extended straight. Lift your hips upward using the bent leg while keeping the extended leg aligned with your torso. Lower your hips slowly back to the floor.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 2, // Side view
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Left Leg Planted (Bent)
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        // Right Leg Extended
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 0.1 },
        // Arms at sides
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        duration: 2
      },
      {
        name: 'Lift Hips (Bridge)',
        // Hips rise and tilt backward so shoulders stay anchored
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        // Planted foot knee drops to match torso
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        // Extended leg (Right) naturally follows pelvis, keeping perfectly aligned
        duration: 2.5
      },
      { name: 'Hold Bridge', duration: 1.5 },
      {
        name: 'Lower Hips',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        duration: 2
      },
      {
        name: 'Final Lift',
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        duration: 1.5
      }
    ]
  },

  'Glute Bridging': {
    info: 'Lie on your back with knees bent and feet flat on the ground. Press through both feet to lift your hips upward, engaging the glute and lower back muscles. Form a straight line from shoulders to knees, then lower slowly.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 2, // Side view
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Both Legs Planted (Bent)
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        rightUpLeg: { x: -1.0 }, rightLeg: { x: 1.8 },
        // Arms at sides for stability
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        duration: 2
      },
      {
        name: 'Lift Hips (Bridge)',
        // Hips rise, but tilt BACKWARD (negative x) so the shoulders stay anchored to the mat
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        // Thighs align with torso, knees open to keep feet planted
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 1.4 },
        duration: 2.5
      },
      { name: 'Hold Bridge', duration: 1.5 },
      {
        name: 'Lower Hips',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        rightUpLeg: { x: -1.0 }, rightLeg: { x: 1.8 },
        duration: 2
      },
      {
        name: 'Final Lift',
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 1.4 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        rightUpLeg: { x: -1.0 }, rightLeg: { x: 1.8 },
        duration: 1.5
      }
    ]
  },

  'Gluteal Stretch': {
    info: 'Lie on your back with knees bent. Place one ankle across the opposite knee. Grab the supporting thigh with both hands and gently pull it toward your chest. Hold, then slowly release.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 3, // Angled to see the figure 4 position clearly
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Both Legs Planted (Bent)
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        rightUpLeg: { x: -1.0 }, rightLeg: { x: 1.8 },
        // Arms at sides
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        camPos: { x: 3.0, y: 2.5, z: 3.0 }, camTarget: { x: 0, y: 0.5, z: 0 },
        duration: 2
      },
      {
        name: 'Figure-Four Position',
        // Place right ankle across left knee by rotating and lifting right leg
        rightUpLeg: { x: -1.1, y: -0.6, z: 0.5 },
        rightLeg: { x: 2.2 },
        duration: 2
      },
      {
        name: 'Pull Thigh to Chest',
        // Lift planted left leg toward chest
        leftUpLeg: { x: -2.0 }, leftLeg: { x: 2.2 },
        // Right leg follows since it is resting on the left
        rightUpLeg: { x: -2.0, y: -0.6, z: 0.5 },
        // Reach arms to grab the left thigh
        leftArm: { x: -1.0, y: 0.2, z: -0.2 }, leftForeArm: { x: 1.5 },
        rightArm: { x: -1.0, y: -0.2, z: 0.2 }, rightForeArm: { x: 1.5 },
        duration: 2.5
      },
      { name: 'Hold Stretch', duration: 2.5 },
      {
        name: 'Release to Figure-Four',
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        rightUpLeg: { x: -1.1, y: -0.6, z: 0.5 },
        leftArm: { x: 0.2, y: 0, z: -1.4 }, leftForeArm: { x: 0 },
        rightArm: { x: 0.2, y: 0, z: 1.4 }, rightForeArm: { x: 0 },
        duration: 2
      },
      {
        name: 'Return to Start',
        rightUpLeg: { x: -1.0, y: 0, z: 0 }, rightLeg: { x: 1.8 },
        duration: 2
      }
    ]
  },

  'Hamstring Assisted Single Leg Bridging': {
    info: 'Lie on your back with one knee bent and the foot flat on the floor, while the other leg remains extended upward. Hold the extended leg lightly behind the thigh for support. Lift your hips upward by pressing through the bent leg. Lower the pelvis back to the floor slowly.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 2, // Side view to see the leg elevated
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Left Leg Planted (Bent)
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        // Right Leg Extended Upward
        rightUpLeg: { x: -1.6 }, rightLeg: { x: 0.1 },
        // Arms holding lightly behind the right thigh
        leftArm: { x: -1.4, y: 0.2, z: -0.4 }, leftForeArm: { x: 1.0 },
        rightArm: { x: -1.4, y: -0.2, z: 0.4 }, rightForeArm: { x: 1.0 },
        duration: 2
      },
      {
        name: 'Lift Hips (Bridge)',
        // Hips rise and tilt backward so shoulders stay anchored
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        // Planted foot knee drops to match torso angle
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        // The right leg and arms stay locked to their parent joints, naturally tracking the hip tilt
        duration: 2.5
      },
      { name: 'Hold Bridge', duration: 1.5 },
      {
        name: 'Lower Hips',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        duration: 2
      },
      {
        name: 'Final Lift',
        hips: { rot: { x: -Math.PI / 2 - 0.35 }, pos: { y: 28, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 1.4 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -1.0 }, leftLeg: { x: 1.8 },
        duration: 1.5
      }
    ]
  },

  'Hamstring Bridging': {
    info: 'Lie on your back with knees bent and heels placed firmly on the floor, slightly farther from the hips than in a glute bridge to emphasize hamstring activation. Arms rest beside the body. Press through your heels to lift the pelvis upward while keeping your shoulders on the ground. Form a straight line from shoulders to knees, then lower slowly.',
    steps: [
      {
        name: 'Supine Setup (Heels Extended)',
        modelRot: Math.PI / 2, // Side view to show the foot placement
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Both Legs Planted, but further out compared to Glute Bridge
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.8 },
        // Arms at sides for stability
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        duration: 2
      },
      {
        name: 'Lift Pelvis (Hamstring Bridge)',
        // Hips rise and tilt backward so shoulders stay anchored
        // Max height is lower due to the legs being further out
        hips: { rot: { x: -Math.PI / 2 - 0.25 }, pos: { y: 22, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        // Thighs align with torso, knees open slightly to keep heels planted
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 0.6 },
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 0.6 },
        duration: 2.5
      },
      { name: 'Hold Bridge', duration: 1.5 },
      {
        name: 'Lower Pelvis',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.8 },
        duration: 2
      },
      {
        name: 'Final Lift',
        hips: { rot: { x: -Math.PI / 2 - 0.25 }, pos: { y: 22, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 0.6 },
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 0.6 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        rightUpLeg: { x: -0.6 }, rightLeg: { x: 0.8 },
        duration: 1.5
      }
    ]
  },

  'Hamstring Single Leg Bridging': {
    info: 'Lie on your back with one knee bent and heel placed on the floor, father from the hips than a typical glute bridge. Keep the other leg extended straight. Lift your hips upward by pushing through the heel of the supporting leg while maintaining the extended leg aligned with the torso. Lower back to the floor slowly.',
    steps: [
      {
        name: 'Supine Setup (Heel Extended)',
        modelRot: Math.PI / 2, // Side view to show the foot placement and straight leg
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Left Leg Planted (Extended outward for hamstring bias)
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        // Right Leg Extended Straight
        rightUpLeg: { x: -0.1 }, rightLeg: { x: 0.1 },
        // Arms at sides for balance
        leftArm: { x: 0.2, z: -1.4 }, rightArm: { x: 0.2, z: 1.4 },
        duration: 2
      },
      {
        name: 'Lift Pelvis (Single Leg Hamstring Bridge)',
        // Hips rise and tilt backward so shoulders stay anchored
        // Max height is lower due to the supporting leg being further out
        hips: { rot: { x: -Math.PI / 2 - 0.25 }, pos: { y: 22, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        // Planted Left leg thigh aligns with torso, knee opens slightly
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 0.6 },
        // Extended right leg naturally follows the tilt of the pelvis
        duration: 2.5
      },
      { name: 'Hold Bridge', duration: 1.5 },
      {
        name: 'Lower Pelvis',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        duration: 2
      },
      {
        name: 'Final Lift',
        hips: { rot: { x: -Math.PI / 2 - 0.25 }, pos: { y: 22, z: 0 } },
        spine: { x: -0.1 }, spine1: { x: -0.1 },
        leftUpLeg: { x: -0.1 }, leftLeg: { x: 0.6 },
        duration: 2.5
      },
      { name: 'Hold & Return', duration: 1.5 },
      {
        name: 'Resting Position',
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        leftUpLeg: { x: -0.6 }, leftLeg: { x: 0.8 },
        duration: 1.5
      }
    ]
  },

  'Hamstring Stretch': {
    info: 'Lie on your back with one leg extended flat on the floor and the other leg raised upward. Keeping the raised knee straight, gently pull the leg toward your torso to stretch the hamstrings. Hold the stretch, then slowly return to the starting position.',
    steps: [
      {
        name: 'Supine Setup',
        modelRot: Math.PI / 2, // Side view
        hips: { rot: { x: -Math.PI / 2 }, pos: { y: 12, z: 0 } },
        spine: { x: 0 }, spine1: { x: 0 },
        // Left Leg Extended Flat on floor
        leftUpLeg: { x: 0 }, leftLeg: { x: 0.05 },
        // Right Leg Raised Upward
        rightUpLeg: { x: -1.5 }, rightLeg: { x: 0.05 },
        // Arms hold the back of the right thigh
        leftArm: { x: -1.2, y: 0.2, z: -0.3 }, leftForeArm: { x: 0.8 },
        rightArm: { x: -1.2, y: -0.2, z: 0.3 }, rightForeArm: { x: 0.8 },
        duration: 2
      },
      {
        name: 'Pull Leg (Stretch)',
        // Pull the raised leg closer to the torso
        rightUpLeg: { x: -2.1 },
        // Bend elbows to pull
        leftArm: { x: -1.8, y: 0.2, z: -0.3 }, leftForeArm: { x: 1.5 },
        rightArm: { x: -1.8, y: -0.2, z: 0.3 }, rightForeArm: { x: 1.5 },
        duration: 2.5
      },
      { name: 'Hold Stretch', duration: 2.5 },
      {
        name: 'Release to Start',
        rightUpLeg: { x: -1.5 },
        leftArm: { x: -1.2, y: 0.2, z: -0.3 }, leftForeArm: { x: 0.8 },
        rightArm: { x: -1.2, y: -0.2, z: 0.3 }, rightForeArm: { x: 0.8 },
        duration: 2
      }
    ]
  },

  'Hand Grasp': {
    info: 'Position your hand in front of your body with fingers extended and slightly separated. Flex your fingers inward toward the palm while the thumb moves across to form a full grasping motion (like making a fist). Hold briefly, then extend your fingers to return to the open-hand position.',
    steps: [
      {
        name: 'Open Hand Setup',
        modelRot: -Math.PI / 6, // Angled slightly to view the right arm clearly
        hips: { pos: { y: 104 } },
        spine: { x: 0.1 },
        spine1: { x: -0.1 },
        // Head tilted slightly down and right to look at the screen
        neck: { x: 0.2, y: 0.3 },
        head: { x: 0.2, y: 0.3 },
        // Legs in a neutral standing stance
        leftUpLeg: { x: 0, z: 0.1 }, leftLeg: { x: 0 },
        rightUpLeg: { x: 0, z: -0.1 }, rightLeg: { x: 0 },

        // --- Right Arm holding phone/device (focused on the screen) ---
        rightArm: { x: -0.6, y: -0.4, z: 0.3 },
        rightForeArm: { x: 1.8 },
        rightHand: { x: 0.2, y: 0, z: 0.5 },
        rightHandThumb1: { y: -0.4, z: 0.2 }, rightHandThumb2: { y: -0.2 }, rightHandThumb3: { y: -0.2 },
        rightHandIndex1: { z: 0.4 }, rightHandIndex2: { z: 0.2 }, rightHandIndex3: { z: 0 },
        rightHandMiddle1: { z: 0.6 }, rightHandMiddle2: { z: 0.4 }, rightHandMiddle3: { z: 0 },
        rightHandRing1: { z: 0.6 }, rightHandRing2: { z: 0.4 }, rightHandRing3: { z: 0 },
        rightHandPinky1: { z: 0.6 }, rightHandPinky2: { z: 0.4 }, rightHandPinky3: { z: 0 },

        // --- Left Arm in front ready for grasp ---
        leftArm: { x: -1.0, y: 0.2, z: -0.3 },
        leftForeArm: { x: 0.5 },
        leftHand: { x: 0 },
        leftHandThumb1: { y: 0.4, z: 0.2 }, leftHandThumb2: { y: 0 }, leftHandThumb3: { y: 0 },
        leftHandIndex1: { z: -0.1 }, leftHandIndex2: { z: 0 }, leftHandIndex3: { z: 0 },
        leftHandMiddle1: { z: 0 }, leftHandMiddle2: { z: 0 }, leftHandMiddle3: { z: 0 },
        leftHandRing1: { z: 0.1 }, leftHandRing2: { z: 0 }, leftHandRing3: { z: 0 },
        leftHandPinky1: { z: 0.2 }, leftHandPinky2: { z: 0 }, leftHandPinky3: { z: 0 },

        camPos: { x: 1.0, y: 1.2, z: 1.5 }, camTarget: { x: 0, y: 1.0, z: 0.5 },
        duration: 2
      },
      {
        name: 'Grasp (Flex Fingers)',
        // Form a fist: Curl all finger joints inward ONLY for left hand
        leftHandIndex1: { z: 1.5 }, leftHandIndex2: { z: 1.5 }, leftHandIndex3: { z: 1.0 },
        leftHandMiddle1: { z: 1.5 }, leftHandMiddle2: { z: 1.5 }, leftHandMiddle3: { z: 1.0 },
        leftHandRing1: { z: 1.5 }, leftHandRing2: { z: 1.5 }, leftHandRing3: { z: 1.0 },
        leftHandPinky1: { z: 1.5 }, leftHandPinky2: { z: 1.5 }, leftHandPinky3: { z: 1.0 },
        leftHandThumb1: { y: -0.5, z: 0 }, leftHandThumb2: { y: -0.8 }, leftHandThumb3: { y: -0.5 },
        duration: 1.5
      },
      { name: 'Hold Grasp', duration: 1.5 },
      {
        name: 'Release (Open Hand)',
        leftHandThumb1: { y: 0.4, z: 0.2 }, leftHandThumb2: { y: 0 }, leftHandThumb3: { y: 0 },
        leftHandIndex1: { z: -0.1 }, leftHandIndex2: { z: 0 }, leftHandIndex3: { z: 0 },
        leftHandMiddle1: { z: 0 }, leftHandMiddle2: { z: 0 }, leftHandMiddle3: { z: 0 },
        leftHandRing1: { z: 0.1 }, leftHandRing2: { z: 0 }, leftHandRing3: { z: 0 },
        leftHandPinky1: { z: 0.2 }, leftHandPinky2: { z: 0 }, leftHandPinky3: { z: 0 },
        duration: 1.5
      },
      {
        name: 'Final Grasp',
        leftHandIndex1: { z: 1.5 }, leftHandIndex2: { z: 1.5 }, leftHandIndex3: { z: 1.0 },
        leftHandMiddle1: { z: 1.5 }, leftHandMiddle2: { z: 1.5 }, leftHandMiddle3: { z: 1.0 },
        leftHandRing1: { z: 1.5 }, leftHandRing2: { z: 1.5 }, leftHandRing3: { z: 1.0 },
        leftHandPinky1: { z: 1.5 }, leftHandPinky2: { z: 1.5 }, leftHandPinky3: { z: 1.0 },
        leftHandThumb1: { y: -0.5, z: 0 }, leftHandThumb2: { y: -0.8 }, leftHandThumb3: { y: -0.5 },
        duration: 1.5
      },
      { name: 'Hold Grasp', duration: 1.5 },
      {
        name: 'Resting Position',
        leftHandThumb1: { y: 0.4, z: 0.2 }, leftHandThumb2: { y: 0 }, leftHandThumb3: { y: 0 },
        leftHandIndex1: { z: -0.1 }, leftHandIndex2: { z: 0 }, leftHandIndex3: { z: 0 },
        leftHandMiddle1: { z: 0 }, leftHandMiddle2: { z: 0 }, leftHandMiddle3: { z: 0 },
        leftHandRing1: { z: 0.1 }, leftHandRing2: { z: 0 }, leftHandRing3: { z: 0 },
        leftHandPinky1: { z: 0.2 }, leftHandPinky2: { z: 0 }, leftHandPinky3: { z: 0 },
        duration: 1.5
      }
    ]
  }
};

class App {
  constructor() {
    this.canvas = document.querySelector('#canvas-container');
    this.scene = new THREE.Scene();
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(this.dracoLoader);

    this.model = null;
    this.modelGroup = null;
    this.bones = {};
    this.initialPose = new Map();
    this.initialGroupRotation = new THREE.Euler();
    this.initialGroupPosition = new THREE.Vector3();
    this.currentExercise = null;
    this.isPlaying = false;
    this.synth = window.speechSynthesis;
    this.activeTimeline = null;
    this.chair = null;
    this.platform = null;
    this.band = null;
    this.leftDumbbell = null;
    this.rightDumbbell = null;
    this.gripBall = null;

    this.init();
    this.animate();
  }

  init() {
    // CPU-Optimized Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color('#0a0a0c');

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.4, 4);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    this.scene.add(new THREE.GridHelper(10, 20, 0x00f2ff, 0x1a1a1a));

    // Create a stable group early to avoid initialization null-errors
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.createChair();
    this.createStepPlatform();
    this.createResistanceBand();
    this.createDumbbells();
    this.createGripBall();
    this.loadModel();
    this.setupUI();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    window.addEventListener('resize', () => this.onResize());
  }

  loadModel() {
    const modelUrl = 'https://threejs.org/examples/models/gltf/Xbot.glb';
    console.log("🚀 Loading 3D Bio-Model...");

    this.loader.load(
      modelUrl,
      (gltf) => {
        this.model = gltf.scene;

        // Create a stable group to avoid Gimbal Lock
        this.modelGroup.add(this.model);
        // this.scene.add(this.modelGroup); // This line is now redundant as modelGroup is added in init()

        this.initialGroupRotation = this.modelGroup.rotation.clone();
        this.initialGroupPosition = this.modelGroup.position.clone();

        this.model.traverse((node) => {
          if (node.isBone) {
            const name = node.name;
            // Capture Initial Pose for Reset logic
            this.initialPose.set(node, {
              rotation: node.rotation.clone(),
              position: node.position.clone()
            });

            // Comprehensive Bone Discovery - Avoid 'End' bones for main joints
            const isEndBone = name.includes('End') || name.includes('Top');

            if (name.includes('Hips')) this.bones.hips = node;
            if (name.includes('Spine') && !isEndBone) {
              if (name.includes('Spine1')) this.bones.spine1 = node;
              else if (name.includes('Spine2')) this.bones.spine2 = node;
              else this.bones.spine = node;
            }
            if (name.includes('Neck') && !isEndBone) this.bones.neck = node;
            if (name.includes('Head') && !isEndBone) this.bones.head = node;

            if (name.includes('LeftShoulder')) this.bones.leftShoulder = node;
            if (name.includes('RightShoulder')) this.bones.rightShoulder = node;

            if (name.includes('LeftArm') && !name.includes('Fore') && !isEndBone) this.bones.leftArm = node;
            if (name.includes('RightArm') && !name.includes('Fore') && !isEndBone) this.bones.rightArm = node;
            if (name.includes('LeftForeArm') && !isEndBone) this.bones.leftForeArm = node;
            if (name.includes('RightForeArm') && !isEndBone) this.bones.rightForeArm = node;

            if (name.includes('LeftUpLeg')) this.bones.leftUpLeg = node;
            if (name.includes('LeftLeg') && !name.includes('Up')) this.bones.leftLeg = node;

            if (name.includes('RightUpLeg')) this.bones.rightUpLeg = node;
            if (name.includes('RightLeg') && !name.includes('Up')) this.bones.rightLeg = node;

            if (name.includes('LeftFoot')) this.bones.leftFoot = node;
            if (name.includes('RightFoot')) this.bones.rightFoot = node;

            // Map Hands and Fingers generically (e.g. 'mixamorigRightHandIndex1' -> 'rightHandIndex1')
            if (name.includes('Hand') && !isEndBone) {
              let boneKey = name.replace('mixamorig', ''); // 'RightHandIndex1'
              boneKey = boneKey.charAt(0).toLowerCase() + boneKey.slice(1); // 'rightHandIndex1'
              this.bones[boneKey] = node;
            }

            this.bones[name] = node;
          }
        });

        // Bone-Attached Equipment
        const lHand = this.bones['LeftHand'] || this.bones['mixamorigLeftHand'];
        const rHand = this.bones['RightHand'] || this.bones['mixamorigRightHand'];
        if (lHand) {
          lHand.add(this.leftDumbbell);
          lHand.add(this.gripBall);
        }
        if (rHand) rHand.add(this.rightDumbbell);

        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'none';
        console.log("✅ Physio Model Ready.");
      },
      (xhr) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`⏳ Loading: ${percent}%`);
        const statusText = document.querySelector('#loading-overlay p');
        if (statusText) statusText.innerText = `Synchronizing 3D Model... ${percent}%`;
      },
      (error) => {
        console.error("❌ Model Load Failed:", error);
        const statusText = document.querySelector('#loading-overlay p');
        if (statusText) statusText.innerText = "Error: Connection lost. Please refresh the page.";
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'flex'; // Keep overlay visible on error
      }
    );
  }

  // --- The Playback Engine ---
  playExercise(exerciseName) {
    // Kill any ongoing animation or speech
    if (this.activeTimeline) this.activeTimeline.kill();
    this.synth.cancel();

    const exercise = EXERCISE_LIBRARY[exerciseName];
    if (!exercise) return;

    this.isPlaying = true;

    // 1. Update UI and Trigger Voice-Over
    document.getElementById('instr-title').innerText = exerciseName;
    document.getElementById('instr-desc').innerText = exercise.info;
    document.getElementById('instr-step').innerText = "Preparing...";

    const utter = new SpeechSynthesisUtterance(exercise.info);
    utter.rate = 0.9; // Slightly slower for clarity
    this.synth.speak(utter);

    this.activeTimeline = gsap.timeline({
      onComplete: () => {
        this.isPlaying = false;
        document.getElementById('instr-step').innerText = "Finished";
      }
    });

    // 2. Mandatory Reset Phase
    this.chair.visible = false;
    this.platform.visible = false;
    if (this.gripBall) this.gripBall.visible = false;
    this.activeTimeline.to(this.modelGroup.rotation, {
      x: this.initialGroupRotation.x, y: this.initialGroupRotation.y, z: this.initialGroupRotation.z,
      duration: 1, ease: "power2.inOut"
    }, "reset");
    this.activeTimeline.to(this.modelGroup.position, {
      x: this.initialGroupPosition.x, y: this.initialGroupPosition.y, z: this.initialGroupPosition.z,
      duration: 1, ease: "power2.inOut"
    }, "reset");

    Object.keys(this.bones).forEach(key => {
      const bone = this.bones[key];
      const data = this.initialPose.get(bone);
      if (data) {
        this.activeTimeline.to(bone.rotation, {
          x: data.rotation.x, y: data.rotation.y, z: data.rotation.z,
          duration: 1, ease: "power2.inOut"
        }, "reset");
        this.activeTimeline.to(bone.position, {
          x: data.position.x, y: data.position.y, z: data.position.z,
          duration: 1, ease: "power2.inOut"
        }, "reset");
      }
    });

    // 3. Play Sequence
    exercise.steps.forEach((step, index) => {
      const stepLabel = `step_${index}`;
      this.activeTimeline.addLabel(stepLabel, ">");

      // Global Model Group Rotation (Orientation - Solves Gimbal Lock)
      if (step.modelRot !== undefined) {
        this.activeTimeline.to(this.modelGroup.rotation, {
          y: step.modelRot,
          duration: step.duration || 1,
          ease: "power2.inOut"
        }, stepLabel);
      }

      // Dynamic Camera Positioning - Snaps once at the start, then stays static as requested
      if (index === 0) {
        if (step.camPos) {
          this.activeTimeline.to(this.camera.position, {
            x: step.camPos.x, y: step.camPos.y, z: step.camPos.z,
            duration: 1.5,
            ease: "power2.inOut"
          }, stepLabel);
        }

        if (step.camTarget) {
          this.activeTimeline.to(this.controls.target, {
            x: step.camTarget.x, y: step.camTarget.y, z: step.camTarget.z,
            duration: 1.5,
            ease: "power2.inOut"
          }, stepLabel);
        }
      }

      // Chair Management
      if (step.chair !== undefined) {
        this.activeTimeline.call(() => {
          this.chair.visible = step.chair;
          if (step.hips && step.hips.pos) this.chair.position.set(0, 0, 0);
        }, null, stepLabel);
      }

      // Platform Management
      if (step.platform !== undefined) {
        this.activeTimeline.call(() => {
          this.platform.visible = step.platform;
        }, null, stepLabel);
      }

      // Resistance Band Management
      if (step.band !== undefined) {
        this.activeTimeline.call(() => {
          if (this.band) this.band.visible = step.band;
        }, null, stepLabel);
      }

      // Dumbbell Management
      if (step.dumbbells !== undefined) {
        this.activeTimeline.call(() => {
          if (this.leftDumbbell) this.leftDumbbell.visible = step.dumbbells;
          if (this.rightDumbbell) this.rightDumbbell.visible = step.dumbbells;
        }, null, stepLabel);
      }

      // Grip Ball Management
      if (step.gripBall !== undefined) {
        this.activeTimeline.call(() => {
          if (this.gripBall) this.gripBall.visible = step.gripBall;
        }, null, stepLabel);
      }

      this.activeTimeline.call(() => {
        document.getElementById('instr-step').innerText = `Active Step: ${step.name}`;
      }, null, stepLabel);

      Object.keys(step).forEach(boneKey => {
        if (this.bones[boneKey]) {
          const bone = this.bones[boneKey];
          const data = step[boneKey];
          const initial = this.initialPose.get(bone);

          // Build selective rotation object
          const rotData = data.rot || data;
          const targetRot = {};
          if (rotData.x !== undefined) targetRot.x = rotData.x;
          if (rotData.y !== undefined) targetRot.y = rotData.y;
          if (rotData.z !== undefined) targetRot.z = rotData.z;

          if (Object.keys(targetRot).length > 0) {
            this.activeTimeline.to(bone.rotation, {
              ...targetRot,
              duration: step.duration || 1,
              ease: "power2.inOut"
            }, stepLabel);
          }

          // Build selective position object
          if (data.pos) {
            const targetPos = {};
            if (data.pos.x !== undefined) targetPos.x = data.pos.x;
            if (data.pos.y !== undefined) targetPos.y = data.pos.y;
            if (data.pos.z !== undefined) targetPos.z = data.pos.z;

            if (Object.keys(targetPos).length > 0) {
              this.activeTimeline.to(bone.position, {
                ...targetPos,
                duration: step.duration || 1,
                ease: "power2.inOut"
              }, stepLabel);
            }
          }
        }
      });
    });

    // 4. Final Reset (Auto-Stand Up)
    const finalLabel = "final_reset";
    this.activeTimeline.addLabel(finalLabel, ">");

    this.activeTimeline.call(() => {
      document.getElementById('instr-step').innerText = "Returning to rest position...";
    }, null, finalLabel);

    this.activeTimeline.to(this.modelGroup.rotation, {
      x: this.initialGroupRotation.x, y: this.initialGroupRotation.y, z: this.initialGroupRotation.z,
      duration: 1.5, ease: "power2.inOut"
    }, finalLabel);

    this.activeTimeline.to(this.modelGroup.position, {
      x: this.initialGroupPosition.x, y: this.initialGroupPosition.y, z: this.initialGroupPosition.z,
      duration: 1.5, ease: "power2.inOut"
    }, finalLabel);

    this.activeTimeline.call(() => {
      this.chair.visible = false;
      this.platform.visible = false;
      this.band.visible = false;
      if (this.leftDumbbell) this.leftDumbbell.visible = false;
      if (this.rightDumbbell) this.rightDumbbell.visible = false;
      if (this.gripBall) this.gripBall.visible = false;
    }, null, finalLabel);

    Object.keys(this.bones).forEach(key => {
      const bone = this.bones[key];
      const data = this.initialPose.get(bone);
      if (data) {
        this.activeTimeline.to(bone.rotation, {
          x: data.rotation.x, y: data.rotation.y, z: data.rotation.z,
          duration: 1.5, ease: "power2.inOut"
        }, finalLabel);
        this.activeTimeline.to(bone.position, {
          x: data.position.x, y: data.position.y, z: data.position.z,
          duration: 1.5, ease: "power2.inOut"
        }, finalLabel);
      }
    });

    // Reset Camera to Home View - Restored to ensure proper reset after finish
    this.activeTimeline.to(this.camera.position, {
      x: 0, y: 1.4, z: 4,
      duration: 2, ease: "power2.inOut"
    }, finalLabel);

    this.activeTimeline.to(this.controls.target, {
      x: 0, y: 1.0, z: 0,
      duration: 2, ease: "power2.inOut"
    }, finalLabel);
  }

  setupUI() {
    const listContainer = document.getElementById('exercise-list');
    const restBtn = document.getElementById('rest-btn');
    if (!listContainer) return;

    // Create buttons from the library
    Object.keys(EXERCISE_LIBRARY).forEach(name => {
      const btn = document.createElement('button');
      btn.innerText = name;
      btn.className = 'exercise-btn';
      btn.onclick = () => {
        document.querySelectorAll('.exercise-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.playExercise(name);
      };
      listContainer.appendChild(btn);
    });

    // --- EMERGENCY REST ACTION ---
    restBtn.onclick = () => {
      console.log("🛑 Commencing Emergency Rest...");
      if (this.activeTimeline) this.activeTimeline.kill();
      this.synth.cancel();
      this.isPlaying = false;
      if (this.chair) this.chair.visible = false;
      if (this.platform) this.platform.visible = false;
      if (this.gripBall) this.gripBall.visible = false;
      if (this.band) this.band.visible = false;
      if (this.leftDumbbell) this.leftDumbbell.visible = false;
      if (this.rightDumbbell) this.rightDumbbell.visible = false;

      document.getElementById('instr-title').innerText = "System Status";
      document.getElementById('instr-step').innerText = "Resetting Pose...";
      document.getElementById('instr-desc').innerText = "Stopping all exercises and returning the model to a neutral standing position.";

      const restTimeline = gsap.timeline();

      // Reset Camera Frame
      restTimeline.to(this.camera.position, {
        x: 0, y: 1.4, z: 4,
        duration: 0.8, ease: "power2.inOut"
      }, 0);
      restTimeline.to(this.controls.target, {
        x: 0, y: 1.0, z: 0,
        duration: 0.8, ease: "power2.inOut"
      }, 0);

      // Reset Model Orientation
      restTimeline.to(this.modelGroup.rotation, {
        x: this.initialGroupRotation.x, y: this.initialGroupRotation.y, z: this.initialGroupRotation.z,
        duration: 0.8, ease: "power2.inOut"
      }, 0);
      restTimeline.to(this.modelGroup.position, {
        x: this.initialGroupPosition.x, y: this.initialGroupPosition.y, z: this.initialGroupPosition.z,
        duration: 0.8, ease: "power2.inOut"
      }, 0);

      Object.keys(this.bones).forEach(key => {
        const bone = this.bones[key];
        const data = this.initialPose.get(bone);
        if (data) {
          restTimeline.to(bone.rotation, {
            x: data.rotation.x, y: data.rotation.y, z: data.rotation.z,
            duration: 0.6, ease: "power2.out"
          }, 0);
          restTimeline.to(bone.position, {
            x: data.position.x, y: data.position.y, z: data.position.z,
            duration: 0.6, ease: "power2.out"
          }, 0);
        }
      });

      document.querySelectorAll('.exercise-btn').forEach(b => b.classList.remove('active'));
    };
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  createChair() {
    this.chair = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ color: '#cbd5e1', shininess: 80 }); // Chrome/Silver legs
    const seatMaterial = new THREE.MeshPhongMaterial({ color: '#1e3a8a' }); // Deep Royal Blue

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), seatMaterial);
    seat.position.y = 0.48; // Slightly lower than hips for thickness
    this.chair.add(seat);

    // Backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), seatMaterial);
    backrest.position.set(0, 0.78, -0.22);
    this.chair.add(backrest);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.04, 0.48, 0.04);
    const pos = [[0.2, 0.24, 0.2], [-0.2, 0.24, 0.2], [0.2, 0.24, -0.2], [-0.2, 0.24, -0.2]];
    pos.forEach(p => {
      const leg = new THREE.Mesh(legGeo, material);
      leg.position.set(...p);
      this.chair.add(leg);
    });

    this.chair.visible = false;
    // Add chair to modelGroup so it follows the rotation/turn perfectly
    this.modelGroup.add(this.chair);
  }

  createStepPlatform() {
    this.platform = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: '#334155', shininess: 50 });
    const topMat = new THREE.MeshPhongMaterial({ color: '#475569' });

    // Main Box
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.6), mat);
    box.position.y = 0.1;
    this.platform.add(box);

    // Grid on top for grip
    const grid = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.01, 0.55), topMat);
    grid.position.y = 0.205;
    this.platform.add(grid);

    this.platform.visible = false;
    this.scene.add(this.platform);
  }

  createResistanceBand() {
    const geo = new THREE.CylinderGeometry(0.012, 0.012, 1, 8);
    const mat = new THREE.MeshPhongMaterial({ color: '#ea4335', emissive: '#440000', shininess: 100 }); // Red Band
    this.band = new THREE.Mesh(geo, mat);
    this.band.visible = false;
    this.scene.add(this.band);
  }

  updateResistanceBand() {
    if (!this.band || !this.band.visible || !this.model) return;

    // Find the hand bones (support for common naming conventions)
    const lHand = this.bones['LeftHand'] || this.bones['mixamorigLeftHand'];
    const rHand = this.bones['RightHand'] || this.bones['mixamorigRightHand'];

    if (!lHand || !rHand) return;

    const pLeft = new THREE.Vector3();
    const pRight = new THREE.Vector3();

    // Get absolute world positions
    lHand.getWorldPosition(pLeft);
    rHand.getWorldPosition(pRight);

    // Calculate vector, center and length
    const direction = new THREE.Vector3().subVectors(pRight, pLeft);
    const length = direction.length();

    // Update mesh transform
    this.band.position.copy(pLeft).add(direction.clone().multiplyScalar(0.5));
    this.band.scale.set(1, length, 1);

    // Orient the cylinder to point along the direction vector
    this.band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  }

  createDumbbells() {
    const mat = new THREE.MeshPhongMaterial({ color: '#334155', shininess: 80, emissive: '#111' });
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8);
    const weightGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12);

    // Assembly Helper
    const buildDumbbell = () => {
      const group = new THREE.Group();
      const bar = new THREE.Mesh(barGeo, mat);
      const w1 = new THREE.Mesh(weightGeo, mat); w1.position.y = 0.08;
      const w2 = new THREE.Mesh(weightGeo, mat); w2.position.y = -0.08;
      group.add(bar, w1, w2);
      group.rotation.z = Math.PI / 2; // Orient to hand grip
      group.visible = false;
      return group;
    };

    this.leftDumbbell = buildDumbbell();
    this.rightDumbbell = buildDumbbell();
  }

  createGripBall() {
    const geo = new THREE.SphereGeometry(0.04, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: '#00f2ff',
      emissive: '#002233',
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    this.gripBall = new THREE.Mesh(geo, mat);
    this.gripBall.position.set(0.04, 0.05, 0.0); // Adjust to sit in palm
    this.gripBall.visible = false;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) this.controls.update();
    this.updateResistanceBand();
    this.renderer.render(this.scene, this.camera);
  }
}

window.app = new App();
