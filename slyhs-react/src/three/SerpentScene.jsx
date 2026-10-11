import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from '../lib/gsap';
import { serpentState } from './serpentState';

/*
 * A pit viper built from particles. Every point stores where it sits on the
 * body (aS: 0 tail → 1 snout, aA: angle around the body); the vertex shader
 * builds the spine each frame, so the same points can slither (S-curve),
 * coil (spiral with raised head) or scatter into sparks — all from uniforms
 * that GSAP scrubs with the page scroll.
 */

const vertex = /* glsl */`
  attribute float aS;
  attribute float aA;
  attribute vec3 aRand;
  attribute float aKind; // 0 body, 1 eye

  uniform float uPhase, uTime, uCoil, uDisperse, uPR, uSize;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 spineS(float s) {
    float x = (s - .5) * 10.0;
    float amp = mix(.25, 1.0, smoothstep(0.0, .6, s)) * (1.0 - .55 * smoothstep(.85, 1.0, s));
    float z = sin(s * 6.2831 * 1.35 - uPhase * 1.6) * .95 * amp;
    float y = sin(s * 6.2831 * .7 - uPhase * .9) * .22 + smoothstep(.88, 1.0, s) * .35;
    return vec3(x, y, z);
  }

  vec3 spineCoil(float s) {
    float turns = 2.6;
    float a = s * 6.2831 * turns + uPhase * .12;
    float rad = mix(2.1, 1.05, s);
    float h = -1.25 + s * 1.3;
    vec3 p = vec3(cos(a) * rad, h, sin(a) * rad);
    // neck rises out of the coil, head points at the viewer
    float lift = smoothstep(.8, 1.0, s);
    vec3 strike = vec3(cos(a) * rad * .35, .55 + (s - .8) * 9.0, 1.2 + (s - .8) * 4.0);
    return mix(p, strike, lift * lift);
  }

  vec3 spine(float s) { return mix(spineS(s), spineCoil(s), uCoil); }

  float radius(float s) {
    float body = .36 * mix(.1, 1.0, smoothstep(0.0, .55, s));
    float neck = 1.0 - .32 * exp(-pow((s - .905) / .025, 2.0));
    float head = 1.0 + .42 * exp(-pow((s - .95) / .022, 2.0));
    float tip = 1.0 - smoothstep(.972, 1.0, s) * .85;
    return body * neck * head * tip;
  }

  void main() {
    float s = aS;
    vec3 p = spine(s);
    vec3 T = normalize(spine(min(s + .003, 1.0)) - spine(max(s - .003, 0.0)));
    vec3 up = abs(T.y) > .95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 N = normalize(cross(T, up));
    vec3 B = normalize(cross(N, T));

    float r = radius(s) * (1.0 + sin(uTime * 2.0 + s * 40.0) * .015);
    float flatten = 1.0 - .25 * smoothstep(.88, .96, s); // flatter, wider head
    vec3 offs = cos(aA) * N * r + sin(aA) * B * r * flatten;
    vec3 body = p + offs;

    // scatter: head assembles first, the tail last
    float d = clamp(uDisperse * 1.6 - s * .6, 0.0, 1.0);
    d = d * d * (3.0 - 2.0 * d);
    vec3 drift = vec3(sin(uTime * .3 + aRand.x * 12.0), cos(uTime * .25 + aRand.y * 9.0), sin(uTime * .2 + aRand.z * 7.0)) * .25;
    vec3 scatter = aRand * vec3(7.5, 4.2, 4.0) + drift;
    vec3 pos = mix(body, scatter, d);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // --- colour: lime scales, dark cross bands, pale belly, amber eyes
    float dorsal = sin(aA);                       // +1 back, -1 belly
    float band = smoothstep(.78, .9, fract(s * 24.0 + .1 * sin(aA * 3.0)));
    vec3 lime = vec3(.62, .9, .32);
    vec3 deep = vec3(.16, .42, .14);
    vec3 belly = vec3(.94, .97, .62);
    vec3 c = mix(lime, deep, smoothstep(.2, 1.0, dorsal) * .55);
    c = mix(c, belly, smoothstep(-.55, -.95, dorsal) * .7);
    c = mix(c, vec3(.05, .16, .07), band * smoothstep(-.3, .4, dorsal) * .85);
    c *= .75 + aRand.z * .5;
    c = mix(c, vec3(1.0, .72, .18), aKind);
    c = mix(c, vec3(.82, .95, .5), d * .6);      // sparks glow lime
    vColor = c;

    float size = uSize * (1.0 + aRand.z * .7) * (1.0 + aKind * 2.4) * (1.0 + d * .6);
    gl_PointSize = size * uPR * (10.0 / -mv.z);
    vAlpha = mix(.55, .9, aKind) * (1.0 - d * .35);
  }
`;

const fragment = /* glsl */`
  precision mediump float;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float g = smoothstep(.5, 0.0, length(gl_PointCoord - .5));
    float a = g * g * vAlpha * uOpacity;
    // premultiplied output on a transparent canvas: glow adds light, corners add nothing
    gl_FragColor = vec4(vColor * a, a);
  }
`;

const dustVertex = /* glsl */`
  attribute vec4 aSeed;
  uniform float uTime, uPR;
  varying float vA;
  void main() {
    vec3 p = (aSeed.xyz - .5) * vec3(16.0, 10.0, 8.0);
    p.y += mod(uTime * (.05 + aSeed.w * .1) + aSeed.y * 10.0, 10.0) - 5.0 - (aSeed.y - .5) * 10.0;
    p.x += sin(uTime * .2 + aSeed.w * 30.0) * .3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed.w * 2.5) * uPR * (10.0 / -mv.z);
    vA = .25 + .35 * (.5 + .5 * sin(uTime * 1.5 + aSeed.w * 50.0));
  }
`;
const dustFragment = /* glsl */`
  precision mediump float;
  uniform float uOpacity;
  varying float vA;
  void main() {
    float g = smoothstep(.5, 0.0, length(gl_PointCoord - .5));
    float a = g * vA * uOpacity;
    gl_FragColor = vec4(vec3(.82, .95, .5) * a, a);
  }
`;

function buildBody(segments, rings) {
  const total = segments * rings + 4;
  const aS = new Float32Array(total);
  const aA = new Float32Array(total);
  const aRand = new Float32Array(total * 3);
  const aKind = new Float32Array(total);
  let i = 0;
  for (let si = 0; si < segments; si++) {
    for (let ri = 0; ri < rings; ri++) {
      // jitter breaks up the grid so it reads as scales, not a mesh
      aS[i] = Math.min(1, Math.max(0, (si + Math.random() * .9) / segments));
      aA[i] = ((ri + (si % 2) * .5 + Math.random() * .3) / rings) * Math.PI * 2;
      aRand[i * 3] = Math.random() * 2 - 1;
      aRand[i * 3 + 1] = Math.random() * 2 - 1;
      aRand[i * 3 + 2] = Math.random();
      i++;
    }
  }
  // eyes: two per side (core + halo) near the snout
  [[.955, 0.55], [.955, Math.PI - 0.55], [.956, 0.5], [.956, Math.PI - 0.5]].forEach(([s, a]) => {
    aS[i] = s; aA[i] = a; aKind[i] = 1;
    aRand[i * 3] = Math.random() * 2 - 1; aRand[i * 3 + 1] = Math.random() * 2 - 1; aRand[i * 3 + 2] = .5;
    i++;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  g.setAttribute('aA', new THREE.BufferAttribute(aA, 1));
  g.setAttribute('aRand', new THREE.BufferAttribute(aRand, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
  return g;
}

function buildDust(count) {
  const g = new THREE.BufferGeometry();
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  return g;
}

function Serpent({ small }) {
  const group = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const phase = useRef(0);

  const bodyGeo = useMemo(() => (small ? buildBody(360, 22) : buildBody(560, 30)), [small]);
  const dustGeo = useMemo(() => buildDust(small ? 220 : 420), [small]);

  const uniforms = useMemo(() => ({
    uPhase: { value: 0 }, uTime: { value: 0 }, uCoil: { value: 0 }, uDisperse: { value: 1 },
    uPR: { value: 1 }, uSize: { value: small ? 3.4 : 3.0 }, uOpacity: { value: 0 }
  }), [small]);
  const dustUniforms = useMemo(() => ({ uTime: { value: 0 }, uPR: { value: 1 }, uOpacity: { value: 0 } }), []);

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, .05);
    const st = serpentState;
    phase.current += dt * st.speed;
    const u = uniforms;
    u.uPhase.value = phase.current;
    u.uTime.value += dt;
    u.uCoil.value = st.coil;
    u.uDisperse.value = st.disperse;
    u.uOpacity.value = st.opacity;
    u.uPR.value = state.viewport.dpr;
    dustUniforms.uTime.value = u.uTime.value;
    dustUniforms.uPR.value = state.viewport.dpr;
    dustUniforms.uOpacity.value = st.opacity * .8;

    const g = group.current;
    const k = 1 - Math.pow(.001, dt); // frame-rate independent easing
    g.position.x += (st.x - g.position.x) * k * 2;
    g.position.y += (st.y - g.position.y) * k * 2;
    g.rotation.y += (st.rotY + st.spin + pointer.current.x * .25 - g.rotation.y) * k;
    g.rotation.x += (st.rotX + pointer.current.y * .12 - g.rotation.x) * k;
    g.scale.setScalar(st.scale * (small ? .62 : 1));
  });

  return (
    <>
      <group ref={group}>
        <points geometry={bodyGeo} frustumCulled={false}>
          <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
            transparent depthTest={false} depthWrite={false} blending={THREE.CustomBlending} blendSrc={THREE.OneFactor} blendDst={THREE.OneFactor} />
        </points>
      </group>
      <points geometry={dustGeo} frustumCulled={false}>
        <shaderMaterial uniforms={dustUniforms} vertexShader={dustVertex} fragmentShader={dustFragment}
          transparent depthTest={false} depthWrite={false} blending={THREE.CustomBlending} blendSrc={THREE.OneFactor} blendDst={THREE.OneFactor} />
      </points>
    </>
  );
}

/** Fixed, full-viewport canvas behind the page content. Sleeps while invisible. */
export default function SerpentScene() {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const [small] = useState(() => window.innerWidth < 760);

  useEffect(() => {
    const check = () => {
      const on = serpentState.opacity > .005;
      if (on !== activeRef.current) { activeRef.current = on; setActive(on); }
    };
    gsap.ticker.add(check);
    return () => gsap.ticker.remove(check);
  }, []);

  return (
    <div className="serpent-layer" aria-hidden="true" style={{ visibility: active ? 'visible' : 'hidden' }}>
      <Canvas
        dpr={[1, 1.5]}
        linear
        flat
        frameloop={active ? 'always' : 'never'}
        camera={{ position: [0, 0, 10], fov: 38, near: .1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <Serpent small={small} />
      </Canvas>
    </div>
  );
}
