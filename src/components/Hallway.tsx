import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

const HALLWAY_LENGTH = 14
const HALLWAY_WIDTH = 5.4
const HALLWAY_HEIGHT = 4.5
const LOGO_Z = -8

// --- Simplex 3D noise GLSL ---
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
`

/** Generate a blurred shape mask texture from logo shapes for liquid metal effect */
function generateShapeMaskTexture(
  shapes: THREE.Shape[],
  material: THREE.MeshPhysicalMaterial & { userData: Record<string, { value: any }> }
) {
  const bounds = new THREE.Box2()
  for (const shape of shapes) {
    for (const pt of shape.getPoints()) bounds.expandByPoint(pt)
  }

  const width = bounds.max.x - bounds.min.x
  const height = bounds.max.y - bounds.min.y
  const maxDim = Math.max(width, height)
  const pad = maxDim * 0.25
  const paddedMinX = bounds.min.x - pad
  const paddedMinY = bounds.min.y - pad
  const paddedWidth = width + pad * 2
  const paddedHeight = height + pad * 2

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, 1024, 1024)

  const scaleX = 1024 / paddedWidth
  const scaleY = 1024 / paddedHeight

  ctx.save()
  ctx.filter = 'blur(45px)'
  ctx.fillStyle = 'white'
  ctx.scale(scaleX, scaleY)
  ctx.translate(-paddedMinX, -paddedMinY)

  ctx.beginPath()
  for (const shape of shapes) {
    const pts = shape.getPoints(100)
    if (pts.length) {
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    }
    for (const hole of shape.holes) {
      const hPts = hole.getPoints(100)
      if (hPts.length) {
        ctx.moveTo(hPts[0].x, hPts[0].y)
        for (let i = 1; i < hPts.length; i++) ctx.lineTo(hPts[i].x, hPts[i].y)
      }
    }
  }
  ctx.fill('evenodd')
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false

  material.userData.uShapeMask.value = tex
  material.userData.uShapeBounds.value.set(paddedMinX, paddedMinY, paddedWidth, paddedHeight)
}

/** Create liquid metal material with animated iridescent distortion */
function createLiquidMetalMaterial(envMap: THREE.Texture) {
  const dummyTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
  dummyTex.needsUpdate = true

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
  })

  material.userData = {
    uTime: { value: 0 },
    uSpeed: { value: 0.0 },
    uScale: { value: 0.015 },
    uDistortion: { value: 1.62 },
    uEdgeProtection: { value: 1.0 },
    uShapeReactivity: { value: 0.12 },
    uShapeMask: { value: dummyTex },
    uShapeBounds: { value: new THREE.Vector4(0, 0, 1, 1) },
  }

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = material.userData.uTime
    shader.uniforms.uSpeed = material.userData.uSpeed
    shader.uniforms.uScale = material.userData.uScale
    shader.uniforms.uDistortion = material.userData.uDistortion
    shader.uniforms.uEdgeProtection = material.userData.uEdgeProtection
    shader.uniforms.uShapeReactivity = material.userData.uShapeReactivity
    shader.uniforms.uShapeMask = material.userData.uShapeMask
    shader.uniforms.uShapeBounds = material.userData.uShapeBounds

    shader.vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying vec3 vOriginalNormal;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
       vLocalPos = position;
       vOriginalNormal = normal;`
    )

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
    ` + shader.fragmentShader

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
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      /texture2D\(\s*iridescenceThicknessMap\s*,\s*vIridescenceThicknessMapUv\s*\)/g,
      'vec4(vFluidNoise * 0.5 + 0.5)'
    )
  }

  return material
}

function CameraRig({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree()
  useFrame(() => {
    const startZ = HALLWAY_LENGTH + 1
    const endZ = -4
    const wp = Math.min(scrollProgress / 0.85, 1)
    const eased = wp < 0.5 ? 2 * wp * wp : 1 - Math.pow(-2 * wp + 2, 2) / 2
    const z = startZ - eased * (startZ - endZ)
    camera.position.set(0, 1.6, z)
    camera.lookAt(0, 1.8, z - 5)
  })
  return null
}

function HallwayGeometry() {
  // Lipstick uses MeshPhongMaterial { color: 0xffffff, shininess: 100 } on
  // its walls so the hot-pink/purple lights bounce around as bright specular
  // highlights against white.
  const wallMat = useMemo(() =>
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 100,
      side: THREE.FrontSide,
    }), [])

  const hl = HALLWAY_LENGTH / 2

  return (
    <>
      {/* Reflective floor (matches lipstick groundMirror) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, hl]}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_LENGTH + 4]} />
        <MeshReflectorMaterial
          blur={[200, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={1}
          mirror={1}
          roughness={0}
          color="#ffffff"
        />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALLWAY_HEIGHT, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_LENGTH + 4]} />
      </mesh>
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HALLWAY_WIDTH / 2, HALLWAY_HEIGHT / 2, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_LENGTH + 4, HALLWAY_HEIGHT]} />
      </mesh>
      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HALLWAY_WIDTH / 2, HALLWAY_HEIGHT / 2, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_LENGTH + 4, HALLWAY_HEIGHT]} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, HALLWAY_HEIGHT / 2, HALLWAY_LENGTH + 2]} rotation={[0, Math.PI, 0]} material={wallMat}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_HEIGHT]} />
      </mesh>
      {/* Small vertical mirror standing in front of the back wall */}
      <mesh position={[0, HALLWAY_HEIGHT * 0.475, HALLWAY_LENGTH + 1.9]}>
        <planeGeometry args={[HALLWAY_WIDTH * 0.55, HALLWAY_HEIGHT * 0.6]} />
        <MeshReflectorMaterial
          blur={[100, 50]}
          resolution={256}
          mixBlur={0.5}
          mixStrength={1}
          mirror={1}
          roughness={0}
          color="#ffffff"
        />
      </mesh>
    </>
  )
}

/** Environment cubemap for chrome reflections */
function useEnvMap() {
  const { gl } = useThree()
  return useMemo(() => {
    const cubeRT = new THREE.WebGLCubeRenderTarget(512)
    cubeRT.texture.type = THREE.HalfFloatType

    const envScene = new THREE.Scene()
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(200, 64, 64),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPosition = wp.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            vec3 top = vec3(0.25, 0.15, 0.5);
            vec3 bot = vec3(0.03, 0.02, 0.08);
            gl_FragColor = vec4(mix(bot, top, dir.y * 0.5 + 0.5), 1.0);
          }
        `
      })
    ))

    const spots = [
      { pos: [90, 70, 90], color: 0xffffff, size: 25 },
      { pos: [-80, 60, 80], color: 0xffffff, size: 22 },
      { pos: [0, 100, 40], color: 0xffffff, size: 28 },
      { pos: [70, 40, 70], color: 0xeeeeff, size: 18 },
      { pos: [-70, 40, 60], color: 0xeeeeff, size: 16 },
      { pos: [-70, 40, -70], color: 0xaa88ff, size: 18 },
      { pos: [70, -30, -60], color: 0x8866ff, size: 15 },
      { pos: [0, -80, 50], color: 0x664488, size: 18 },
      { pos: [100, 20, 30], color: 0xffffff, size: 20 },
      { pos: [-100, 20, 30], color: 0xddddff, size: 18 },
      { pos: [50, 80, -20], color: 0xffffff, size: 15 },
      { pos: [-50, 80, -20], color: 0xeeeeff, size: 14 },
    ]
    spots.forEach(s => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(s.size, 16, 16),
        new THREE.MeshBasicMaterial({ color: s.color })
      )
      m.position.set(s.pos[0], s.pos[1], s.pos[2])
      envScene.add(m)
    })

    new THREE.CubeCamera(1, 1000, cubeRT).update(gl, envScene)
    return cubeRT.texture
  }, [gl])
}

interface LogoRefs {
  material: THREE.MeshPhysicalMaterial
  frontPlane: THREE.Mesh
  frontMat: THREE.MeshBasicMaterial
  group: THREE.Group
  baseY: React.MutableRefObject<number>
}

/** Liquid metal 3D extruded logo (currently disabled on the classic page) */
// @ts-expect-error preserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Logo3D({ envMap, onRefs }: { envMap: THREE.Texture; onRefs?: (r: LogoRefs) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null)
  const baseY = useRef(1.7)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    let disposed = false

    async function load() {
      try {
        const [logoPaths, logoTexture] = await Promise.all([
          fetch('/logo_paths.json').then(r => r.json()),
          new Promise<THREE.Texture>((res, rej) =>
            new THREE.TextureLoader().load('/logo_texture.png', res, undefined, rej)
          ),
        ])
        if (disposed) return

        logoTexture.colorSpace = THREE.SRGBColorSpace
        logoTexture.minFilter = THREE.LinearFilter
        logoTexture.magFilter = THREE.LinearFilter

        const ext = { depth: 0.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelOffset: 0, bevelSegments: 5, steps: 2 }
        const liquidMat = createLiquidMetalMaterial(envMap)
        materialRef.current = liquidMat

        const allShapes: THREE.Shape[] = []
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

        logoPaths.forEach((c: any) => {
          const pts = c.points
          if (pts.length < 3) return
          pts.forEach(([x, y]: [number, number]) => {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x)
            minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          })
          const shape = new THREE.Shape()
          shape.moveTo(pts[0][0], pts[0][1])
          for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
          shape.closePath()
          allShapes.push(shape)
          try {
            const geo = new THREE.ExtrudeGeometry(shape, ext)
            geo.computeVertexNormals()
            const mesh = new THREE.Mesh(geo, liquidMat)
            mesh.position.z = -ext.depth / 2
            group!.add(mesh)
          } catch { /* skip */ }
        })

        // Textured front face
        const w = maxX - minX, h = maxY - minY
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
        const fMat = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, alphaTest: 0.01, side: THREE.FrontSide, depthTest: true, depthWrite: false, toneMapped: false })
        const frontPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          fMat
        )
        frontPlane.position.set(cx, cy, 0.47)
        frontPlane.renderOrder = 10
        group!.add(frontPlane)

        if (allShapes.length > 0) {
          generateShapeMaskTexture(allShapes, liquidMat as any)
        }

        // Scale to fit hallway
        group!.scale.set(0.235, 0.235, 0.235)
        const box = new THREE.Box3().setFromObject(group!)
        const center = box.getCenter(new THREE.Vector3())
        group!.position.sub(center)
        group!.position.set(0, 1.7, -7.4)
        onRefs?.({ material: liquidMat, frontPlane, frontMat: fMat, group: group!, baseY })
      } catch (e) {
        console.error('Logo load error:', e)
      }
    }
    load()

    return () => {
      disposed = true
      while (group.children.length) {
        const c = group.children[0] as THREE.Mesh
        group.remove(c)
        c.geometry?.dispose()
        if (c.material) (c.material as THREE.Material).dispose()
      }
    }
  }, [envMap])

  useFrame(({ clock }) => {
    if (!groupRef.current || groupRef.current.children.length === 0) return
    const t = clock.getElapsedTime()
    groupRef.current.position.y = baseY.current + Math.sin(t * 0.4) * 0.12
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.01
    if (materialRef.current) {
      materialRef.current.userData.uTime.value = t
    }
  })

  return <group ref={groupRef} />
}

/** Twinkling 4-pointed star field */
function StarField() {
  const groupRef = useRef<THREE.Group>(null)
  const starsRef = useRef<{ sprite: THREE.Sprite; baseScale: number; phase: number; speed: number; baseOp: number }[]>([])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const cv = document.createElement('canvas')
    cv.width = 128; cv.height = 128
    const ctx = cv.getContext('2d')!
    const c = 64
    ctx.clearRect(0, 0, 128, 128)
    const g = ctx.createRadialGradient(c, c, 0, c, c, 60)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.08, 'rgba(255,255,255,1)')
    g.addColorStop(0.2, 'rgba(230,230,255,0.7)')
    g.addColorStop(0.5, 'rgba(180,180,255,0.3)')
    g.addColorStop(1, 'rgba(100,100,200,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2
      const r = i % 2 === 0 ? 60 : 2
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath(); ctx.fill()
    const cg = ctx.createRadialGradient(c, c, 0, c, c, 12)
    cg.addColorStop(0, 'rgba(255,255,255,1)')
    cg.addColorStop(0.5, 'rgba(255,255,255,0.6)')
    cg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = cg
    ctx.beginPath(); ctx.arc(c, c, 12, 0, Math.PI * 2); ctx.fill()
    const tex = new THREE.CanvasTexture(cv)

    const stars: typeof starsRef.current = []
    for (let i = 0; i < 4000; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
      const sprite = new THREE.Sprite(mat)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const rad = 20 + Math.random() * 150
      sprite.position.set(
        rad * Math.sin(phi) * Math.cos(theta),
        rad * Math.sin(phi) * Math.sin(theta),
        rad * Math.cos(phi)
      )
      const sr = Math.random()
      const sz = sr > 0.98 ? 2 + Math.random() * 2 : sr > 0.92 ? 1.2 + Math.random() * 1.5 : sr > 0.7 ? 0.5 + Math.random() * 0.8 : 0.15 + Math.random() * 0.4
      sprite.scale.set(sz, sz, 1)
      stars.push({ sprite, baseScale: sz, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 1.2, baseOp: 0.7 + Math.random() * 0.3 })
      group.add(sprite)
    }
    starsRef.current = stars

    return () => {
      stars.forEach(s => { group.remove(s.sprite); s.sprite.material.dispose() })
      tex.dispose()
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    starsRef.current.forEach(({ sprite, baseScale, phase, speed, baseOp }) => {
      const tw = 0.5 + 0.5 * Math.sin(t * speed + phase)
      const sc = baseScale * (0.6 + 0.4 * tw)
      sprite.scale.set(sc, sc, 1)
      sprite.material.opacity = baseOp * tw
    })
  })

  return <group ref={groupRef} position={[0, HALLWAY_HEIGHT / 2, LOGO_Z]} />
}

/** Lipstick-hallway lighting (1 purple + 3 hot-pink point lights),
 * positioned inside the classic tunnel. */
function LogoLighting() {
  const cz = HALLWAY_LENGTH / 2
  return (
    <>
      <pointLight color="#7F00FF" intensity={1.5} distance={4.5} position={[0, HALLWAY_HEIGHT * 0.6, cz]} />
      <pointLight color="#FF1493" intensity={0.5} distance={1.125} position={[HALLWAY_WIDTH / 2 * 0.9, HALLWAY_HEIGHT / 2, 3]} />
      <pointLight color="#FF1493" intensity={0.5} distance={11.25} position={[-HALLWAY_WIDTH / 2 * 0.9, HALLWAY_HEIGHT / 2, cz]} />
      <pointLight color="#FF1493" intensity={0.5} distance={22.5} position={[0, HALLWAY_HEIGHT / 2, HALLWAY_LENGTH]} />
    </>
  )
}

/** Lipstick grid skybox: inverted box with grid.jpeg on every face. */
function SkyBox() {
  const texture = useMemo(() => {
    const base = import.meta.env.BASE_URL || '/'
    return new THREE.TextureLoader().load(`${base}lipstick-hallway/cubeTexture/grid.jpeg`)
  }, [])
  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1}>
      <boxGeometry args={[1000, 1000, 1000]} />
      <meshBasicMaterial map={texture} depthWrite={false} />
    </mesh>
  )
}

function SceneContent({ onRefs: _onRefs }: { onRefs?: (r: LogoRefs) => void }) {
  useEnvMap()
  return (
    <>
      <SkyBox />
      <StarField />
      <LogoLighting />
    </>
  )
}

/** Slider panel for liquid metal material tweaking */
function LiquidMetalPanel({ refs }: { refs: LogoRefs }) {
  const [, forceUpdate] = useState(0)
  const rerender = useCallback(() => forceUpdate(n => n + 1), [])

  const { material, frontPlane, frontMat, group, baseY } = refs
  const ud = material.userData

  type Slider = { label: string; get: () => number; set: (v: number) => void; min: number; max: number; step: number }
  type Section = { title: string; sliders: Slider[] }

  const sections: Section[] = [
    {
      title: 'Liquid Metal',
      sliders: [
        { label: 'Ripple Scale', get: () => ud.uScale.value, set: v => { ud.uScale.value = v }, min: 0.0001, max: 0.015, step: 0.0001 },
        { label: 'Shape Reactivity', get: () => ud.uShapeReactivity.value, set: v => { ud.uShapeReactivity.value = v }, min: 0, max: 5, step: 0.01 },
        { label: 'Distortion', get: () => ud.uDistortion.value, set: v => { ud.uDistortion.value = v }, min: 0, max: 5, step: 0.01 },
        { label: 'Edge Sharpness', get: () => ud.uEdgeProtection.value, set: v => { ud.uEdgeProtection.value = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Speed', get: () => ud.uSpeed.value, set: v => { ud.uSpeed.value = v }, min: 0, max: 2, step: 0.01 },
      ],
    },
    {
      title: 'Material',
      sliders: [
        { label: 'Iridescence', get: () => material.iridescence, set: v => { material.iridescence = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Iridescence IOR', get: () => material.iridescenceIOR, set: v => { material.iridescenceIOR = v }, min: 1, max: 3, step: 0.01 },
        { label: 'Roughness', get: () => material.roughness, set: v => { material.roughness = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Metalness', get: () => material.metalness, set: v => { material.metalness = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Clearcoat', get: () => material.clearcoat, set: v => { material.clearcoat = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Clearcoat Rough', get: () => material.clearcoatRoughness, set: v => { material.clearcoatRoughness = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Reflectivity', get: () => material.reflectivity, set: v => { material.reflectivity = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Env Intensity', get: () => material.envMapIntensity, set: v => { material.envMapIntensity = v }, min: 0, max: 5, step: 0.1 },
        { label: 'Opacity', get: () => material.opacity, set: v => { material.opacity = v; material.transparent = v < 1 }, min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      title: 'Front Texture',
      sliders: [
        { label: 'Tex Z Offset', get: () => frontPlane.position.z, set: v => { frontPlane.position.z = v }, min: -1, max: 2, step: 0.01 },
        { label: 'Tex Scale X', get: () => frontPlane.scale.x, set: v => { frontPlane.scale.x = v }, min: 0.5, max: 2, step: 0.01 },
        { label: 'Tex Scale Y', get: () => frontPlane.scale.y, set: v => { frontPlane.scale.y = v }, min: 0.5, max: 2, step: 0.01 },
        { label: 'Tex Opacity', get: () => frontMat.opacity, set: v => { frontMat.opacity = v }, min: 0, max: 1, step: 0.01 },
        { label: 'Tex Visible', get: () => frontPlane.visible ? 1 : 0, set: v => { frontPlane.visible = v > 0.5 }, min: 0, max: 1, step: 1 },
      ],
    },
    {
      title: 'Transform',
      sliders: [
        { label: 'Scale', get: () => group.scale.x, set: v => { group.scale.set(v, v, v) }, min: 0.05, max: 0.4, step: 0.005 },
        { label: 'Pos Y', get: () => baseY.current, set: v => { baseY.current = v }, min: 0, max: 5, step: 0.05 },
        { label: 'Pos Z', get: () => group.position.z, set: v => { group.position.z = v }, min: -15, max: 0, step: 0.1 },
        { label: 'Rot X', get: () => group.rotation.x, set: v => { group.rotation.x = v }, min: -0.5, max: 0.5, step: 0.01 },
        { label: 'Rot Y', get: () => group.rotation.y, set: v => { group.rotation.y = v }, min: -1, max: 1, step: 0.01 },
      ],
    },
  ]

  const panelStyle: React.CSSProperties = {
    position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    padding: '1rem', width: '240px', maxHeight: '85vh', overflowY: 'auto',
    fontFamily: 'monospace', fontSize: '0.6rem', color: '#fff',
  }

  const copyJson = () => {
    const config: Record<string, number> = {}
    sections.forEach(sec => sec.sliders.forEach(s => { config[s.label] = Number(s.get().toFixed(4)) }))
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  return (
    <div style={panelStyle}>
      {sections.map(sec => (
        <div key={sec.title}>
          <p style={{ fontWeight: 600, fontSize: '0.65rem', marginBottom: '0.5rem', marginTop: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>{sec.title}</p>
          {sec.sliders.map(s => (
            <div key={s.label} style={{ marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{s.label}</span>
                <span style={{ opacity: 0.5 }}>{s.get().toFixed(3)}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.get()}
                onChange={e => { s.set(parseFloat(e.target.value)); rerender() }}
                style={{ width: '100%', height: '4px' }} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={copyJson} style={{
        marginTop: '0.6rem', width: '100%', padding: '0.4rem',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.6rem', color: '#fff',
      }}>
        copy json
      </button>
    </div>
  )
}

interface Props {
  scrollProgress: number
}

export function Hallway({ scrollProgress }: Props) {
  const [logoRefs, setLogoRefs] = useState<LogoRefs | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)


  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100%',
        zIndex: 2,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{ position: [0, 1.6, 15], fov: 55, near: 0.1, far: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#000000']} />

        <CameraRig scrollProgress={scrollProgress} />
        <HallwayGeometry />
        <SceneContent onRefs={setLogoRefs} />
      </Canvas>

      <button
        onClick={() => setPanelVisible(v => !v)}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '4px', padding: '0.4rem 0.7rem', fontSize: '0.7rem',
          cursor: 'pointer', fontFamily: 'monospace', opacity: 0.6, color: '#fff',
          display: panelVisible ? 'none' : 'block',
        }}
      >
        controls
      </button>

      {panelVisible && logoRefs && (
        <>
          <LiquidMetalPanel refs={logoRefs} />
          <button
            onClick={() => setPanelVisible(false)}
            style={{
              position: 'absolute', top: '1rem', right: '265px', zIndex: 10,
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px', padding: '0.4rem 0.7rem', fontSize: '0.7rem',
              cursor: 'pointer', fontFamily: 'monospace', opacity: 0.6, color: '#fff',
            }}
          >
            close
          </button>
        </>
      )}

      {/* Scroll hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          opacity: Math.max(0, 0.35 - scrollProgress * 2),
          fontSize: '1.5rem',
          color: '#f0eaf5',
          animation: 'scrollHint 2s ease-in-out infinite',
        }}
      >
        &darr;
      </div>
    </div>
  )
}
