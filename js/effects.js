// Small vanilla-JS UI effects: navbar scroll shadow, scroll-reveal for the
// About section, and the SVG refraction filter used by the "liquid glass"
// tiles (see custom-3d.css). Card hover (lift + shadow) is handled in CSS.
// No dependencies.
(function () {
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Liquid-glass refraction: an SVG filter that gently bends whatever is
    // behind a glass tile, like light through real glass. Referenced from
    // CSS as backdrop-filter: url(#liquid-glass-distortion). Only affects
    // the backdrop (what's behind the tile) — a tile's own text/content is
    // never distorted. Injected once, reused by every glass surface.
    // Wrapped in its own try/catch so a failure here (a strict CSP
    // blocking the innerHTML sink, a hostile extension, etc.) can't take
    // down the unrelated navbar-shadow/reveal setup below it.
    try {
        if (!document.getElementById("liquid-glass-distortion")) {
            var svgNS = "http://www.w3.org/2000/svg";
            var svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "0");
            svg.setAttribute("height", "0");
            svg.setAttribute("aria-hidden", "true");
            svg.style.position = "absolute";
            svg.style.overflow = "hidden";
            svg.innerHTML =
                '<filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%">' +
                '<feTurbulence type="fractalNoise" baseFrequency="0.01 0.012" numOctaves="2" seed="7" result="noise" />' +
                '<feGaussianBlur in="noise" stdDeviation="3" result="blurredNoise" />' +
                '<feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="16" xChannelSelector="R" yChannelSelector="G" />' +
                "</filter>";
            document.body.prepend(svg);
        }
        // custom-3d.css only applies the refraction backdrop-filter under
        // html.liquid-glass, so a blocked/failed injection above (or JS
        // disabled entirely) leaves every surface on its plain, always-safe
        // blur — this line only runs once injection actually succeeded.
        document.documentElement.classList.add("liquid-glass");
    } catch (err) {
        // Decorative enhancement only; nothing else depends on it.
    }

    var nav = document.querySelector(".navbar");
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle("is-scrolled", window.scrollY > 8);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    var revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            revealEls.forEach(function (el) {
                el.classList.add("in-view");
            });
        } else {
            var observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("in-view");
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.15 }
            );
            revealEls.forEach(function (el) {
                observer.observe(el);
            });
        }
    }
})();
