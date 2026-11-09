(function () {
    const gate     = document.getElementById("gate");
    const glow     = document.getElementById("gateGlow");
    const page     = document.getElementById("finalPage");
    const left     = gate.querySelector(".curtain--left");
    const right    = gate.querySelector(".curtain--right");
    const reduce   = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // How far the silk bunches up at the sides when the curtains are drawn open
    const GATHERED = 0.34;

    // ===== MANUAL TIMING (seconds) =====
    // HOLD: how long the curtains stay closed after they finish closing, before they start to open.
    // Smaller = quicker (0 = open straight away). Try 0.3 to 1.5.
    const HOLD = 0;

    // Curtains start fully closed and are hung from the top, so they can swing like fabric
    gsap.set(left,  { scaleX: 1, opacity: 0, transformOrigin: "0% 0%" });
    gsap.set(right, { scaleX: 1, opacity: 0, transformOrigin: "100% 0%" });

    // keep the beaded edge round while the curtain is squashed
    function syncBeads() {
        [left, right].forEach(el => el.style.setProperty("--inv", 1 / gsap.getProperty(el, "scaleX")));
    }
    syncBeads();

    function startCountdown() {
        const target = new Date("2026-11-21T00:00:00").getTime();
        const els = ["days", "hours", "mins", "secs"].map(id => document.getElementById("cd-" + id));
        const pad = n => String(n).padStart(2, "0");
        function tick() {
            let diff = Math.max(0, target - Date.now());
            const d = Math.floor(diff / 864e5); diff %= 864e5;
            const h = Math.floor(diff / 36e5);  diff %= 36e5;
            const m = Math.floor(diff / 6e4);
            const s = Math.floor((diff % 6e4) / 1e3);
            [d, h, m, s].forEach((v, i) => els[i].textContent = pad(v));
        }
        tick();
        setInterval(tick, 1000);
    }

    window.openGate = function () {
        gsap.set(gate, { visibility: "visible" });
        gsap.set(page, { visibility: "hidden" });
        startCountdown();

        const tl = gsap.timeline({
            onUpdate: syncBeads,
            onComplete: () => {
                gsap.set([gate, glow], { display: "none" });
                document.querySelector(".invitation-screen").style.display = "none";
                window.revealHashtag && window.revealHashtag();   // navbar hashtag appears once the curtains are gone
            }
        });

        /* Fabric lag: the top of a hanging curtain moves first and the hem trails behind.
           dir = +1 for the left curtain, -1 for the right one. */
        const drag = (el, dir, at, peak, rise, fall) =>
            tl.to(el, { skewX: dir * peak, duration: rise, ease: "sine.out" }, at)
              .to(el, { skewX: 0, duration: fall, ease: "sine.inOut" }, at + rise);

        // 1. the closed curtains simply appear (a very quick fade so there is no hard cut)
        tl.to([left, right], { opacity: 1, duration: 0.4, ease: "power1.out" }, 0);

        // 2. a calm beat: the closed silk breathes very slightly (lasts as long as HOLD allows)
        const CLOSED_AT = 0.4;                 // moment the curtains are fully visible
        const breath = Math.min(0.8, HOLD / 2);
        if (breath >= 0.2) {
            tl.to(left,  { skewX: 0.5,  duration: breath, ease: "sine.inOut", yoyo: true, repeat: 1 }, CLOSED_AT)
              .to(right, { skewX: -0.5, duration: breath, ease: "sine.inOut", yoyo: true, repeat: 1 }, CLOSED_AT);
        }

        // 3. warm light grows behind the silk, then the curtains are drawn open and bunch at the sides
        tl.addLabel("open", CLOSED_AT + HOLD)
          .set(glow, { visibility: "visible" }, "open-=0.3")
          .to(glow, { opacity: 1, duration: 1.3, ease: "power1.in" }, "open-=0.3")
          .to(left,  { scaleX: GATHERED, duration: 2.8, ease: "power2.inOut" }, "open")
          .to(right, { scaleX: GATHERED, duration: 2.8, ease: "power2.inOut" }, "open+=0.1");
        drag(left,   1, "open",      2.2, 1.2, 1.8);
        drag(right, -1, "open+=0.1", 2.2, 1.2, 1.8);

        // 4. the invitation rises gently out of the light while the curtains melt away
        tl.set(page, { visibility: "visible" }, "open+=1.4")
          .fromTo(page, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.2, ease: "power3.out" }, "open+=1.4")
          .to(glow, { opacity: 0, duration: 1.6, ease: "power1.out" }, "open+=1.7")
          .to([left, right], { opacity: 0, duration: 1.2, ease: "power1.inOut" }, "open+=2.4")
          .from(".fp-reveal", { y: 26, opacity: 0, duration: 1, stagger: 0.14, ease: "power2.out" }, "open+=1.9")
          .add(() => window.initReveals && window.initReveals(), "open+=2.2");

        if (reduce) tl.timeScale(5);
    };
})();