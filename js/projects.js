// Projects page: capsule filter with counts, "+N" tool overflow, and a
// details popup built from each card's own content.
(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".pj-card"));
    if (!cards.length) return;

    function cats(card) {
        return (card.getAttribute("data-cat") || "").split(/\s+/);
    }

    // ---- Filter ----
    var filterBtns = document.querySelectorAll(".pj-filter button");
    filterBtns.forEach(function (btn) {
        var f = btn.getAttribute("data-filter");
        var n = f === "all" ? cards.length : cards.filter(function (c) { return cats(c).indexOf(f) !== -1; }).length;
        var count = btn.querySelector(".pj-count");
        if (count) count.textContent = n;

        btn.addEventListener("click", function () {
            filterBtns.forEach(function (b) {
                b.classList.toggle("is-active", b === btn);
                b.setAttribute("aria-pressed", b === btn ? "true" : "false");
            });
            cards.forEach(function (card) {
                var show = f === "all" || cats(card).indexOf(f) !== -1;
                card.hidden = !show;
                if (show) {
                    card.classList.remove("pj-in");
                    void card.offsetWidth; // restart the entry animation
                    card.classList.add("pj-in");
                }
            });
        });
    });

    // ---- "+N" on long tool lists (not on the featured card) ----
    var MAX_TOOLS = 4;
    cards.forEach(function (card) {
        if (card.classList.contains("is-featured")) return;
        var tools = card.querySelectorAll(".pj-tools > span");
        if (tools.length > MAX_TOOLS) {
            for (var i = MAX_TOOLS; i < tools.length; i++) tools[i].classList.add("pj-hide");
            var more = document.createElement("span");
            more.className = "pj-more-tools";
            more.textContent = "+" + (tools.length - MAX_TOOLS);
            card.querySelector(".pj-tools").appendChild(more);
        }
    });

    // ---- Details popup ----
    var dialog = document.getElementById("pjDialog");
    if (!dialog) return;
    var slots = {};
    dialog.querySelectorAll("[data-slot]").forEach(function (el) {
        slots[el.getAttribute("data-slot")] = el;
    });
    var lastTrigger = null;

    function html(card, sel) {
        var el = card.querySelector(sel);
        return el ? el.innerHTML : "";
    }

    function open(card, trigger) {
        var img = card.querySelector(".pj-media img");
        slots.media.innerHTML = img ? '<img src="' + img.getAttribute("src") + '" alt="' + (img.getAttribute("alt") || "") + '" />' : "";
        slots.tags.innerHTML = html(card, ".pj-tags");
        slots.title.textContent = card.querySelector(".pj-title").textContent;
        slots.desc.textContent = card.querySelector(".pj-desc").textContent;
        slots.stats.innerHTML = html(card, ".pj-stats");
        slots.stats.hidden = !slots.stats.innerHTML.trim();
        slots.extra.innerHTML = html(card, ".pj-extra");

        slots.tools.innerHTML = "";
        card.querySelectorAll(".pj-tools > span:not(.pj-more-tools)").forEach(function (t) {
            var s = document.createElement("span");
            s.textContent = t.textContent;
            slots.tools.appendChild(s);
        });

        slots.actions.innerHTML = "";
        card.querySelectorAll(".pj-actions a").forEach(function (a) {
            slots.actions.appendChild(a.cloneNode(true));
        });

        lastTrigger = trigger || card;
        document.documentElement.classList.add("tl-dialog-open");
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
        dialog.querySelector(".tl-dialog-body").scrollTop = 0;
    }

    function close() {
        if (typeof dialog.close === "function") dialog.close();
        else {
            dialog.removeAttribute("open");
            onClosed();
        }
    }

    function onClosed() {
        document.documentElement.classList.remove("tl-dialog-open");
        if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    }

    cards.forEach(function (card) {
        // Make the whole tile open the popup; real links keep working.
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-haspopup", "dialog");
        card.setAttribute("aria-label", "Open details: " + card.querySelector(".pj-title").textContent);

        card.addEventListener("click", function (e) {
            if (e.target.closest("a")) return;
            open(card, card);
        });
        card.addEventListener("keydown", function (e) {
            if (e.target !== card) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(card, card);
            }
        });
    });

    dialog.querySelector(".tl-close").addEventListener("click", close);
    dialog.addEventListener("click", function (e) {
        if (e.target !== dialog) return;
        var r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    });
    dialog.addEventListener("close", onClosed);
})();
