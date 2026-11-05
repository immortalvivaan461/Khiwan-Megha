(function () {
    const page = document.getElementById("finalPage");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $$ = s => [...page.querySelectorAll(s)];

    /* ---- mark reveal targets while the page is still hidden (no flash) ---- */
    const sel = ".fp-title,.fp-lead,.fp-invite-card,.fp-invite-card > *,.fp-venue-photo,.fp-venue-grid > div:last-child > *," +
        ".fp-scratch > *,.fp-tabs,.fp-timeline li,.fp-countdown,.fp-form,.fp-footer > *";
    const els = [...new Set($$(sel))].filter(e => !e.classList.contains("fp-divider"));
    const seen = new Map();
    els.forEach(el => {
        const n = seen.get(el.parentNode) || 0;
        seen.set(el.parentNode, n + 1);
        el.classList.add("rv");
        el.style.setProperty("--d", Math.min(n, 6) * 0.09 + "s");
    });
    const draws = $$(".fp-divider,.fp-timeline");
    draws.forEach(el => el.classList.add("draw"));

    /* ---- started by gate.js once the doors open ---- */
    window.initReveals = function () {
        const all = els.concat(draws);
        if (reduce) return all.forEach(e => e.classList.add("in"));
        // (petals start below, after the observer is set up)
        const io = new IntersectionObserver(entries => entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        all.forEach(e => io.observe(e));
        onScroll();
        startPetals();
    };

    /* ---- falling petals + tiny blossoms over the whole page ---- */
    function startPetals() {
        if (reduce || document.querySelector(".petal-layer")) return;
        const layer = document.createElement("div");
        layer.className = "petal-layer";
        layer.setAttribute("aria-hidden", "true");
        const colors = ["#F4DDE0", "#EBC3C8", "#E3A9B1", "#FFF9F3", "#E6CB94"];
        const count = window.innerWidth < 600 ? 16 : 28;
        const r = (a, b) => a + Math.random() * (b - a);
        for (let i = 0; i < count; i++) {
            const bloom = i % 4 === 0;
            const f = document.createElement("span");
            f.className = "fall " + (bloom ? "bloom" : "petal");
            f.style.cssText = `--x:${r(0, 100)}%;--s:${bloom ? r(14, 20) : r(9, 15)}px;--c:${colors[i % colors.length]};` +
                `--t:${r(10, 18)}s;--dl:${r(0, 9)}s;--dx:${r(-90, 90)}px;--sw:${r(2, 4)}s`;
            f.appendChild(document.createElement("i"));
            layer.appendChild(f);
        }
        document.body.appendChild(layer);
        requestAnimationFrame(() => layer.classList.add("on"));
    }

    /* ---- scroll: progress bar, parallax, active link, nav shadow ---- */
    const nav = page.querySelector(".fp-nav");
    const bar = page.querySelector(".fp-progress");
    const hero = page.querySelector(".fp-hero");
    const links = $$(".fp-nav nav a");
    const targets = links.map(a => page.querySelector(a.getAttribute("href")));
    let ticking = false;

    function onScroll() {
        ticking = false;
        const st = page.scrollTop, max = page.scrollHeight - page.clientHeight;
        bar.style.setProperty("--p", max > 0 ? st / max : 0);
        nav.classList.toggle("is-scrolled", st > 10);
        if (!reduce && st < hero.offsetHeight) hero.style.setProperty("--py", st * 0.3 + "px");
        let active = 0;
        targets.forEach((t, i) => { if (t && t.offsetTop - 140 <= st) active = i; });
        if (max > 0 && st >= max - 4) active = links.length - 1;
        links.forEach((a, i) => a.classList.toggle("is-active", i === active));
    }
    page.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

    /* ---- countdown: tick when a number changes ---- */
    ["days", "hours", "mins", "secs"].forEach(k => {
        const el = document.getElementById("cd-" + k);
        let last = el.textContent;
        new MutationObserver(() => {
            if (el.textContent === last) return;
            last = el.textContent;
            el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
        }).observe(el, { childList: true, characterData: true, subtree: true });
    });

    /* ---- scratch card: sparkle burst on reveal ---- */
    const card = document.getElementById("scratchCard");
    new MutationObserver(() => {
        if (!card.classList.contains("is-done") || reduce) return;
        const sec = card.parentNode;
        const cx = card.offsetLeft + card.offsetWidth / 2, cy = card.offsetTop + card.offsetHeight / 2;
        for (let i = 0; i < 20; i++) {
            const s = document.createElement("span");
            s.className = "fp-spark";
            s.style.left = cx + "px"; s.style.top = cy + "px";
            sec.appendChild(s);
            const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 130;
            gsap.fromTo(s, { x: 0, y: 0, scale: 0, opacity: 1 },
                { x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0.6 + Math.random() * 1.2, opacity: 0,
                  duration: 1.1 + Math.random() * 0.6, ease: "power2.out", onComplete: () => s.remove() });
        }
    }).observe(card, { attributes: true, attributeFilter: ["class"] });
})();