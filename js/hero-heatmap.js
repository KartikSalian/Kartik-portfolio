// Home hero background: a soft "activity heatmap" of rounded squares.
// Gentle waves roll across it, and the squares under the cursor (or finger)
// heat up to peach and slowly cool down, leaving a fading trail.
// Plain 2D canvas — no modules/CDN — so it also works from file://.
(function () {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var SIZE = 16; // square size (px)
    var GAP = 6; // gap between squares (px)
    var STEP = SIZE + GAP;
    var REACH = 70; // cursor influence radius (px)
    var DECAY = 0.955; // how fast heat fades each frame

    var W = 0, H = 0, cols = 0, rows = 0;
    var seed = []; // per-cell random base value
    var heat = []; // per-cell interaction heat (0..1)
    var t = 0;
    var running = true;
    var needsDraw = true;

    function setup() {
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        if (!W || !H) return;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(W / STEP);
        rows = Math.ceil(H / STEP);
        seed = [];
        heat = [];
        for (var i = 0; i < cols * rows; i++) {
            seed.push(Math.random());
            heat.push(0);
        }
        needsDraw = true;
    }

    function roundRect(x, y, s, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + s, y, x + s, y + s, r);
        ctx.arcTo(x + s, y + s, x, y + s, r);
        ctx.arcTo(x, y + s, x, y, r);
        ctx.arcTo(x, y, x + s, y, r);
        ctx.closePath();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (var gy = 0; gy < rows; gy++) {
            for (var gx = 0; gx < cols; gx++) {
                var i = gy * cols + gx;
                var px = gx * STEP;
                var py = gy * STEP;
                var wave = 0.5 + 0.5 * Math.sin(gx * 0.22 + gy * 0.15 - t);
                var v = seed[i] * 0.55 + wave * 0.45;
                var h = heat[i];

                var fill;
                if (h > 0.04) {
                    // interaction: blend toward a bright peach
                    fill = "rgba(245,182,158," + Math.min(0.95, 0.25 + h * 0.75) + ")";
                } else if (v > 0.9) {
                    fill = "rgba(245,182,158,0.7)";
                } else if (v > 0.7) {
                    fill = "rgba(42,43,95,0.11)";
                } else {
                    fill = "rgba(233,232,248,0.18)";
                }
                ctx.fillStyle = fill;

                // hot squares grow a touch
                var grow = h * 3;
                roundRect(px - grow / 2, py - grow / 2, SIZE + grow, 4);
                ctx.fill();
            }
        }
    }

    function addHeat(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        if (mx < -REACH || my < -REACH || mx > W + REACH || my > H + REACH) return;

        var c0 = Math.max(0, Math.floor((mx - REACH) / STEP));
        var c1 = Math.min(cols - 1, Math.ceil((mx + REACH) / STEP));
        var r0 = Math.max(0, Math.floor((my - REACH) / STEP));
        var r1 = Math.min(rows - 1, Math.ceil((my + REACH) / STEP));
        for (var gy = r0; gy <= r1; gy++) {
            for (var gx = c0; gx <= c1; gx++) {
                var cx = gx * STEP + SIZE / 2;
                var cy = gy * STEP + SIZE / 2;
                var d = Math.sqrt((cx - mx) * (cx - mx) + (cy - my) * (cy - my));
                if (d < REACH) {
                    var i = gy * cols + gx;
                    heat[i] = Math.min(1, heat[i] + (1 - d / REACH) * 0.55);
                }
            }
        }
        needsDraw = true;
    }

    function loop() {
        if (running) {
            if (!reduceMotion) t += 0.02;
            var hot = false;
            for (var i = 0; i < heat.length; i++) {
                if (heat[i] > 0.001) {
                    heat[i] *= DECAY;
                    hot = true;
                }
            }
            if (!reduceMotion || hot || needsDraw) {
                draw();
                needsDraw = false;
            }
        }
        requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", function (e) {
        addHeat(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (e) {
        if (e.touches && e.touches[0]) addHeat(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setup, 150);
    });

    // Pause while the hero is off-screen or the tab is hidden.
    var visible = true;
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            running = visible && !document.hidden;
        }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
        running = visible && !document.hidden;
    });

    setup();
    draw();
    requestAnimationFrame(loop);
})();
