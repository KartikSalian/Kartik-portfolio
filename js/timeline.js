// Resume timeline: clicking a tile opens a popup with that entry's details.
(function () {
    var dialog = document.getElementById("tlDialog");
    if (!dialog) return;

    var slots = {};
    dialog.querySelectorAll("[data-slot]").forEach(function (el) {
        slots[el.getAttribute("data-slot")] = el;
    });
    var types = ["is-work", "is-part", "is-edu"];
    var lastTrigger = null;

    function text(card, selector) {
        var el = card.querySelector(selector);
        return el ? el.textContent.trim() : "";
    }

    function open(item) {
        var card = item.querySelector(".tl-card");
        var details = item.querySelector(".tl-details");

        types.forEach(function (t) {
            dialog.classList.toggle(t, item.classList.contains(t));
        });
        slots.type.textContent = text(card, ".tl-type");
        slots.date.textContent = text(card, ".tl-date");
        slots.role.textContent = text(card, ".tl-role");
        slots.org.textContent = text(card, ".tl-org");
        slots.body.innerHTML = details ? details.innerHTML : "";

        lastTrigger = card;
        document.documentElement.classList.add("tl-dialog-open");
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
        slots.body.scrollTop = 0;
    }

    function close() {
        if (typeof dialog.close === "function") {
            dialog.close();
        } else {
            dialog.removeAttribute("open");
            onClosed();
        }
    }

    function onClosed() {
        document.documentElement.classList.remove("tl-dialog-open");
        if (lastTrigger) lastTrigger.focus();
    }

    document.querySelectorAll(".tl-item .tl-card").forEach(function (card) {
        card.addEventListener("click", function () {
            open(card.closest(".tl-item"));
        });
    });

    dialog.querySelector(".tl-close").addEventListener("click", close);

    // Click on the dimmed backdrop (outside the panel) closes it.
    dialog.addEventListener("click", function (e) {
        if (e.target !== dialog) return;
        var r = dialog.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) close();
    });

    dialog.addEventListener("close", onClosed);
})();
