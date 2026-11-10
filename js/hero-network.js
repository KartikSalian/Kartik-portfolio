// Calm hero background: a faint field of drifting data points that link up
// when close to each other, and reach toward the cursor. Plain 2D canvas (no
// modules / CDN), so it also runs when index.html is opened from disk.
(function () {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;
    var points = [];
    var mouse = { x: -9999, y: -9999 };
    var LINK = 120; // px: max distance for point-to-point links
    var REACH = 170; // px: cursor reach
    var running = true;

    function seed() {
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        if (!W || !H) return;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var count = Math.max(28, Math.min(95, Math.round((W * H) / 15000)));
        points = [];
        for (var i = 0; i < count; i++) {
            points.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.28,
                r: 1 + Math.random() * 1.6,
                peach: Math.random() < 0.12,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (!reduceMotion) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                if (p.y > H + 10) p.y = -10;
            }

            // Links to neighbours
            for (var j = i + 1; j < points.length; j++) {
                var q = points[j];
                var dx = p.x - q.x;
                var dy = p.y - q.y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < LINK) {
                    ctx.strokeStyle = "rgba(42, 43, 95," + (1 - d / LINK) * 0.16 + ")";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }

            // Reach toward the cursor
            var mx = p.x - mouse.x;
            var my = p.y - mouse.y;
            var md = Math.sqrt(mx * mx + my * my);
            var near = md < REACH;
            if (near) {
                ctx.strokeStyle = "rgba(255, 255, 255," + (1 - md / REACH) * 0.7 + ")";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }

            ctx.fillStyle = p.peach || near ? "rgba(245, 182, 158, 0.95)" : "rgba(42, 43, 95, 0.35)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, near ? p.r + 0.8 : p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop() {
        if (running) draw();
        requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        if (reduceMotion) draw();
    });
    window.addEventListener("mouseout", function () {
        mouse.x = mouse.y = -9999;
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            seed();
            draw();
        }, 150);
    });

    // Pause while the hero is off-screen or the tab is hidden.
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            running = entries[0].isIntersecting && !document.hidden;
        }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
        running = !document.hidden;
    });

    seed();
    draw();
    if (!reduceMotion) requestAnimationFrame(loop);
})();
