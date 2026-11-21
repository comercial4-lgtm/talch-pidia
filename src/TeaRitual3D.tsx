import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

interface TeaRitual3DProps {
  onSelectBlendForCarta?: (blendId: string) => void;
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
}

interface TeaBlend3D {
  id: string;
  name: string;
  category: string;
  temp: string;
  steepTime: string;
  dosage: string;
  liquidHex: string;
  attenuationHex: string;
  leafColors: string[];
  notes: string;
  pairing: string;
}

const BLENDS_3D: TeaBlend3D[] = [
  {
    id: 'cherry-rose',
    name: 'Cherry Rose',
    category: 'Chá Verde Sencha',
    temp: '75°C – 80°C',
    steepTime: '2 a 3 min',
    dosage: '2g / 200ml',
    liquidHex: '#8FB96E',
    attenuationHex: '#5B8B3C',
    leafColors: ['#3F6D36', '#618B4A', '#D96B84', '#EAB5C0'],
    notes: 'Sencha japonês, flor de cerejeira selvagem e pétalas de rosa.',
    pairing: 'Peixes brancos, sushis, ceviches e frutas frescas.',
  },
  {
    id: 'earl-grey',
    name: 'Earl Grey Especial',
    category: 'Chá Preto do Ceilão',
    temp: '95°C',
    steepTime: '3 a 4 min',
    dosage: '2g / 200ml',
    liquidHex: '#B66324',
    attenuationHex: '#7A3510',
    leafColors: ['#2B1E16', '#463225', '#3E4F6B', '#C99846'],
    notes: 'Folhas negras do Ceilão com óleo essencial de bergamota prensado a frio.',
    pairing: 'Carnes nobres, queijos curados, folhados e chocolate 70%.',
  },
  {
    id: 'vermelho-intenso',
    name: 'Vermelho Intenso',
    category: 'Infusão Rubi (Sem Cafeína)',
    temp: '100°C',
    steepTime: '5 a 7 min',
    dosage: '3g / 200ml',
    liquidHex: '#9E1B32',
    attenuationHex: '#680B1D',
    leafColors: ['#7D1225', '#B92B45', '#D77A89', '#4A1820'],
    notes: 'Hibisco em flor, morango, framboesa silvestre e maçã caramelizada.',
    pairing: 'Coquetelaria autoral, queijo de cabra e tortas cítricas.',
  },
  {
    id: 'doce-amendoa',
    name: 'Doce Amêndoa',
    category: 'Infusão Conforto (Sem Cafeína)',
    temp: '100°C',
    steepTime: '5 a 8 min',
    dosage: '3g / 200ml',
    liquidHex: '#C24D3A',
    attenuationHex: '#7C261D',
    leafColors: ['#C59E6E', '#8F4624', '#DFC096', '#7A252E'],
    notes: 'Maçã assada, lâminas de amêndoa tostada, canela do Ceilão e beterraba.',
    pairing: 'Sobremesas quentes, mil-folhas, fondues e café da manhã.',
  },
];

type CameraPresetKey = 'full' | 'vapt' | 'cup' | 'tubes';

interface CameraPreset {
  id: CameraPresetKey;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'full', label: 'Mesa Completa', position: [3.2, 2.35, 3.85], target: [0.0, 0.72, 0.0] },
  { id: 'vapt', label: 'Vapt Vupt', position: [1.55, 1.75, 2.1], target: [-0.25, 0.92, 0.0] },
  { id: 'cup', label: 'Copo Duplo', position: [2.1, 1.28, 2.05], target: [1.02, 0.42, 0.35] },
  { id: 'tubes', label: 'Tubo Olfativo', position: [-2.15, 1.38, 2.1], target: [-1.18, 0.46, 0.3] },
];

interface InspectedPartInfo {
  key: 'vapt' | 'cup' | 'tubes';
  title: string;
  subtitle: string;
  specs: string;
}

const PART_INFO: Record<'vapt' | 'cup' | 'tubes', InspectedPartInfo> = {
  vapt: {
    key: 'vapt',
    title: 'Preparador Vapt Vupt Patenteado (500ml)',
    subtitle: 'Tritan BPA-Free · Válvula Antipingos por Pressão',
    specs: 'Ao apoiar a base sobre a xícara, a válvula inferior libera o chá filtrado pela malha de aço inox sem deixar resíduos ou pingos na toalha de mesa.',
  },
  cup: {
    key: 'cup',
    title: 'Copo Térmico Vidro Duplo Borossilicato',
    subtitle: 'Isolamento Térmico · Realce Cromático da Infusão',
    specs: 'Parede dupla mantém a temperatura ideal por mais tempo sem aquecer as mãos do convidado e revela a tonalidade cristalina de cada blend.',
  },
  tubes: {
    key: 'tubes',
    title: 'Display de Amostra Olfativa à Mesa',
    subtitle: '3 Tubos de Borossilicato com Rolha Natural & Folhas Inteiras',
    specs: 'O cliente vivencia o aroma seco das folhas inteiras e flores antes da infusão — elevando o ticket médio e a percepção de luxo no salão.',
  },
};

// Pre-allocated math helpers (zero GC in animation loop)
const _v3a = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function createWalnutTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3B281B';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.04) * 14 + Math.cos(y * 0.11) * 6;
    const tone = Math.floor(42 + Math.sin(y * 0.08 + wave * 0.05) * 16);
    ctx.fillStyle = `rgba(${tone + 26}, ${tone + 8}, ${Math.max(12, tone - 6)}, 0.45)`;
    ctx.fillRect(0, y, 512, 2);
  }
  for (let i = 0; i < 420; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    const w = 40 + (i % 90);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(24,14,8,0.18)' : 'rgba(116,82,52,0.12)';
    ctx.fillRect(x, y, w, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createTravertineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#E8DFD1');
  grad.addColorStop(0.5, '#DED3C1');
  grad.addColorStop(1, '#D3C5B0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) {
    const y = (i * 19) % 512;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(182, 165, 140, 0.25)' : 'rgba(255, 250, 244, 0.35)';
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + ((i % 7) - 3) * 4, 340, y - ((i % 5) - 2) * 5, 512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createMeshFilterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#B8BEC4';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#3B4148';
  for (let y = 4; y < 256; y += 8) {
    for (let x = 4; x < 256; x += 8) {
      ctx.beginPath();
      ctx.arc(x + ((y / 8) % 2) * 4, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  g.addColorStop(0, 'rgba(10, 8, 6, 0.58)');
  g.addColorStop(0.55, 'rgba(10, 8, 6, 0.22)');
  g.addColorStop(1, 'rgba(10, 8, 6, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createSteamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0, 'rgba(255, 252, 245, 0.42)');
  g.addColorStop(0.45, 'rgba(250, 244, 232, 0.16)');
  g.addColorStop(1, 'rgba(250, 244, 232, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function playRitualChime(pouring: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pouring ? 528 : 659.25, now);
    osc.frequency.exponentialRampToValueAtTime(pouring ? 396 : 880, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Audio playback disabled by browser policy
  }
}

export default function TeaRitual3D({ onSelectBlendForCarta, onOpenLeadModal }: TeaRitual3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedBlendId, setSelectedBlendId] = useState<string>('cherry-rose');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetKey>('full');
  const [exploded, setExploded] = useState<number>(0);
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [studioLightMode, setStudioLightMode] = useState<'noir' | 'ivory'>('noir');
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [inspectedPart, setInspectedPart] = useState<InspectedPartInfo | null>(PART_INFO.vapt);

  const selectedBlend = BLENDS_3D.find((b) => b.id === selectedBlendId) || BLENDS_3D[0];

  // Mutable ref state read inside Three.js animation loop without re-creating the WebGLRenderer
  const sceneStateRef = useRef({
    blend: selectedBlend,
    explodedTarget: 0,
    explodedCurrent: 0,
    pouring: false,
    pourProgress: 0,
    studioMode: 'noir' as 'noir' | 'ivory',
    camTransitionActive: false,
    camTargetPos: new THREE.Vector3(3.2, 2.35, 3.85),
    camTargetLook: new THREE.Vector3(0, 0.72, 0),
    soundEnabled: false,
    updateBlendVisuals: null as ((b: TeaBlend3D) => void) | null,
    updateStudioTheme: null as ((m: 'noir' | 'ivory') => void) | null,
  });

  useEffect(() => {
    sceneStateRef.current.blend = selectedBlend;
    sceneStateRef.current.updateBlendVisuals?.(selectedBlend);
  }, [selectedBlend]);

  useEffect(() => {
    sceneStateRef.current.explodedTarget = exploded / 100;
  }, [exploded]);

  useEffect(() => {
    sceneStateRef.current.pouring = isPouring;
    if (sceneStateRef.current.soundEnabled) {
      playRitualChime(isPouring);
    }
  }, [isPouring]);

  useEffect(() => {
    sceneStateRef.current.studioMode = studioLightMode;
    sceneStateRef.current.updateStudioTheme?.(studioLightMode);
  }, [studioLightMode]);

  useEffect(() => {
    sceneStateRef.current.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        setHudCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const triggerCameraPreset = (presetId: CameraPresetKey) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    setCameraPreset(presetId);
    sceneStateRef.current.camTargetPos.set(...preset.position);
    sceneStateRef.current.camTargetLook.set(...preset.target);
    sceneStateRef.current.camTransitionActive = true;
    if (presetId === 'vapt') setInspectedPart(PART_INFO.vapt);
    else if (presetId === 'cup') setInspectedPart(PART_INFO.cup);
    else if (presetId === 'tubes') setInspectedPart(PART_INFO.tubes);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL probe (cost-only gating; zero layout/object degradation)
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 580;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const darkBg = new THREE.Color('#161210');
    const lightBg = new THREE.Color('#EAE1D3');
    scene.background = darkBg.clone();
    scene.fog = new THREE.FogExp2(darkBg.getHex(), 0.052);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(3.2, 2.35, 3.85);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.72, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.65;
    controls.maxDistance = 7.2;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.addEventListener('start', () => {
      sceneStateRef.current.camTransitionActive = false;
    });

    // Studio Lighting (warm key + cool Hemisphere + rim + optional RectAreaLight softboxes)
    const keyLight = new THREE.DirectionalLight('#FFF0D8', 2.4);
    keyLight.position.set(3.6, 5.4, 3.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3.6;
    keyLight.shadow.camera.right = 3.6;
    keyLight.shadow.camera.top = 3.6;
    keyLight.shadow.camera.bottom = -3.6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight('#C6DCF4', '#2C2119', 0.95);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight('#FFD99B', 1.15);
    rimLight.position.set(-3.5, 3.2, -3.4);
    scene.add(rimLight);

    let softbox1: THREE.RectAreaLight | null = null;
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      softbox1 = new THREE.RectAreaLight('#FFF6E8', 2.8, 3.0, 1.8);
      softbox1.position.set(-2.6, 2.8, 2.2);
      softbox1.lookAt(0, 0.7, 0);
      scene.add(softbox1);
    }

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const walnutTex = createWalnutTexture();
    walnutTex.anisotropy = maxAniso;
    const travertineTex = createTravertineTexture();
    travertineTex.anisotropy = maxAniso;
    const filterTex = createMeshFilterTexture();
    filterTex.anisotropy = maxAniso;
    const contactTex = createContactShadowTexture();
    const steamTex = createSteamTexture();

    const disposables: Array<{ dispose: () => void }> = [
      walnutTex,
      travertineTex,
      filterTex,
      contactTex,
      steamTex,
      envRT,
    ];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // Architectural Stone Pedestal & Walnut Table Horizon
    const floorGeo = track(new THREE.CylinderGeometry(18, 18, 0.1, 64));
    const floorMat = track(
      new THREE.MeshStandardMaterial({
        map: travertineTex,
        roughness: 0.78,
        metalness: 0.04,
      })
    );
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    scene.add(floor);

    // Sculpted Walnut Serving Tray (ExtrudeGeometry with bevels, bottom-center y=0)
    const trayShape = new THREE.Shape();
    const tw = 1.88;
    const td = 0.92;
    const tr = 0.22;
    trayShape.moveTo(-tw + tr, -td);
    trayShape.lineTo(tw - tr, -td);
    trayShape.quadraticCurveTo(tw, -td, tw, -td + tr);
    trayShape.lineTo(tw, td - tr);
    trayShape.quadraticCurveTo(tw, td, tw - tr, td);
    trayShape.lineTo(-tw + tr, td);
    trayShape.quadraticCurveTo(-tw, td, -tw, td - tr);
    trayShape.lineTo(-tw, -td + tr);
    trayShape.quadraticCurveTo(-tw, -td, -tw + tr, -td);

    const trayGeo = track(
      new THREE.ExtrudeGeometry(trayShape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.022,
        bevelSegments: 4,
      })
    );
    trayGeo.rotateX(Math.PI / 2);
    trayGeo.computeBoundingBox();
    const trayMinY = trayGeo.boundingBox!.min.y;
    trayGeo.translate(0, -trayMinY, 0);

    const walnutMat = track(
      new THREE.MeshStandardMaterial({
        map: walnutTex,
        roughness: 0.52,
        metalness: 0.05,
      })
    );
    const trayMesh = new THREE.Mesh(trayGeo, walnutMat);
    trayMesh.castShadow = true;
    trayMesh.receiveShadow = true;
    scene.add(trayMesh);

    // Brushed Brass Trim Rim around Tray
    const goldMat = track(
      new THREE.MeshPhysicalMaterial({
        color: '#C8923E',
        metalness: 0.94,
        roughness: 0.18,
        anisotropy: 0.82,
        clearcoat: 0.35,
      })
    );
    const mattePolymerMat = track(
      new THREE.MeshStandardMaterial({
        color: '#1C1B1A',
        roughness: 0.72,
        metalness: 0.06,
      })
    );
    const satinPolymerMat = track(
      new THREE.MeshStandardMaterial({
        color: '#2A2521',
        roughness: 0.42,
        metalness: 0.12,
      })
    );
    const corkMat = track(
      new THREE.MeshStandardMaterial({
        color: '#B5895A',
        roughness: 0.9,
        metalness: 0.0,
      })
    );
    const steelMeshMat = track(
      new THREE.MeshStandardMaterial({
        map: filterTex,
        metalness: 0.85,
        roughness: 0.32,
        side: THREE.DoubleSide,
      })
    );
    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        metalness: 0,
        roughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.92,
        transparent: true,
        opacity: isSoftwareGl ? 0.34 : 1.0,
        ior: 1.52,
        thickness: 0.45,
        clearcoat: 1.0,
        depthWrite: false,
      })
    );

    // Liquid Ripple Shader extension via onBeforeCompile
    const liquidUniforms = { uTime: { value: 0 } };
    const createTeaLiquidMaterial = (liquidHex: string, attenHex: string) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: liquidHex,
        attenuationColor: new THREE.Color(attenHex),
        attenuationDistance: 0.45,
        roughness: 0.08,
        metalness: 0.0,
        transmission: isSoftwareGl ? 0 : 0.58,
        transparent: true,
        opacity: isSoftwareGl ? 0.82 : 0.94,
        ior: 1.333,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = liquidUniforms.uTime;
        shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          if (position.y > 0.02) {
            float ripple = sin(position.x * 16.0 + uTime * 2.8) * cos(position.z * 16.0 - uTime * 2.2) * 0.008;
            transformed.y += ripple;
          }
          `
        );
      };
      return track(mat);
    };

    const chamberLiquidMat = createTeaLiquidMaterial(selectedBlend.liquidHex, selectedBlend.attenuationHex);
    const cupLiquidMat = createTeaLiquidMaterial(selectedBlend.liquidHex, selectedBlend.attenuationHex);

    // Soft Radial Contact Shadows sitting slightly above tray surface (y=0.078)
    const trayTopY = 0.075;
    const contactMat = track(
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    const shadowPlaneGeo = track(new THREE.PlaneGeometry(1.1, 1.1));
    [
      [-0.25, 0, 1.2],
      [1.02, 0.35, 0.78],
      [-1.18, 0.28, 0.85],
    ].forEach(([sx, sz, scale]) => {
      const sp = new THREE.Mesh(shadowPlaneGeo, contactMat);
      sp.rotation.x = -Math.PI / 2;
      sp.position.set(sx, trayTopY + 0.003, sz);
      sp.scale.set(scale, scale, 1);
      scene.add(sp);
    });

    // =========================================================================
    // ASSEMBLY 1: VAPT VUPT INFUSER (9 distinct parts, bottom-center grounded)
    // =========================================================================
    const vaptGroup = new THREE.Group();
    vaptGroup.position.set(-0.25, trayTopY, 0.0);
    vaptGroup.userData.partKey = 'vapt';
    scene.add(vaptGroup);

    // 1. Matte Silicone & Polymer Valve Base (LatheGeometry)
    const basePts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.37, 0.0),
      new THREE.Vector2(0.39, 0.04),
      new THREE.Vector2(0.37, 0.14),
      new THREE.Vector2(0.35, 0.18),
      new THREE.Vector2(0.28, 0.18),
      new THREE.Vector2(0.24, 0.09),
      new THREE.Vector2(0.0, 0.09),
    ];
    const vaptBaseGeo = track(new THREE.LatheGeometry(basePts, 48));
    const vaptBase = new THREE.Mesh(vaptBaseGeo, mattePolymerMat);
    vaptBase.castShadow = true;
    vaptBase.receiveShadow = true;
    vaptGroup.add(vaptBase);

    // 2. Brushed Gold Release Collar Ring
    const collarGeo = track(new THREE.TorusGeometry(0.372, 0.018, 16, 48));
    collarGeo.rotateX(Math.PI / 2);
    const vaptCollar = new THREE.Mesh(collarGeo, goldMat);
    vaptCollar.position.y = 0.185;
    vaptCollar.castShadow = true;
    vaptGroup.add(vaptCollar);

    // 3. Micro-perforated Stainless Mesh Valve Filter (inside bottom chamber)
    const filterGeo = track(new THREE.CylinderGeometry(0.24, 0.21, 0.12, 32, 1, true));
    const filterMesh = new THREE.Mesh(filterGeo, steelMeshMat);
    filterMesh.position.y = 0.23;
    vaptGroup.add(filterMesh);

    const filterCapGeo = track(new THREE.CircleGeometry(0.24, 32));
    filterCapGeo.rotateX(-Math.PI / 2);
    const filterCap = new THREE.Mesh(filterCapGeo, steelMeshMat);
    filterCap.position.y = 0.29;
    vaptGroup.add(filterCap);

    // 4. Steeping Tea Liquid Column inside Vapt Vupt
    const chamberLiquidGeo = track(new THREE.CylinderGeometry(0.365, 0.325, 0.62, 40, 12));
    chamberLiquidGeo.translate(0, 0.31, 0);
    const chamberLiquid = new THREE.Mesh(chamberLiquidGeo, chamberLiquidMat);
    chamberLiquid.position.y = 0.2;
    chamberLiquid.renderOrder = 2;
    vaptGroup.add(chamberLiquid);

    // 5. Floating Tea Leaves inside Chamber (InstancedMesh, 36 sculpted leaves)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.028);
    leafShape.quadraticCurveTo(0.018, -0.005, 0.014, 0.018);
    leafShape.quadraticCurveTo(0, 0.036, 0, 0.036);
    leafShape.quadraticCurveTo(-0.014, 0.018, -0.018, -0.005);
    leafShape.quadraticCurveTo(0, -0.028, 0, -0.028);
    const leafGeo = track(
      new THREE.ExtrudeGeometry(leafShape, {
        depth: 0.004,
        bevelEnabled: true,
        bevelSize: 0.001,
        bevelThickness: 0.001,
        bevelSegments: 2,
      })
    );
    const leafMat = track(
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.68,
        metalness: 0.04,
      })
    );
    const LEAF_COUNT = 36;
    const leafInstanced = new THREE.InstancedMesh(leafGeo, leafMat, LEAF_COUNT);
    leafInstanced.frustumCulled = false;
    leafInstanced.renderOrder = 3;
    const leafSeeds = Array.from({ length: LEAF_COUNT }, (_, idx) => ({
      radius: 0.05 + ((idx * 17) % 24) * 0.01,
      angle: (idx / LEAF_COUNT) * Math.PI * 2,
      baseY: 0.26 + ((idx * 13) % 19) * 0.024,
      speed: 0.35 + (idx % 5) * 0.12,
      scale: 0.85 + ((idx * 7) % 10) * 0.03,
      tilt: ((idx % 7) - 3) * 0.25,
    }));
    const applyLeafColors = (colors: string[]) => {
      for (let i = 0; i < LEAF_COUNT; i++) {
        _color.set(colors[i % colors.length]);
        leafInstanced.setColorAt(i, _color);
      }
      if (leafInstanced.instanceColor) leafInstanced.instanceColor.needsUpdate = true;
    };
    applyLeafColors(selectedBlend.leafColors);
    vaptGroup.add(leafInstanced);

    // 6. Outer Crystal Tritan Chamber (LatheGeometry, renderOrder 4)
    const chamberPts = [
      new THREE.Vector2(0.35, 0.18),
      new THREE.Vector2(0.39, 0.21),
      new THREE.Vector2(0.415, 0.96),
      new THREE.Vector2(0.43, 1.02),
      new THREE.Vector2(0.41, 1.03),
      new THREE.Vector2(0.388, 0.96),
      new THREE.Vector2(0.365, 0.22),
      new THREE.Vector2(0.34, 0.19),
    ];
    const chamberGeo = track(new THREE.LatheGeometry(chamberPts, 48));
    const chamberMesh = new THREE.Mesh(chamberGeo, glassMat);
    chamberMesh.renderOrder = 4;
    chamberMesh.castShadow = !isSoftwareGl;
    vaptGroup.add(chamberMesh);

    // 7. Ergonomic Pouring Handle (TubeGeometry along smooth curve)
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.39, 0.88, 0),
      new THREE.Vector3(-0.62, 0.84, 0),
      new THREE.Vector3(-0.65, 0.56, 0),
      new THREE.Vector3(-0.58, 0.34, 0),
      new THREE.Vector3(-0.37, 0.29, 0),
    ]);
    const handleGeo = track(new THREE.TubeGeometry(handleCurve, 28, 0.036, 12, false));
    const handleMesh = new THREE.Mesh(handleGeo, satinPolymerMat);
    handleMesh.castShadow = true;
    vaptGroup.add(handleMesh);

    // 8 & 9. Sculpted Lid + Brushed Gold Finial (moves vertically in Exploded View)
    const lidGroup = new THREE.Group();
    lidGroup.position.y = 1.02;
    const lidPts = [
      new THREE.Vector2(0.0, 0.055),
      new THREE.Vector2(0.39, 0.045),
      new THREE.Vector2(0.435, 0.025),
      new THREE.Vector2(0.435, 0.0),
      new THREE.Vector2(0.385, 0.0),
      new THREE.Vector2(0.375, -0.025),
      new THREE.Vector2(0.0, -0.025),
    ];
    const lidGeo = track(new THREE.LatheGeometry(lidPts, 48));
    const lidMesh = new THREE.Mesh(lidGeo, satinPolymerMat);
    lidMesh.castShadow = true;
    lidGroup.add(lidMesh);

    const knobGeo = track(new THREE.CylinderGeometry(0.065, 0.045, 0.055, 24));
    const knobMesh = new THREE.Mesh(knobGeo, goldMat);
    knobMesh.position.y = 0.075;
    knobMesh.castShadow = true;
    lidGroup.add(knobMesh);
    vaptGroup.add(lidGroup);

    // =========================================================================
    // ASSEMBLY 2: DOUBLE-WALL GLASS CUP & SAUCER (6 distinct parts)
    // =========================================================================
    const cupGroup = new THREE.Group();
    cupGroup.position.set(1.02, trayTopY, 0.35);
    cupGroup.userData.partKey = 'cup';
    scene.add(cupGroup);

    // Walnut Coaster Saucer
    const saucerPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.28, 0.0),
      new THREE.Vector2(0.35, 0.032),
      new THREE.Vector2(0.33, 0.045),
      new THREE.Vector2(0.23, 0.022),
      new THREE.Vector2(0.0, 0.022),
    ];
    const saucerGeo = track(new THREE.LatheGeometry(saucerPts, 40));
    const saucerMesh = new THREE.Mesh(saucerGeo, walnutMat);
    saucerMesh.castShadow = true;
    saucerMesh.receiveShadow = true;
    cupGroup.add(saucerMesh);

    // Brass Coaster Inlay Ring
    const coasterRingGeo = track(new THREE.RingGeometry(0.19, 0.215, 40));
    coasterRingGeo.rotateX(-Math.PI / 2);
    const coasterRing = new THREE.Mesh(coasterRingGeo, goldMat);
    coasterRing.position.y = 0.024;
    cupGroup.add(coasterRing);

    // Brewed Tea Core inside Double-Wall Cup (animated level)
    const cupLiquidGeo = track(new THREE.CylinderGeometry(0.195, 0.125, 0.29, 36, 8));
    cupLiquidGeo.translate(0, 0.145, 0);
    const cupLiquid = new THREE.Mesh(cupLiquidGeo, cupLiquidMat);
    cupLiquid.position.y = 0.085;
    cupLiquid.renderOrder = 2;
    cupGroup.add(cupLiquid);

    // Double-Wall Borosilicate Thermal Glass Shell
    const cupGlassPts = [
      new THREE.Vector2(0.0, 0.025),
      new THREE.Vector2(0.155, 0.025),
      new THREE.Vector2(0.235, 0.19),
      new THREE.Vector2(0.262, 0.42),
      new THREE.Vector2(0.248, 0.425),
      new THREE.Vector2(0.212, 0.21),
      new THREE.Vector2(0.132, 0.075),
      new THREE.Vector2(0.0, 0.075),
    ];
    const cupGlassGeo = track(new THREE.LatheGeometry(cupGlassPts, 44));
    const cupGlassMesh = new THREE.Mesh(cupGlassGeo, glassMat);
    cupGlassMesh.renderOrder = 5;
    cupGroup.add(cupGlassMesh);

    // Golden Tea Stream Jet (visible when Pour Valve is active)
    const streamGeo = track(new THREE.CylinderGeometry(0.018, 0.026, 0.72, 16));
    const streamMesh = new THREE.Mesh(streamGeo, cupLiquidMat);
    streamMesh.position.set(0.38, 0.56, 0.18);
    streamMesh.rotation.z = -0.58;
    streamMesh.rotation.x = 0.22;
    streamMesh.visible = false;
    scene.add(streamMesh);

    // =========================================================================
    // ASSEMBLY 3: OLFACTORY TUBE DISPLAY & DOSING SPOON (6 parts)
    // =========================================================================
    const tubesGroup = new THREE.Group();
    tubesGroup.position.set(-1.18, trayTopY, 0.28);
    tubesGroup.rotation.y = 0.35;
    tubesGroup.userData.partKey = 'tubes';
    scene.add(tubesGroup);

    const rackShape = new THREE.Shape();
    rackShape.moveTo(-0.42, -0.13);
    rackShape.lineTo(0.42, -0.13);
    rackShape.lineTo(0.42, 0.13);
    rackShape.lineTo(-0.42, 0.13);
    rackShape.closePath();
    const rackGeo = track(
      new THREE.ExtrudeGeometry(rackShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.014,
        bevelThickness: 0.012,
        bevelSegments: 3,
      })
    );
    rackGeo.rotateX(Math.PI / 2);
    rackGeo.computeBoundingBox();
    rackGeo.translate(0, -rackGeo.boundingBox!.min.y, 0);
    const rackMesh = new THREE.Mesh(rackGeo, walnutMat);
    rackMesh.castShadow = true;
    rackMesh.receiveShadow = true;
    tubesGroup.add(rackMesh);

    const tubeColors = ['#3F6D36', '#B92B45', '#C99846'];
    const tubeGeo = track(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 24, 1, true));
    const corkGeo = track(new THREE.CylinderGeometry(0.052, 0.044, 0.075, 20));
    const dryTeaGeo = track(new THREE.CylinderGeometry(0.046, 0.046, 0.2, 16));
    const tubeCorkMeshes: THREE.Mesh[] = [];

    [-0.25, 0, 0.25].forEach((tx, idx) => {
      const collar = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.058, 0.008, 10, 24)).rotateX(Math.PI / 2),
        goldMat
      );
      collar.position.set(tx, 0.075, 0);
      tubesGroup.add(collar);

      const teaSample = new THREE.Mesh(
        dryTeaGeo,
        track(
          new THREE.MeshStandardMaterial({
            color: tubeColors[idx],
            roughness: 0.88,
            metalness: 0.02,
          })
        )
      );
      teaSample.position.set(tx, 0.17, 0);
      tubesGroup.add(teaSample);

      const tGlass = new THREE.Mesh(tubeGeo, glassMat);
      tGlass.position.set(tx, 0.28, 0);
      tGlass.renderOrder = 4;
      tubesGroup.add(tGlass);

      const cork = new THREE.Mesh(corkGeo, corkMat);
      cork.position.set(tx, 0.51, 0);
      cork.castShadow = true;
      tubesGroup.add(cork);
      tubeCorkMeshes.push(cork);
    });

    // Brushed Gold Dosing Spoon resting next to Olfactory Rack
    const spoonStemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, 0.022, 0.28),
      new THREE.Vector3(0.0, 0.028, 0.29),
      new THREE.Vector3(0.28, 0.025, 0.31),
    ]);
    const spoonStem = new THREE.Mesh(track(new THREE.TubeGeometry(spoonStemCurve, 20, 0.011, 10, false)), goldMat);
    spoonStem.castShadow = true;
    tubesGroup.add(spoonStem);

    const spoonBowlGeo = track(new THREE.SphereGeometry(0.068, 20, 12, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48));
    spoonBowlGeo.scale(1.25, 0.55, 0.9);
    const spoonBowl = new THREE.Mesh(spoonBowlGeo, goldMat);
    spoonBowl.position.set(0.35, 0.028, 0.31);
    spoonBowl.castShadow = true;
    tubesGroup.add(spoonBowl);

    // =========================================================================
    // ATMOSPHERIC RISING STEAM WISPS (14 sprites)
    // =========================================================================
    const steamSprites: Array<{ sprite: THREE.Sprite; seed: number; origin: [number, number, number] }> = [];
    for (let i = 0; i < 14; i++) {
      const sMat = track(
        new THREE.SpriteMaterial({
          map: steamTex,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        })
      );
      const sp = new THREE.Sprite(sMat);
      const onCup = i >= 8;
      const origin: [number, number, number] = onCup ? [1.02, 0.45, 0.35] : [-0.25, 1.08, 0.0];
      sp.position.set(...origin);
      scene.add(sp);
      steamSprites.push({ sprite: sp, seed: i * 0.71, origin });
    }

    // Visual update callbacks synced from React state
    sceneStateRef.current.updateBlendVisuals = (b: TeaBlend3D) => {
      chamberLiquidMat.color.set(b.liquidHex);
      chamberLiquidMat.attenuationColor.set(b.attenuationHex);
      cupLiquidMat.color.set(b.liquidHex);
      cupLiquidMat.attenuationColor.set(b.attenuationHex);
      applyLeafColors(b.leafColors);
    };

    sceneStateRef.current.updateStudioTheme = (mode: 'noir' | 'ivory') => {
      const target = mode === 'noir' ? darkBg : lightBg;
      scene.background = target.clone();
      (scene.fog as THREE.FogExp2).color.copy(target);
      hemiLight.intensity = mode === 'noir' ? 0.95 : 1.25;
    };

    // Raycaster on pointer tap (distinct from drag)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onPointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };
    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects([vaptGroup, cupGroup, tubesGroup], true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.partKey) obj = obj.parent;
        const k = obj?.userData?.partKey as 'vapt' | 'cup' | 'tubes' | undefined;
        if (k) {
          setInspectedPart(PART_INFO[k]);
          triggerCameraPreset(k);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 960;
      const nh = container.clientHeight || 580;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Paced animation loop (afterDraw fenceSync when isSoftwareGl)
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();
      const st = sceneStateRef.current;

      liquidUniforms.uTime.value = elapsed;

      // Exponentially damp Exploded Service View
      st.explodedCurrent = THREE.MathUtils.damp(st.explodedCurrent, st.explodedTarget, 6.5, dt);
      const exp = st.explodedCurrent;
      chamberMesh.position.y = exp * 0.24;
      filterMesh.position.y = 0.23 + exp * 0.14;
      filterCap.position.y = 0.29 + exp * 0.14;
      lidGroup.position.y = 1.02 + exp * 0.56;
      cupGlassMesh.position.y = exp * 0.22;
      tubeCorkMeshes.forEach((cork, idx) => {
        cork.position.y = 0.51 + exp * (0.18 + idx * 0.05);
      });

      // Exponentially damp Pour Ritual state
      const targetPour = st.pouring ? 1 : 0;
      st.pourProgress = THREE.MathUtils.damp(st.pourProgress, targetPour, 3.2, dt);
      const p = st.pourProgress;
      chamberLiquid.scale.y = Math.max(0.28, 1.0 - p * 0.55);
      cupLiquid.scale.y = 0.36 + p * 0.64;
      streamMesh.visible = st.pouring && p < 0.94;
      vaptGroup.position.x = THREE.MathUtils.damp(vaptGroup.position.x, st.pouring ? 0.28 : -0.25, 4.5, dt);
      vaptGroup.position.y = trayTopY + THREE.MathUtils.damp(vaptGroup.position.y - trayTopY, st.pouring ? 0.54 : 0.0, 4.5, dt);
      vaptGroup.position.z = THREE.MathUtils.damp(vaptGroup.position.z, st.pouring ? 0.16 : 0.0, 4.5, dt);

      // Update InstancedMesh floating botanical leaves (zero GC)
      const liquidHeightScale = chamberLiquid.scale.y;
      for (let i = 0; i < LEAF_COUNT; i++) {
        const s = leafSeeds[i];
        const ang = s.angle + elapsed * s.speed;
        const bob = Math.sin(elapsed * 1.4 + s.angle) * 0.035;
        const clampedY = Math.min(0.22 + 0.55 * liquidHeightScale, s.baseY * liquidHeightScale + bob);
        _dummy.position.set(Math.cos(ang) * s.radius, clampedY + exp * 0.1, Math.sin(ang) * s.radius);
        _dummy.rotation.set(s.tilt + Math.sin(elapsed + i) * 0.2, ang, Math.cos(elapsed * 0.8 + i) * 0.25);
        _dummy.scale.setScalar(s.scale);
        _dummy.updateMatrix();
        leafInstanced.setMatrixAt(i, _dummy.matrix);
      }
      leafInstanced.instanceMatrix.needsUpdate = true;

      // Rising steam wisps
      for (let i = 0; i < steamSprites.length; i++) {
        const item = steamSprites[i];
        const phase = (elapsed * 0.36 + item.seed) % 1;
        item.sprite.position.set(
          item.origin[0] + Math.sin(elapsed * 1.3 + item.seed * 4) * 0.06,
          item.origin[1] + phase * 0.68,
          item.origin[2] + Math.cos(elapsed * 1.1 + item.seed * 3) * 0.05
        );
        const sSize = 0.22 + phase * 0.38;
        item.sprite.scale.set(sSize, sSize, 1);
        (item.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(phase * Math.PI) * 0.22;
      }

      // Smooth exponential camera preset transition (stops when arriving or user drags)
      if (st.camTransitionActive) {
        const dampAlpha = 1 - Math.exp(-5.2 * dt);
        camera.position.lerp(st.camTargetPos, dampAlpha);
        controls.target.lerp(st.camTargetLook, dampAlpha);
        if (
          camera.position.distanceTo(st.camTargetPos) < 0.025 &&
          controls.target.distanceTo(st.camTargetLook) < 0.025
        ) {
          st.camTransitionActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {}
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div id="talcha-ritual3d-scope" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Editorial Section Header */}
      <div className="mb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B2635]/10 border border-[#C68A36]/40 text-[#8B2635] dark:text-[#F3D78E] text-[11px] font-bold uppercase tracking-[0.14em] mb-2">
            Ateliê Sensorial 3D · Experiência Interativa à Mesa
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight">
            Ritual Vapt Vupt & Serviço de Mesa Talchá
          </h2>
          <p className="text-sm text-[#5C564D] dark:text-[#C2B8AA] mt-1 max-w-2xl">
            Gire, aproxime e clique nos instrumentos para inspecionar o preparador patenteado em Tritan, o copo térmico de vidro duplo e o display de amostra olfativa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onSelectBlendForCarta && (
            <button
              type="button"
              onClick={() => onSelectBlendForCarta(selectedBlend.id)}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#C68A36] text-[#8B2635] dark:text-[#F3D78E] text-xs font-bold hover:bg-[#F3ECE1] transition-colors cursor-pointer"
            >
              Incluir {selectedBlend.name} na Carta B2B
            </button>
          )}
          {onOpenLeadModal && (
            <button
              type="button"
              onClick={() => onOpenLeadModal('kit-vapt-vupt', selectedBlend.name)}
              className="px-4 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Solicitar Kit Vapt Vupt B2B
            </button>
          )}
        </div>
      </div>

      {/* 3D Viewport Stage (Zero HUD occlusion over center; collapsible bottom dock; NO backdrop-filter over WebGL) */}
      <div className="relative w-full h-[540px] sm:h-[640px] rounded-2xl overflow-hidden border border-[#DFD2BF] dark:border-[#352C23] bg-[#161210] shadow-xl">
        {/* Isolated empty WebGL container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Minimal Top-Left Spec Badge (No mid-left/mid-right clutter, no backdrop-filter, no pulsing dots) */}
        <div
          className="pointer-events-auto absolute top-4 left-4 max-w-[330px] rounded-xl border border-[#C68A36]/40 px-3.5 py-2.5 text-left shadow-lg"
          style={{ backgroundColor: 'rgba(22, 18, 16, 0.90)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F3D78E]">
              {selectedBlend.category}
            </span>
            <span className="text-[11px] font-mono text-[#DDD4C4]">
              {selectedBlend.temp} · {selectedBlend.steepTime}
            </span>
          </div>
          <div className="text-sm font-serif font-bold text-[#FAF7F2] mt-0.5">{selectedBlend.name}</div>
          {inspectedPart && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-semibold text-[#F3D78E]">{inspectedPart.title}</div>
              <p className="text-[11px] text-[#DDD4C4]/85 leading-snug mt-0.5">{inspectedPart.specs}</p>
            </div>
          )}
        </div>

        {/* Collapsible Bottom Control Dock */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center transition-transform duration-300 z-20"
          style={{
            width: 'min(920px, 94%)',
            transform: hudCollapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)',
          }}
        >
          <button
            type="button"
            onClick={() => setHudCollapsed((c) => !c)}
            className="px-3.5 py-1 rounded-t-xl border border-b-0 border-[#C68A36]/50 text-[11px] font-bold text-[#F3D78E] cursor-pointer"
            style={{ backgroundColor: 'rgba(22, 18, 16, 0.94)' }}
          >
            {hudCollapsed ? '▲ Mostrar Controles 3D (H)' : '▼ Recolher Controles · Modo Zen (H)'}
          </button>

          <div
            className="w-full rounded-2xl border border-[#C68A36]/50 p-3 sm:p-3.5 shadow-2xl space-y-2.5"
            style={{ backgroundColor: 'rgba(22, 18, 16, 0.94)' }}
          >
            {/* Row 1: Blends & Ritual Pour */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {BLENDS_3D.map((b) => {
                  const active = b.id === selectedBlendId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBlendId(b.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#8B2635] border-[#C68A36] text-white'
                          : 'bg-[#231E1A] border-[#3C332B] text-[#DDD4C4] hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: b.liquidHex }}
                      />
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPouring((p) => !p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isPouring
                      ? 'bg-[#2E6B34] border-[#6FD47B] text-white'
                      : 'bg-[#C68A36] border-[#F3D78E] text-[#161210]'
                  }`}
                >
                  {isPouring ? 'Válvula Aberta · Servindo' : 'Acionar Válvula Vapt Vupt'}
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((s) => !s)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#231E1A] border border-[#3C332B] text-[#DDD4C4] hover:text-white cursor-pointer"
                  title="Som procedural de serviço"
                >
                  {soundEnabled ? 'Som: Ativo' : 'Som: Mudo'}
                </button>
              </div>
            </div>

            {/* Row 2: Camera Presets, Exploded Slider, Lighting */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-1.5">
                {CAMERA_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => triggerCameraPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                      cameraPreset === preset.id
                        ? 'bg-[#FAF7F2] text-[#1E1B18]'
                        : 'bg-[#231E1A] text-[#C2B8AA] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <label className="text-[11px] font-semibold text-[#DDD4C4] whitespace-nowrap">
                  Vista Explodida: {exploded}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={exploded}
                  onChange={(e) => setExploded(Number(e.target.value))}
                  className="w-24 sm:w-32 accent-[#C68A36] cursor-pointer"
                />
              </div>

              <div className="inline-flex rounded-lg bg-[#231E1A] p-0.5 border border-[#3C332B]">
                <button
                  type="button"
                  onClick={() => setStudioLightMode('noir')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    studioLightMode === 'noir' ? 'bg-[#8B2635] text-white' : 'text-[#C2B8AA]'
                  }`}
                >
                  Galeria Noir
                </button>
                <button
                  type="button"
                  onClick={() => setStudioLightMode('ivory')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    studioLightMode === 'ivory' ? 'bg-[#FAF7F2] text-[#1E1B18]' : 'text-[#C2B8AA]'
                  }`}
                >
                  Salão Dia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blend Sensory Details Strip below canvas */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
            Notas Botânicas & Perfil
          </div>
          <p className="text-xs text-[#4F4840] dark:text-[#DDD4C4] mt-1">{selectedBlend.notes}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
            Harmonização Gastronômica
          </div>
          <p className="text-xs text-[#4F4840] dark:text-[#DDD4C4] mt-1">{selectedBlend.pairing}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
            Dosagem Padrão Talchá
          </div>
          <p className="text-xs font-semibold text-[#1E1B18] dark:text-white mt-1">
            {selectedBlend.dosage} · {selectedBlend.temp} · {selectedBlend.steepTime}
          </p>
        </div>
      </div>
    </div>
  );
}
