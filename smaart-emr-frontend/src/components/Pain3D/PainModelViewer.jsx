import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

const REGION_MESHES = [
  "Pain_Head",
  "Pain_Chest",
  "Pain_Abdomen",
  "Pain_Left_Arm",
  "Pain_Right_Arm",
  "Pain_Left_Leg",
  "Pain_Right_Leg",
  "Pain_Pelvis"
];

const BASE_COLOR = new THREE.Color("#dbeafe");
const SELECTED_COLOR = new THREE.Color("#06b6d4");

const intensityToColor = (intensity) => {
  const value = Number(intensity || 0);
  if (value >= 7) return new THREE.Color("#ef4444");
  if (value >= 4) return new THREE.Color("#f97316");
  if (value >= 1) return new THREE.Color("#facc15");
  return BASE_COLOR.clone();
};

export default function PainModelViewer({
  modelUrl = "/models/pain_body.glb",
  regionData = {},
  heatmap = false,
  view = "front",
  selectedRegion = "",
  onRegionClick,
  reportRef,
  onCaptureReady
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null);
  const outlinePassRef = useRef(null);
  const rafRef = useRef(null);
  const modelRef = useRef(null);
  const meshesRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef(null);
  const targetColorsRef = useRef(new Map());
  const animatingCameraRef = useRef(false);
  const selectedRegionRef = useRef(selectedRegion);
  const viewRef = useRef(view);
  const modelLoadedRef = useRef(false);
  const isCapturingRef = useRef(false);
  const [loading, setLoading] = useState(true);

  const regionKey = useMemo(() => JSON.stringify(regionData || {}), [regionData]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F4F9FC");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.3, 3.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0xF4F9FC, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI * 0.65;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const normalizeMeshName = (name = "") =>
      String(name).trim().toLowerCase().replace(/^pain_/, "").replaceAll("_", " ");
    const matchesSelectedPart = (meshName, selectedParts = []) => {
      const meshRaw = String(meshName || "").trim();
      const meshNormalized = normalizeMeshName(meshRaw);
      return selectedParts.some((part) => {
        const raw = String(part || "").trim();
        const normalized = normalizeMeshName(raw);
        return (
          raw === meshRaw ||
          raw === `Pain_${meshRaw}` ||
          raw === `Pain_${meshRaw.replaceAll(" ", "_")}` ||
          normalized === meshNormalized
        );
      });
    };
    const applyHighlight = (selectedParts = []) => {
      if (!modelRef.current) return;
      modelRef.current.traverse((node) => {
        if (!node.isMesh) return;
        if (!REGION_MESHES.includes(node.name)) return;
        if (matchesSelectedPart(node.name, selectedParts)) {
          node.material.emissive.set("#E74C3C");
          node.material.emissiveIntensity = 0.8;
        } else {
          node.material.emissive.set("#000000");
          node.material.emissiveIntensity = 0;
        }
      });
    };

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.25, 0.3, 0.95));
    const outlinePass = new OutlinePass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), scene, camera);
    outlinePass.edgeStrength = 3.5;
    outlinePass.edgeGlow = 0.4;
    outlinePass.edgeThickness = 1.2;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set("#2E86C1");
    outlinePass.hiddenEdgeColor.set("#2E86C1");
    composer.addPass(outlinePass);
    outlinePassRef.current = outlinePass;
    composerRef.current = composer;
    const captureModelImage = async (options = {}) => {
      if (!modelLoadedRef.current) {
        throw new Error("Model still loading...");
      }
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) {
        throw new Error("Canvas capture failed");
      }
      try {
        const selectedParts = Array.isArray(options.selectedParts) && options.selectedParts.length
          ? options.selectedParts
          : selectedRegionRef.current
            ? [selectedRegionRef.current]
            : [];
        isCapturingRef.current = true;
        applyHighlight(selectedParts);
        controlsRef.current?.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        composerRef.current?.render();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => setTimeout(resolve, 200));
        const imageData = rendererRef.current.domElement.toDataURL("image/png", 1.0);
        if (!imageData || imageData.length < 1000) {
          throw new Error("Canvas capture failed");
        }
        return imageData;
      } finally {
        isCapturingRef.current = false;
      }
    };
    onCaptureReady?.(captureModelImage);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        model.scale.setScalar(1.45);
        model.position.set(0, -1.4, 0);
        model.traverse((node) => {
          if (!node.isMesh) return;
          if (!REGION_MESHES.includes(node.name)) return;
          node.material = node.material.clone();
          node.material.transparent = false;
          node.material.roughness = 0.55;
          node.material.metalness = 0.05;
          node.material.color.copy(BASE_COLOR);
          node.material.emissive = new THREE.Color("#000000");
          meshesRef.current.set(node.name, node);
          targetColorsRef.current.set(node.name, BASE_COLOR.clone());
        });
        scene.add(model);
        modelLoadedRef.current = true;
        setLoading(false);
      },
      undefined,
      () => {
        modelLoadedRef.current = false;
        modelRef.current = null;
        setLoading(false);
      }
    );

    const onPointerMove = (event) => {
      if (!rendererRef.current || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const targets = Array.from(meshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(targets, false);
      const mesh = intersects?.[0]?.object || null;
      if (hoveredMeshRef.current !== mesh) {
        hoveredMeshRef.current = mesh;
        rendererRef.current.domElement.style.cursor = mesh ? "pointer" : "default";
      }
    };

    const onPointerDown = () => {
      if (hoveredMeshRef.current?.name) {
        onRegionClick?.(hoveredMeshRef.current.name);
      }
    };

    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current || !composerRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      composerRef.current.setSize(width, height);
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    const frontPosition = new THREE.Vector3(0, 1.3, 3.3);
    const backPosition = new THREE.Vector3(0, 1.3, -3.3);
    const targetPosition = new THREE.Vector3().copy(frontPosition);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      meshesRef.current.forEach((mesh, name) => {
        const targetColor = targetColorsRef.current.get(name) || BASE_COLOR;
        mesh.material.color.lerp(targetColor, 0.15);
        if (!isCapturingRef.current) {
          if (selectedRegionRef.current && selectedRegionRef.current === name) {
            mesh.material.emissive.lerp(SELECTED_COLOR, 0.2);
            mesh.material.emissiveIntensity = 0.55;
          } else {
            mesh.material.emissive.lerp(new THREE.Color("#000000"), 0.2);
            mesh.material.emissiveIntensity = 0.15;
          }
        }
      });

      if (viewRef.current === "back") {
        targetPosition.copy(backPosition);
      } else {
        targetPosition.copy(frontPosition);
      }
      if (outlinePassRef.current) {
        const selectedMesh = selectedRegionRef.current
          ? meshesRef.current.get(selectedRegionRef.current)
          : hoveredMeshRef.current;
        outlinePassRef.current.selectedObjects = selectedMesh ? [selectedMesh] : [];
      }

      const distance = camera.position.distanceTo(targetPosition);
      if (distance > 0.02) {
        animatingCameraRef.current = true;
        controls.enabled = false;
        camera.position.lerp(targetPosition, 0.08);
      } else {
        animatingCameraRef.current = false;
        controls.enabled = true;
      }

      controls.update();
      composer.render();
    };
    animate();

    return () => {
      modelLoadedRef.current = false;
      modelRef.current = null;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();
      scene.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => mat.dispose?.());
        } else {
          node.material?.dispose?.();
        }
      });
      composer.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [modelUrl, onRegionClick, onCaptureReady]);

  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const parsed = JSON.parse(regionKey || "{}");
    REGION_MESHES.forEach((name) => {
      const row = parsed?.[name] || {};
      if (heatmap) {
        targetColorsRef.current.set(name, intensityToColor(row.intensity));
      } else if (selectedRegion === name && row.intensity) {
        targetColorsRef.current.set(name, intensityToColor(row.intensity));
      } else {
        targetColorsRef.current.set(name, BASE_COLOR.clone());
      }
    });
  }, [heatmap, selectedRegion, regionKey]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-100">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            Loading 3D model...
          </div>
        </div>
      ) : null}
      <div ref={(node) => {
        mountRef.current = node;
        if (typeof reportRef === "function") reportRef(node);
        else if (reportRef) reportRef.current = node;
      }} className="h-full w-full" />
    </div>
  );
}
