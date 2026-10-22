import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TubesBackgroundProps {
  className?: string;
}

export const TubesBackground: React.FC<TubesBackgroundProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !mountRef.current) return;

    const container = mountRef.current;
    let animationFrameId: number;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
      console.warn('WebGL not supported, falling back to CSS background.');
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 400;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.opacity = '0.35';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Create 3 curved spline tubes
    const curves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-35, -15, 0),
        new THREE.Vector3(-15, 10, 5),
        new THREE.Vector3(10, -5, -5),
        new THREE.Vector3(35, 15, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-40, 15, -5),
        new THREE.Vector3(-10, -10, 5),
        new THREE.Vector3(15, 12, 0),
        new THREE.Vector3(40, -15, 5),
      ]),
    ];

    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x59b8ff, wireframe: true, transparent: true, opacity: 0.25 }),
      new THREE.MeshBasicMaterial({ color: 0x4ad6a7, wireframe: true, transparent: true, opacity: 0.2 }),
    ];

    const meshes: THREE.Mesh[] = [];
    curves.forEach((curve, i) => {
      const geometry = new THREE.TubeGeometry(curve, 64, 2.2, 8, false);
      const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
      scene.add(mesh);
      meshes.push(mesh);
    });

    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      meshes.forEach((mesh, idx) => {
        mesh.rotation.x = elapsed * 0.05 * (idx === 0 ? 1 : -1);
        mesh.rotation.y = elapsed * 0.08 * (idx === 0 ? 1 : -1);
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      meshes.forEach((m) => {
        m.geometry.dispose();
      });
      materials.forEach((mat) => mat.dispose());
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} />;
};
