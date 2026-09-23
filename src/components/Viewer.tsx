import { useEffect, useRef, useState } from "react";
import { Maximize2, RotateCcw, Box, LoaderCircle } from "lucide-react";
import type { GeneratedModel } from "../core/engine";

export default function Viewer({
  result,
  busy,
  error,
  kind = "bin",
}: {
  result: GeneratedModel | null;
  busy: boolean;
  error?: string;
  kind?: "bin" | "plate";
}) {
  const mount = useRef<HTMLDivElement>(null),
    [reset, setReset] = useState(0),
    [viewError, setViewError] = useState("");
  useEffect(() => {
    if (!result || !mount.current) return;
    let cleanup = () => {},
      cancelled = false;
    setViewError("");
    Promise.all([
      import("three"),
      import("three/addons/loaders/STLLoader.js"),
      import("three/addons/controls/OrbitControls.js"),
    ])
      .then(([T, { STLLoader }, { OrbitControls }]) => {
        if (cancelled || !mount.current) return;
        const host = mount.current,
          renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFShadowMap;
        renderer.outputColorSpace = T.SRGBColorSpace;
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute(
          "aria-label",
          "Interactive 3D model. Drag to orbit and scroll to zoom.",
        );
        const scene = new T.Scene(),
          camera = new T.PerspectiveCamera(36, 1, 0.1, 10000);
        camera.up.set(0, 0, 1);
        const geometry = new STLLoader().parse(
          result.bytes.slice().buffer as ArrayBuffer,
        );
        geometry.computeBoundingBox();
        const bounds = geometry.boundingBox!,
          center = new T.Vector3();
        bounds.getCenter(center);
        geometry.translate(-center.x, -center.y, -bounds.min.z);
        geometry.computeVertexNormals();
        const material = new T.MeshStandardMaterial({
          color: kind === "bin" ? 0xd3e779 : 0xb8c5b3,
          roughness: 0.7,
          metalness: 0.02,
        });
        const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        const [w, d, h] = result.report.size,
          span = Math.max(w, d, h, 42);
        const groundGeometry = new T.PlaneGeometry(span * 12, span * 12),
          groundMaterial = new T.ShadowMaterial({ opacity: 0.12 });
        const ground = new T.Mesh(groundGeometry, groundMaterial);
        ground.position.z = -0.08;
        ground.receiveShadow = true;
        scene.add(ground);
        const grid = new T.GridHelper(
          Math.ceil(span / 42) * 42 + 168,
          Math.ceil(span / 42) + 4,
          0xc9cec2,
          0xe0e2d9,
        );
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -0.12;
        scene.add(grid);
        scene.add(new T.HemisphereLight(0xffffff, 0x77845c, 3));
        const light = new T.DirectionalLight(0xffffff, 3.2);
        light.position.set(-span, -span * 1.5, span * 2);
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.left = -span * 1.5;
        light.shadow.camera.right = span * 1.5;
        light.shadow.camera.top = span * 1.5;
        light.shadow.camera.bottom = -span * 1.5;
        light.shadow.camera.far = span * 8;
        light.shadow.normalBias = 0.04;
        scene.add(light);
        camera.position.set(span * 1.15, -span * 1.75, span * 1.45);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, h / 3);
        controls.enableDamping = true;
        controls.minDistance = span * 0.5;
        controls.maxDistance = span * 6;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.update();
        const observer = new ResizeObserver(() => {
          const { width, height } = host.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        });
        observer.observe(host);
        let frame = 0;
        const draw = () => {
          if (!document.hidden) {
            controls.update();
            renderer.render(scene, camera);
          }
          frame = requestAnimationFrame(draw);
        };
        draw();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          geometry.dispose();
          material.dispose();
          groundGeometry.dispose();
          groundMaterial.dispose();
          grid.geometry.dispose();
          (grid.material as import("three").Material).dispose();
          light.shadow.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        if (!cancelled)
          setViewError(
            "3D preview is unavailable on this device. You can still download the checked STL.",
          );
      });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [result, reset, kind]);
  return (
    <div className="viewer">
      <div className="viewer-top">
        <span className="micro">
          <span className={`status-dot ${result ? "ready" : ""}`} />
          {busy ? "GENERATING MODEL" : result ? "LIVE MODEL" : "MODEL PREVIEW"}
        </span>
        <span className="viewer-units">mm · perspective</span>
      </div>
      <div className="canvas-host" ref={mount} />
      {!result && (
        <div className="viewer-empty">
          {busy ? (
            <LoaderCircle size={34} className="spin" />
          ) : (
            <Box size={38} strokeWidth={1} />
          )}
          <strong>
            {busy
              ? "Building your model"
              : error
                ? "Let’s adjust that"
                : "Your model starts here"}
          </strong>
          <p>
            {busy
              ? "Generating and checking the actual STL, on your device."
              : error ||
                "Choose your dimensions to generate a printable model."}
          </p>
        </div>
      )}
      {viewError && (
        <div className="viewer-empty">
          <p>{viewError}</p>
        </div>
      )}
      <div className="viewer-bottom">
        <span>
          Drag to orbit <b>·</b> Scroll to zoom
        </span>
        <button
          className="icon-button"
          title="Reset view"
          aria-label="Reset 3D view"
          onClick={() => setReset((n) => n + 1)}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="axis">
        <span className="axis-z">Z</span>
        <span className="axis-y">Y</span>
        <span className="axis-x">X</span>
        <Maximize2 size={17} />
      </div>
    </div>
  );
}
