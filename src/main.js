import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import earthTextureUrl from './textures/earth.jpg?url';
import asteroidTextureUrl from './textures/asteroid.jpg?url';
import blueTextureUrl from './textures/blue.jpg?url';

    const threeContainer = document.getElementById('three');

    // ------------------------------------------------
    //  GLOBAL STATE
    // ------------------------------------------------
    let renderer, scene, camera;
    let composer, bloomPass, afterimagePass;

    let points, positions, velocities, colors, sizes;
    const COUNT = 6000;

    // Asteroids (Spheres)
    let spheres = [];
    const SPHERE_COUNT = 8;
    const SPHERE_RADIUS = 30;
    let score = 0;

    // Cache
    let asteroidGeometry = null;
    let asteroidMaterial = null;

    // Earth & Shield
    let earthMesh;
    let shieldMesh;
    const SHIELD_COVERAGE = 0.2; // 20%
    
    // Game State
    let earthHealth = 100;
    let isGameOver = false;
    let isGameActive = false;

    // Super Power
    let superPowerCharges = 3;
    let lastSuperPowerTime = 0;
    const SUPER_POWER_COOLDOWN = 2000; // 1 second cooldown
    
    // Power Spheres
    let powerSpheres = [];
    let powerSphereMaterial = null;
    let nextPowerSpawnTime = 0;
    const POWER_SPHERE_RADIUS = 25;

    // ------------------------------------------------
    //  MEDIA PIPE HANDS
    // ------------------------------------------------
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsinline = true;

    // Camera setup
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      video.srcObject = stream;
    });

    // MediaPipe Hands
    const hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    let indexFinger = null;
    let isPinching = false;

    hands.onResults(res => {
      indexFinger = null;
      isPinching = false;
      
      if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const landmarks = res.multiHandLandmarks[0];
        const indexTip = landmarks[8];  // pointer tip
        const thumbTip = landmarks[4];  // thumb tip
        
        indexFinger = {
          x: indexTip.x,
          y: indexTip.y
        };
        
        // Pinch
        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const dz = indexTip.z - thumbTip.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        isPinching = distance < 0.05;
        
        // Super Power Fist Detection
        const wrist = landmarks[0];
        const dIndexWrist = Math.sqrt(
            Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2) + Math.pow(indexTip.z - wrist.z, 2)
        );
        const middleTip = landmarks[12];
        const dMiddleWrist = Math.sqrt(
             Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2) + Math.pow(middleTip.z - wrist.z, 2)
        );
        
        // Threshold for detecting fist
        if (dIndexWrist < 0.15 && dMiddleWrist < 0.15) {
            activateSuperPower();
        }
      }
    });

    const mpCam = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 1280,
      height: 720
    });
    mpCam.start();


    // ------------------------------------------------
    //  GAME FUNCTIONS
    // ------------------------------------------------

    function startCountdown(onComplete) {
        const el = document.getElementById('countdown');
        if (!el) {
            if (onComplete) onComplete();
            return;
        }
        
        el.style.display = 'flex';
        let count = 3;
        el.textContent = count;
        
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                el.textContent = count;
            } else if (count === 0) {
                el.textContent = "GO!";
            } else {
                clearInterval(timer);
                el.style.display = 'none';
                isGameActive = true;
                if (onComplete) onComplete();
                nextPowerSpawnTime = performance.now() + 10000;
            }
        }, 1000);
    }

    function activateSuperPower() {
        if (!isGameActive || isGameOver) return;
        
        const now = performance.now();
        if (now - lastSuperPowerTime < SUPER_POWER_COOLDOWN) return;
        
        if (superPowerCharges > 0) {
            superPowerCharges--;
            lastSuperPowerTime = now;
            
            // UI Update
            const charges = document.querySelectorAll('.charge.active');
            if (charges.length > 0) {
                charges[charges.length - 1].classList.remove('active');
            }
            
            // EFFECT: Destroy all asteroids
            spheres.forEach(s => {
                if (s.userData.alive) {
                    explodeSphere(s);
                }
            });
            
            // Visual feedback
            if (bloomPass) {
                const originalStrength = bloomPass.strength;
                bloomPass.strength = 5.0;
                setTimeout(() => {
                    bloomPass.strength = originalStrength;
                }, 300);
            }
            
            if (shieldMesh) {
                const oldScale = shieldMesh.scale.x;
                shieldMesh.scale.set(3,3,3); 
                setTimeout(() => {
                    shieldMesh.scale.set(oldScale, oldScale, oldScale);
                }, 200);
            }
        }
    }

    function restartGame() {
        // Reset State
        score = 0;
        earthHealth = 100;
        isGameOver = false;
        isGameActive = false;
        superPowerCharges = 3; 
        
        // Reset UI
        updateScoreDisplay();
        document.querySelectorAll('.charge').forEach(el => el.classList.add('active'));
        const bar = document.getElementById('life-bar');
        if (bar) bar.style.width = '100%';
        const go = document.getElementById('game-over');
        if (go) go.style.display = 'none';
        
        // Clear Asteroids
        spheres.forEach(s => scene.remove(s));
        spheres.length = 0;
        
        // Spawn initial batch
        for (let i = 0; i < SPHERE_COUNT; i++) {
            spheres.push(spawnSingleSphere());
        }
        
        // Start countdown
        startCountdown(() => {
            isGameActive = true;
            nextPowerSpawnTime = performance.now() + 10000;
        });
    }

    function updateScoreDisplay() {
      const el = document.getElementById('score');
      if (el) el.textContent = score;
    }

    function damageEarth(amount) {
        earthHealth = Math.max(0, earthHealth - amount);
        const bar = document.getElementById('life-bar');
        if (bar) {
            bar.style.width = earthHealth + '%';
        }
        
        if (earthHealth <= 0) {
            isGameOver = true;
            const go = document.getElementById('game-over');
            if (go) go.style.display = 'flex';
        }
    }

    // ------------------------------------------------
    //  THREE.JS SCENE
    // ------------------------------------------------

    function initThree() {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(innerWidth, innerHeight);
      renderer.setClearColor(0x000000, 1);
      threeContainer.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      // Camera: Deep range for background particles
      camera = new THREE.OrthographicCamera(0, innerWidth, innerHeight, 0, -2000, 2000);
      camera.updateProjectionMatrix();

      // Earth
      const r = Math.min(innerWidth, innerHeight) * 0.225; 
      const earthGeo = new THREE.SphereGeometry(r, 64, 64);
      const textureLoader = new THREE.TextureLoader();
      const earthTex = textureLoader.load(earthTextureUrl);
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.5,
        metalness: 0.1
      });
      earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.position.set(innerWidth / 2, innerHeight / 2, -200);
      scene.add(earthMesh);

      // Shield
      const shieldInner = r * 1.15;
      const shieldOuter = r * 1.25;
      const thetaLength = Math.PI * 2 * SHIELD_COVERAGE;
      // Start at -Lengths/2 so rotation 0 is centered
      const shieldGeo = new THREE.RingGeometry(shieldInner, shieldOuter, 32, 1, -thetaLength/2, thetaLength);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.position.set(innerWidth / 2, innerHeight / 2, -190);
      scene.add(shieldMesh);

      // Particles (Stars/Dust)
      const geom = new THREE.BufferGeometry();
      positions = new Float32Array(COUNT * 3);
      velocities = new Float32Array(COUNT * 3);
      colors = new Float32Array(COUNT * 3);
      sizes = new Float32Array(COUNT);

      for (let i = 0; i < COUNT; i++) {
        const x = Math.random() * innerWidth;
        const y = Math.random() * innerHeight;
        // Deep background
        const z = -1000 - Math.random() * 800; 

        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;

        velocities[i*3] = (Math.random() - .5) * .2;
        velocities[i*3+1] = (Math.random() - .5) * .2;
        velocities[i*3+2] = 0;

        colors[i*3] = 1;
        colors[i*3+1] = 1;
        colors[i*3+2] = 1;

        sizes[i] = 2 + Math.random() * 5;
      }

      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      geom.setAttribute("customColor", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
      geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

      const vshader = `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mv;
        }
      `;

      const fshader = `
        varying vec3 vColor;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          if(dot(c,c)>0.25) discard;
          gl_FragColor = vec4(vColor,1.0);
        }
      `;

      const material = new THREE.ShaderMaterial({
        vertexShader: vshader,
        fragmentShader: fshader,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });

      points = new THREE.Points(geom, material);
      scene.add(points);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(0, 100, 100);
      scene.add(dirLight);

      // Asteroids Setup
      createSpheres();
      initPowerSphereMaterial();

      // Post Processing
      const renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(innerWidth, innerHeight),
        1.3, 0.3, 0.1 
      );
      afterimagePass = new AfterimagePass(0.88); 

      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(afterimagePass);

      window.addEventListener("resize", onResize);
      
      const btn = document.getElementById('restart-btn');
      if (btn) btn.addEventListener('click', restartGame);
      
      // Start
      startCountdown(() => {
          isGameActive = true;
      });
    }

    function onResize() {
      renderer.setSize(innerWidth, innerHeight);
      composer.setSize(innerWidth, innerHeight);

      camera.right = innerWidth;
      camera.top = innerHeight;
      camera.updateProjectionMatrix();

      if (earthMesh) {
          const r = Math.min(innerWidth, innerHeight) * 0.225;
          earthMesh.geometry.dispose(); 
          earthMesh.geometry = new THREE.SphereGeometry(r, 64, 64);
          earthMesh.position.set(innerWidth / 2, innerHeight / 2, -200);

          if (shieldMesh) {
              shieldMesh.geometry.dispose();
              const sInner = r * 1.15;
              const sOuter = r * 1.25;
              const thetaLength = Math.PI * 2 * SHIELD_COVERAGE;
              shieldMesh.geometry = new THREE.RingGeometry(sInner, sOuter, 32, 1, -thetaLength/2, thetaLength);
              shieldMesh.position.set(innerWidth / 2, innerHeight / 2, -190);
          }
      }
      
      spheres.forEach(sphere => {
        sphere.position.x = Math.min(sphere.position.x, innerWidth - SPHERE_RADIUS);
        sphere.position.y = Math.min(sphere.position.y, innerHeight - SPHERE_RADIUS);
      });
    }

    function createSpheres() {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(asteroidTextureUrl);

      asteroidGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
      asteroidMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1
      });

      for (let i = 0; i < SPHERE_COUNT; i++) {
        spheres.push(spawnSingleSphere());
      }
    }

    function spawnSingleSphere() {
        const mesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial.clone());
        
        // Emissive Fire Effect
        mesh.material.color.setHex(0x888888); 
        const fireHue = Math.random() * 0.1; 
        mesh.material.emissive.setHSL(fireHue, 1.0, 0.5);
        mesh.material.emissiveIntensity = 2.0 + Math.random() * 2.0; 
        
        const scale = 0.5 + Math.random() * 1.0; 
        mesh.scale.set(scale, scale, scale);

        // Spawn Outside
        const cx = innerWidth / 2;
        const cy = innerHeight / 2;
        const maxDim = Math.max(innerWidth, innerHeight);
        const spawnRadius = maxDim * 0.7; 
        const angle = Math.random() * Math.PI * 2;
        
        mesh.position.x = cx + Math.cos(angle) * spawnRadius;
        mesh.position.y = cy + Math.sin(angle) * spawnRadius;
        mesh.position.z = (Math.random() - 0.5) * 50; 
        
        // Velocity
        const dx = cx - mesh.position.x;
        const dy = cy - mesh.position.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = 2 + Math.random() * 3; 
        
        mesh.userData.vx = (dx / dist) * speed;
        mesh.userData.vy = (dy / dist) * speed;
        
        mesh.userData.alive = true;
        mesh.userData.hue = fireHue; 
        mesh.userData.baseScale = scale;
        
        scene.add(mesh);
        return mesh;
    }

    function explodeSphere(sphere) {
      sphere.userData.alive = false;
      score++;
      updateScoreDisplay();
      
      const sx = sphere.position.x;
      const sy = sphere.position.y;
      
      const explosionSteps = 200; 
      const explosionForce = 3.5;

      // Particle explosion effect
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const x = positions[ix];
        const y = positions[ix+1];
        const dx = x - sx;
        const dy = y - sy;
        const d2 = dx*dx + dy*dy;

        if (d2 < explosionSteps*explosionSteps) {
          const d = Math.sqrt(d2) + 0.001;
          const f = (1 - d/explosionSteps) * explosionForce;
          velocities[ix] += (dx/d) * f;
          velocities[ix+1] += (dy/d) * f;
          
          sizes[i] = Math.min(sizes[i] * 2, 20);
        }
      }

      // Fade out
      const fadeOut = () => {
        if (sphere.scale.x > 0.01) {
             sphere.scale.multiplyScalar(0.9);
             requestAnimationFrame(fadeOut);
        } else {
          scene.remove(sphere);
          // Respawn logic
          setTimeout(() => {
             const idx = spheres.indexOf(sphere);
             if (idx !== -1) {
                 spheres[idx] = spawnSingleSphere();
             } else {
                 spheres.push(spawnSingleSphere());
             }
          }, 2000);
        }
      };
      fadeOut();
    }

    function updateSpheres(dt) {
      const w = innerWidth;
      const h = innerHeight;
      const earthRadius = Math.min(w, h) * 0.225;
      const cx = w / 2;
      const cy = h / 2;

      spheres.forEach(sphere => {
        if (!sphere.userData.alive) return;

        sphere.position.x += sphere.userData.vx * dt * 60;
        sphere.position.y += sphere.userData.vy * dt * 60;
        
        sphere.rotation.x += dt * 0.5;
        sphere.rotation.y += dt * 0.5;
        
        // Flicker
        if (Math.random() > 0.3) {
             sphere.material.emissiveIntensity = 2.0 + Math.random() * 1.5;
        }

        // Shield Collision
        let hitShield = false;
        if (shieldMesh) {
             const dx = sphere.position.x - cx;
             const dy = sphere.position.y - cy; 
             const dist = Math.sqrt(dx*dx + dy*dy);
             const shieldHitRadius = earthRadius * 1.25; 
             
             if (dist < shieldHitRadius + SPHERE_RADIUS && dist > earthRadius) {
                 let asteroidAngle = Math.atan2(dy, dx); 
                 let shieldAngle = shieldMesh.rotation.z;
                 
                 const normalize = (a) => {
                     a = a % (Math.PI * 2);
                     if (a < -Math.PI) a += Math.PI * 2;
                     if (a > Math.PI) a -= Math.PI * 2;
                     return a;
                 };
                 
                 let diff = normalize(asteroidAngle - shieldAngle);
                 const halfLen = (Math.PI * 2 * SHIELD_COVERAGE) / 2;
                 
                 if (Math.abs(diff) < halfLen + 0.2) { 
                     explodeSphere(sphere);
                     hitShield = true;
                 }
             }
        }

        // Earth Collision
        if (!hitShield && earthMesh && earthHealth > 0) {
            const dx = sphere.position.x - cx;
            const dy = sphere.position.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const asteroidRadius = SPHERE_RADIUS * sphere.scale.x;
            
            if (dist < earthRadius + asteroidRadius - 10) {
                const damage = 10 * sphere.scale.x;
                damageEarth(damage);
                explodeSphere(sphere);
            }
        }
        
        // Cleanup off-screen
        const maxDim = Math.max(w, h);
        const distFromCenter = Math.sqrt(Math.pow(sphere.position.x - cx, 2) + Math.pow(sphere.position.y - cy, 2));
        if (distFromCenter > maxDim) {
             const dot = (sphere.position.x - cx) * sphere.userData.vx + (sphere.position.y - cy) * sphere.userData.vy;
             if (dot > 0) { 
                 scene.remove(sphere);
                 sphere.userData.alive = false;
                 // respawn
                 const idx = spheres.indexOf(sphere);
                 if (idx !== -1) spheres[idx] = spawnSingleSphere();
             }
        }
      });
    }



    function initPowerSphereMaterial() {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(blueTextureUrl);
        
        powerSphereMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            emissive: 0x0088ff,
            emissiveIntensity: 2.0,
            roughness: 0.2,
            metalness: 0.8
        });
    }

    function spawnPowerSphere() {
        if (!powerSphereMaterial) return;
        
        const geometry = new THREE.SphereGeometry(POWER_SPHERE_RADIUS, 32, 32);
        const mat = powerSphereMaterial.clone(); 
        const mesh = new THREE.Mesh(geometry, mat);
        
        const w = innerWidth;
        const h = innerHeight;
        
        // Spawn at random edge
        let x, y, vx, vy;
        const edge = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
        const offset = 50;
        
        if (edge === 0) { // Top
            x = Math.random() * w;
            y = -offset;
        } else if (edge === 1) { // Right
            x = w + offset;
            y = Math.random() * h;
        } else if (edge === 2) { // Bottom
            x = Math.random() * w;
            y = h + offset;
        } else { // Left
            x = -offset;
            y = Math.random() * h;
        }
        
        // Target random point on opposite side quadrant
        const targetX = w * 0.2 + Math.random() * w * 0.6;
        const targetY = h * 0.2 + Math.random() * h * 0.6;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = 2 + Math.random() * 1.5; 
        
        mesh.userData.vx = (dx / dist) * speed;
        mesh.userData.vy = (dy / dist) * speed;
        
        mesh.position.set(x, y, -50 + Math.random()*100); 
        scene.add(mesh);
        powerSpheres.push(mesh);
    }

    function updatePowerSpheres(dt, t) {
        const timeSec = t / 1000;
        
        const w = innerWidth;
        const h = innerHeight;
        const earthRadius = Math.min(w, h) * 0.225;
        const cx = w / 2;
        const cy = h / 2;

        for (let i = powerSpheres.length - 1; i >= 0; i--) {
            const s = powerSpheres[i];
            
            // Move
            s.position.x += s.userData.vx * dt * 60;
            s.position.y += s.userData.vy * dt * 60;
            s.rotation.z += dt;
            s.rotation.x += dt * 0.5; // Add some tumble
            
            // Pulse Glow
            if (s.material.emissiveIntensity !== undefined) {
                 s.material.emissiveIntensity = 2.0 + Math.sin(t * 0.005) * 0.5;
            }
            
            // --- Collisions ---
            
             // Shield Collision
            let hitShield = false;
            if (shieldMesh) {
                 const dx = s.position.x - cx;
                 const dy = s.position.y - cy; 
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 const shieldHitRadius = earthRadius * 1.25; 
                 
                 // Check if crossing shield line
                 if (dist < shieldHitRadius + POWER_SPHERE_RADIUS && dist > earthRadius) {
                     let objAngle = Math.atan2(dy, dx); 
                     let shieldAngle = shieldMesh.rotation.z;
                     
                     const normalize = (a) => {
                         a = a % (Math.PI * 2);
                         if (a < -Math.PI) a += Math.PI * 2;
                         if (a > Math.PI) a -= Math.PI * 2;
                         return a;
                     };
                     
                     let diff = normalize(objAngle - shieldAngle);
                     const halfLen = (Math.PI * 2 * SHIELD_COVERAGE) / 2;
                     
                     if (Math.abs(diff) < halfLen + 0.3) { 
                         hitShield = true;
                     }
                 }
            }

            if (hitShield) {
                // ADD CHARGE
                if (superPowerCharges < 3) {
                    superPowerCharges++;
                    // Update UI
                    const charges = document.querySelectorAll('.charge:not(.active)');
                    if (charges.length > 0) {
                        charges[0].classList.add('active');
                    }
                }
                
                // Remove
                scene.remove(s);
                powerSpheres.splice(i, 1);
                continue;
            }

            // 2. Earth Collision (Destroy without charging)
            if (earthMesh) {
                const dx = s.position.x - cx;
                const dy = s.position.y - cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // Simple radius check
                if (dist < earthRadius + POWER_SPHERE_RADIUS - 5) {
                    scene.remove(s);
                    powerSpheres.splice(i, 1);
                    continue;
                }
            }

            // 2. Offscreen check
            const distX = s.position.x - cx;
            const distY = s.position.y - cy;
            if (Math.abs(distX) > w/2 + 200 || Math.abs(distY) > h/2 + 200) {
                 scene.remove(s);
                 powerSpheres.splice(i, 1);
            }
        }
    }

    function integrate(dt) {
      const w = innerWidth;
      const h = innerHeight;
      const damping = 0.98;

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        velocities[ix] *= damping;
        velocities[ix+1] *= damping;
        positions[ix] += velocities[ix] * dt * 60;
        positions[ix+1] += velocities[ix+1] * dt * 60;
        sizes[i] += (1 + Math.random() * 2 - sizes[i]) * 0.05;

        if (
          positions[ix] < 0 || positions[ix] > w || 
          positions[ix+1] < 0 || positions[ix+1] > h
        ) {
          positions[ix] = Math.random() * w;
          positions[ix+1] = Math.random() * h;
          velocities[ix] = velocities[ix+1] = 0;
        }
      }
    }

    // ------------------------------------------------
    //  ANIMATION LOOP
    // ------------------------------------------------
    let last = performance.now();

    function animate(t) {
      requestAnimationFrame(animate);

      if (isGameOver) {
          if (composer) composer.render();
          return;
      }

      const now = t;
      if (isGameActive && now > nextPowerSpawnTime) {
          spawnPowerSphere();
          nextPowerSpawnTime = now + 10000; 
      }

      const dt = (t - last) / 1000;
      last = t;
      
      if (earthMesh) {
          earthMesh.rotation.y += 0.001;
      }

      if (indexFinger && isGameActive) {
        if (shieldMesh) {
             const targetAngle = Math.PI - (indexFinger.x * 2.5 * Math.PI);
             shieldMesh.rotation.z += (targetAngle - shieldMesh.rotation.z) * 0.2;
        }
      }

      if (isGameActive) {
          updateSpheres(dt);
          updatePowerSpheres(dt, t);
          integrate(dt);
      }

      if (points) {
          points.geometry.attributes.position.needsUpdate = true;
          points.geometry.attributes.customColor.needsUpdate = true;
          points.geometry.attributes.size.needsUpdate = true;
      }

      if (composer) composer.render();
    }

    initThree();
    animate(performance.now());