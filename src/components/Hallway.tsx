import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const HALLWAY_LENGTH = 14
const HALLWAY_WIDTH = 5.4
const HALLWAY_HEIGHT = 4.5

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
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 1.6, 15], fov: 55, near: 0.1, far: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a1520']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 4, 8]} intensity={1.0} />
        <pointLight position={[0, 3.5, HALLWAY_LENGTH * 0.7]} intensity={0.6} distance={HALLWAY_LENGTH} />
        <pointLight position={[0, 3, 6]} intensity={1.0} distance={8} />

        <CameraRig scrollProgress={scrollProgress} />
        <HallwayGeometry />
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
