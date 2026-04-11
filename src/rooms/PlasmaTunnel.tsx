import { useRef, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const tunnelVertex = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const tunnelFragment = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;

  float noise(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - u_resolution) / min(u_resolution.x, u_resolution.y);

    float angle = atan(uv.y, uv.x);
    float dist = length(uv);

    float depth = 1.0 / (dist + 0.1);
    float a = angle / 3.14159265;

    float t = u_time * 0.6;
    vec2 tc = vec2(depth * 0.4 + t, a);

    // Plasma waves on tunnel surface
    float p = 0.0;
    p += sin(tc.x * 4.0 + u_time * 0.5) * 0.5;
    p += sin(tc.y * 6.0 - u_time * 0.3) * 0.5;
    p += sin((tc.x + tc.y) * 3.0 + u_time * 0.4) * 0.5;
    p += sin(length(tc) * 5.0 - u_time * 0.7) * 0.5;

    // Particle blobs from original shader
    float blobR = 0.0;
    float blobG = 0.0;
    float blobB = 0.0;
    for (int i = 0; i < 12; i++) {
      float k = float(i);
      float na = noise(vec2(k * 1.1, 0.0));
      float nb = noise(vec2(k * 2.8, 0.0));
      float nc = noise(vec2(k * 0.7, 0.0));

      vec2 bpos;
      bpos.x = tc.x * 0.12 + sin(u_time * na * 0.4) * cos(u_time * nb * 0.3) * 0.5;
      bpos.y = tc.y + sin(u_time * nc * 0.35) * 0.4;

      float d = 0.008 / (length(fract(bpos) - 0.5) + 0.04);

      if (k < 4.0) blobR += d;
      else if (k < 8.0) blobG += d;
      else blobB += d;
    }

    // Purple/magenta/blue plasma palette
    vec3 color;
    color.r = sin(p * 3.14159 + 0.5) * 0.5 + 0.5;
    color.g = sin(p * 3.14159 + 3.5) * 0.5 + 0.5;
    color.b = sin(p * 3.14159 + 5.5) * 0.5 + 0.5;
    color *= vec3(1.2, 0.3, 1.8);

    color += vec3(blobR * 1.1, blobG * 0.5, blobB * 1.8) * 0.025;

    // Triangle-wave fold like original
    vec3 c = mod(color, 2.0);
    if (c.r > 1.0) c.r = 2.0 - c.r;
    if (c.g > 1.0) c.g = 2.0 - c.g;
    if (c.b > 1.0) c.b = 2.0 - c.b;

    // Boost saturation and brightness
    c = pow(c, vec3(1.1)) * 3.0;

    // Tunnel fades from center outward
    float inner = smoothstep(0.0, 0.06, dist);
    float outer = exp(-dist * 1.5);
    c *= inner * outer;

    // Depth pulsing on tunnel walls
    c *= 0.7 + 0.3 * sin(depth * 0.3 + u_time * 0.5);

    // Glow at tunnel vanishing point
    float glow = exp(-dist * 5.0) * 0.9;
    c += vec3(0.5, 0.2, 1.0) * glow;

    gl_FragColor = vec4(c, 1.0);
  }
`

function TunnelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    const vs = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vs, tunnelVertex)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS:', gl.getShaderInfoLog(vs))
      return
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fs, tunnelFragment)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS:', gl.getShaderInfoLog(fs))
      return
    }

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Link:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    gl.clearColor(0, 0, 0, 1)

    const timeLoc = gl.getUniformLocation(program, 'u_time')
    const resLoc = gl.getUniformLocation(program, 'u_resolution')
    const start = Date.now()

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth * dpr
      const h = canvas.clientHeight * dpr
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(timeLoc, (Date.now() - start) / 1000)
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafRef.current = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

export function PlasmaTunnel() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        background: '#000',
      }}
    >
      <TunnelCanvas />
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          fontSize: 14,
          fontFamily: 'monospace',
          zIndex: 20,
          mixBlendMode: 'difference',
        }}
      >
        &larr; back
      </Link>
    </motion.div>
  )
}
