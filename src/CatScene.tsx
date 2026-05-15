import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type WorkStage = 'before' | 'working' | 'after';

type CatSceneProps = {
  stage: WorkStage;
};

type CatRig = {
  root: THREE.Group;
  head: THREE.Group;
  body: THREE.Mesh;
  tail: THREE.Group;
  ears: THREE.Mesh[];
  mouth: THREE.Mesh;
};

const furWhite = new THREE.MeshStandardMaterial({
  color: '#f6eee3',
  roughness: 0.78,
  metalness: 0.02,
});

const furCream = new THREE.MeshStandardMaterial({
  color: '#ead2b4',
  roughness: 0.82,
  metalness: 0.01,
});

const furOrange = new THREE.MeshStandardMaterial({
  color: '#c36b2c',
  roughness: 0.76,
  metalness: 0.01,
});

const furBlack = new THREE.MeshStandardMaterial({
  color: '#2b2724',
  roughness: 0.86,
  metalness: 0.01,
});

const nosePink = new THREE.MeshStandardMaterial({
  color: '#d18b82',
  roughness: 0.48,
  metalness: 0.01,
});

const mouthMaterial = new THREE.MeshStandardMaterial({
  color: '#6f3f3b',
  roughness: 0.5,
  metalness: 0.01,
});

const eyeMaterial = new THREE.MeshStandardMaterial({
  color: '#101014',
  roughness: 0.18,
  metalness: 0.04,
});

const whiskerMaterial = new THREE.MeshStandardMaterial({
  color: '#161616',
  roughness: 0.6,
});

let sharedAudioContext: AudioContext | null = null;

function makeEllipsoid(
  material: THREE.Material,
  scale: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 28), material);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeTube(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material);
  mesh.castShadow = true;
  return mesh;
}

function makeWhiskers(side: -1 | 1) {
  const group = new THREE.Group();
  const baseX = side * 0.18;
  const endX = side * 0.98;
  const rows = [
    { y: 0.03, z: 1.1, lift: 0.08 },
    { y: -0.08, z: 1.12, lift: 0 },
    { y: -0.19, z: 1.08, lift: -0.1 },
  ];

  rows.forEach((row) => {
    group.add(
      makeTube(
        [
          new THREE.Vector3(baseX, row.y, 0.78),
          new THREE.Vector3(side * 0.58, row.y + row.lift * 0.4, 1.02),
          new THREE.Vector3(endX, row.y + row.lift, row.z),
        ],
        0.01,
        whiskerMaterial,
      ),
    );
  });

  return group;
}

function createCatRig() {
  const root = new THREE.Group();
  root.position.set(0, -0.56, 0);
  root.rotation.y = -0.12;

  const body = makeEllipsoid(furWhite, [1.48, 0.78, 0.9], [0, 0, 0]);
  root.add(body);

  const chest = makeEllipsoid(furCream, [0.78, 0.5, 0.55], [0, -0.1, 0.62], [-0.12, 0, 0]);
  root.add(chest);

  const backPatch = makeEllipsoid(furBlack, [0.82, 0.2, 0.34], [-0.48, 0.32, -0.42], [0.35, 0.08, -0.25]);
  const orangeFlank = makeEllipsoid(furOrange, [0.55, 0.24, 0.38], [0.82, 0.14, -0.12], [0.18, -0.24, 0.2]);
  const smallPatch = makeEllipsoid(furBlack, [0.3, 0.12, 0.22], [0.38, 0.42, 0.48], [-0.2, 0.2, 0.1]);
  root.add(backPatch, orangeFlank, smallPatch);

  const head = new THREE.Group();
  head.position.set(0, 0.78, 0.62);
  root.add(head);

  const skull = makeEllipsoid(furWhite, [0.76, 0.64, 0.68], [0, 0, 0]);
  head.add(skull);

  const leftFacePatch = makeEllipsoid(furOrange, [0.44, 0.43, 0.19], [-0.34, 0.13, 0.54], [-0.08, -0.18, -0.34]);
  const rightFacePatch = makeEllipsoid(furBlack, [0.34, 0.37, 0.16], [0.32, 0.2, 0.56], [-0.1, 0.2, 0.28]);
  const chin = makeEllipsoid(furCream, [0.34, 0.19, 0.2], [0, -0.3, 0.58]);
  head.add(leftFacePatch, rightFacePatch, chin);

  const earGeometry = new THREE.ConeGeometry(0.28, 0.6, 3);
  const leftEar = new THREE.Mesh(earGeometry, furBlack);
  leftEar.position.set(-0.42, 0.62, -0.02);
  leftEar.rotation.set(0.18, 0.05, 0.25);
  leftEar.castShadow = true;

  const rightEar = new THREE.Mesh(earGeometry, furOrange);
  rightEar.position.set(0.42, 0.62, -0.02);
  rightEar.rotation.set(0.18, -0.05, -0.25);
  rightEar.castShadow = true;
  head.add(leftEar, rightEar);

  const snout = makeEllipsoid(furCream, [0.28, 0.18, 0.17], [0, -0.12, 0.66]);
  const nose = makeEllipsoid(nosePink, [0.07, 0.045, 0.035], [0, -0.03, 0.82]);
  const mouth = makeEllipsoid(mouthMaterial, [0.13, 0.018, 0.02], [0, -0.17, 0.83]);
  head.add(snout, nose, mouth);

  const leftEye = makeEllipsoid(eyeMaterial, [0.07, 0.095, 0.035], [-0.23, 0.13, 0.61]);
  const rightEye = makeEllipsoid(eyeMaterial, [0.07, 0.095, 0.035], [0.23, 0.13, 0.61]);
  const leftEyeLight = makeEllipsoid(furWhite, [0.018, 0.022, 0.008], [-0.205, 0.16, 0.635]);
  const rightEyeLight = makeEllipsoid(furWhite, [0.018, 0.022, 0.008], [0.255, 0.16, 0.635]);
  head.add(leftEye, rightEye, leftEyeLight, rightEyeLight, makeWhiskers(-1), makeWhiskers(1));

  const pawGeometry = new THREE.SphereGeometry(1, 32, 18);
  const pawPositions: Array<[number, number, number, THREE.Material]> = [
    [-0.72, -0.55, 0.42, furWhite],
    [0.72, -0.55, 0.42, furOrange],
    [-0.64, -0.42, -0.42, furBlack],
    [0.64, -0.42, -0.42, furWhite],
  ];
  pawPositions.forEach(([x, y, z, material]) => {
    const paw = new THREE.Mesh(pawGeometry, material);
    paw.scale.set(0.22, 0.16, 0.32);
    paw.position.set(x, y, z);
    paw.castShadow = true;
    root.add(paw);
  });

  const tail = new THREE.Group();
  tail.position.set(-1.12, 0.2, -0.36);
  tail.add(
    makeTube(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.46, 0.34, -0.14),
        new THREE.Vector3(-0.34, 0.86, 0.06),
        new THREE.Vector3(0.05, 1.05, 0.18),
      ],
      0.12,
      furOrange,
    ),
  );
  tail.add(
    makeTube(
      [
        new THREE.Vector3(-0.36, 0.33, -0.13),
        new THREE.Vector3(-0.48, 0.54, -0.05),
        new THREE.Vector3(-0.46, 0.72, 0.03),
      ],
      0.124,
      furBlack,
    ),
  );
  root.add(tail);

  return {
    root,
    head,
    body,
    tail,
    ears: [leftEar, rightEar],
    mouth,
  };
}

function playMeow() {
  const AudioCtor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtor) {
    return;
  }

  sharedAudioContext ??= new AudioCtor();
  const context = sharedAudioContext;
  const start = context.currentTime;
  const variants = [
    { from: 760, mid: 540, to: 690, length: 0.52, type: 'sawtooth' as OscillatorType },
    { from: 520, mid: 880, to: 430, length: 0.68, type: 'triangle' as OscillatorType },
    { from: 880, mid: 620, to: 980, length: 0.42, type: 'sine' as OscillatorType },
    { from: 430, mid: 740, to: 560, length: 0.78, type: 'sawtooth' as OscillatorType },
  ];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const tremolo = context.createOscillator();
  const tremoloGain = context.createGain();
  const voice = context.createOscillator();
  const overtone = context.createOscillator();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1320, start);
  filter.Q.setValueAtTime(6, start);

  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.22, start + 0.04);
  master.gain.exponentialRampToValueAtTime(0.09, start + variant.length * 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, start + variant.length);

  tremolo.frequency.setValueAtTime(18, start);
  tremoloGain.gain.setValueAtTime(0.04, start);
  tremolo.connect(tremoloGain);
  tremoloGain.connect(master.gain);

  voice.type = variant.type;
  voice.frequency.setValueAtTime(variant.from, start);
  voice.frequency.exponentialRampToValueAtTime(variant.mid, start + variant.length * 0.36);
  voice.frequency.exponentialRampToValueAtTime(variant.to, start + variant.length);

  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(variant.from * 1.55, start);
  overtone.frequency.exponentialRampToValueAtTime(variant.mid * 1.5, start + variant.length * 0.42);
  overtone.frequency.exponentialRampToValueAtTime(variant.to * 1.45, start + variant.length);

  const overtoneGain = context.createGain();
  overtoneGain.gain.setValueAtTime(0.08, start);

  voice.connect(filter);
  overtone.connect(overtoneGain);
  overtoneGain.connect(filter);
  filter.connect(master);
  master.connect(context.destination);

  voice.start(start);
  overtone.start(start);
  tremolo.start(start);
  voice.stop(start + variant.length);
  overtone.stop(start + variant.length);
  tremolo.stop(start + variant.length);
}

export default function CatScene({ stage }: CatSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(stage);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.3, 6.1);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'cat-canvas';
    host.appendChild(renderer.domElement);

    const keyLight = new THREE.DirectionalLight('#fff7ed', 3.2);
    keyLight.position.set(-3.2, 5.5, 4.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);
    scene.add(new THREE.HemisphereLight('#ffffff', '#d8d1c5', 2.2));

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.6, 96),
      new THREE.ShadowMaterial({ color: '#3b332a', opacity: 0.16 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.18;
    floor.receiveShadow = true;
    scene.add(floor);

    const rig = createCatRig();
    scene.add(rig.root);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const lookTarget = new THREE.Vector2();
    let meowForce = 0;
    let disposed = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(360, rect.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      lookTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      lookTarget.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(rig.root.children, true)[0];
      if (!hit) {
        return;
      }

      meowForce = 1;
      playMeow();
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', resize);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      const stageLift = stageRef.current === 'after' ? -0.07 : 0;
      const breath = Math.sin(elapsed * 2.2) * 0.025;
      meowForce = Math.max(0, meowForce - 0.035);

      rig.root.position.y = -0.56 + stageLift + Math.sin(elapsed * 1.4) * 0.018 + meowForce * 0.16;
      rig.root.rotation.y = -0.12 + lookTarget.x * 0.08 + Math.sin(elapsed * 0.55) * 0.035;
      rig.body.scale.y = 0.78 * (1 + breath);
      rig.head.rotation.x = lookTarget.y * 0.08 + Math.sin(elapsed * 1.7) * 0.025 - meowForce * 0.1;
      rig.head.rotation.y = lookTarget.x * 0.16 + Math.sin(elapsed * 0.9) * 0.03;
      rig.tail.rotation.z = Math.sin(elapsed * 2.7) * 0.18 + meowForce * 0.26;
      rig.tail.rotation.y = Math.sin(elapsed * 1.6) * 0.1;
      rig.mouth.scale.y = 0.018 + meowForce * 0.11;
      rig.ears[0].rotation.z = 0.25 + Math.sin(elapsed * 4.7) * 0.035 + meowForce * 0.12;
      rig.ears[1].rotation.z = -0.25 - Math.sin(elapsed * 4.2) * 0.035 - meowForce * 0.12;

      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      disposed = true;
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', resize);
      host.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
        }
      });
    };
  }, []);

  return <div className="cat-scene" ref={hostRef} />;
}
