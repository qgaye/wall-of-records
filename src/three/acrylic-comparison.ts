import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type AlbumSnapshot = {
  index: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  zIndex: number;
  hidden: boolean;
  frameType: string;
  cover: string | null;
  name: string;
  year: string;
  kind: string;
  label: string | null;
  labelInk: string | null;
  monogram: string | null;
  title: string;
  subtitle: string;
};

type WallSnapshot = {
  width: number;
  height: number;
  wallYaw: number;
  spotlightCount: number;
  spotlightPositions: number[];
  interacting: boolean;
  albums: AlbumSnapshot[];
};

type FrameAsset = {
  group: THREE.Group;
  cover: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frontPlate: THREE.Mesh<RoundedBoxGeometry, THREE.MeshPhysicalMaterial>;
  rearPlate: THREE.Mesh<RoundedBoxGeometry, THREE.MeshPhysicalMaterial>;
  frontEdges: THREE.LineSegments;
  rearEdges: THREE.LineSegments;
  reflection: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  rim: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  headLightSheen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  materialType: string;
  textureKey: string;
};

type HeadSpotlightAsset = {
  group: THREE.Group;
};

type WallExportRequest = {
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
};

declare global {
  interface WindowEventMap {
    "record-wall:sync": CustomEvent<WallSnapshot>;
    "record-wall:interaction": CustomEvent<{ active: boolean }>;
    "record-wall:export": CustomEvent<WallExportRequest>;
  }
}

const PANEL_SIZE = 240;
const COVER_SIZE = PANEL_SIZE * 0.74;
const PLATE_THICKNESS = 3.2;
const REAR_PLATE_Z = -7.5;
const COVER_Z = -4.75;
const FRONT_PLATE_Z = 0;
const WALL_CAMERA_FOV = 42;

class AcrylicComparison {
  private readonly stage: HTMLElement;
  private readonly host: HTMLDivElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(WALL_CAMERA_FOV, 1, 1, 5000);
  private readonly wallAssembly = new THREE.Group();
  private readonly frames = new Map<number, FrameAsset>();
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly resizeObserver: ResizeObserver;
  private readonly plateGeometry = new RoundedBoxGeometry(PANEL_SIZE, PANEL_SIZE, PLATE_THICKNESS, 5, 1.35);
  private readonly coverGeometry = new THREE.PlaneGeometry(COVER_SIZE, COVER_SIZE);
  private readonly contactShadowGeometry = new THREE.PlaneGeometry(PANEL_SIZE + 24, PANEL_SIZE + 24);
  private readonly reflectionGeometry = new THREE.PlaneGeometry(PANEL_SIZE - 7, PANEL_SIZE - 7);
  private readonly rimGeometry = new THREE.PlaneGeometry(PANEL_SIZE - 3, PANEL_SIZE - 3);
  private readonly screwGeometry = new THREE.CylinderGeometry(5.05, 5.45, 6.5, 48, 1, false);
  private readonly screwThreadGeometry = this.makeScrewThreadGeometry();
  private readonly screwFaceRingGeometry = new THREE.TorusGeometry(4.45, 0.2, 6, 40);
  private readonly standoffGeometry = new THREE.CylinderGeometry(3.2, 3.2, 8, 18, 1, false);
  private readonly separatorGeometry = new THREE.CylinderGeometry(3.15, 3.15, 4.3, 18, 1, false);
  private readonly spotlightCanopyGeometry = new THREE.CylinderGeometry(8.5, 8.5, 4.2, 40);
  private readonly spotlightCanopyRingGeometry = new THREE.TorusGeometry(7.55, 0.38, 8, 40);
  private readonly spotlightStemGeometry = new THREE.CylinderGeometry(1.55, 1.55, 1, 20);
  private readonly spotlightPivotGeometry = new THREE.SphereGeometry(3.35, 28, 18);
  private readonly spotlightHousingGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(5.15, -11.2),
    new THREE.Vector2(5.7, -10.5),
    new THREE.Vector2(6.2, -8.3),
    new THREE.Vector2(8.15, 4.7),
    new THREE.Vector2(8.65, 7.9),
    new THREE.Vector2(8.25, 9.7),
    new THREE.Vector2(7.35, 11.1),
  ], 48);
  private readonly spotlightInteriorGeometry = new THREE.CircleGeometry(6.72, 40);
  private readonly spotlightTrimGeometry = new THREE.TorusGeometry(7.25, 0.58, 10, 48);
  private readonly spotlightBulbGeometry = new THREE.SphereGeometry(3.1, 28, 18);
  private readonly spotlightLensGeometry = new THREE.CircleGeometry(6.35, 40);
  private readonly spotlightPoolGeometry = new THREE.PlaneGeometry(290, 360);
  private readonly glassFrontPlateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe6fbfb,
    roughness: 0.025,
    metalness: 0,
    transmission: 0,
    thickness: PLATE_THICKNESS,
    ior: 1.49,
    clearcoat: 1,
    clearcoatRoughness: 0.018,
    specularIntensity: 0.96,
    envMapIntensity: 1.08,
    opacity: 0.046,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  private readonly glassRearPlateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcfe9e8,
    roughness: 0.055,
    metalness: 0,
    transmission: 0,
    thickness: PLATE_THICKNESS,
    ior: 1.49,
    clearcoat: 0.72,
    clearcoatRoughness: 0.035,
    specularIntensity: 0.82,
    envMapIntensity: 0.82,
    opacity: 0.062,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  private readonly acrylicFrontPlateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff7e7,
    roughness: 0.082,
    metalness: 0,
    transmission: 0,
    thickness: PLATE_THICKNESS,
    ior: 1.49,
    clearcoat: 0.62,
    clearcoatRoughness: 0.072,
    specularIntensity: 0.68,
    envMapIntensity: 0.72,
    opacity: 0.052,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  private readonly acrylicRearPlateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf1eadb,
    roughness: 0.12,
    metalness: 0,
    transmission: 0,
    thickness: PLATE_THICKNESS,
    ior: 1.49,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    specularIntensity: 0.55,
    envMapIntensity: 0.58,
    opacity: 0.068,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  private readonly interactionPlateMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf3f1,
    roughness: 0.08,
    metalness: 0,
    transmission: 0,
    clearcoat: 0.46,
    clearcoatRoughness: 0.07,
    specularIntensity: 0.72,
    envMapIntensity: 0.7,
    opacity: 0.09,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  private readonly glassReflectionMaterial = new THREE.MeshBasicMaterial({
    map: this.makeSurfaceReflectionTexture(),
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
  });
  private readonly glassRimMaterial = new THREE.MeshBasicMaterial({
    map: this.makeRimTexture(),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly acrylicReflectionMaterial = new THREE.MeshBasicMaterial({
    map: this.makeAcrylicReflectionTexture(),
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly acrylicRimMaterial = new THREE.MeshBasicMaterial({
    map: this.makeAcrylicRimTexture(),
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly metalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbdbcb5,
    roughness: 0.2,
    metalness: 0.98,
    anisotropy: 0.72,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.24,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.32,
  });
  private readonly threadMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x84847f,
    roughness: 0.28,
    metalness: 0.98,
    anisotropy: 0.4,
    clearcoat: 0.12,
    envMapIntensity: 1.05,
  });
  private readonly standoffMaterial = new THREE.MeshStandardMaterial({
    color: 0x777875,
    roughness: 0.38,
    metalness: 0.84,
  });
  private readonly spotlightFixtureMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x777873,
    roughness: 0.21,
    metalness: 1,
    anisotropy: 0.86,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.13,
    envMapIntensity: 1.52,
    bumpMap: this.makeBrushedMetalTexture(),
    bumpScale: 0.045,
  });
  private readonly spotlightChromeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc8c9c5,
    roughness: 0.085,
    metalness: 1,
    clearcoat: 0.58,
    clearcoatRoughness: 0.045,
    envMapIntensity: 2.05,
  });
  private readonly spotlightInnerMaterial = new THREE.MeshStandardMaterial({
    color: 0x111210,
    roughness: 0.28,
    metalness: 0.86,
  });
  private readonly spotlightBulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe4ac,
    emissive: 0xffc66f,
    emissiveIntensity: 5.2,
    roughness: 0.18,
    metalness: 0,
    toneMapped: false,
  });
  private readonly spotlightLensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffe4b5,
    emissive: 0xffbd62,
    emissiveIntensity: 1.45,
    roughness: 0.035,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.018,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  private readonly spotlightGlowMaterial = new THREE.SpriteMaterial({
    map: this.makeBulbGlowTexture(),
    color: 0xffd895,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  private readonly spotlightPoolMaterial = new THREE.MeshBasicMaterial({
    map: this.makeSpotlightPoolTexture(),
    color: 0xffdfaa,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  private readonly headLightSheenMaterial = new THREE.MeshBasicMaterial({
    map: this.makeHeadLightSheenTexture(),
    color: 0xffe7bc,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  private readonly contactShadowMaterial = new THREE.MeshBasicMaterial({
    map: this.makeContactShadowTexture(),
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    toneMapped: false,
  });
  private wall?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private readonly headSpotlights: HeadSpotlightAsset[] = [];
  private keyLight?: THREE.RectAreaLight;
  private fillLight?: THREE.RectAreaLight;
  private headSpotFill?: THREE.RectAreaLight;
  private snapshot?: WallSnapshot;
  private renderFrame = 0;
  private width = 1;
  private height = 1;
  private interacting = false;
  private interactionMaterialWarmed = false;

  constructor(stage: HTMLElement) {
    this.stage = stage;
    this.host = document.createElement("div");
    this.host.className = "three-acrylic-stage";
    this.host.setAttribute("aria-hidden", "true");
    stage.prepend(this.host);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 0.84;
    this.renderer.setClearColor(0xdad5c9, 1);
    this.host.append(this.renderer.domElement);
    this.scene.add(this.wallAssembly);

    this.setupEnvironment();
    this.setupLights();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(stage);
    stage.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("record-wall:sync", this.handleSync);
    window.addEventListener("record-wall:interaction", this.handleInteraction);
    window.addEventListener("record-wall:export", this.handleExport);
    window.addEventListener("beforeunload", () => this.dispose(), { once: true });

    this.resize();
  }

  private setupEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environment = environment;
    this.scene.environmentIntensity = 0.68;
    pmrem.dispose();
  }

  private setupLights() {
    RectAreaLightUniformsLib.init();
    this.scene.add(new THREE.AmbientLight(0xf3eee3, 0.48));

    this.keyLight = new THREE.RectAreaLight(0xffe7bd, 2.75, 260, 720);
    this.keyLight.position.set(-520, 110, 360);
    this.keyLight.lookAt(-80, 20, -10);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.RectAreaLight(0xd5e2df, 0.82, 220, 620);
    this.fillLight.position.set(560, -20, 250);
    this.fillLight.lookAt(120, -10, -12);
    this.scene.add(this.fillLight);

    this.headSpotFill = new THREE.RectAreaLight(0xffd59c, 0, 900, 96);
    this.headSpotFill.position.set(0, 320, 260);
    this.headSpotFill.rotation.x = -0.52;
    this.wallAssembly.add(this.headSpotFill);

    const shadowLight = new THREE.DirectionalLight(0xffebca, 1.05);
    shadowLight.position.set(-560, 170, 680);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.set(1024, 1024);
    shadowLight.shadow.camera.near = 50;
    shadowLight.shadow.camera.far = 1500;
    shadowLight.shadow.bias = -0.00025;
    shadowLight.shadow.normalBias = 0.75;
    this.scene.add(shadowLight);
  }

  private readonly handleSync = (event: CustomEvent<WallSnapshot>) => {
    this.snapshot = event.detail;
    this.setInteraction(event.detail.interacting);
    this.updateScene(event.detail);
  };

  private readonly handleInteraction = (event: CustomEvent<{ active: boolean }>) => {
    this.setInteraction(event.detail.active);
  };

  private readonly handleExport = (event: CustomEvent<WallExportRequest>) => {
    const { resolve, reject } = event.detail;
    this.exportShareImage().then(resolve, reject);
  };

  private setInteraction(active: boolean) {
    if (this.interacting === active) return;
    this.interacting = active;
    this.frames.forEach((frame) => {
      this.applyFrameMaterial(frame, frame.materialType, active);
    });
    if (!active) this.renderer.shadowMap.needsUpdate = true;
    this.scheduleRender();
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (this.interacting || !this.keyLight || !this.fillLight) return;
    const bounds = this.stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
    const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
    this.keyLight.position.x = -520 + x * 90;
    this.keyLight.position.y = 110 - y * 55;
    this.keyLight.lookAt(-80 + x * 100, 20 - y * 70, -10);
    this.fillLight.position.x = 560 - x * 55;
    this.scheduleRender();
  };

  private resize() {
    const bounds = this.stage.getBoundingClientRect();
    this.width = Math.max(1, Math.round(bounds.width));
    this.height = Math.max(1, Math.round(bounds.height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.width < 720 ? 1.35 : 1.65));
    this.renderer.setSize(this.width, this.height, false);

    const cameraDistance = (this.height / 2) / Math.tan(THREE.MathUtils.degToRad(WALL_CAMERA_FOV / 2));
    this.camera.aspect = this.width / this.height;
    this.camera.near = 1;
    this.camera.far = cameraDistance + 2600;
    this.camera.position.set(0, 0, cameraDistance);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.updateWall();
    if (this.snapshot) this.updateScene(this.snapshot);
    this.scheduleRender();
  }

  private updateWall() {
    if (this.wall) {
      this.wallAssembly.remove(this.wall);
      this.wall.geometry.dispose();
      this.wall.material.map?.dispose();
      this.wall.material.bumpMap?.dispose();
      this.wall.material.dispose();
    }

    const texture = this.makeWallTexture();
    const bumpTexture = this.makeWallBumpTexture();
    const material = new THREE.MeshStandardMaterial({
      color: 0xeeeae1,
      map: texture,
      bumpMap: bumpTexture,
      bumpScale: 0.54,
      roughness: 0.94,
      metalness: 0,
    });
    this.wall = new THREE.Mesh(new THREE.PlaneGeometry(this.width + 1400, this.height + 1200, 32, 20), material);
    this.wall.position.z = -18;
    this.wall.receiveShadow = true;
    this.wallAssembly.add(this.wall);
  }

  private makeWallTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#d8d3c8";
    context.fillRect(0, 0, 1024, 1024);

    let seed = 137;
    context.filter = "blur(32px)";
    for (let index = 0; index < 72; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const radius = 38 + (seed / 2147483647) * 116;
      context.fillStyle = index % 2
        ? "rgba(72,63,52,.022)"
        : "rgba(255,252,242,.04)";
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.filter = "none";

    for (let index = 0; index < 54; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const length = 46 + (seed / 2147483647) * 154;
      context.lineWidth = index % 4 === 0 ? 1.4 : 0.7;
      context.strokeStyle = index % 3
        ? "rgba(72,65,55,.028)"
        : "rgba(255,255,249,.048)";
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x + length * 0.28, y + 3, x + length * 0.7, y - 4, x + length, y + 1);
      context.stroke();
    }

    for (let index = 0; index < 12800; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      const alpha = index % 5 === 0 ? 0.042 : 0.021;
      context.fillStyle = index % 3 ? `rgba(48,43,36,${alpha})` : `rgba(255,255,255,${alpha})`;
      context.fillRect(x, y, index % 7 === 0 ? 1.4 : 0.8, index % 11 === 0 ? 1.3 : 0.8);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(Math.max(1, this.width / 980), Math.max(1, this.height / 980));
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  private makeWallBumpTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#808080";
    context.fillRect(0, 0, 1024, 1024);

    let seed = 911;
    context.filter = "blur(14px)";
    for (let index = 0; index < 92; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const radius = 24 + (seed / 2147483647) * 72;
      context.fillStyle = index % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)";
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.filter = "none";

    context.lineCap = "round";
    for (let index = 0; index < 84; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const length = 32 + (seed / 2147483647) * 126;
      context.lineWidth = 0.8 + (index % 5) * 0.32;
      context.strokeStyle = index % 2 ? "rgba(255,255,255,.075)" : "rgba(0,0,0,.06)";
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + length, y + (index % 3 - 1) * 1.5);
      context.stroke();
    }

    for (let index = 0; index < 18400; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1024;
      context.fillStyle = index % 2 ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.085)";
      const grain = index % 9 === 0 ? 1.4 : 0.75;
      context.fillRect(x, y, grain, grain);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(Math.max(1, this.width / 980), Math.max(1, this.height / 980));
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  private placeCylinderBetween(mesh: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) {
    const direction = end.clone().sub(start);
    const length = direction.length();
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.set(1, length, 1);
  }

  private makeBrushedMetalTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#808080";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let seed = 1847;
    for (let y = 0; y < canvas.height; y += 1) {
      seed = (seed * 16807) % 2147483647;
      const value = 106 + Math.round((seed / 2147483647) * 52);
      const alpha = y % 7 === 0 ? 0.52 : 0.24;
      context.fillStyle = `rgba(${value},${value},${value},${alpha})`;
      context.fillRect(0, y, canvas.width, y % 5 === 0 ? 1.4 : 0.55);
    }

    const softHighlight = context.createLinearGradient(0, 0, canvas.width, 0);
    softHighlight.addColorStop(0, "rgba(255,255,255,.04)");
    softHighlight.addColorStop(0.45, "rgba(255,255,255,.2)");
    softHighlight.addColorStop(0.58, "rgba(0,0,0,.08)");
    softHighlight.addColorStop(1, "rgba(255,255,255,.03)");
    context.fillStyle = softHighlight;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  private createHeadSpotlight(index: number) {
    const group = new THREE.Group();
    group.name = `head-spotlight-${index + 1}`;

    const source = new THREE.Vector3(0, -40, 26);
    const targetPosition = new THREE.Vector3(0, -215, -17);
    const beamDirection = targetPosition.clone().sub(source).normalize();

    const canopy = new THREE.Mesh(this.spotlightCanopyGeometry, this.spotlightFixtureMaterial);
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(0, -12, -14.2);
    canopy.castShadow = true;
    group.add(canopy);

    const canopyRing = new THREE.Mesh(this.spotlightCanopyRingGeometry, this.spotlightChromeMaterial);
    canopyRing.position.set(0, -12, -11.92);
    group.add(canopyRing);

    const housingBack = source.clone().addScaledVector(beamDirection, -18);
    const stem = new THREE.Mesh(this.spotlightStemGeometry, this.spotlightChromeMaterial);
    this.placeCylinderBetween(stem, new THREE.Vector3(0, -12, -11.5), housingBack);
    stem.castShadow = true;
    group.add(stem);

    const pivot = new THREE.Mesh(this.spotlightPivotGeometry, this.spotlightChromeMaterial);
    pivot.position.copy(housingBack);
    pivot.castShadow = true;
    group.add(pivot);

    const housing = new THREE.Mesh(this.spotlightHousingGeometry, this.spotlightFixtureMaterial);
    housing.position.copy(source).addScaledVector(beamDirection, -11.1);
    housing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamDirection);
    housing.castShadow = true;
    group.add(housing);

    const darkInterior = new THREE.Mesh(
      this.spotlightInteriorGeometry,
      this.spotlightInnerMaterial,
    );
    darkInterior.position.copy(source).addScaledVector(beamDirection, -0.5);
    darkInterior.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamDirection);
    group.add(darkInterior);

    const bulb = new THREE.Mesh(this.spotlightBulbGeometry, this.spotlightBulbMaterial);
    bulb.position.copy(source).addScaledVector(beamDirection, -0.8);
    group.add(bulb);

    const lens = new THREE.Mesh(this.spotlightLensGeometry, this.spotlightLensMaterial);
    lens.position.copy(source).addScaledVector(beamDirection, 0.12);
    lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamDirection);
    lens.renderOrder = 44;
    group.add(lens);

    const trim = new THREE.Mesh(this.spotlightTrimGeometry, this.spotlightChromeMaterial);
    trim.position.copy(source).addScaledVector(beamDirection, 0.38);
    trim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamDirection);
    trim.castShadow = true;
    group.add(trim);

    const glow = new THREE.Sprite(this.spotlightGlowMaterial);
    glow.position.copy(source).addScaledVector(beamDirection, 2.5);
    glow.scale.set(32, 32, 1);
    glow.renderOrder = 45;
    group.add(glow);

    const pool = new THREE.Mesh(this.spotlightPoolGeometry, this.spotlightPoolMaterial);
    pool.position.set(0, -215, -17.2);
    pool.renderOrder = -1;
    group.add(pool);

    this.wallAssembly.add(group);
    return { group };
  }

  private updateHeadSpotlights(snapshot: WallSnapshot) {
    const count = THREE.MathUtils.clamp(Math.round(snapshot.spotlightCount || 0), 0, 6);
    while (this.headSpotlights.length < count) {
      this.headSpotlights.push(this.createHeadSpotlight(this.headSpotlights.length));
    }
    while (this.headSpotlights.length > count) {
      const removed = this.headSpotlights.pop();
      if (removed) this.wallAssembly.remove(removed.group);
    }

    this.headSpotlights.forEach((asset, index) => {
      const normalizedPosition = snapshot.spotlightPositions[index] ?? (index + 1) / (count + 1);
      const x = (normalizedPosition - 0.5) * snapshot.width;
      asset.group.position.set(x, snapshot.height / 2 - 22, 0);
    });

    if (this.headSpotFill) {
      this.headSpotFill.intensity = count ? 2.05 + count * 0.2 : 0;
      this.headSpotFill.width = Math.min(snapshot.width * 0.86, 1180);
      this.headSpotFill.position.set(0, snapshot.height / 2 - 34, 260);
    }
    this.headLightSheenMaterial.opacity = count ? Math.min(0.25, 0.14 + count * 0.018) : 0;
  }

  private updateScene(snapshot: WallSnapshot) {
    this.wallAssembly.rotation.y = THREE.MathUtils.degToRad(snapshot.wallYaw || 0);
    this.updateHeadSpotlights(snapshot);
    const active = new Set<number>();
    snapshot.albums.forEach((album) => {
      active.add(album.index);
      const frame = this.frames.get(album.index) ?? this.createFrame(album.index);
      frame.group.visible = !album.hidden;
      frame.group.position.set(
        album.x + album.size / 2 - snapshot.width / 2,
        snapshot.height / 2 - album.y - album.size / 2,
        Math.min(8, album.zIndex * 0.035),
      );
      const scale = album.size / PANEL_SIZE;
      frame.group.scale.setScalar(scale);
      frame.group.rotation.z = THREE.MathUtils.degToRad(-album.rotation);
      frame.group.renderOrder = album.zIndex;
      this.applyFrameMaterial(frame, album.frameType);
      this.setCover(frame, album);
    });

    this.frames.forEach((frame, index) => {
      if (!active.has(index)) frame.group.visible = false;
    });
    if (!this.interacting && !this.interactionMaterialWarmed && this.frames.size) {
      this.frames.forEach((frame) => {
        this.applyFrameMaterial(frame, frame.materialType, true);
      });
      this.renderer.compile(this.scene, this.camera);
      this.frames.forEach((frame) => {
        this.applyFrameMaterial(frame, frame.materialType, false);
      });
      this.interactionMaterialWarmed = true;
    }
    this.scheduleRender();
  }

  private applyFrameMaterial(frame: FrameAsset, requestedType: string, interacting = this.interacting) {
    const materialType = requestedType === "glass" ? "glass" : "acrylic";
    const isGlass = materialType === "glass";
    const thicknessScale = isGlass ? 0.68 : 1;
    frame.materialType = materialType;
    frame.frontPlate.material = interacting
      ? this.interactionPlateMaterial
      : isGlass ? this.glassFrontPlateMaterial : this.acrylicFrontPlateMaterial;
    frame.rearPlate.material = interacting
      ? this.interactionPlateMaterial
      : isGlass ? this.glassRearPlateMaterial : this.acrylicRearPlateMaterial;
    frame.frontPlate.scale.z = thicknessScale;
    frame.rearPlate.scale.z = thicknessScale;
    frame.rearPlate.position.set(isGlass ? -0.72 : -1.35, isGlass ? 0.58 : 1.05, REAR_PLATE_Z);
    frame.frontEdges.scale.z = thicknessScale;
    frame.rearEdges.scale.z = thicknessScale;
    frame.rearEdges.position.copy(frame.rearPlate.position);
    frame.reflection.material = isGlass ? this.glassReflectionMaterial : this.acrylicReflectionMaterial;
    frame.rim.material = isGlass ? this.glassRimMaterial : this.acrylicRimMaterial;
    const surfaceZ = FRONT_PLATE_Z + (PLATE_THICKNESS * thicknessScale) / 2;
    frame.reflection.position.z = surfaceZ + 0.12;
    frame.rim.position.z = surfaceZ + 0.18;
    frame.headLightSheen.position.z = surfaceZ + 0.1;

    const frontEdgeMaterial = frame.frontEdges.material as THREE.LineBasicMaterial;
    const rearEdgeMaterial = frame.rearEdges.material as THREE.LineBasicMaterial;
    frontEdgeMaterial.color.setHex(isGlass ? 0xd8ffff : 0xfff5dd);
    frontEdgeMaterial.opacity = isGlass ? 0.96 : 0.72;
    rearEdgeMaterial.color.setHex(isGlass ? 0x8eafb1 : 0xb7ad98);
    rearEdgeMaterial.opacity = isGlass ? 0.9 : 0.62;
  }

  private createFrame(index: number) {
    const group = new THREE.Group();
    group.name = `acrylic-frame-${index + 1}`;

    const contactShadow = new THREE.Mesh(this.contactShadowGeometry, this.contactShadowMaterial);
    contactShadow.position.set(7, -10, -14.6);
    contactShadow.renderOrder = -2;
    group.add(contactShadow);

    const rearPlate = new THREE.Mesh(
      this.plateGeometry,
      this.interacting ? this.interactionPlateMaterial : this.acrylicRearPlateMaterial,
    );
    rearPlate.position.set(-1.35, 1.05, REAR_PLATE_Z);
    rearPlate.receiveShadow = true;
    rearPlate.renderOrder = 10;
    group.add(rearPlate);

    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    const cover = new THREE.Mesh(this.coverGeometry, coverMaterial);
    cover.position.z = COVER_Z;
    cover.castShadow = true;
    cover.renderOrder = 16;
    group.add(cover);

    const frontPlate = new THREE.Mesh(
      this.plateGeometry,
      this.interacting ? this.interactionPlateMaterial : this.acrylicFrontPlateMaterial,
    );
    frontPlate.position.z = FRONT_PLATE_Z;
    frontPlate.castShadow = false;
    frontPlate.receiveShadow = false;
    frontPlate.renderOrder = 24;
    group.add(frontPlate);

    const rearEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0xb7ad98,
      transparent: true,
      opacity: 0.62,
      toneMapped: false,
    });
    const rearEdges = new THREE.LineSegments(new THREE.EdgesGeometry(this.plateGeometry, 24), rearEdgeMaterial);
    rearEdges.position.copy(rearPlate.position);
    rearEdges.renderOrder = 12;
    group.add(rearEdges);

    const frontEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0xfff5dd,
      transparent: true,
      opacity: 0.72,
      toneMapped: false,
    });
    const frontEdges = new THREE.LineSegments(new THREE.EdgesGeometry(this.plateGeometry, 24), frontEdgeMaterial);
    frontEdges.position.z = FRONT_PLATE_Z + 0.08;
    frontEdges.renderOrder = 27;
    group.add(frontEdges);

    const headLightSheen = new THREE.Mesh(this.reflectionGeometry, this.headLightSheenMaterial);
    headLightSheen.position.z = FRONT_PLATE_Z + PLATE_THICKNESS / 2 + 0.1;
    headLightSheen.renderOrder = 29;
    group.add(headLightSheen);

    const reflection = new THREE.Mesh(this.reflectionGeometry, this.acrylicReflectionMaterial);
    reflection.position.z = FRONT_PLATE_Z + PLATE_THICKNESS / 2 + 0.12;
    reflection.renderOrder = 30;
    group.add(reflection);

    const rim = new THREE.Mesh(this.rimGeometry, this.acrylicRimMaterial);
    rim.position.z = FRONT_PLATE_Z + PLATE_THICKNESS / 2 + 0.18;
    rim.renderOrder = 31;
    group.add(rim);

    const screwInset = 17;
    const screwPositions = [
      [-PANEL_SIZE / 2 + screwInset, PANEL_SIZE / 2 - screwInset],
      [PANEL_SIZE / 2 - screwInset, PANEL_SIZE / 2 - screwInset],
      [-PANEL_SIZE / 2 + screwInset, -PANEL_SIZE / 2 + screwInset],
      [PANEL_SIZE / 2 - screwInset, -PANEL_SIZE / 2 + screwInset],
    ];
    screwPositions.forEach(([x, y]) => {
      const standoff = new THREE.Mesh(this.standoffGeometry, this.standoffMaterial);
      standoff.rotation.x = Math.PI / 2;
      standoff.position.set(x, y, -13.1);
      standoff.castShadow = true;
      group.add(standoff);

      const separator = new THREE.Mesh(this.separatorGeometry, this.standoffMaterial);
      separator.rotation.x = Math.PI / 2;
      separator.position.set(x, y, -3.75);
      separator.castShadow = true;
      group.add(separator);

      const screw = new THREE.Mesh(this.screwGeometry, this.metalMaterial);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, 4.85);
      screw.castShadow = true;
      group.add(screw);

      const thread = new THREE.Mesh(this.screwThreadGeometry, this.threadMaterial);
      thread.position.set(x, y, 4.85);
      thread.castShadow = true;
      group.add(thread);

      const faceRing = new THREE.Mesh(this.screwFaceRingGeometry, this.threadMaterial);
      faceRing.position.set(x, y, 8.12);
      group.add(faceRing);
    });

    this.wallAssembly.add(group);
    const frame: FrameAsset = {
      group,
      cover,
      frontPlate,
      rearPlate,
      frontEdges,
      rearEdges,
      headLightSheen,
      reflection,
      rim,
      materialType: "acrylic",
      textureKey: "",
    };
    this.frames.set(index, frame);
    return frame;
  }

  private setCover(frame: FrameAsset, album: AlbumSnapshot) {
    const textureKey = album.cover || `generated:${album.index}:${album.name}`;
    if (frame.textureKey === textureKey) return;
    frame.textureKey = textureKey;

    const cached = this.textures.get(textureKey);
    if (cached) {
      frame.cover.material.map = cached;
      frame.cover.material.needsUpdate = true;
      return;
    }

    if (!album.cover) {
      const texture = this.makeGeneratedCover(album);
      this.textures.set(textureKey, texture);
      frame.cover.material.map = texture;
      frame.cover.material.needsUpdate = true;
      return;
    }

    const proxyUrl = `/api/cover?url=${encodeURIComponent(album.cover)}`;
    this.textureLoader.load(
      proxyUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.textures.set(textureKey, texture);
        if (frame.textureKey === textureKey) {
          frame.cover.material.map = texture;
          frame.cover.material.needsUpdate = true;
        }
        this.scheduleRender();
      },
      undefined,
      () => {
        const fallback = this.makeGeneratedCover(album);
        this.textures.set(textureKey, fallback);
        if (frame.textureKey === textureKey) {
          frame.cover.material.map = fallback;
          frame.cover.material.needsUpdate = true;
        }
        this.scheduleRender();
      },
    );
  }

  private makeGeneratedCover(album: AlbumSnapshot) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;
    const palettes = [
      ["#182a30", "#c36943", "#e7d0a5"],
      ["#89926d", "#d7c98e", "#20271d"],
      ["#224b65", "#cda83f", "#e7e2d1"],
      ["#263a3e", "#b95d45", "#e4c49d"],
      ["#8ba29b", "#28434d", "#d0bda0"],
      ["#d46b31", "#3b2419", "#e7c59e"],
      ["#14201f", "#4e725a", "#d8c18a"],
      ["#b87380", "#452b35", "#e9d4c2"],
    ];
    const [base, accent, ink] = palettes[album.index % palettes.length];

    if (album.kind === "vinyl") {
      context.fillStyle = "#ebe7dd";
      context.fillRect(0, 0, 512, 512);
      const vinyl = context.createRadialGradient(256, 256, 18, 256, 256, 218);
      vinyl.addColorStop(0, "#393936");
      vinyl.addColorStop(0.12, "#111210");
      vinyl.addColorStop(0.58, "#252622");
      vinyl.addColorStop(1, "#090a09");
      context.fillStyle = vinyl;
      context.beginPath();
      context.arc(256, 256, 214, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(255,255,255,.075)";
      context.lineWidth = 1;
      for (let radius = 78; radius < 204; radius += 8) {
        context.beginPath();
        context.arc(256, 256, radius, 0, Math.PI * 2);
        context.stroke();
      }
      context.fillStyle = album.label || accent;
      context.beginPath();
      context.arc(256, 256, 66, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = album.labelInk || ink;
      context.font = '500 30px Georgia, serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(album.monogram || "RW", 256, 258);

      const vinylTexture = new THREE.CanvasTexture(canvas);
      vinylTexture.colorSpace = THREE.SRGBColorSpace;
      vinylTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      return vinylTexture;
    }

    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, base);
    gradient.addColorStop(1, accent);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    context.strokeStyle = `${ink}88`;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(370, 145, 72 + album.index * 3, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = ink;
    context.font = '500 44px "Avenir Next", sans-serif';
    context.fillText(album.title.replace("\n", " ").slice(0, 16), 42, 402);
    context.globalAlpha = 0.68;
    context.font = '600 18px "Avenir Next", sans-serif';
    context.fillText(album.subtitle.slice(0, 32), 44, 445);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  private makeScrewThreadGeometry() {
    const points: THREE.Vector3[] = [];
    const segments = 144;
    const turns = 5.25;
    const radius = 5.34;
    const length = 5.7;

    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const angle = progress * turns * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (progress - 0.5) * length,
      ));
    }

    const helix = new THREE.CatmullRomCurve3(points, false, "centripetal");
    return new THREE.TubeGeometry(helix, 176, 0.2, 6, false);
  }

  private makeSurfaceReflectionTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    const diagonal = context.createLinearGradient(40, 0, 472, 512);
    diagonal.addColorStop(0, "rgba(255,255,255,.02)");
    diagonal.addColorStop(0.14, "rgba(255,255,255,.11)");
    diagonal.addColorStop(0.25, "rgba(255,255,255,.018)");
    diagonal.addColorStop(0.48, "rgba(255,255,255,0)");
    diagonal.addColorStop(0.63, "rgba(255,255,255,.075)");
    diagonal.addColorStop(0.75, "rgba(255,255,255,.014)");
    diagonal.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = diagonal;
    context.fillRect(0, 0, 512, 512);

    const cornerGlow = context.createRadialGradient(80, 44, 0, 80, 44, 280);
    cornerGlow.addColorStop(0, "rgba(255,250,235,.1)");
    cornerGlow.addColorStop(0.44, "rgba(255,252,244,.025)");
    cornerGlow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = cornerGlow;
    context.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeAcrylicReflectionTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    const broadLight = context.createLinearGradient(-40, 500, 520, 10);
    broadLight.addColorStop(0, "rgba(255,247,228,0)");
    broadLight.addColorStop(0.27, "rgba(255,247,228,.018)");
    broadLight.addColorStop(0.44, "rgba(255,251,240,.062)");
    broadLight.addColorStop(0.63, "rgba(255,250,237,.026)");
    broadLight.addColorStop(0.82, "rgba(255,248,231,0)");
    context.fillStyle = broadLight;
    context.fillRect(0, 0, 512, 512);

    const topGlow = context.createRadialGradient(104, 42, 8, 104, 42, 330);
    topGlow.addColorStop(0, "rgba(255,252,241,.075)");
    topGlow.addColorStop(0.48, "rgba(255,249,235,.022)");
    topGlow.addColorStop(1, "rgba(255,247,230,0)");
    context.fillStyle = topGlow;
    context.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeRimTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    const topLight = context.createLinearGradient(0, 0, 0, 34);
    topLight.addColorStop(0, "rgba(238,255,255,.62)");
    topLight.addColorStop(0.2, "rgba(228,255,255,.23)");
    topLight.addColorStop(1, "rgba(228,255,255,0)");
    context.fillStyle = topLight;
    context.fillRect(0, 0, 512, 34);

    const leftLight = context.createLinearGradient(0, 0, 34, 0);
    leftLight.addColorStop(0, "rgba(245,255,255,.52)");
    leftLight.addColorStop(0.22, "rgba(222,251,251,.18)");
    leftLight.addColorStop(1, "rgba(222,251,251,0)");
    context.fillStyle = leftLight;
    context.fillRect(0, 0, 34, 512);

    const bottomShade = context.createLinearGradient(0, 478, 0, 512);
    bottomShade.addColorStop(0, "rgba(79,112,114,0)");
    bottomShade.addColorStop(0.78, "rgba(79,112,114,.17)");
    bottomShade.addColorStop(1, "rgba(68,98,101,.32)");
    context.fillStyle = bottomShade;
    context.fillRect(0, 478, 512, 34);

    const rightShade = context.createLinearGradient(478, 0, 512, 0);
    rightShade.addColorStop(0, "rgba(77,109,112,0)");
    rightShade.addColorStop(0.8, "rgba(77,109,112,.14)");
    rightShade.addColorStop(1, "rgba(65,94,97,.27)");
    context.fillStyle = rightShade;
    context.fillRect(478, 0, 34, 512);

    context.strokeStyle = "rgba(222,252,251,.56)";
    context.lineWidth = 3;
    context.strokeRect(2, 2, 508, 508);
    context.strokeStyle = "rgba(111,148,150,.18)";
    context.lineWidth = 2;
    context.strokeRect(8, 8, 496, 496);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeAcrylicRimTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    const topLight = context.createLinearGradient(0, 0, 0, 52);
    topLight.addColorStop(0, "rgba(255,250,235,.46)");
    topLight.addColorStop(0.34, "rgba(255,248,230,.16)");
    topLight.addColorStop(1, "rgba(255,248,230,0)");
    context.fillStyle = topLight;
    context.fillRect(0, 0, 512, 52);

    const leftLight = context.createLinearGradient(0, 0, 52, 0);
    leftLight.addColorStop(0, "rgba(255,252,241,.4)");
    leftLight.addColorStop(0.38, "rgba(255,247,226,.13)");
    leftLight.addColorStop(1, "rgba(255,247,226,0)");
    context.fillStyle = leftLight;
    context.fillRect(0, 0, 52, 512);

    const bottomShade = context.createLinearGradient(0, 460, 0, 512);
    bottomShade.addColorStop(0, "rgba(120,105,82,0)");
    bottomShade.addColorStop(0.72, "rgba(120,105,82,.1)");
    bottomShade.addColorStop(1, "rgba(105,91,70,.2)");
    context.fillStyle = bottomShade;
    context.fillRect(0, 460, 512, 52);

    const rightShade = context.createLinearGradient(460, 0, 512, 0);
    rightShade.addColorStop(0, "rgba(120,105,82,0)");
    rightShade.addColorStop(0.72, "rgba(120,105,82,.085)");
    rightShade.addColorStop(1, "rgba(105,91,70,.17)");
    context.fillStyle = rightShade;
    context.fillRect(460, 0, 52, 512);

    context.strokeStyle = "rgba(255,249,232,.43)";
    context.lineWidth = 5;
    context.strokeRect(3, 3, 506, 506);
    context.strokeStyle = "rgba(133,116,88,.1)";
    context.lineWidth = 2;
    context.strokeRect(11, 11, 490, 490);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeBulbGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d")!;
    const glow = context.createRadialGradient(128, 128, 2, 128, 128, 126);
    glow.addColorStop(0, "rgba(255,248,220,1)");
    glow.addColorStop(0.12, "rgba(255,224,160,.9)");
    glow.addColorStop(0.36, "rgba(255,198,103,.34)");
    glow.addColorStop(1, "rgba(255,183,74,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeHeadLightSheenTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    const wash = context.createLinearGradient(0, 0, 0, 512);
    wash.addColorStop(0, "rgba(255,250,230,.74)");
    wash.addColorStop(0.16, "rgba(255,238,201,.38)");
    wash.addColorStop(0.42, "rgba(255,222,168,.12)");
    wash.addColorStop(0.72, "rgba(255,214,145,.025)");
    wash.addColorStop(1, "rgba(255,210,136,0)");
    context.fillStyle = wash;
    context.fillRect(0, 0, 512, 512);

    const center = context.createRadialGradient(256, 18, 12, 256, 70, 330);
    center.addColorStop(0, "rgba(255,251,235,.34)");
    center.addColorStop(0.5, "rgba(255,230,187,.08)");
    center.addColorStop(1, "rgba(255,220,160,0)");
    context.fillStyle = center;
    context.fillRect(0, 0, 512, 400);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeSpotlightPoolTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    context.save();
    context.translate(128, 256);
    context.scale(0.52, 1);
    const pool = context.createRadialGradient(0, 0, 3, 0, 0, 232);
    pool.addColorStop(0, "rgba(255,247,220,.72)");
    pool.addColorStop(0.2, "rgba(255,230,181,.38)");
    pool.addColorStop(0.56, "rgba(255,214,145,.13)");
    pool.addColorStop(0.82, "rgba(255,207,129,.035)");
    pool.addColorStop(1, "rgba(255,202,116,0)");
    context.fillStyle = pool;
    context.fillRect(-280, -260, 560, 520);
    context.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private makeContactShadowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.filter = "blur(10px)";
    context.fillStyle = "rgba(36,31,25,.36)";
    context.fillRect(25, 22, 198, 198);
    context.filter = "blur(3px)";
    context.fillStyle = "rgba(37,33,28,.2)";
    context.fillRect(29, 26, 198, 198);
    context.filter = "blur(1px)";
    context.fillStyle = "rgba(39,35,30,.08)";
    context.fillRect(31, 28, 196, 196);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private scheduleRender() {
    if (this.renderFrame) return;
    this.renderFrame = window.requestAnimationFrame(() => {
      this.renderFrame = 0;
      this.renderer.render(this.scene, this.camera);
    });
  }

  private async waitForVisibleTextures(timeout = 3000) {
    const startedAt = performance.now();
    while (
      [...this.frames.values()].some((frame) => frame.group.visible && !frame.cover.material.map) &&
      performance.now() - startedAt < timeout
    ) {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
  }

  private async exportShareImage() {
    await this.waitForVisibleTextures();

    const previousTarget = this.renderer.getRenderTarget();
    let capturedImage = "";

    try {
      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      capturedImage = this.renderer.domElement.toDataURL("image/png");
    } finally {
      this.renderer.setRenderTarget(previousTarget);
      this.scheduleRender();
    }

    if (!capturedImage || capturedImage === "data:,") {
      throw new Error("浏览器没有返回可用的 WebGL 画面");
    }

    const encoded = capturedImage.slice(capturedImage.indexOf(",") + 1);
    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: "image/png" });
  }

  private dispose() {
    this.resizeObserver.disconnect();
    window.removeEventListener("record-wall:sync", this.handleSync);
    window.removeEventListener("record-wall:interaction", this.handleInteraction);
    window.removeEventListener("record-wall:export", this.handleExport);
    this.plateGeometry.dispose();
    this.coverGeometry.dispose();
    this.contactShadowGeometry.dispose();
    this.reflectionGeometry.dispose();
    this.rimGeometry.dispose();
    this.screwGeometry.dispose();
    this.screwThreadGeometry.dispose();
    this.screwFaceRingGeometry.dispose();
    this.standoffGeometry.dispose();
    this.separatorGeometry.dispose();
    this.spotlightCanopyGeometry.dispose();
    this.spotlightCanopyRingGeometry.dispose();
    this.spotlightStemGeometry.dispose();
    this.spotlightPivotGeometry.dispose();
    this.spotlightHousingGeometry.dispose();
    this.spotlightInteriorGeometry.dispose();
    this.spotlightTrimGeometry.dispose();
    this.spotlightBulbGeometry.dispose();
    this.spotlightLensGeometry.dispose();
    this.spotlightPoolGeometry.dispose();
    this.glassFrontPlateMaterial.dispose();
    this.glassRearPlateMaterial.dispose();
    this.acrylicFrontPlateMaterial.dispose();
    this.acrylicRearPlateMaterial.dispose();
    this.interactionPlateMaterial.dispose();
    this.glassReflectionMaterial.map?.dispose();
    this.glassReflectionMaterial.dispose();
    this.acrylicReflectionMaterial.map?.dispose();
    this.acrylicReflectionMaterial.dispose();
    this.glassRimMaterial.map?.dispose();
    this.glassRimMaterial.dispose();
    this.acrylicRimMaterial.map?.dispose();
    this.acrylicRimMaterial.dispose();
    this.metalMaterial.dispose();
    this.threadMaterial.dispose();
    this.standoffMaterial.dispose();
    this.spotlightFixtureMaterial.bumpMap?.dispose();
    this.spotlightFixtureMaterial.dispose();
    this.spotlightChromeMaterial.dispose();
    this.spotlightInnerMaterial.dispose();
    this.spotlightBulbMaterial.dispose();
    this.spotlightLensMaterial.dispose();
    this.spotlightGlowMaterial.map?.dispose();
    this.spotlightGlowMaterial.dispose();
    this.spotlightPoolMaterial.map?.dispose();
    this.spotlightPoolMaterial.dispose();
    this.headLightSheenMaterial.map?.dispose();
    this.headLightSheenMaterial.dispose();
    this.contactShadowMaterial.map?.dispose();
    this.contactShadowMaterial.dispose();
    this.textures.forEach((texture) => texture.dispose());
    if (this.wall) {
      this.wall.geometry.dispose();
      this.wall.material.map?.dispose();
      this.wall.material.bumpMap?.dispose();
      this.wall.material.dispose();
    }
    this.frames.forEach((frame) => {
      frame.cover.material.dispose();
      frame.group.traverse((object) => {
        if (object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    });
    this.headSpotlights.forEach((asset) => this.wallAssembly.remove(asset.group));
    this.renderer.dispose();
  }
}

export function createAcrylicComparison() {
  const stage = document.querySelector<HTMLElement>("#galleryStage");
  if (!stage) return;

  try {
    new AcrylicComparison(stage);
  } catch (error) {
    document.body.dataset.webglUnavailable = "true";
    console.error("Three.js acrylic renderer failed to initialize", error);
  }
}
