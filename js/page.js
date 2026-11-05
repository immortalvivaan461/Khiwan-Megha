(function () {
    /* ---------- Navbar menu button (phones) ---------- */
    const header = document.querySelector(".fp-nav");
    const toggle = header.querySelector(".fp-toggle");
    const isOpen = () => header.classList.contains("menu-open");
    function setMenu(open) {
        header.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open);
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", () => setMenu(!isOpen()));
    header.querySelector("nav").addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
    header.querySelector(".fp-logo").addEventListener("click", () => setMenu(false));
    document.addEventListener("click", e => { if (isOpen() && !header.contains(e.target)) setMenu(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen()) { setMenu(false); toggle.focus(); } });
    window.matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

    /* ---------- Day tabs ---------- */
    const tabs = [...document.querySelectorAll('.fp-tabs [role="tab"]')];
    function selectTab(tab) {
        tabs.forEach(t => {
            const on = t === tab;
            t.setAttribute("aria-selected", on);
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        });
    }
    tabs.forEach((t, i) => {
        t.addEventListener("click", () => selectTab(t));
        t.addEventListener("keydown", e => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
            selectTab(next); next.focus();
        });
    });

    /* ---------- Scratch to reveal ---------- */
    const card = document.getElementById("scratchCard");
    const canvas = document.getElementById("scratchCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let drawing = false, scratched = false, done = false, dpr = 1;

    function paintCover() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = card.offsetWidth * dpr;
        canvas.height = card.offsetHeight * dpr;
        const W = canvas.width, H = canvas.height;
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#C9A46A"); g.addColorStop(.55, "#D9A9A5"); g.addColorStop(1, "#B77C83");
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(255,249,243,.14)"; ctx.lineWidth = dpr;
        for (let x = -H; x < W; x += 18 * dpr) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
        ctx.fillStyle = "#FFF9F3"; ctx.textAlign = "center";
        ctx.font = `${36 * dpr}px "Great Vibes", cursive`;
        ctx.fillText("Scratch here", W / 2, H / 2 + 6 * dpr);
        ctx.font = `italic ${15 * dpr}px "Cormorant Garamond", serif`;
        ctx.fillText("using your finger or mouse", W / 2, H / 2 + 34 * dpr);
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(paintCover);
    window.addEventListener("resize", () => { if (!scratched && !done) paintCover(); });

    function reveal() {
        if (done) return;
        done = true;
        card.classList.add("is-done");
        card.closest(".fp-scratch").classList.add("is-done");
    }
    function scratch(e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * (canvas.width / r.width);
        const y = (e.clientY - r.top) * (canvas.height / r.height);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(x, y, 24 * dpr, 0, Math.PI * 2); ctx.fill();
    }
    function cleared() {
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let clear = 0, total = 0;
        for (let i = 3; i < d.length; i += 64) { total++; if (d[i] < 128) clear++; }
        return clear / total;
    }
    canvas.addEventListener("pointerdown", e => { drawing = scratched = true; canvas.setPointerCapture(e.pointerId); scratch(e); });
    canvas.addEventListener("pointermove", e => { if (drawing) scratch(e); });
    ["pointerup", "pointercancel"].forEach(ev => canvas.addEventListener(ev, () => {
        if (!drawing) return;
        drawing = false;
        if (cleared() > 0.4) reveal();
    }));
    document.getElementById("revealDate").addEventListener("click", reveal);

    /* ---------- RSVP ---------- */
    // Set your WhatsApp number (country code, digits only, e.g. "919876543210") to receive replies.
    const WHATSAPP_NUMBER = "";
    const form = document.getElementById("rsvpForm");
    const status = document.getElementById("rsvpStatus");

    form.addEventListener("submit", e => {
        e.preventDefault();
        const f = new FormData(form);
        const name = (f.get("name") || "").trim();
        if (!name || !f.get("attending")) {
            status.textContent = "Please add your name and let us know if you can join.";
            return;
        }
        const yes = f.get("attending") === "yes";
        const msg = [
            `RSVP from ${name}`,
            yes ? `Joining us (${f.get("guests")} guest${f.get("guests") > 1 ? "s" : ""})` : "Unable to attend",
            f.get("phone") ? `Contact: ${f.get("phone")}` : "",
            f.get("message") ? `Message: ${f.get("message")}` : ""
        ].filter(Boolean).join("\n");

        if (WHATSAPP_NUMBER) {
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
        } else {
            console.warn("RSVP not delivered: set WHATSAPP_NUMBER in js/page.js.\n" + msg);
        }
        status.textContent = yes ? `Thank you, ${name}. We can’t wait to celebrate with you.` : `Thank you, ${name}. You will be missed.`;
        form.reset();
    });
})();