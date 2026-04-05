import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ContourData {
  points: [number, number][]
}

// ---- Starfield ----

function createStarTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const cx = 64, cy = 64

  ctx.clearRect(0, 0, 128, 128)

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.08, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(230, 230, 255, 0.7)')
  gradient.addColorStop(0.5, 'rgba(180, 180, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(100, 100, 200, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  const innerR = 2, outerR = 60
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
  }
  ctx.closePath()
  ctx.fill()

  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12)
  centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)')
  centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = centerGrad
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fill()

  return new THREE.CanvasTexture(canvas)
}

interface StarData {
  position: THREE.Vector3
  baseScale: number
  twinklePhase: number
  twinkleSpeed: number
  baseOpacity: number
}

function StarField() {
  const groupRef = useRef<THREE.Group>(null)
  const starTexture = useMemo(() => createStarTexture(), [])

  const stars = useMemo<StarData[]>(() => {
    const result: StarData[] = []
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 20 + Math.random() * 80

      const sizeRand = Math.random()
      let size: number
      if (sizeRand > 0.96) size = 2 + Math.random() * 3
      else if (sizeRand > 0.8) size = 0.8 + Math.random() * 1.5
      else size = 0.2 + Math.random() * 0.6

      result.push({
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
        ),
        baseScale: size,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 1.5,
        baseOpacity: 0.6 + Math.random() * 0.4,
      })
    }
    return result
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const group = groupRef.current
    if (!group) return
    group.children.forEach((sprite, i) => {
      const d = stars[i]
      const twinkle = 0.4 + 0.6 * Math.sin(t * d.twinkleSpeed + d.twinklePhase)
      const s = d.baseScale * (0.5 + 0.5 * twinkle);
      (sprite as THREE.Sprite).scale.set(s, s, 1);
      ((sprite as THREE.Sprite).material as THREE.SpriteMaterial).opacity = d.baseOpacity * twinkle
    })
  })

  return (
    <group ref={groupRef}>
      {stars.map((s, i) => (
        <sprite key={i} position={s.position}>
          <spriteMaterial
            map={starTexture}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// ---- Chrome Logo ----

function ChromeLogo() {
  const groupRef = useRef<THREE.Group>(null)
  const [paths, setPaths] = useState<ContourData[] | null>(null)
  const { gl } = useThree()

  // Load path data
  useEffect(() => {
    fetch('/logo_paths.json')
      .then(r => r.json())
      .then(setPaths)
      .catch(e => console.error('Failed to load logo paths:', e))
  }, [])

  // Load texture
  const logoTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/logo_texture.png')
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [])

  // Create environment map for chrome reflections
  const envMap = useMemo(() => {
    const cubeRT = new THREE.WebGLCubeRenderTarget(256)
    cubeRT.texture.type = THREE.HalfFloatType

    const envScene = new THREE.Scene()
    const envGeo = new THREE.SphereGeometry(200, 32, 32)
    const envMat = new THREE.ShaderMaterial({
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
          float y = dir.y;
          vec3 top = vec3(0.25, 0.15, 0.5);
          vec3 bot = vec3(0.03, 0.02, 0.08);
          gl_FragColor = vec4(mix(bot, top, y * 0.5 + 0.5), 1.0);
        }
      `,
    })
    envScene.add(new THREE.Mesh(envGeo, envMat))

    const spots = [
      { pos: [90, 70, 90], size: 25 },
      { pos: [-80, 60, 80], size: 22 },
      { pos: [0, 100, 40], size: 28 },
      { pos: [70, 40, 70], size: 18 },
      { pos: [-70, 40, -70], size: 18 },
    ]
    spots.forEach(s => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(s.size, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      )
      m.position.set(s.pos[0], s.pos[1], s.pos[2])
      envScene.add(m)
    })

    const cubeCam = new THREE.CubeCamera(1, 1000, cubeRT)
    cubeCam.update(gl, envScene)
    return cubeRT.texture
  }, [gl])

  // Build geometry from paths
  const { meshes, frontPlaneData } = useMemo(() => {
    if (!paths) return { meshes: [], frontPlaneData: null }

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    paths.forEach(c => c.points.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }))

    const extrudeSettings = {
      depth: 1.0,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.15,
      bevelOffset: 0,
      bevelSegments: 5,
    }

    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: 0x3322bb,
      metalness: 1.0,
      roughness: 0.03,
      envMap,
      envMapIntensity: 3.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
    })

    const geos: { geometry: THREE.ExtrudeGeometry; material: THREE.MeshPhysicalMaterial; zOffset: number }[] = []

    paths.forEach(contour => {
      if (contour.points.length < 3) return
      const shape = new THREE.Shape()
      shape.moveTo(contour.points[0][0], contour.points[0][1])
      for (let i = 1; i < contour.points.length; i++) {
        shape.lineTo(contour.points[i][0], contour.points[i][1])
      }
      shape.closePath()
      try {
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        geo.computeVertexNormals()
        geos.push({ geometry: geo, material: chromeMat, zOffset: -extrudeSettings.depth / 2 })
      } catch (_) { /* skip bad shapes */ }
    })

    return {
      meshes: geos,
      frontPlaneData: {
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        depth: extrudeSettings.depth,
      },
    }
  }, [paths, envMap])

  // Gentle bob
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.5
    }
  })

  if (!paths || meshes.length === 0) return null

  return (
    <group ref={groupRef}>
      {meshes.map((m, i) => (
        <mesh key={i} geometry={m.geometry} material={m.material} position-z={m.zOffset} />
      ))}
      {frontPlaneData && (
        <mesh
          position={[
            frontPlaneData.centerX,
            frontPlaneData.centerY,
            frontPlaneData.depth / 2 + 0.25,
          ]}
          renderOrder={10}
        >
          <planeGeometry args={[frontPlaneData.width, frontPlaneData.height]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            side={THREE.FrontSide}
            depthTest
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

// ---- Combined Scene ----

export const LOGO_POSITION = new THREE.Vector3(0, 2, -8)

export function LogoScene() {
  return (
    <group position={LOGO_POSITION}>
      <StarField />
      <group scale={0.25}>
        <ChromeLogo />
      </group>
      {/* Lighting from 3D example */}
      <spotLight position={[25, 25, 35]} intensity={2000} angle={Math.PI / 3} penumbra={0.2} decay={1.0} />
      <spotLight position={[-25, 20, 30]} intensity={1200} angle={Math.PI / 3.5} penumbra={0.3} />
      <directionalLight position={[0, 35, 15]} intensity={6} />
      <directionalLight position={[-20, 8, -25]} intensity={6} color={0x9955ff} />
      <directionalLight position={[20, -8, -20]} intensity={5} color={0x5555ff} />
      <hemisphereLight args={[0x9977dd, 0x110022, 1.5]} />
      <pointLight position={[0, 0, 30]} intensity={300} distance={70} color={0xffffff} />
      <pointLight position={[30, 0, 10]} intensity={200} distance={50} color={0xccccff} />
      <pointLight position={[-30, 0, 10]} intensity={200} distance={50} color={0xccccff} />
    </group>
  )
}
