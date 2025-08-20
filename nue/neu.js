// neo-mini: tiny JS helpers (no deps)
(function () {
  // Toggle component activation
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".toggle");
    if (!t) return;
    const on = t.getAttribute("aria-checked") === "true";
    t.setAttribute("aria-checked", String(!on));
    t.dispatchEvent(
      new CustomEvent("toggle-change", {
        detail: { checked: !on },
        bubbles: true,
      }),
    );
  });

  // Keyboard a11y for toggle
  document.addEventListener("keydown", (e) => {
    const t = e.target.closest(".toggle");
    if (!t) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      t.click();
    }
  });

  // Knob: drag/rotate to set value 0..100
  document.querySelectorAll(".knob").forEach((knob) => {
    const needle = knob.querySelector(".knob__needle");
    const center = knob.querySelector(".knob__center");
    let value = 0;

    function setValue(v) {
      value = Math.max(0, Math.min(100, v));
      const deg = (value / 100) * 300 - 150; // sweep -150..+150
      needle.style.transform = `rotate(${deg}deg)`;
      center.textContent = value.toString().padStart(2, "0") + "%";
      knob.dispatchEvent(
        new CustomEvent("knob-change", { detail: { value }, bubbles: true }),
      );
    }

    function angleFromEvent(ev) {
      const r = knob.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - cx;
      const y = (ev.touches ? ev.touches[0].clientY : ev.clientY) - cy;
      let a = (Math.atan2(-x, -y) * 180) / Math.PI; // 0 at top
      a = (a + 360) % 360; // 0..359
      // map 30..330 to 0..100
      if (a < 30) a = 30;
      if (a > 330) a = 330;
      const swept = a - 30; // 0..300
      return (swept / 300) * 100;
    }

    function start(ev) {
      ev.preventDefault();
      setValue(angleFromEvent(ev));
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end);
    }
    function move(ev) {
      ev.preventDefault();
      setValue(angleFromEvent(ev));
    }
    function end() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    }

    knob.addEventListener("mousedown", start);
    knob.addEventListener("touchstart", start, { passive: false });
    setValue(0); // init
  });

  // Theme toggle button (data-theme on :root)
  const themeBtn = document.querySelector('[data-action="toggle-theme"]');
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const root = document.documentElement;
      const cur = root.getAttribute("data-theme");
      root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
    });
  }
})();
