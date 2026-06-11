"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroScene3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.65, 7.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeometry = new THREE.IcosahedronGeometry(1.08, 3);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      emissive: 0x22105f,
      emissiveIntensity: 0.45,
      metalness: 0.72,
      roughness: 0.28,
      transparent: true,
      opacity: 0.86,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    coreGroup.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.17, 2),
      new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      }),
    );
    coreGroup.add(wire);

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.32,
    });

    const makeRing = (radius: number, tilt: [number, number, number]) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 160; i += 1) {
        const t = (i / 160) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
      }
      const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMaterial);
      ring.rotation.set(...tilt);
      coreGroup.add(ring);
      return ring;
    };

    const rings = [
      makeRing(1.95, [0.7, 0.2, 0.15]),
      makeRing(2.55, [1.15, -0.35, 0.65]),
      makeRing(3.15, [0.28, 0.9, -0.2]),
    ];

    const relayMaterial = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 0.7,
      metalness: 0.35,
      roughness: 0.22,
    });
    const relayGeometry = new THREE.SphereGeometry(0.075, 20, 20);
    const relays = Array.from({ length: 9 }, (_, index) => {
      const mesh = new THREE.Mesh(relayGeometry, relayMaterial);
      const angle = (index / 9) * Math.PI * 2;
      const radius = 2.25 + (index % 3) * 0.42;
      mesh.userData = { angle, radius, speed: 0.16 + index * 0.012, tilt: (index % 3) * 0.45 };
      coreGroup.add(mesh);
      return mesh;
    });

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.2,
    });
    const relayLines = relays.map(() => {
      const line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
      coreGroup.add(line);
      return line;
    });

    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const r = 2.6 + Math.random() * 4.6;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.4;
      particlePositions[i * 3] = Math.cos(a) * r;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(a) * r - 0.8;
    }
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(particlePositions, 3)),
      new THREE.PointsMaterial({
        color: 0x94a3b8,
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const tealLight = new THREE.PointLight(0x2dd4bf, 5.5, 12);
    tealLight.position.set(-2.4, 2.2, 3.4);
    scene.add(tealLight);
    const violetLight = new THREE.PointLight(0xa78bfa, 6, 12);
    violetLight.position.set(3, -1.4, 4);
    scene.add(violetLight);

    let width = 0;
    let height = 0;
    let frame = 0;
    let disposed = false;

    const resize = () => {
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      core.rotation.x = t * 0.16;
      core.rotation.y = t * 0.24;
      wire.rotation.x = -t * 0.12;
      wire.rotation.y = t * 0.18;
      particles.rotation.y = t * 0.015;
      particles.rotation.x = Math.sin(t * 0.18) * 0.035;
      rings.forEach((ring, index) => {
        ring.rotation.z += 0.0012 + index * 0.00035;
      });

      relays.forEach((relay, index) => {
        const data = relay.userData as { angle: number; radius: number; speed: number; tilt: number };
        const a = data.angle + t * data.speed;
        const y = Math.sin(a * 1.7 + data.tilt) * 0.55;
        relay.position.set(Math.cos(a) * data.radius, y, Math.sin(a) * data.radius * 0.45);
        relay.scale.setScalar(1 + Math.sin(t * 2 + index) * 0.16);
        relayLines[index].geometry.setFromPoints([new THREE.Vector3(0, 0, 0), relay.position.clone()]);
      });

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      relayGeometry.dispose();
      relayMaterial.dispose();
      ringMaterial.dispose();
      lineMaterial.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="hero-scene3d" aria-hidden="true" />;
}
