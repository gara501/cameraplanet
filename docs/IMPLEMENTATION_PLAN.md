# Implementation Plan - Super Power (Fist Gesture)

The goal is to add a powerful ability triggered by a fist gesture that clears the screen.

## Proposed Changes

### `Root`

#### [MODIFY] [index.html](file:///t:/JSProjects/Particles/hand-particles/index.html)
-   **UI**: Add a container for Super Power charges near the lifebar.
    ```html
    <div id="superpower-container">
      <div class="charge active">⚡</div>
      <div class="charge active">⚡</div>
      <div class="charge active">⚡</div>
    </div>
    ```
-   **CSS**: Style it to the right of the lifebar.

### `src`

#### [MODIFY] [main.js](file:///t:/JSProjects/Particles/hand-particles/src/main.js)
-   **State**: `superPowerCharges = 3`, `lastSuperPowerTime = 0` (cooldown).
-   **Gesture Detection (`onResults`)**:
    -   Implement `detectFist(landmarks)`: Check if fingertips are close to palm bases (MCPs).
    -   Trigger `activateSuperPower` if unique fist event detected.
-   **Function `activateSuperPower()`**:
    -   Check `charges > 0` and `gameActive`.
    -   Decrement charges, update UI (remove `.active` class).
    -   **Effect**:
        -   **Shield**: Expand geometry to full circle (`thetaLength = 2 * PI`) momentarily, then revert.
        -   **Shockwave**: Create a visual expanding ring or just use the bloom flash.
        -   **Destruction**: Iterate all `spheres` and `explodeSphere(s)` immediately.
-   **Visual Feedback**: Maybe flash the screen white or cyan.

## Verification Plan

### Manual Verification
1.  **Start Game**: Verify 3 lightning icons appear.
2.  **Make Fist**:
    -   Verify all asteroids explode.
    -   Verify shield expands (optional visual).
    -   Verify one icon dims/disappears.
3.  **Repeat**: Try 3 times.
4.  **Exhaust**: Try 4th time, verify nothing happens.
