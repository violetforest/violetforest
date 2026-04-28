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
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// ============ LIGHTING (matches Hallway LogoLighting, scaled for the
// larger homepage logo: classic logo is 0.235x scale, homepage is 0.75x,
// so positions/distances are multiplied by 3.19 and intensities of
// distance-attenuated lights by 3.19² ≈ 10.18) ============

const S = 0.75 / 0.235;
const I = S * S;

const keyLight = new THREE.SpotLight(0xffffff, 200 * I);
keyLight.position.set(25 * S, 25 * S, 35 * S);
keyLight.angle = Math.PI / 6;
keyLight.penumbra = 0.5;
keyLight.decay = 2.0;
scene.add(keyLight);

const keyLight2 = new THREE.SpotLight(0xffffff, 120 * I);
keyLight2.position.set(-25 * S, 20 * S, 30 * S);
keyLight2.angle = Math.PI / 6;
keyLight2.penumbra = 0.5;
keyLight2.decay = 2.0;
scene.add(keyLight2);

const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
topLight.position.set(0, 35 * S, 15 * S);
scene.add(topLight);

const rimLight = new THREE.DirectionalLight(0x9955ff, 2);
rimLight.position.set(-20 * S, 8 * S, -25 * S);
scene.add(rimLight);

const rimLight2 = new THREE.DirectionalLight(0x5555ff, 1.5);
rimLight2.position.set(20 * S, -8 * S, -20 * S);
scene.add(rimLight2);

const frontFill = new THREE.PointLight(0xffffff, 80 * I, 20 * S);
frontFill.position.set(0, 0, 8 * S);
scene.add(frontFill);

const sideLight1 = new THREE.PointLight(0xccccff, 50 * I, 15 * S);
sideLight1.position.set(8 * S, 0, 3 * S);
scene.add(sideLight1);

const sideLight2 = new THREE.PointLight(0xccccff, 50 * I, 15 * S);
sideLight2.position.set(-8 * S, 0, 3 * S);
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

// ============ LIQUID METAL SHADER (ported from Hallway.tsx) ============

const simplex3D = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

function generateShapeMaskTexture(shapes, material) {
    const bounds = new THREE.Box2();
    for (const shape of shapes) {
        for (const pt of shape.getPoints()) bounds.expandByPoint(pt);
    }

    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const maxDim = Math.max(width, height);
    const pad = maxDim * 0.25;
    const paddedMinX = bounds.min.x - pad;
    const paddedMinY = bounds.min.y - pad;
    const paddedWidth = width + pad * 2;
    const paddedHeight = height + pad * 2;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1024, 1024);

    const scaleX = 1024 / paddedWidth;
    const scaleY = 1024 / paddedHeight;

    ctx.save();
    ctx.filter = 'blur(45px)';
    ctx.fillStyle = 'white';
    ctx.scale(scaleX, scaleY);
    ctx.translate(-paddedMinX, -paddedMinY);

    ctx.beginPath();
    for (const shape of shapes) {
        const pts = shape.getPoints(100);
        if (pts.length) {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        }
        for (const hole of shape.holes) {
            const hPts = hole.getPoints(100);
            if (hPts.length) {
                ctx.moveTo(hPts[0].x, hPts[0].y);
                for (let i = 1; i < hPts.length; i++) ctx.lineTo(hPts[i].x, hPts[i].y);
            }
        }
    }
    ctx.fill('evenodd');
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false;

    material.userData.uShapeMask.value = tex;
    material.userData.uShapeBounds.value.set(paddedMinX, paddedMinY, paddedWidth, paddedHeight);
}

function createLiquidMetalMaterial(envMap) {
    const dummyTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    dummyTex.needsUpdate = true;

    const material = new THREE.MeshPhysicalMaterial({
        color: 0xeeeeee,
        metalness: 1.0,
        roughness: 0.33,
        clearcoat: 0.14,
        clearcoatRoughness: 0.0,
        iridescence: 1.0,
        iridescenceIOR: 1.0,
        iridescenceThicknessRange: [759, 800],
        iridescenceThicknessMap: dummyTex,
        envMap,
        envMapIntensity: 0.0,
        dithering: true,
    });

    material.userData = {
        uTime: { value: 0 },
        uSpeed: { value: 0.0 },
        uScale: { value: 0.015 },
        uDistortion: { value: 1.62 },
        uEdgeProtection: { value: 1.0 },
        uShapeReactivity: { value: 0.12 },
        uShapeMask: { value: dummyTex },
        uShapeBounds: { value: new THREE.Vector4(0, 0, 1, 1) },
    };

    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = material.userData.uTime;
        shader.uniforms.uSpeed = material.userData.uSpeed;
        shader.uniforms.uScale = material.userData.uScale;
        shader.uniforms.uDistortion = material.userData.uDistortion;
        shader.uniforms.uEdgeProtection = material.userData.uEdgeProtection;
        shader.uniforms.uShapeReactivity = material.userData.uShapeReactivity;
        shader.uniforms.uShapeMask = material.userData.uShapeMask;
        shader.uniforms.uShapeBounds = material.userData.uShapeBounds;

        shader.vertexShader = `
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;
          varying vec3 vOriginalNormal;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
             vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
             vLocalPos = position;
             vOriginalNormal = normal;`
        );

        shader.fragmentShader = `
          uniform float uTime;
          uniform float uSpeed;
          uniform float uScale;
          uniform float uDistortion;
          uniform float uEdgeProtection;
          uniform float uShapeReactivity;
          uniform sampler2D uShapeMask;
          uniform vec4 uShapeBounds;
          varying vec3 vWorldPos;
          varying vec3 vLocalPos;
          varying vec3 vOriginalNormal;
          float vFluidNoise;
          ${simplex3D}
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <normal_fragment_begin>',
            `#include <normal_fragment_begin>

             vec2 shapeUV = (vLocalPos.xy - uShapeBounds.xy) / uShapeBounds.zw;
             vec2 texEps = vec2(4.0 / 1024.0);
             float maskC = texture2D(uShapeMask, shapeUV).r;
             float maskR = texture2D(uShapeMask, shapeUV + vec2(texEps.x, 0.0)).r;
             float maskL = texture2D(uShapeMask, shapeUV - vec2(texEps.x, 0.0)).r;
             float maskT = texture2D(uShapeMask, shapeUV + vec2(0.0, texEps.y)).r;
             float maskB = texture2D(uShapeMask, shapeUV - vec2(0.0, texEps.y)).r;
             float smoothDist = (maskC + maskR + maskL + maskT + maskB) * 0.2;
             vec2 maskGrad = vec2(maskR - maskL, maskT - maskB) / (2.0 * texEps.x);

             vec3 p = vLocalPos * uScale;
             p.z += smoothDist * uShapeReactivity * 150.0 * uScale;
             vec2 contourTangent = vec2(-maskGrad.y, maskGrad.x);
             p.xy += contourTangent * (uTime * uSpeed * 0.5);
             p.y -= uTime * uSpeed * 0.1;

             vec3 warp;
             warp.x = snoise(p + vec3(0.0, 0.0, uTime * 0.1));
             warp.y = snoise(p + vec3(114.5, 22.1, uTime * 0.1));
             warp.z = snoise(p + vec3(233.2, 51.5, uTime * 0.1));
             vec3 warpedP = p + warp * 1.5;

             float eps = 0.03;
             float n0 = snoise(warpedP);
             float nx = snoise(warpedP + vec3(eps, 0.0, 0.0));
             float ny = snoise(warpedP + vec3(0.0, eps, 0.0));
             float nz = snoise(warpedP + vec3(0.0, 0.0, eps));

             vFluidNoise = n0 + (smoothDist * uShapeReactivity * 2.0);

             vec3 noiseNormal = normalize(vec3(nx - n0, ny - n0, nz - n0));
             vec3 viewNoiseNormal = normalize((viewMatrix * vec4(noiseNormal, 0.0)).xyz);
             float isFlatFace = smoothstep(0.1, 0.9, abs(vOriginalNormal.z));
             float edgeMask = mix(1.0, isFlatFace, uEdgeProtection);
             normal = normalize(normal + viewNoiseNormal * uDistortion * edgeMask);`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            /texture2D\(\s*iridescenceThicknessMap\s*,\s*vIridescenceThicknessMapUv\s*\)/g,
            'vec4(vFluidNoise * 0.5 + 0.5)'
        );
    };

    return material;
}

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
    
    // Liquid metal material for the sides (matches Hallway logo)
    const chromeMaterial = createLiquidMetalMaterial(envMap);
    window.liquidMat = chromeMaterial;
    
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

    if (shapes.length > 0) {
        generateShapeMaskTexture(shapes, chromeMaterial);
    }
    
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

    if (window.liquidMat) {
        window.liquidMat.userData.uTime.value = elapsedTime * 0.5;
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

// ============ CLICK LOGO → LISTENING ============

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
    if (!window.logoGroup) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(window.logoGroup.children, true);
    if (intersects.length > 0) {
        const dest = '/listening';
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'navigate', to: dest }, '*');
        } else {
            window.location.href = dest;
        }
    }
});

renderer.domElement.style.cursor = 'pointer';
