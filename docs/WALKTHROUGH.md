# Walkthrough - Planetary Defense Game

I have transformed the scene into a full game where you defend the Earth from incoming asteroids using a hand-controlled shield.

## Changes

-   **Incoming Asteroids**:
    -   Asteroids now **spawn off-screen** and fly towards the center (Earth).
    -   **Fire Effect**: Asteroids flow with intense orange/yellow light and flicker like fireballs.
    -   **Variable Size/Damage**:
        -   Larger asteroids deal **more damage**.
        -   Smaller asteroids deal less damage.
-   **Defense Gameplay**:
    -   **Goal**: Protect the Earth using the blue shield.
    -   **Score**: Destroying an asteroid with the shield +1 Score.
    -   **Health**: Earth starts with 100% health. Hits reduce it.
    -   **Super Power**:
        -   **Gesture**: Make a **Fist** to unleash a shockwave.
        -   **Effect**: Destroys ALL asteroids on screen instantly.
        -   **Limit**: 3 charges per game (shown by lightning icons).
-   **Game Over**:
    -   When Health reaches 0%, the game **freezes**.
    -   A "GAME OVER" screen appears.
-   **Restart**:
    -   Click "REINICIAR" to reset the game instantly without refreshing.
-   **Countdown**:
    -   At start and restart, a **3-2-1-GO!** countdown appears.
-   **Visuals**:
    -   **Fixed Background**: Stars/dust particles are now visible behind the Earth (moved deeper in Z-space).
    -   **Planet Update**: Reduced planet size by 10%.
-   **Controls**:
    -   **Move Hand Left/Right**: Rotates the shield.
    -   **Make Fist**: Activates Super Power.

## Verification Steps

1.  **Start and Open**: `npm run dev` -> `http://localhost:5173`.
2.  **Super Power**:
    -   Wait for asteroids to fill the screen.
    -   **Clench your hand** into a fist.
    -   Verify all asteroids explode.
    -   Verify one lightning charge is used up.
    -   Verify screen brightens momentarily (bloom effect).
3.  **Lose & Restart**:
    -   Lose the game.
    -   Restart.
    -   Verify charges reset to 3.
