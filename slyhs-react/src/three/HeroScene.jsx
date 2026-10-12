import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/gsap';

const LIME = new THREE.Color(0.82, 0.95, 0.5);

/* ---------------------------------------------------------- photo plane */
const photoVertex = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const photoFragment = /* glsl */`
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uRes, uImg, uMouse, uPos;
  uniform float uHover, uTime, uZoom;
  varying vec2 vUv;

  vec2 cover(vec2 uv) {
    float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
    vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
    return uv * s + (1.0 - s) * uPos;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) / uZoom + 0.5;
    p += vec2(sin(p.y * 5.0 + uTime * .35), cos(p.x * 4.0 + uTime * .28)) * .0022;

    vec2 d2 = (vUv - uMouse) * vec2(aspect, 1.0);
    float d = length(d2);
    float ripple = sin(d * 38.0 - uTime * 3.2) * exp(-d * 5.5) * .007 * uHover;
    p += normalize(d2 + 1e-5) * ripple / vec2(aspect, 1.0);

    vec2 uv = cover(p);
    float ca = .0035 * uHover * exp(-d * 3.5);
    vec3 col = vec3(texture2D(uTex, uv + vec2(ca, 0.0)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(ca, 0.0)).b);
    col += vec3(.79, .93, .43) * exp(-d * 7.0) * .10 * uHover;

    vec3 bg = vec3(5.0, 8.0, 6.0) / 255.0;
    gl_FragColor = vec4(mix(bg, col, .62), 1.0);
  }
`;

function Photo({ src, pointer, sectionRef, objectPosition, onReady }) {
  const tex = useLoader(THREE.TextureLoader, src);
  const uniforms = useMemo(() => ({
    uTex: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uImg: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(.6, .6) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uZoom: { value: 1 },
    uPos: { value: new THREE.Vector2(objectPosition[0], 1 - objectPosition[1]) }
  }), [objectPosition[0], objectPosition[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    uniforms.uTex.value = tex;
    uniforms.uImg.value.set(tex.image.width, tex.image.height);
    if (onReady) onReady();
  }, [tex, uniforms, onReady]);

  useFrame((state, delta) => {
    const u = uniforms;
    u.uRes.value.set(state.size.width, state.size.height);
    if (!prefersReducedMotion) u.uTime.value += Math.min(delta, .05);
    u.uMouse.value.lerp(pointer.current, .08);
    u.uHover.value += ((prefersReducedMotion ? 0 : pointer.current.hover) - u.uHover.value) * .05;
    const el = sectionRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const progress = Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1);
      u.uZoom.value = 1 + progress * .12;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={uniforms} vertexShader={photoVertex} fragmentShader={photoFragment} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

/* ---------------------------------------------------------- fireflies */
const ffVertex = /* glsl */`
  attribute vec4 aSeed;
  uniform float uTime, uPR, uHover, uAspect;
  uniform vec2 uMouse;
  varying float vAlpha;
  void main() {
    float t = uTime * aSeed.z;
    float y = fract(aSeed.y + t * .018);
    float x = aSeed.x + sin(t * .55 + aSeed.w * 6.2831) * .025;
    vec2 pos = vec2(x, y);
    vec2 dv = (pos - uMouse) * vec2(uAspect, 1.0);
    pos += normalize(dv + 1e-5) / vec2(uAspect, 1.0) * exp(-length(dv) * 9.0) * .06 * uHover;
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = (2.0 + aSeed.w * 5.0) * uPR;
    float edge = smoothstep(0.0, .12, y) * smoothstep(1.0, .75, y);
    vAlpha = edge * (.35 + .65 * (.5 + .5 * sin(uTime * (1.5 + aSeed.w * 2.0) + aSeed.w * 40.0)));
  }
`;
const ffFragment = /* glsl */`
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float g = smoothstep(.5, 0.0, length(gl_PointCoord - .5));
    gl_FragColor = vec4(uColor * g * g * vAlpha, 1.0);
  }
`;

function Fireflies({ pointer, count }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = .4 + Math.random() * 1.2;
      seeds[i * 4 + 3] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    return g;
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uPR: { value: 1 }, uHover: { value: 0 }, uAspect: { value: 1 },
    uMouse: { value: new THREE.Vector2(.6, .6) }, uColor: { value: LIME }
  }), []);

  useFrame((state, delta) => {
    if (!prefersReducedMotion) uniforms.uTime.value += Math.min(delta, .05);
    uniforms.uPR.value = state.viewport.dpr;
    uniforms.uAspect.value = state.size.width / state.size.height;
    uniforms.uMouse.value.lerp(pointer.current, .08);
    uniforms.uHover.value += (pointer.current.hover - uniforms.uHover.value) * .05;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={ffVertex} fragmentShader={ffFragment}
        transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ---------------------------------------------------------- scene */
export default function HeroScene({ sectionRef, src = '/assets/hero-snake.jpg', objectPosition = [.62, .55], onReady }) {
  const [visible, setVisible] = useState(true);
  const pointer = useRef(Object.assign(new THREE.Vector2(.6, .6), { hover: 0 }));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      pointer.current.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      pointer.current.hover = 1;
    };
    const onLeave = () => { pointer.current.hover = 0; };
    // touch: a tap sends a ripple through the photo and scatters the fireflies, then it settles
    let settle = 0;
    const onTap = (e) => {
      if (e.pointerType !== 'touch') return;
      onMove(e);
      clearTimeout(settle);
      settle = setTimeout(onLeave, 900);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onTap);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      clearTimeout(settle);
      io.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onTap);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [sectionRef]);

  const count = typeof window !== 'undefined' && window.innerWidth < 700 ? 70 : 160;

  return (
    <Canvas
      className="hero-canvas"
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      linear
      flat
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#050806', 1)}
    >
      <Suspense fallback={null}>
        <Photo src={src} pointer={pointer} sectionRef={sectionRef} objectPosition={objectPosition} onReady={onReady} />
      </Suspense>
      <Fireflies pointer={pointer} count={count} />
    </Canvas>
  );
}
