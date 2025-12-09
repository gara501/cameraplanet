# 🌍 Planetary Defense - Hand Controlled

> **"Your hands are the only barrier between Earth and extinction."**

## Overview
**Planetary Defense** is an immersive wrapper for a classic arcade defense game, powered by **Three.js** and **MediaPipe Hand Tracking**. Instead of a joystick or keyboard, you use your **bare hands** to control a planetary energy shield.

Defend our home planet from a ceaseless bombardment of fiery asteroids. Spin the shield by moving your hand left to right, and unleash a devastating **Super Power Shockwave** by clenching your fist!

## ✨ Features

-   **🖐 Hand-Tracking Control**: Powered by MediaPipe. Your physical movements directly control the digital shield.
-   **🔥 Fire Asteroids**: Dynamic asteroids that glow with procedural fire effects and emissive lighting.
-   **🛡 Energy Shield**: A rotational barrier that destroys debris on contact.
-   **⚡ Super Power**: In a pinch? **Make a fist** to trigger a screen-clearing shockwave (Limit: 3 per game).
-   **🌌 Immersive Atmosphere**: Deep space particle field, bloom post-processing, and motion blur.
-   **Game State**: Complete game loop with Health Bar, Score, Countdown, and Game Over/Restart functionality.

## 🎮 How to Play

1.  **Launch**: `npm run dev`
2.  **Allow Camera**: Grant camera permissions for hand tracking.
3.  **Shield Control**:
    -   Show your index finger and move your hand **Left** or **Right**.
    -   The blue shield will rotate to follow your hand.
4.  **Defend**:
    -   Block incoming asteroids with the shield.
    -   Gain **+1 Score** for every block.
    -   Don't let them hit the Earth!
5.  **Super Power**:
    -   Too many asteroids? **Clench your Fist**.
    -   This unleashes a shockwave destroying ALL current threats.
    -   You have **3 charges** (⚡⚡⚡).

## 🛠 Tech Stack

-   **Three.js**: 3D Rendering, Particles, Shaders, Post-processing (Bloom, Afterimage).
-   **MediaPipe Hands**: Real-time hand landmark detection.
-   **Vite**: Fast development server and bundling.

## 📂 Documentation

Detailed notes on the development process can be found in the `docs/` folder:
-   [Tasks](docs/TASKS.md): Development checklist.
-   [Walkthrough](docs/WALKTHROUGH.md): Feature breakdown and verification.
-   [Implementation Plan](docs/IMPLEMENTATION_PLAN.md): Technical planning documents.

---

*"Good luck, Commander. The Earth is counting on you."*
