/**
 * ═══════════════════════════════════════════════════════════════════════
 * dna-helix.js  ·  Three.js DNA Double Helix  ·  Seekro Platform
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Architecture:
 * initDnaHelix(containerElement)
 * → mounts renderer, Three.js scene, and HTML overlays
 * entirely WITHIN containerElement (not document.body)
 * → returns cleanup() for React useEffect return / unmount
 *
 * Usage in React:
 * useEffect(() => {
 * const cleanup = initDnaHelix(containerRef.current);
 * return cleanup;
 * }, []);
 *
 * B-form DNA parameters (all scaled for screen, ratios preserved):
 * - 10 base pairs per full helical turn
 * - 36° rotation between adjacent base pairs
 * - Each strand offset by π from the other (antiparallel)
 * - Watson-Crick pairing: A–T (2 H-bonds), C–G (3 H-bonds)
 *
 * Dependencies: three, three/addons/controls/OrbitControls.js
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────────────
//  DNA GEOMETRY CONSTANTS  (B-form DNA, screen-scaled)
// ─────────────────────────────────────────────────────────────────
const NUM_PAIRS      = 24;   // total base pairs rendered (~2.4 full turns)
const HELIX_RADIUS   = 4.4;  // distance from helix axis to backbone centroid
const RISE_PER_BASE  = 2.0;  // vertical rise (Å scaled) between adjacent pairs
const BASES_PER_TURN = 10;   // B-DNA: exactly 10 bp per helical turn
const TOTAL_HEIGHT   = NUM_PAIRS * RISE_PER_BASE;

// ─────────────────────────────────────────────────────────────────
//  COLOR PALETTE
// ─────────────────────────────────────────────────────────────────
const COLORS = {
  A:   0xff3655,  // Adenine   — vivid crimson
  T:   0x3a80ff,  // Thymine   — cobalt blue
  C:   0x2ecc71,  // Cytosine  — emerald green
  G:   0xffbe22,  // Guanine   — amber gold
  BB1: 0xf07830,  // Backbone strand 1 — warm orange
  BB2: 0x28a8e0,  // Backbone strand 2 — sky blue
};

// Watson-Crick complement rules
const COMPLEMENT = { A: 'T', T: 'A', C: 'G', G: 'C' };

// ─────────────────────────────────────────────────────────────────
//  EDUCATIONAL BASE DATA
//  All facts are biochemically accurate for use in Seekro lessons.
// ─────────────────────────────────────────────────────────────────
const BASE_INFO = {
  A: {
    name: 'Adenine', shorthand: 'A', classification: 'Purine',
    formula: 'C₅H₅N₅', molWeight: '135.13 g/mol', bonds: 2,
    pairedWith: 'T',
    pairRule:   'Adenine pairs with Thymine (A–T) via 2 hydrogen bonds.',
    biochemNote: 'Adenine is also the base in ATP — the cell\'s primary energy currency — and in NAD⁺ coenzymes.',
  },
  T: {
    name: 'Thymine', shorthand: 'T', classification: 'Pyrimidine',
    formula: 'C₅H₆N₂O₂', molWeight: '126.11 g/mol', bonds: 2,
    pairedWith: 'A',
    pairRule:   'Thymine pairs with Adenine (T–A) via 2 hydrogen bonds.',
    biochemNote: 'Thymine is exclusive to DNA. RNA replaces it with Uracil (U), which lacks the 5-methyl group.',
  },
  C: {
    name: 'Cytosine', shorthand: 'C', classification: 'Pyrimidine',
    formula: 'C₄H₅N₃O', molWeight: '111.10 g/mol', bonds: 3,
    pairedWith: 'G',
    pairRule:   'Cytosine pairs with Guanine (C–G) via 3 hydrogen bonds.',
    biochemNote: 'High C–G content raises DNA melting temperature (Tm) because 3 H-bonds require more energy to break.',
  },
  G: {
    name: 'Guanine', shorthand: 'G', classification: 'Purine',
    formula: 'C₅H₅N₅O', molWeight: '151.13 g/mol', bonds: 3,
    pairedWith: 'C',
    pairRule:   'Guanine pairs with Cytosine (G–C) via 3 hydrogen bonds.',
    biochemNote: 'Guanine-rich telomeric repeats form G-quadruplex structures involved in chromosome stability.',
  },
};

// ─────────────────────────────────────────────────────────────────
//  MATERIAL FACTORY
//  MeshPhysicalMaterial with clearcoat gives a wet, organic look.
//  Each call returns a fresh instance so highlights can modify it
//  without affecting other meshes sharing the same base color.
// ─────────────────────────────────────────────────────────────────
function makeMat(colorHex, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color:              colorHex,
    emissive:           opts.emissive ?? 0x000000,
    emissiveIntensity:  opts.emissiveIntensity ?? 0,
    roughness:          opts.roughness ?? 0.18,
    metalness:          0.0,
    clearcoat:          opts.clearcoat ?? 1.0,
    clearcoatRoughness: 0.08,
    reflectivity:       0.55,
    transparent:        opts.opacity !== undefined,
    opacity:            opts.opacity ?? 1.0,
  });
}

// ─────────────────────────────────────────────────────────────────
//  CYLINDER BETWEEN TWO POINTS
//
//  Three.js CylinderGeometry is aligned along the +Y axis by default.
//  To orient it from point p1 to point p2 we:
//    1. Place it at the midpoint of p1–p2.
//    2. Compute direction vector d = normalize(p2 - p1).
//    3. Build a Quaternion that rotates Ŷ → d.
//       Guard against the degenerate case where d ≈ -Ŷ (dot ≈ -1),
//       which makes setFromUnitVectors undefined.
// ─────────────────────────────────────────────────────────────────
function makeCylinder(p1, p2, radius, mat) {
  const dir    = new THREE.Vector3().subVectors(p2, p1);
  const length = dir.length();
  const mid    = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const geo    = new THREE.CylinderGeometry(radius, radius, length, 10, 1);
  const mesh   = new THREE.Mesh(geo, mat);
  mesh.position.copy(mid);

  const norm = dir.clone().normalize();
  const yAxis = new THREE.Vector3(0, 1, 0);
  // Degenerate guard: if norm ≈ -Ŷ, rotate 180° around X
  if (norm.dot(yAxis) < -0.9999) {
    mesh.rotation.x = Math.PI;
  } else {
    mesh.quaternion.setFromUnitVectors(yAxis, norm);
  }
  return mesh;
}

// ─────────────────────────────────────────────────────────────────
//  CELLULAR DEBRIS PARTICLE SYSTEM
//  Simulates the aqueous interior of a cell nucleus —
//  1 400 softly glowing points drifting in a large volume.
// ─────────────────────────────────────────────────────────────────
function makeParticles(scene, dq) {
  const N = 1400;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 70;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x3a88aa, size: 0.16,
    transparent: true, opacity: 0.50, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  dq.push(geo, mat);
  return pts;
}

// ─────────────────────────────────────────────────────────────────
//  BACKBONE TUBE
//  CatmullRomCurve3 through all nucleotide positions → TubeGeometry.
//  This produces the smooth, sinuous ribbon of the sugar-phosphate
//  backbone.
// ─────────────────────────────────────────────────────────────────
function makeBackbone(group, dq, pts, colorHex) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo   = new THREE.TubeGeometry(curve, NUM_PAIRS * 4, 0.20, 8, false);
  const mat   = makeMat(colorHex, { clearcoat: 0.7, roughness: 0.25 });
  const mesh  = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.userData.isBackbone = true;
  group.add(mesh);
  dq.push(geo, mat);
  return mesh;
}

// ─────────────────────────────────────────────────────────────────
//  DNA BUILDER
//
//  Helix geometry math:
//    For base pair i (0-indexed):
//      angle  = (i / BASES_PER_TURN) × 2π      [0 → ~4.8π for 24 pairs]
//      y      = i × RISE - TOTAL_HEIGHT/2       [centred on origin]
//      Strand1: (R·cos(angle),        y, R·sin(angle))
//      Strand2: (R·cos(angle + π),    y, R·sin(angle + π))
//
//    The π offset places strand 2 exactly opposite strand 1.
//    This models the antiparallel, complementary nature of real DNA.
//
//  Each base pair becomes:
//    • Two nucleotide spheres (one per strand, colored by their base)
//    • Two half-cylinders meeting at the midpoint (hydrogen bond zone)
//      - Half 1: strand1 pos → midpoint, color = base1
//      - Half 2: midpoint  → strand2 pos, color = base2
//    pairMeshes array links all 4 for joint highlight on click.
// ─────────────────────────────────────────────────────────────────
function buildDNA(group, dq) {
  // Generate a random Watson-Crick valid DNA sequence
  const pool = ['A', 'C', 'G', 'T'];
  const seq  = Array.from({ length: NUM_PAIRS },
    () => pool[Math.floor(Math.random() * 4)]);

  const s1pts = [], s2pts = [];   // backbone spine points
  const clickables = [];           // raycaster test targets

  for (let i = 0; i < NUM_PAIRS; i++) {
    // ── Helix angle: 36° (2π/10) per base pair — B-DNA standard ──
    const angle = (i / BASES_PER_TURN) * Math.PI * 2;
    const y     = i * RISE_PER_BASE - TOTAL_HEIGHT * 0.5;

    const p1 = new THREE.Vector3(
      HELIX_RADIUS * Math.cos(angle), y, HELIX_RADIUS * Math.sin(angle));
    const p2 = new THREE.Vector3(
      HELIX_RADIUS * Math.cos(angle + Math.PI), y, HELIX_RADIUS * Math.sin(angle + Math.PI));

    s1pts.push(p1.clone());
    s2pts.push(p2.clone());

    const base1 = seq[i];
    const base2 = COMPLEMENT[base1];
    const mid   = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    // ── Nucleotide spheres at each backbone attachment point ──
    const mkSphere = (pos, base) => {
      const geo  = new THREE.SphereGeometry(0.40, 14, 14);
      const mat  = makeMat(COLORS[base]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.userData = { isDnaBase: true, base, pairIndex: i, isNucleotide: true };
      group.add(mesh);
      dq.push(geo, mat);
      return mesh;
    };
    const sph1 = mkSphere(p1, base1);
    const sph2 = mkSphere(p2, base2);

    // ── Half-cylinder: strand-1 side (p1 → midpoint) ──
    const mat1  = makeMat(COLORS[base1]);
    const cyl1  = makeCylinder(p1, mid, 0.17, mat1);
    cyl1.userData = { isDnaBase: true, base: base1, complement: base2, pairIndex: i, strand: 1 };
    cyl1.castShadow = true;
    group.add(cyl1);
    dq.push(cyl1.geometry, mat1);

    // ── Half-cylinder: strand-2 side (midpoint → p2) ──
    const mat2  = makeMat(COLORS[base2]);
    const cyl2  = makeCylinder(mid, p2, 0.17, mat2);
    cyl2.userData = { isDnaBase: true, base: base2, complement: base1, pairIndex: i, strand: 2 };
    cyl2.castShadow = true;
    group.add(cyl2);
    dq.push(cyl2.geometry, mat2);

    // ── Small central connector sphere at hydrogen-bond zone ──
    const jGeo  = new THREE.SphereGeometry(0.22, 10, 10);
    const jMat  = makeMat(0xffffff, { roughness: 0.3, clearcoat: 0.5, opacity: 0.65 });
    const joint = new THREE.Mesh(jGeo, jMat);
    joint.position.copy(mid);
    group.add(joint);
    dq.push(jGeo, jMat);

    // Link all 4 meshes so clicking one highlights all of them
    const pairMeshes = [sph1, sph2, cyl1, cyl2];
    pairMeshes.forEach(m => { m.userData.pairMeshes = pairMeshes; });

    clickables.push(cyl1, cyl2, sph1, sph2);
  }

  // Build smooth backbone tubes through the collected spine points
  makeBackbone(group, dq, s1pts, COLORS.BB1);
  makeBackbone(group, dq, s2pts, COLORS.BB2);

  return { clickables, seq };
}

// ─────────────────────────────────────────────────────────────────
//  UI — LEGEND PANEL (top-left)
// ─────────────────────────────────────────────────────────────────
function buildLegend(container, seq) {
  const el = document.createElement('div');
  el.className = 'dna-legend';

  // Format sequence as 5'→3' / 3'→5' pair, wrapped at 12 chars
  const s1 = seq.join('');
  const s2 = seq.map(b => COMPLEMENT[b]).join('');
  const wrap = s => s.match(/.{1,12}/g).map(c =>
    c.split('').map(b => `<span style="color:#${COLORS[b].toString(16).padStart(6,'0')};">${b}</span>`).join('')).join('<br>');

  el.innerHTML = `
    <div class="dna-legend__brand">⬡ Seekro — DNA Module</div>
    <div class="dna-legend__section">Bases</div>
    ${Object.entries(BASE_INFO).map(([k,v]) => `
      <div class="dna-legend__item">
        <div class="dna-legend__swatch" style="background:#${COLORS[k].toString(16).padStart(6,'0')};"></div>
        <span class="dna-legend__name">${v.name}</span>
        <span class="dna-legend__class">${v.classification[0]}</span>
      </div>`).join('')}
    <div class="dna-legend__section">Backbones</div>
    <div class="dna-legend__item">
      <div class="dna-legend__swatch" style="background:#${COLORS.BB1.toString(16).padStart(6,'0')};border-radius:2px;"></div>
      <span>5′→3′ Strand</span>
    </div>
    <div class="dna-legend__item">
      <div class="dna-legend__swatch" style="background:#${COLORS.BB2.toString(16).padStart(6,'0')};border-radius:2px;"></div>
      <span>3′→5′ Strand</span>
    </div>
    <div class="dna-legend__hr"></div>
    <div class="dna-legend__section">Sequence (5′→3′)</div>
    <div class="dna-legend__seq">${wrap(s1)}</div>`;
  container.appendChild(el);
  return el;
}

// ─────────────────────────────────────────────────────────────────
//  UI — SPEED CONTROL HUD (top-right)
// ─────────────────────────────────────────────────────────────────
function buildSpeedHud(container, onChange) {
  const el = document.createElement('div');
  el.className = 'dna-speed';
  el.innerHTML = `
    <div class="dna-speed__label">⟳ Rotation Speed</div>
    <div class="dna-speed__row">
      <input type="range" min="0" max="3" step="0.05" value="1" id="dna-spd">
      <span class="dna-speed__val" id="dna-spd-val">1.0×</span>
    </div>
    <div class="dna-speed__hint">Click base pair to inspect<br>Drag · Scroll · Pan</div>`;
  container.appendChild(el);
  el.querySelector('#dna-spd').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    el.querySelector('#dna-spd-val').textContent = `${v.toFixed(1)}×`;
    onChange(v);
  });
  return el;
}

// ─────────────────────────────────────────────────────────────────
//  UI — INFO CARD  (bottom-right)
// ─────────────────────────────────────────────────────────────────
function buildCard(container) {
  const el = document.createElement('div');
  el.className = 'dna-card';
  container.appendChild(el);
  return el;
}

/**
 * Populate and animate-in the info card with data for the clicked base.
 * Shows the clicked base AND its Watson-Crick complement side-by-side
 * so students can see the pairing rule in context.
 */
function showCard(card, userData, onClose) {
  const info  = BASE_INFO[userData.base];
  const cInfo = BASE_INFO[userData.complement];
  const col   = COLORS[userData.base];
  const cCol  = COLORS[userData.complement];
  const css   = n => '#' + n.toString(16).padStart(6, '0');

  card.innerHTML = `
    <div class="dna-card__header">
      <div>
        <div class="dna-card__title" style="color:${css(col)}">${info.name}</div>
        <div class="dna-card__sub">${info.classification} · Pair #${userData.pairIndex + 1} of ${NUM_PAIRS}</div>
      </div>
      <button class="dna-card__close" id="dna-close">✕ CLOSE</button>
    </div>
    <hr class="dna-card__hr">
    <div class="dna-card__grid">
      <div class="dna-card__cell">
        <div class="dna-card__clabel">Formula</div>
        <div class="dna-card__cval">${info.formula}</div>
      </div>
      <div class="dna-card__cell">
        <div class="dna-card__clabel">Mol. Weight</div>
        <div class="dna-card__cval">${info.molWeight}</div>
      </div>
    </div>
    <div class="dna-card__pair">
      <div class="dna-card__base"
           style="color:${css(col)};border-color:${css(col)};background:${css(col)}22">${info.shorthand}</div>
      <div class="dna-card__hbonds">${Array.from({length: info.bonds}, () =>
        `<div class="dna-card__hbond"></div>`).join('')}</div>
      <div class="dna-card__base"
           style="color:${css(cCol)};border-color:${css(cCol)};background:${css(cCol)}22">${cInfo.shorthand}</div>
    </div>
    <div class="dna-card__rule">${info.pairRule}</div>
    <div class="dna-card__note"><span>🔬</span><span>${info.biochemNote}</span></div>`;

  card.classList.add('visible');
  requestAnimationFrame(() => card.classList.add('shown'));
  card.querySelector('#dna-close').addEventListener('click', onClose);
}

function hideCard(card) {
  card.classList.remove('shown');
  setTimeout(() => card.classList.remove('visible'), 400);
}

// ═════════════════════════════════════════════════════════════════
//  initDnaHelix(containerElement)
//
//  Mounts the complete Three.js DNA simulation inside containerElement.
//  Returns cleanup() — must be called on React component unmount to:
//    1. Cancel the rAF render loop
//    2. Remove all DOM event listeners
//    3. Dispose all WebGL resources (geometries, materials, textures)
//    4. Dispose OrbitControls (has its own pointer/wheel listeners)
//    5. Dispose the WebGLRenderer and remove its <canvas>
//    6. Remove injected HTML overlay elements
// ═════════════════════════════════════════════════════════════════
export function initDnaHelix(containerElement) {

  // Overlays use position:absolute — container must be non-static
  if (getComputedStyle(containerElement).position === 'static')
    containerElement.style.position = 'relative';

  /* ── Scene ────────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010d1a);
  // Exponential fog mimics the aqueous, protein-dense cellular nucleus
  scene.fog = new THREE.FogExp2(0x010d1a, 0.016);

  /* ── Camera ───────────────────────────────────────────── */
  const W = containerElement.clientWidth;
  const H = containerElement.clientHeight;
  const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 400);
  camera.position.set(0, 2, 34);

  /* ── Renderer ─────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  containerElement.appendChild(renderer.domElement);

  /* ── Lighting ─────────────────────────────────────────── */
  // Soft blue-teal ambient: ensures no pure-black shadow zones
  scene.add(new THREE.AmbientLight(0x0a2240, 1.5));

  // Primary key light — warm white from upper front-right
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(12, 18, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0002;
  scene.add(key);

  // Cool fill from the left — creates chromatic separation
  const fill = new THREE.DirectionalLight(0x88aaff, 1.4);
  fill.position.set(-14, 6, 4);
  scene.add(fill);

  // Teal rim light from behind-below — separates molecule from background
  const rim = new THREE.DirectionalLight(0x00e8c8, 0.85);
  rim.position.set(0, -12, -18);
  scene.add(rim);

  // Subtle axis glow — a dim point light through the helix centre axis
  const axisPt = new THREE.PointLight(0x00ccaa, 0.55, 28, 1.5);
  axisPt.position.set(0, 0, 0);
  scene.add(axisPt);

  /* ── Resources tracker ────────────────────────────────── */
  // All THREE.js disposable objects registered here for clean teardown
  const dq = [];

  /* ── Cellular debris particles ────────────────────────── */
  const particles = makeParticles(scene, dq);

  /* ── DNA double helix ─────────────────────────────────── */
  const dnaGroup = new THREE.Group();
  scene.add(dnaGroup);
  const { clickables, seq } = buildDNA(dnaGroup, dq);

  /* ── OrbitControls ────────────────────────────────────── */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.058;
  controls.minDistance   = 8;    // can't clip through the molecule
  controls.maxDistance   = 60;   // can't lose the helix in fog
  controls.zoomSpeed     = 0.85;
  controls.rotateSpeed   = 0.50;
  controls.enablePan     = true;
  controls.panSpeed      = 0.60;

  /* ── UI overlays ──────────────────────────────────────── */
  let rotSpeed = 1.0;
  const legend   = buildLegend(containerElement, seq);
  const speedHud = buildSpeedHud(containerElement, v => { rotSpeed = v; });
  const card     = buildCard(containerElement);

  /* ── Selection / Highlight State ─────────────────────── */
  /**
   * Highlighting technique:
   * On click  → store each mesh's original emissive + intensity,
   * set emissive = mesh.color (glow matching the base colour),
   * set emissiveIntensity = 0.  (will pulse via Math.sin)
   * On close  → restore stored values.
   *
   * Using emissive instead of a bloom pass keeps us dependency-free.
   * The pulse effect in the animation loop makes the selection visible
   * even from a distance.
   */
  let selected = [];
  let glowT    = 0;  // phase accumulator for glow pulse

  function highlight(meshes) {
    clearHighlight();
    selected = meshes;
    meshes.forEach(m => {
      m.userData._savedEmissive = m.material.emissive.clone();
      m.userData._savedEI       = m.material.emissiveIntensity;
      m.material.emissive.copy(m.material.color); // glow = own color
    });
    glowT = 0;
  }

  function clearHighlight() {
    selected.forEach(m => {
      if (m.userData._savedEmissive) {
        m.material.emissive.copy(m.userData._savedEmissive);
        m.material.emissiveIntensity = m.userData._savedEI ?? 0;
      }
    });
    selected = [];
  }

  /* ── Raycaster ────────────────────────────────────────── */
  /**
   * Raycasting logic:
   * 1. Convert click pixel (clientX/Y) → NDC via getBoundingClientRect.
   * 2. setFromCamera shoots a ray from the camera through NDC point.
   * 3. intersectObjects tests only the clickable base meshes (not backbone).
   * 4. The first hit object's userData carries base/pairIndex/complement.
   * 5. We then highlight all pairMeshes (both halves + both spheres).
   */
  const raycaster = new THREE.Raycaster();
  const ndc       = new THREE.Vector2();

  function onPointerDown(e) {
    if (e.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(clickables, false);
    if (!hits.length) return;

    const obj = hits[0].object;
    if (!obj.userData?.isDnaBase) return;

    highlight(obj.userData.pairMeshes ?? [obj]);
    showCard(card, obj.userData, () => {
      clearHighlight();
      hideCard(card);
    });
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  /* ── Resize handler ───────────────────────────────────── */
  function onResize() {
    const w = containerElement.clientWidth;
    const h = containerElement.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  /* ── Animation loop ───────────────────────────────────── */
  const BASE_ROT_SPEED = 0.0048; // radians/frame at 1× speed
  let   rafId  = null;
  const clock  = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    // Continuous Y-axis helix rotation — the defining visual of the simulation
    dnaGroup.rotation.y += BASE_ROT_SPEED * rotSpeed;

    // Slow drift of cellular debris cloud for a living-cell atmosphere
    particles.rotation.y += 0.00018;
    particles.rotation.x += 0.00009;

    // Pulsing glow on selected base pair meshes
    // emissiveIntensity oscillates on a 1.8 Hz sine wave so the
    // highlight breathes gently rather than being static.
    if (selected.length > 0) {
      glowT += delta * 1.8;
      const glow = 0.28 + 0.22 * Math.sin(glowT * Math.PI * 2);
      selected.forEach(m => { m.material.emissiveIntensity = glow; });
    }

    controls.update(); // required each frame with enableDamping
    renderer.render(scene, camera);
  }

  animate();

  // ─────────────────────────────────────────────────────────────
  //  CLEANUP — returned for React useEffect / manual unmount
  //
  //  React contract:
  //    useEffect(() => {
  //      const cleanup = initDnaHelix(containerRef.current);
  //      return cleanup;   ← React calls this on unmount
  //    }, []);
  //
  //  The cleanup function must:
  //    1. Cancel the requestAnimationFrame loop immediately so the
  //       renderer stops writing to a potentially reused or detached
  //       canvas element.
  //    2. Remove DOM event listeners — failing to do this in React
  //       strict mode causes double-listener bugs across hot reloads.
  //    3. Dispose all Three.js GPU resources tracked in `dq` plus a
  //       scene.traverse() safety net for anything we may have missed.
  //       Each geometry / material / texture holds a WebGL buffer or
  //       texture object; not disposing them leaks GPU memory.
  //    4. Dispose OrbitControls — it registers its own pointer, wheel,
  //       and keyboard listeners on the renderer DOM element.
  //    5. Dispose the WebGLRenderer (releases the WebGL context) and
  //       remove its <canvas> from containerElement's DOM.
  //    6. Remove the three HTML overlay elements this function injected.
  // ─────────────────────────────────────────────────────────────
  function cleanup() {
    // 1. Stop render loop
    if (rafId !== null) cancelAnimationFrame(rafId);

    // 2. Remove event listeners registered by this function
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('resize', onResize);

    // 3a. Dispose explicitly tracked resources (geometries, materials, textures)
    dq.forEach(item => item?.dispose?.());

    // 3b. Deep-traverse scene to catch Sun corona shells, joint spheres,
    //     backbone tubes, or any mesh not captured in dq above.
    scene.traverse(obj => {
      if (!obj.isMesh) return;
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => {
        if (!m) return;
        // Dispose every texture slot (map, normalMap, clearcoatMap, etc.)
        Object.values(m).forEach(v => { if (v instanceof THREE.Texture) v.dispose(); });
        m.dispose();
      });
    });

    // 4. Dispose OrbitControls (removes its own internal DOM listeners)
    controls.dispose();

    // 5. Dispose WebGLRenderer + detach its <canvas> from the container
    renderer.dispose();
    if (renderer.domElement.parentNode === containerElement)
      containerElement.removeChild(renderer.domElement);

    // 6. Remove HTML overlay elements injected by this function
    [legend, speedHud, card].forEach(el => {
      if (el?.parentNode === containerElement) containerElement.removeChild(el);
    });
  }

  return cleanup;
}