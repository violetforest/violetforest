import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Logo path data will be loaded
let logoPaths = [];

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.0;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// ============ LIGHTING FOR CHROME EFFECT ============

const keyLight = new THREE.SpotLight(0xffffff, 2000);
keyLight.position.set(25, 25, 35);
keyLight.angle = Math.PI / 3;
keyLight.penumbra = 0.2;
keyLight.decay = 1.0;
scene.add(keyLight);

const keyLight2 = new THREE.SpotLight(0xffffff, 1200);
keyLight2.position.set(-25, 20, 30);
keyLight2.angle = Math.PI / 3.5;
keyLight2.penumbra = 0.3;
scene.add(keyLight2);

const topLight = new THREE.DirectionalLight(0xffffff, 6);
topLight.position.set(0, 35, 15);
scene.add(topLight);

const rimLight = new THREE.DirectionalLight(0x9955ff, 6);
rimLight.position.set(-20, 8, -25);
scene.add(rimLight);

const rimLight2 = new THREE.DirectionalLight(0x5555ff, 5);
rimLight2.position.set(20, -8, -20);
scene.add(rimLight2);

const hemiLight = new THREE.HemisphereLight(0x9977dd, 0x110022, 1.5);
scene.add(hemiLight);

const frontFill = new THREE.PointLight(0xffffff, 300, 70);
frontFill.position.set(0, 0, 30);
scene.add(frontFill);

const sideLight1 = new THREE.PointLight(0xccccff, 200, 50);
sideLight1.position.set(30, 0, 10);
scene.add(sideLight1);

const sideLight2 = new THREE.PointLight(0xccccff, 200, 50);
sideLight2.position.set(-30, 0, 10);
scene.add(sideLight2);

// ============ 4-POINTED STAR PARTICLE SYSTEM ============

function createStarField() {
    const starCount = 3500;
    const starGroup = new THREE.Group();
    
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64, cy = 64;
    
    ctx.clearRect(0, 0, 128, 128);
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.08, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(230, 230, 255, 0.7)');
    gradient.addColorStop(0.5, 'rgba(180, 180, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 100, 200, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    const innerR = 2;
    const outerR = 60;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
    centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    
    const starTexture = new THREE.CanvasTexture(canvas);
    
    const stars = [];
    
    for (let i = 0; i < starCount; i++) {
        const starMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1.0
        });
        
        const sprite = new THREE.Sprite(starMaterial);
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 40 + Math.random() * 160;
        
        sprite.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        const sizeRand = Math.random();
        let size;
        if (sizeRand > 0.96) {
            size = 4 + Math.random() * 5;
        } else if (sizeRand > 0.8) {
            size = 1.5 + Math.random() * 2.5;
        } else {
            size = 0.4 + Math.random() * 1;
        }
        sprite.scale.set(size, size, 1);
        
        sprite.userData = {
            baseScale: size,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.3 + Math.random() * 1.5,
            baseOpacity: 0.6 + Math.random() * 0.4
        };
        
        starGroup.add(sprite);
        stars.push(sprite);
    }
    
    scene.add(starGroup);
    return { group: starGroup, stars: stars };
}

const starSystem = createStarField();

// ============ ENVIRONMENT MAP FOR CHROME REFLECTIONS ============

function createEnvMap() {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    
    const envScene = new THREE.Scene();
    
    const envGeo = new THREE.SphereGeometry(200, 64, 64);
    const envMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec3 dir = normalize(vWorldPosition);
                float y = dir.y;
                vec3 topColor = vec3(0.25, 0.15, 0.5);
                vec3 bottomColor = vec3(0.03, 0.02, 0.08);
                vec3 color = mix(bottomColor, topColor, y * 0.5 + 0.5);
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
    const envSphere = new THREE.Mesh(envGeo, envMat);
    envScene.add(envSphere);
    
    const brightSpots = [
        { pos: new THREE.Vector3(90, 70, 90), color: 0xffffff, size: 25 },
        { pos: new THREE.Vector3(-80, 60, 80), color: 0xffffff, size: 22 },
        { pos: new THREE.Vector3(0, 100, 40), color: 0xffffff, size: 28 },
        { pos: new THREE.Vector3(70, 40, 70), color: 0xeeeeff, size: 18 },
        { pos: new THREE.Vector3(-70, 40, 60), color: 0xeeeeff, size: 16 },
        { pos: new THREE.Vector3(-70, 40, -70), color: 0xaa88ff, size: 18 },
        { pos: new THREE.Vector3(70, -30, -60), color: 0x8866ff, size: 15 },
        { pos: new THREE.Vector3(0, -80, 50), color: 0x664488, size: 18 },
        { pos: new THREE.Vector3(100, 20, 30), color: 0xffffff, size: 20 },
        { pos: new THREE.Vector3(-100, 20, 30), color: 0xddddff, size: 18 },
        { pos: new THREE.Vector3(50, 80, -20), color: 0xffffff, size: 15 },
        { pos: new THREE.Vector3(-50, 80, -20), color: 0xeeeeff, size: 14 },
    ];
    
    brightSpots.forEach(spot => {
        const spotGeo = new THREE.SphereGeometry(spot.size, 16, 16);
        const spotMat = new THREE.MeshBasicMaterial({ color: spot.color });
        const spotMesh = new THREE.Mesh(spotGeo, spotMat);
        spotMesh.position.copy(spot.pos);
        envScene.add(spotMesh);
    });
    
    const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    cubeCamera.update(renderer, envScene);
    
    return cubeRenderTarget.texture;
}

const envMap = createEnvMap();

// ============ LOGO 3D MODEL WITH TEXTURED FRONT FACE ============

async function loadAndCreateLogo() {
    try {
        const response = await fetch('logo_paths.json');
        logoPaths = await response.json();
        console.log(`Loaded ${logoPaths.length} contours`);
        
        // Load the logo texture
        const textureLoader = new THREE.TextureLoader();
        const logoTexture = await new Promise((resolve, reject) => {
            textureLoader.load('logo_texture.png', resolve, undefined, reject);
        });
        
        createLogoMesh(logoTexture);
    } catch (error) {
        console.error('Error loading logo:', error);
        createFallbackLogo();
    }
}

function createLogoMesh(logoTexture) {
    const logoGroup = new THREE.Group();
    
    // Configure the texture
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.minFilter = THREE.LinearFilter;
    logoTexture.magFilter = THREE.LinearFilter;
    
    // Calculate bounds for the texture plane
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    logoPaths.forEach((contourData) => {
        const points = contourData.points;
        points.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Extrusion settings
    const extrudeSettings = {
        depth: 1.0,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.15,
        bevelOffset: 0,
        bevelSegments: 5
    };
    
    // Chrome material for the sides
    const chromeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3322bb,
        metalness: 1.0,
        roughness: 0.03,
        envMap: envMap,
        envMapIntensity: 3.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        reflectivity: 1.0,
    });
    
    // Create shapes for each contour
    const shapes = [];
    
    logoPaths.forEach((contourData) => {
        const points = contourData.points;
        if (points.length < 3) return;
        
        const shape = new THREE.Shape();
        shape.moveTo(points[0][0], points[0][1]);
        
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i][0], points[i][1]);
        }
        shape.closePath();
        shapes.push(shape);
    });
    
    // Extrude each shape
    shapes.forEach((shape) => {
        try {
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.computeVertexNormals();
            
            const mesh = new THREE.Mesh(geometry, chromeMaterial);
            // Position so front face is at z = extrudeSettings.depth / 2
            mesh.position.z = -extrudeSettings.depth / 2;
            
            logoGroup.add(mesh);
        } catch (e) {
            console.warn(`Failed to extrude shape:`, e);
        }
    });
    
    // Create a single plane with the full logo texture on the front
    // Position it clearly in front of the 3D extrusion
    const planeGeometry = new THREE.PlaneGeometry(width, height);
    
    // Front face material - the texture overlays the front face
    const frontMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: false,
    });
    
    const frontPlane = new THREE.Mesh(planeGeometry, frontMaterial);
    // Position clearly in front - the bevel is about 0.2, so put it at depth/2 + 0.3
    frontPlane.position.set(centerX, centerY, extrudeSettings.depth / 2 + 0.25);
    frontPlane.renderOrder = 10;
    logoGroup.add(frontPlane);
    
    
    logoGroup.scale.set(0.75, 0.75, 0.75);
    
    // Center the logo
    const box = new THREE.Box3().setFromObject(logoGroup);
    const center = box.getCenter(new THREE.Vector3());
    logoGroup.position.sub(center);
    
    scene.add(logoGroup);
    window.logoGroup = logoGroup;
    
    document.getElementById('loading').style.display = 'none';
}

function createFallbackLogo() {
    const logoGroup = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(10, 2, 0.5);
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x4422aa,
        metalness: 1.0,
        roughness: 0.03,
        envMap: envMap,
        envMapIntensity: 3.0
    });
    const mesh = new THREE.Mesh(geometry, material);
    logoGroup.add(mesh);
    
    scene.add(logoGroup);
    window.logoGroup = logoGroup;
    
    document.getElementById('loading').style.display = 'none';
}

loadAndCreateLogo();

// ============ ANIMATION LOOP ============

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Twinkle the stars
    starSystem.stars.forEach(star => {
        const data = star.userData;
        const twinkle = 0.4 + 0.6 * Math.sin(elapsedTime * data.twinkleSpeed + data.twinklePhase);
        const scale = data.baseScale * (0.5 + 0.5 * twinkle);
        star.scale.set(scale, scale, 1);
        star.material.opacity = data.baseOpacity * twinkle;
    });
    
    // Gentle floating motion for logo
    if (window.logoGroup) {
        window.logoGroup.position.y = Math.sin(elapsedTime * 0.4) * 0.12;
        window.logoGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.01;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

// ============ RESIZE HANDLER ============

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
