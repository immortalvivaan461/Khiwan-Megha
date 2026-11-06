const envelope   = document.getElementById("envelope");
const openButton = document.getElementById("openButton");
const flap       = envelope.querySelector(".envelope-flap");
const card       = envelope.querySelector(".invitation-card");
const shell      = envelope.querySelectorAll(".envelope-back, .envelope-pocket, .envelope-flap");
const instruction = document.querySelector(".instruction");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let isOpened = false;

// The seal is centred with GSAP (not CSS transform) so GSAP can scale it safely
gsap.set(openButton, { xPercent: -50, yPercent: -50 });

/* ---------- Idle state: gentle float + seal pulse ---------- */
let idleFloat, idlePulse;

if (!reduceMotion) {
    idleFloat = gsap.to(envelope, {
        y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1
    });
    idlePulse = gsap.to(openButton, {
        scale: 1.06, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1
    });
}

/* ---------- Petals + sparkles burst ---------- */
function celebrate() {
    if (reduceMotion) return;

    const r = envelope.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.35;
    const colors = ["#F4DDE0", "#E9BFC4", "#B77C83", "#FFF9F3"];
    const rand = (a, b) => a + Math.random() * (b - a);

    for (let i = 0; i < 22; i++) {
        const p = document.createElement("span");
        p.className = "petal";
        p.style.left = cx + "px";
        p.style.top = cy + "px";
        p.style.background = colors[i % colors.length];
        document.body.appendChild(p);

        gsap.timeline({ onComplete: () => p.remove() })
            .fromTo(p,
                { x: 0, y: 0, scale: 0, opacity: 0, rotation: rand(0, 360) },
                { x: rand(-170, 170), y: rand(-210, -60), scale: rand(0.8, 1.5),
                  opacity: 1, rotation: "+=" + rand(120, 300),
                  duration: rand(0.9, 1.3), ease: "power2.out" })
            .to(p, {
                x: "+=" + rand(-60, 60), y: "+=" + rand(260, 420),
                rotation: "+=" + rand(200, 420), opacity: 0,
                duration: rand(2.2, 3.2), ease: "sine.in"
            });
    }

    for (let i = 0; i < 12; i++) {
        const s = document.createElement("span");
        s.className = "sparkle";
        s.style.left = cx + "px";
        s.style.top = cy + "px";
        document.body.appendChild(s);

        gsap.timeline({ onComplete: () => s.remove() })
            .fromTo(s,
                { x: 0, y: 0, scale: 0, opacity: 0 },
                { x: rand(-150, 150), y: rand(-170, 40), scale: rand(0.6, 1.4),
                  opacity: 1, duration: 0.6, ease: "power2.out" })
            .to(s, { opacity: 0, scale: 0, duration: 0.7, ease: "power1.in" });
    }
}

/* ---------- Opening sequence ---------- */
function openEnvelope() {
    if (isOpened) return;
    isOpened = true;

    startWeddingMusic();   // the click is a visitor gesture, so the browser allows the music to start

    idleFloat && idleFloat.kill();
    idlePulse && idlePulse.kill();
    openButton.style.pointerEvents = "none";
    envelope.style.cursor = "default";

    const h = envelope.offsetHeight;

    const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => window.openGate && window.openGate()
    });

    // settle the envelope back to its resting position
    tl.to(envelope, { y: 0, duration: 0.4, ease: "power2.out" }, 0)
      .to(instruction, { opacity: 0, y: 10, duration: 0.5, ease: "power1.out" }, 0)

      // 1. seal presses, then breaks away
      .to(openButton, { scale: 1.12, duration: 0.18, ease: "power1.out" }, 0)
      .to(openButton, {
          scale: 0.4, rotation: -18, opacity: 0, duration: 0.45, ease: "back.in(2)"
      })

      // 2. flap lifts and folds back, showing its inside face
      .to(flap, { rotateX: 180, duration: 1.1, ease: "power2.inOut" }, "-=0.1")
      // once it passes vertical, tuck it behind the card
      .set(flap, { zIndex: 1 }, "<0.5")

      // 3. card slides up out of the pocket
      .to(card, { y: -h * 0.62, duration: 1.1, ease: "power3.out" }, "-=0.3")
      .add(celebrate, "<0.3")

      // 4. card comes forward as the envelope drops away
      .set(card, { zIndex: 6 })
      .to(shell, { y: h * 0.3, opacity: 0, duration: 1, ease: "power2.inOut" }, "+=0.15")
      .to(card, {
          y: 0, scale: 1.14, duration: 1.1, ease: "power3.inOut",
          boxShadow: "0 24px 50px rgba(66,55,47,.28)"
      }, "<");

    if (reduceMotion) tl.timeScale(6);
}

envelope.addEventListener("click", openEnvelope);



/* ---------- WEDDING MUSIC ---------- */

const music = document.getElementById("weddingMusic");
const musicToggle = document.getElementById("musicToggle");

function updateMusicButton() {
    const playing = !music.paused;

    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute(
        "aria-label",
        playing ? "Pause music" : "Play music"
    );

    musicToggle.innerHTML = playing
        ? '<span class="music-icon">♫</span><span class="music-label">Pause</span>'
        : '<span class="music-icon">♪</span><span class="music-label">Play</span>';
}

// Start the music (called when the envelope seal is clicked)
async function startWeddingMusic() {
    if (!music.paused) return;
    try {
        await music.play();
    } catch (error) {
        console.log("Music playback could not start.");
    }
    updateMusicButton();
}

// Play / pause button
musicToggle.addEventListener("click", async () => {
    if (music.paused) {
        try {
            await music.play();
        } catch (error) {
            console.log("Music playback could not start.");
        }
    } else {
        music.pause();
    }

    updateMusicButton();
});

music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);

updateMusicButton();   // show "Play" until the seal is clicked