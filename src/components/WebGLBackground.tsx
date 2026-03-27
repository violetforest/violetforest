import { Canvas } from '@react-three/fiber'
import { BackgroundShader } from './BackgroundShader'

interface Props {
  roomIndex: number
}

export function WebGLBackground({ roomIndex }: Props) {
  return (
    <div className="webgl-background">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 1] }}
      >
        <BackgroundShader roomIndex={roomIndex} />
      </Canvas>
    </div>
  )
}
