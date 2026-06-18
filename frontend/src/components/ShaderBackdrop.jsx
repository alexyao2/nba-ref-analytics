import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function ShaderPlane() {
  const materialRef = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color("#071a3d") },
    uColorB: { value: new THREE.Color("#ffffff") },
    uColorC: { value: new THREE.Color("#17408B") }
  }), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[5.8, 3.4, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin((pos.x * 2.2 + uTime * 0.45)) * 0.08;
            pos.z += cos((pos.y * 2.8 - uTime * 0.34)) * 0.06;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;

          void main() {
            float wave = sin((vUv.x + vUv.y) * 6.0 + uTime * 0.55) * 0.5 + 0.5;
            float glow = smoothstep(0.72, 0.12, distance(vUv, vec2(0.72, 0.28)));
            vec3 color = mix(uColorA, uColorC, vUv.y + wave * 0.16);
            color = mix(color, uColorB, glow * 0.38);
            gl_FragColor = vec4(color, 0.9);
          }
        `}
        transparent
      />
    </mesh>
  );
}

export default function ShaderBackdrop() {
  return (
    <div className="shader-backdrop" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 2.2], fov: 55 }} dpr={[1, 1.5]}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
