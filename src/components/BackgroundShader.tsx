import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Soft purple palettes
const ROOM_PALETTES = [
  // Home — soft lavender / lilac
  [new THREE.Color('#f0eaf5'), new THREE.Color('#e0d0f0'), new THREE.Color('#d8c8eb')],
  // Listening — deeper violet / periwinkle
  [new THREE.Color('#e0d0f0'), new THREE.Color('#c8b8e8'), new THREE.Color('#b8a8e0')],
  // Thinking — cool purple / blue-violet
  [new THREE.Color('#e0e0f5'), new THREE.Color('#d0c8f0'), new THREE.Color('#c0b8e8')],
  // Making — warm purple / mauve
  [new THREE.Color('#f0e0f0'), new THREE.Color('#e0c8e0'), new THREE.Color('#d8b8d8')],
]

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.08;

    // Very slow, gentle movement
    float w1 = sin(uv.x * 2.0 + t) * sin(uv.y * 1.5 - t * 0.5);
    float w2 = sin(uv.y * 3.0 - t * 0.3) * sin(uv.x * 1.0 + t * 0.2);
    float blend = smoothstep(-0.4, 0.4, w1 + w2 * 0.5);

    float w3 = sin(uv.x * 0.8 + t * 0.2 + 2.0) * sin(uv.y * 1.2 - t * 0.1);
    float blend2 = smoothstep(-0.3, 0.7, w3);

    vec3 col = mix(uColor1, uColor2, blend);
    col = mix(col, uColor3, blend2 * 0.3);

    gl_FragColor = vec4(col, 1.0);
  }
`

interface Props {
  roomIndex: number
}

export function BackgroundShader({ roomIndex }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const currentColors = useRef({
    color1: ROOM_PALETTES[0][0].clone(),
    color2: ROOM_PALETTES[0][1].clone(),
    color3: ROOM_PALETTES[0][2].clone(),
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: currentColors.current.color1 },
      uColor2: { value: currentColors.current.color2 },
      uColor3: { value: currentColors.current.color3 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }),
    []
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime()

    const target = ROOM_PALETTES[roomIndex] || ROOM_PALETTES[0]
    const lerpSpeed = 0.02
    currentColors.current.color1.lerp(target[0], lerpSpeed)
    currentColors.current.color2.lerp(target[1], lerpSpeed)
    currentColors.current.color3.lerp(target[2], lerpSpeed)

    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  })

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
