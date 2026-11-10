// Contact page: copy-to-clipboard buttons + a quick-message form that opens
// the visitor's email app pre-filled (the site is static — no server).
(function () {
    var TO = "salian.kartik7@gmail.com";
    var toast = document.getElementById("ctToast");
    var toastTimer;

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("is-on");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("is-on");
        }, 1800);
    }

    function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (e) {}
        document.body.removeChild(ta);
        return ok;
    }

    document.querySelectorAll(".ct-copy[data-copy]").forEach(function (btn) {
        var label = btn.querySelector("span");
        btn.addEventListener("click", function () {
            var text = btn.getAttribute("data-copy");
            var done = function () {
                btn.classList.add("is-copied");
                if (label) label.textContent = "Copied";
                btn.querySelector("i").className = "bi bi-check2";
                showToast("Copied " + text);
                setTimeout(function () {
                    btn.classList.remove("is-copied");
                    if (label) label.textContent = "Copy";
                    btn.querySelector("i").className = "bi bi-copy";
                }, 1800);
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(done, function () {
                    if (fallbackCopy(text)) done();
                });
            } else if (fallbackCopy(text)) {
                done();
            }
        });
    });

    var form = document.getElementById("ctForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            // Look fields up by id: form.name would return the form's own name.
            var nameEl = document.getElementById("ctName");
            var topicEl = document.getElementById("ctTopic");
            var msgEl = document.getElementById("ctMsg");
            var name = nameEl.value.trim();
            var topic = topicEl.value;
            var msg = msgEl.value.trim();
            var hint = document.getElementById("ctHint");

            form.querySelectorAll(".ct-input").forEach(function (el) {
                el.classList.remove("is-invalid");
            });
            if (!name || !msg) {
                if (!name) nameEl.classList.add("is-invalid");
                if (!msg) msgEl.classList.add("is-invalid");
                if (hint) hint.textContent = "Please add your name and a message.";
                (name ? msgEl : nameEl).focus();
                return;
            }

            var subject = topic + " — from " + name;
            var body = msg + "\n\n— " + name;
            window.location.href =
                "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            if (hint) hint.textContent = "Your email app should open now. If it doesn't, copy the address above.";
        });
    }
})();
