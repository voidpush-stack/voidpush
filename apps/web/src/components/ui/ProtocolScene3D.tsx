"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ProtocolScene3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.2, 7.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const rig = new THREE.Group();
    scene.add(rig);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x120726,
      emissiveIntensity: 0.35,
      metalness: 0.08,
      roughness: 0.12,
      transmission: 0.15,
      thickness: 1.2,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.62,
    });

    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 2), glassMaterial);
    rig.add(core);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58, 2),
      new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        emissive: 0x0d9488,
        emissiveIntensity: 0.95,
        metalness: 0.28,
        roughness: 0.25,
        transparent: true,
        opacity: 0.8,
      }),
    );
    rig.add(inner);

    const wire = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.12, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      }),
    );
    rig.add(wire);

    const ringMaterials = [
      new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.35 }),
      new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.28 }),
      new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.22 }),
    ];

    const makeRing = (radius: number, tilt: [number, number, number], material: THREE.LineBasicMaterial) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 192; i += 1) {
        const angle = (i / 192) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      }
      const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
      ring.rotation.set(...tilt);
      rig.add(ring);
      return ring;
    };

    const rings = [
      makeRing(1.78, [0.62, 0.12, 0.28], ringMaterials[0]),
      makeRing(2.18, [1.1, -0.45, 0.68], ringMaterials[1]),
      makeRing(2.62, [0.22, 0.92, -0.28], ringMaterials[2]),
    ];

    const relayMaterial = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.7,
      metalness: 0.24,
      roughness: 0.18,
    });
    const relayGeometry = new THREE.SphereGeometry(0.07, 24, 24);
    const relays = Array.from({ length: 7 }, (_, index) => {
      const relay = new THREE.Mesh(relayGeometry, relayMaterial);
      relay.userData = {
        angle: (index / 7) * Math.PI * 2,
        radius: 1.75 + (index % 3) * 0.28,
        speed: 0.22 + index * 0.015,
      };
      rig.add(relay);
      return relay;
    });

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i += 1) {
      const radius = 2.1 + Math.random() * 2.4;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 2.7;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xa78bfa,
        size: 0.018,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    rig.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const violet = new THREE.PointLight(0xa78bfa, 6, 12);
    violet.position.set(2.4, 2.6, 4.2);
    scene.add(violet);
    const teal = new THREE.PointLight(0x2dd4bf, 5.5, 12);
    teal.position.set(-2.4, -1.5, 4);
    scene.add(teal);

    const pointer = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    let clickPulse = 0;
    let frame = 0;
    let disposed = false;

    const resize = () => {
      const width = mount.clientWidth || 560;
      const height = mount.clientHeight || 420;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = -(((event.clientY - rect.top) / rect.height - 0.5) * 2);
    };

    const pulse = () => {
      clickPulse = 1;
    };

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      pointer.lerp(target, 0.14);
      clickPulse *= 0.9;

      rig.rotation.y = pointer.x * 0.62 + Math.sin(time * 0.35) * 0.16;
      rig.rotation.x = -pointer.y * 0.36 + Math.sin(time * 0.25) * 0.06;
      rig.position.x = pointer.x * 0.16;
      rig.position.y = pointer.y * 0.12 + Math.sin(time * 0.9) * 0.08;
      rig.scale.setScalar(1 + clickPulse * 0.16);

      core.rotation.x = time * 0.18;
      core.rotation.y = time * 0.26;
      inner.rotation.x = -time * 0.32;
      inner.rotation.z = time * 0.24;
      wire.rotation.x = -time * 0.11;
      wire.rotation.y = time * 0.18;
      particles.rotation.y = time * 0.025;

      rings.forEach((ring, index) => {
        ring.rotation.z += 0.0022 + index * 0.0008 + Math.abs(pointer.x) * 0.002 + clickPulse * 0.008;
      });

      relays.forEach((relay, index) => {
        const data = relay.userData as { angle: number; radius: number; speed: number };
        const angle = data.angle + time * data.speed;
        relay.position.set(
          Math.cos(angle) * data.radius,
          Math.sin(angle * 1.4 + index) * 0.35,
          Math.sin(angle) * data.radius * 0.42,
        );
        relay.scale.setScalar(1.05 + Math.sin(time * 2.2 + index) * 0.16 + Math.abs(pointer.y) * 0.2 + clickPulse * 0.85);
      });

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    mount.addEventListener("pointermove", updatePointer);
    mount.addEventListener("pointerdown", pulse);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", updatePointer);
      mount.removeEventListener("pointerdown", pulse);
      renderer.dispose();
      glassMaterial.dispose();
      relayMaterial.dispose();
      relayGeometry.dispose();
      particleGeometry.dispose();
      ringMaterials.forEach((material) => material.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="protocol-scene3d" aria-hidden="true" />;
}
