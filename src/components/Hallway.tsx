import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const HALLWAY_LENGTH = 14
const HALLWAY_WIDTH = 5.4
const HALLWAY_HEIGHT = 4.5
const LOGO_Z = -8

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
  const wallMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: '#c8b8d8', roughness: 0.9, side: THREE.DoubleSide,
    }), [])
  const floorMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: '#a898b8', roughness: 0.85, side: THREE.DoubleSide,
    }), [])

  const hw = HALLWAY_WIDTH / 2
  const hl = HALLWAY_LENGTH / 2

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, hl]} material={floorMat}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_LENGTH + 4]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALLWAY_HEIGHT, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_LENGTH + 4]} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-hw, HALLWAY_HEIGHT / 2, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_LENGTH + 4, HALLWAY_HEIGHT]} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[hw, HALLWAY_HEIGHT / 2, hl]} material={wallMat}>
        <planeGeometry args={[HALLWAY_LENGTH + 4, HALLWAY_HEIGHT]} />
      </mesh>
      <mesh position={[0, HALLWAY_HEIGHT / 2, HALLWAY_LENGTH + 2]} rotation={[0, Math.PI, 0]} material={wallMat}>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_HEIGHT]} />
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

/** Chrome 3D extruded logo */
function Logo3D({ envMap }: { envMap: THREE.Texture }) {
  const groupRef = useRef<THREE.Group>(null)

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

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        logoPaths.forEach((c: any) =>
          c.points.forEach(([x, y]: [number, number]) => {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x)
            minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          })
        )
        const w = maxX - minX, h = maxY - minY
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2

        const ext = { depth: 1.0, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.15, bevelOffset: 0, bevelSegments: 5 }

        const chrome = new THREE.MeshPhysicalMaterial({
          color: 0x3322bb, metalness: 1.0, roughness: 0.03,
          envMap, envMapIntensity: 3.0,
          clearcoat: 0.5, clearcoatRoughness: 0.1, reflectivity: 1.0,
        })

        logoPaths.forEach((c: any) => {
          const pts = c.points
          if (pts.length < 3) return
          const shape = new THREE.Shape()
          shape.moveTo(pts[0][0], pts[0][1])
          for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
          shape.closePath()
          try {
            const geo = new THREE.ExtrudeGeometry(shape, ext)
            geo.computeVertexNormals()
            const mesh = new THREE.Mesh(geo, chrome)
            mesh.position.z = -ext.depth / 2
            group!.add(mesh)
          } catch { /* skip */ }
        })

        // Textured front face
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, side: THREE.FrontSide, depthTest: true, depthWrite: false })
        )
        plane.position.set(cx, cy, ext.depth / 2 + 0.25)
        plane.renderOrder = 10
        group!.add(plane)

        // Scale to fit hallway
        group!.scale.set(0.15, 0.15, 0.15)
        const box = new THREE.Box3().setFromObject(group!)
        const center = box.getCenter(new THREE.Vector3())
        group!.position.sub(center)
        group!.position.set(0, HALLWAY_HEIGHT / 2, LOGO_Z)
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
    groupRef.current.position.y = HALLWAY_HEIGHT / 2 + Math.sin(t * 0.4) * 0.12
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.01
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

/** Lights to illuminate the chrome logo */
function LogoLighting() {
  return (
    <>
      <spotLight position={[25, HALLWAY_HEIGHT / 2 + 25, LOGO_Z + 35]} intensity={200} angle={Math.PI / 6} penumbra={0.5} decay={2.0} />
      <spotLight position={[-25, HALLWAY_HEIGHT / 2 + 20, LOGO_Z + 30]} intensity={120} angle={Math.PI / 6} penumbra={0.5} decay={2.0} />
      <directionalLight position={[0, HALLWAY_HEIGHT / 2 + 35, LOGO_Z + 15]} intensity={1.5} />
      <directionalLight position={[-20, HALLWAY_HEIGHT / 2 + 8, LOGO_Z - 25]} intensity={2} color="#9955ff" />
      <directionalLight position={[20, HALLWAY_HEIGHT / 2 - 8, LOGO_Z - 20]} intensity={1.5} color="#5555ff" />
      <pointLight position={[0, HALLWAY_HEIGHT / 2, LOGO_Z + 8]} intensity={80} distance={20} />
      <pointLight position={[8, HALLWAY_HEIGHT / 2, LOGO_Z + 3]} intensity={50} distance={15} color="#ccccff" />
      <pointLight position={[-8, HALLWAY_HEIGHT / 2, LOGO_Z + 3]} intensity={50} distance={15} color="#ccccff" />
    </>
  )
}

function SceneContent() {
  const envMap = useEnvMap()
  return (
    <>
      <Logo3D envMap={envMap} />
      <StarField />
      <LogoLighting />
    </>
  )
}

interface Props {
  scrollProgress: number
}

export function Hallway({ scrollProgress }: Props) {
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
        <ambientLight intensity={0.3} />
        <directionalLight position={[0, 4, 8]} intensity={0.4} />
        <pointLight position={[0, 3.5, HALLWAY_LENGTH * 0.7]} intensity={0.3} distance={HALLWAY_LENGTH} />
        <pointLight position={[0, 3, 6]} intensity={0.5} distance={8} />

        <CameraRig scrollProgress={scrollProgress} />
        <HallwayGeometry />
        <SceneContent />
      </Canvas>

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
