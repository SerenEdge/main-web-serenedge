"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildDotAttributes, buildEdges, dotCount, infinityScale, mulberry32, type DotAttributes } from "./math";
import { dotFrag, dotVert, edgeFrag, edgeVert } from "./shaders";
import { motion } from "./store";

export const DOT_SIZE = 44; // px at the dot plane distance before DPR (~5.5px in the field)
export const FIELD_ALPHA = 0.16;
export const REPEL_RADIUS = 0.9; // baked into the shader's smoothstep
export const EDGE_NEIGHBORS = 2;
export const EDGE_CROSS_P = 0.25;
export const EDGE_OPACITY = 0.35;
export const FLOW_SPEED = 0.12; // rad/s

/** The brand token, read from CSS so the dots always match the site. */
export function brandColor(): THREE.Color {
  const css = getComputedStyle(document.documentElement).getPropertyValue("--brand-blue").trim();
  return new THREE.Color(css || "#5b8ac5");
}

/**
 * One set of uniform objects shared by the dots and the edges, so one update drives both.
 * Module-level: there is only ever one home scene, and render-loop writes stay outside React.
 */
export const dotUniforms = {
  uTime: { value: 0 },
  uReveal: { value: 0 },
  uGather: { value: 0 },
  uFlow: { value: 0 },
  uDraw: { value: 0 },
  uScale: { value: 1 },
  uSize: { value: DOT_SIZE },
  uPixelRatio: { value: 1 },
  uScrollY: { value: 0 },
  uFieldH: { value: 10 },
  uVelocity: { value: 0 },
  uRepel: { value: 1 },
  uFieldAlpha: { value: FIELD_ALPHA },
  uMouse: { value: new THREE.Vector2() },
  uFocus: { value: new THREE.Vector3() },
  uColor: { value: new THREE.Color() },
  uGlowColor: { value: new THREE.Color() },
  uEdgeOpacity: { value: EDGE_OPACITY },
};
const focusTarget = new THREE.Vector3();

// Passed as constructor args: R3F props would not keep `uniforms` as this shared object.
const DOT_MATERIAL = {
  uniforms: dotUniforms,
  vertexShader: dotVert,
  fragmentShader: dotFrag,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
};
const EDGE_MATERIAL = { uniforms: dotUniforms, vertexShader: edgeVert, fragmentShader: edgeFrag, transparent: true, depthWrite: false };

export function useDotData(plane: { width: number; height: number }, countScale: number): DotAttributes {
  const size = useThree((s) => s.size);
  const count = Math.round(dotCount(size.width) * countScale);
  // Rebuild only when the count or the plane changes meaningfully (resize).
  const w = Math.round(plane.width * 10) / 10;
  const h = Math.round(plane.height * 10) / 10;
  return useMemo(() => buildDotAttributes(count, { width: w, height: h }, mulberry32(1)), [count, w, h]);
}

/** Per-frame uniform sync from the scroll store. Mounted once, next to the dots. */
export function useDotUniformSync(plane: { width: number; height: number }, mobile: boolean, fieldHeight: number) {
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    const u = dotUniforms;
    const color = brandColor();
    u.uColor.value.copy(color);
    // One step deeper and a touch more saturated: on white, "glow" reads as more ink.
    u.uGlowColor.value.copy(color).offsetHSL(0, 0.12, -0.12);
  }, []);
  useEffect(() => {
    dotUniforms.uScale.value = infinityScale(plane.width, mobile);
    dotUniforms.uPixelRatio.value = dpr;
    dotUniforms.uFieldH.value = fieldHeight;
  }, [plane.width, mobile, dpr, fieldHeight]);

  useFrame((state, dt) => {
    const u = dotUniforms;
    if (motion.flowing) motion.flow += dt * FLOW_SPEED * motion.draw;
    u.uTime.value = state.clock.elapsedTime;
    u.uReveal.value = motion.reveal;
    u.uScrollY.value = motion.scrollY;
    u.uVelocity.value += (motion.velocity - u.uVelocity.value) * 0.1;
    u.uGather.value = motion.gather;
    u.uDraw.value = motion.draw;
    u.uFlow.value = motion.flow;
    u.uRepel.value = motion.touch ? 0 : 1 - motion.gather;
    u.uMouse.value.set((motion.mouse.x * plane.width) / 2, (motion.mouse.y * plane.height) / 2);
    focusTarget.set((motion.focus.x * plane.width) / 2, (motion.focus.y * plane.height) / 2, motion.focus.strength);
    u.uFocus.value.lerp(focusTarget, 0.06);
  });
}

export function DotField({ data }: { data: DotAttributes }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.field, 3));
    g.setAttribute("aField", new THREE.BufferAttribute(data.field, 3));
    g.setAttribute("aOff", new THREE.BufferAttribute(data.off, 3));
    g.setAttribute("aRandom", new THREE.BufferAttribute(data.random, 1));
    g.setAttribute("aT", new THREE.BufferAttribute(data.t, 1));
    return g;
  }, [data]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={4}>
      <shaderMaterial args={[DOT_MATERIAL]} />
    </points>
  );
}

export function InfinityEdges({ data, mobile }: { data: DotAttributes; mobile: boolean }) {
  const geometry = useMemo(() => {
    const n = data.t.length;
    const { pairs, order } = buildEdges(data.t, mulberry32(2), {
      neighbors: EDGE_NEIGHBORS,
      crossP: mobile ? EDGE_CROSS_P / 2 : EDGE_CROSS_P,
      window: 0.08,
      maxEdges: Math.round(n * (mobile ? 2.2 : 2.5)),
    });
    const v = pairs.length;
    const field = new Float32Array(v * 3);
    const off = new Float32Array(v * 3);
    const random = new Float32Array(v);
    const t = new Float32Array(v);
    const ord = new Float32Array(v);
    // Every line vertex carries its endpoint dot's attributes, so the lines follow the dots exactly.
    for (let i = 0; i < v; i++) {
      const p = pairs[i];
      field.set(data.field.subarray(p * 3, p * 3 + 3), i * 3);
      off.set(data.off.subarray(p * 3, p * 3 + 3), i * 3);
      random[i] = data.random[p];
      t[i] = data.t[p];
      ord[i] = order[i >> 1];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(field, 3));
    g.setAttribute("aField", new THREE.BufferAttribute(field, 3));
    g.setAttribute("aOff", new THREE.BufferAttribute(off, 3));
    g.setAttribute("aRandom", new THREE.BufferAttribute(random, 1));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aOrder", new THREE.BufferAttribute(ord, 1));
    return g;
  }, [data, mobile]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial args={[EDGE_MATERIAL]} />
    </lineSegments>
  );
}
