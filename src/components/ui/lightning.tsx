import React, { useRef, useEffect } from "react";

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
}

export const Component: React.FC<LightningProps> = ({
  hue = 230,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number | null = null;
    let gl: WebGLRenderingContext | null = null;
    let running = true;
    let program: WebGLProgram | null = null;
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let vertexBuffer: WebGLBuffer | null = null;
    let renderLoop: () => void;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      let displayWidth = 0;
      let displayHeight = 0;
      if (canvas.parentElement && canvas.parentElement.clientWidth > 0 && canvas.parentElement.clientHeight > 0) {
        displayWidth = canvas.parentElement.clientWidth;
        displayHeight = canvas.parentElement.clientHeight;
      } else {
        displayWidth = canvas.clientWidth || 300;
        displayHeight = canvas.clientHeight || 150;
      }
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    
    window.addEventListener("resize", resizeCanvas);

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          uv.x += uXOffset;
          
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          
          float dist = abs(uv.x);
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
          col = pow(col, vec3(1.0)); 
          fragColor = vec4(col, 1.0);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl!.createShader(type);
      if (!shader) {
        console.error("Failed to create shader object.");
        return null;
      }
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        const shaderType = type === gl!.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
        console.error(`Shader compile error (${shaderType}):`, gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const initWebGL = (onRenderLoop: (rl: () => void) => void): boolean => {
      gl = canvas.getContext("webgl");
      if (!gl) {
        console.error("WebGL not supported in this browser.");
        return false;
      }

      const vertexShader = compileShader(vertexShaderSource, gl!.VERTEX_SHADER);
      const fragmentShader = compileShader(fragmentShaderSource, gl!.FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) {
        if (vertexShader) gl!.deleteShader(vertexShader);
        if (fragmentShader) gl!.deleteShader(fragmentShader);
        window.removeEventListener("resize", resizeCanvas);
        return false;
      }

      program = gl!.createProgram();
      if (!program) {
        console.error("Failed to create GL program.");
        gl!.deleteShader(vertexShader);
        gl!.deleteShader(fragmentShader);
        window.removeEventListener("resize", resizeCanvas);
        return false;
      }
      gl!.attachShader(program, vertexShader);
      gl!.attachShader(program, fragmentShader);
      gl!.linkProgram(program);

      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
        console.error("Program linking error:", gl!.getProgramInfoLog(program));
        gl!.deleteProgram(program);
        gl!.deleteShader(vertexShader);
        gl!.deleteShader(fragmentShader);
        window.removeEventListener("resize", resizeCanvas);
        return false;
      }
      gl!.useProgram(program);

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      vertexBuffer = gl!.createBuffer();
      gl!.bindBuffer(gl!.ARRAY_BUFFER, vertexBuffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, vertices, gl!.STATIC_DRAW);

      const aPosition = gl!.getAttribLocation(program, "aPosition");
      gl!.enableVertexAttribArray(aPosition);
      gl!.vertexAttribPointer(aPosition, 2, gl!.FLOAT, false, 0, 0);

      const iResolutionLocation = gl!.getUniformLocation(program, "iResolution");
      const iTimeLocation = gl!.getUniformLocation(program, "iTime");
      const uHueLocation = gl!.getUniformLocation(program, "uHue");
      const uXOffsetLocation = gl!.getUniformLocation(program, "uXOffset");
      const uSpeedLocation = gl!.getUniformLocation(program, "uSpeed");
      const uIntensityLocation = gl!.getUniformLocation(program, "uIntensity");
      const uSizeLocation = gl!.getUniformLocation(program, "uSize");

      const startTime = performance.now();
      
      renderLoop = () => {
        if (!canvasRef.current || !gl || gl!.isContextLost() || !running) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId!);
          return;
        }
        if (!gl) return;
        gl!.uniform2f(iResolutionLocation!, gl!.canvas.width, gl!.canvas.height);
        const currentTime = performance.now();
        const iTimeValue = ((currentTime - startTime) % 5000) / 1000.0;
        gl!.uniform1f(iTimeLocation!, iTimeValue);
        gl!.uniform1f(uHueLocation!, hue);
        gl!.uniform1f(uXOffsetLocation!, xOffset);
        gl!.uniform1f(uSpeedLocation!, speed);
        gl!.uniform1f(uIntensityLocation!, intensity);
        gl!.uniform1f(uSizeLocation!, size);
        gl!.drawArrays(gl!.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(renderLoop);
      };
      
      resizeCanvas(); 
      running = true;
      animationFrameId = requestAnimationFrame(renderLoop);
      onRenderLoop(() => renderLoop);
      return true;
    };

    const cleanupWebGL = () => {
      if (gl && !gl!.isContextLost()) {
        if (program) gl!.deleteProgram(program);
        if (vertexShader) gl!.deleteShader(vertexShader);
        if (fragmentShader) gl!.deleteShader(fragmentShader);
        if (vertexBuffer) gl!.deleteBuffer(vertexBuffer);
      }
      program = null;
      vertexShader = null;
      fragmentShader = null;
      vertexBuffer = null;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      running = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId!);
      cleanupWebGL();
    };
    const handleContextRestored = () => {
      running = true;
      let localRenderLoop: (() => void) | null = null;
      const didInit = initWebGL((rl) => { localRenderLoop = rl; });
      if (didInit && localRenderLoop) {
        resizeCanvas();
        animationFrameId = requestAnimationFrame(localRenderLoop);
      }
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // --- mount 시 반드시 initWebGL() 호출 ---
    let localRenderLoop: (() => void) | null = null;
    const didInit = initWebGL((rl) => { localRenderLoop = rl; });
    if (didInit && localRenderLoop) {
      resizeCanvas();
      running = true;
      animationFrameId = requestAnimationFrame(localRenderLoop);
    }

    return () => {
      running = false;
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId) cancelAnimationFrame(animationFrameId!);
      cleanupWebGL();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}; 