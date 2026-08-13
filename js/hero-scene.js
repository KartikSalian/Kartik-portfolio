// Lightweight Three.js background: a rotating wireframe form (home hero only),
// a swarm of small tumbling geometric "comets" — including a few built from
// Kartik's hobbies (cricket bat/ball/wickets, a football, goalkeeper gloves)
// rendered in the same low-poly wireframe style — plus a starfield, nudged
// gently by the cursor. Skipped entirely on prefers-reduced-motion so the
// hero degrades gracefully to the CSS gradient.
//
// canvas[data-variant="compact"] (used on the inner-page headers) drops the
// big centerpiece and keeps comets clear of the horizontal and vertical
// center, since those headers have a centered title instead of a
// left-aligned column of text.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("hero-canvas");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function wireMesh(geometry, color, opacity) {
    return new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
}

// Cricket bat: cylindrical handle + flattened paddle blade.
function createCricketBat() {
    const group = new THREE.Group();
    const blade = wireMesh(new THREE.BoxGeometry(0.16, 0.42, 0.05), 0x5b7cff, 0.6);
    blade.position.y = 0.06;
    const handle = wireMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), 0x5b7cff, 0.6);
    handle.position.y = 0.4;
    group.add(blade, handle);
    return group;
}

// Cricket ball / football: low-poly sphere, sized and tinted to tell them apart.
function createBall(color, radius) {
    return wireMesh(new THREE.IcosahedronGeometry(radius, 1), color, 0.6);
}

// Cricket wickets: three stumps plus two bails resting on top.
function createWickets() {
    const group = new THREE.Group();
    const stumpGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6);
    [-0.055, 0, 0.055].forEach((x) => {
        const stump = wireMesh(stumpGeo, 0xff3d9a, 0.6);
        stump.position.set(x, 0, 0);
        group.add(stump);
    });
    const bailGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6);
    [-0.0275, 0.0275].forEach((x) => {
        const bail = wireMesh(bailGeo, 0xff3d9a, 0.6);
        bail.rotation.z = Math.PI / 2;
        bail.position.set(x, 0.17, 0);
        group.add(bail);
    });
    return group;
}

// Goalkeeper gloves: a pair of flattened palms with short finger prongs.
function createGloves() {
    const group = new THREE.Group();
    const fingerGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.08, 5);
    [-0.11, 0.11].forEach((x) => {
        const palm = wireMesh(new THREE.BoxGeometry(0.14, 0.18, 0.05), 0x5b7cff, 0.6);
        palm.position.set(x, 0, 0);
        group.add(palm);
        [-0.04, 0, 0.04].forEach((fx) => {
            const finger = wireMesh(fingerGeo, 0x5b7cff, 0.6);
            finger.position.set(x + fx, 0.13, 0);
            group.add(finger);
        });
    });
    return group;
}

if (canvas && !prefersReducedMotion) {
    const isCompact = canvas.dataset.variant === "compact";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = isCompact ? 9 : 8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Centerpiece: wireframe icosahedron "planet" + thin ring (home hero
    // only — on compact headers the title sits centered where this would
    // clash)
    let group = null;
    if (!isCompact) {
        group = new THREE.Group();
        scene.add(group);

        const icoGeometry = new THREE.IcosahedronGeometry(2.3, 1);
        const icoWireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(icoGeometry),
            new THREE.LineBasicMaterial({ color: 0x5b7cff, transparent: true, opacity: 0.55 })
        );
        group.add(icoWireframe);

        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(3.3, 0.015, 8, 120),
            new THREE.MeshBasicMaterial({ color: 0xff3d9a, transparent: true, opacity: 0.5 })
        );
        torus.rotation.x = Math.PI / 2.6;
        torus.rotation.y = Math.PI / 6;
        group.add(torus);
    }

    // Small tumbling geometric "comets" scattered around — a fixed set of
    // hobby icons plus generic polyhedra filling out the rest.
    const cometGroup = new THREE.Group();
    scene.add(cometGroup);

    const hobbyIconFactories = [
        createCricketBat,
        () => createBall(0xff3d9a, 0.12), // cricket ball
        () => createBall(0x5b7cff, 0.17), // football
        createWickets,
        createGloves,
    ];

    const cometGeometries = [
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.IcosahedronGeometry(1, 0),
    ];
    const comets = [];
    const cometCount = isCompact ? 9 : 14;
    for (let i = 0; i < cometCount; i++) {
        let comet;
        let scale;
        if (i < hobbyIconFactories.length) {
            comet = hobbyIconFactories[i]();
            scale = 0.9 + Math.random() * 0.4;
        } else {
            const baseGeometry = cometGeometries[i % cometGeometries.length];
            comet = new THREE.LineSegments(
                new THREE.WireframeGeometry(baseGeometry),
                new THREE.LineBasicMaterial({
                    color: i % 2 === 0 ? 0x5b7cff : 0xff3d9a,
                    transparent: true,
                    opacity: 0.45 + Math.random() * 0.35,
                })
            );
            scale = 0.14 + Math.random() * 0.24;
        }
        comet.scale.setScalar(scale);

        const radius = 3.8 + Math.random() * 3.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        let x = radius * Math.sin(phi) * Math.cos(theta);
        let y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi) * 0.6;

        if (isCompact) {
            // Push comets out toward the corners so the centered title
            // (and its subtitle line) stays clear on both axes. These
            // headers are very wide and short, so the horizontal push has
            // to be large to actually clear the title in screen space.
            const xSign = x >= 0 ? 1 : -1;
            x = xSign * (Math.abs(x) * 0.5 + 5.5);
            if (Math.abs(y) < 1.8) {
                const ySign = y >= 0 ? 1 : -1;
                y = ySign * (Math.abs(y) + 2.2);
            }
        } else if (x < -1 && Math.abs(y) < 2.4) {
            // Keep comets clear of the headline/paragraph column on the left.
            x = Math.abs(x) + 1.5;
        }
        comet.position.set(x, y, z);
        comet.userData.spin = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02,
        };
        cometGroup.add(comet);
        comets.push(comet);
    }

    // Starfield
    const particleCount = isCompact ? 130 : 220;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const radius = 4.4 + Math.random() * 2.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.03,
        transparent: true,
        opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    let targetX = 0;
    let targetY = 0;
    window.addEventListener("mousemove", (event) => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 3;
        targetY = (event.clientY / window.innerHeight - 0.5) * 3;
    });

    function resize() {
        const { clientWidth, clientHeight } = canvas;
        if (clientWidth === 0 || clientHeight === 0) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight, false);
    }
    window.addEventListener("resize", resize);
    resize();

    let isVisible = true;
    document.addEventListener("visibilitychange", () => {
        isVisible = !document.hidden;
    });

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;

        if (group) {
            group.rotation.y += 0.0022;
            group.rotation.x += 0.0007;
        }
        particles.rotation.y -= 0.0005;

        cometGroup.rotation.y += 0.0011;
        cometGroup.rotation.x -= 0.0006;
        comets.forEach((comet) => {
            comet.rotation.x += comet.userData.spin.x;
            comet.rotation.y += comet.userData.spin.y;
            comet.rotation.z += comet.userData.spin.z;
        });

        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();
}
