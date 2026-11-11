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

        // Headers slide up under the floating navbar (see .hero / .page-hero
        // in custom-3d.css); give them the navbar's real height. Measured
        // with the mobile menu closed so opening it doesn't shift the page.
        var setNavHeight = function () {
            var open = nav.querySelector(".navbar-collapse.show");
            if (open) return;
            document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
        };
        setNavHeight();
        window.addEventListener("resize", setNavHeight);

        // Mark the current page's nav link (gets the peach underline).
        var page = location.pathname.split("/").pop() || "index.html";
        nav.querySelectorAll(".nav-link").forEach(function (link) {
            if (link.getAttribute("href") === page) link.classList.add("active");
        });

        // Floating social capsule (desktop ≥1400px only, via CSS). Page links
        // live in the top bar, so this only carries external profiles.
        var railItems = [
            { href: "https://github.com/KartikSalian", icon: "bi-github", label: "GitHub", external: true },
            { href: "https://linkedin.com/in/kartik-salian-445038184", icon: "bi-linkedin", label: "LinkedIn", external: true },
        ];
        var rail = document.createElement("nav");
        rail.className = "side-rail";
        rail.setAttribute("aria-label", "Quick links");
        railItems.forEach(function (item) {
            if (!item) {
                var sep = document.createElement("span");
                sep.className = "rail-sep";
                rail.appendChild(sep);
                return;
            }
            var a = document.createElement("a");
            a.href = item.href;
            a.setAttribute("aria-label", item.label);
            a.setAttribute("data-label", item.label);
            a.innerHTML = '<i class="bi ' + item.icon + '"></i>';
            if (item.external) {
                a.target = "_blank";
                a.rel = "noopener";
            }
            if (item.href === page) a.classList.add("active");
            rail.appendChild(a);
        });
        document.body.appendChild(rail);
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

    // Footer: always-current year + smooth back-to-top.
    document.querySelectorAll(".js-year").forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
    document.querySelectorAll(".to-top").forEach(function (a) {
        a.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    });

    // Hero rotator: types / deletes through data-words ("a|b|c").
    var rotator = document.querySelector(".rotator[data-words]");
    if (rotator) {
        var words = rotator.getAttribute("data-words").split("|");
        var w = 0;
        if (prefersReducedMotion) {
            setInterval(function () {
                w = (w + 1) % words.length;
                rotator.textContent = words[w];
            }, 2600);
        } else {
            var text = words[0];
            var deleting = false;
            var tick = function () {
                var target = words[w];
                if (deleting) {
                    text = text.slice(0, -1);
                    if (!text) {
                        deleting = false;
                        w = (w + 1) % words.length;
                    }
                } else {
                    text = target.slice(0, text.length + 1);
                }
                rotator.textContent = text;
                var delay = deleting ? 45 : 85;
                if (!deleting && text === target) {
                    deleting = true;
                    delay = 2000; // hold the full word
                }
                setTimeout(tick, delay);
            };
            setTimeout(function () {
                deleting = true;
                tick();
            }, 2000);
        }
    }
})();
