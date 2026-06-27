// Plynulé scrollování (Lenis) + napojení na odkazy s kotvou
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof Lenis === "undefined") return;

  const lenis = new Lenis({
    duration: 1.1, // delší = plynulejší dojezd
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
  window.__lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // odkazy na kotvy scrollují plynule s odsazením pod hlavičku
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -88 });
  });
})();

// Mobilní menu
const toggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
if (toggle && nav) {
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.classList.toggle("is-open");
  });
  nav.addEventListener("click", (e) => {
    if (e.target.classList.contains("nav__link")) nav.classList.remove("is-open");
  });
  // klik mimo menu i tlačítko → zavřít
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove("is-open");
    }
  });
  // Escape → zavřít
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") nav.classList.remove("is-open");
  });
}

// Zvýraznění aktivní položky v menu podle scrollu
const sections = [...document.querySelectorAll("section[id]")];
const links = [...document.querySelectorAll(".nav__link")];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach((l) =>
          l.classList.toggle("is-active", l.getAttribute("href") === "#" + id)
        );
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => observer.observe(s));

/* ===== SCROLL REVEAL (postupné nalétávání) ===== */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // skupiny prvků + jejich směr; prvky uvnitř skupiny se odhalují postupně.
  // dir "alt" = střídavě zleva/zprava (hezčí objevování mřížek ze stran).
  const groups = [
    { sel: ".section__title, .eyebrow", dir: "up", step: 90 },
    { sel: ".hero__title, .hero__lead", dir: "left", step: 110 },
    { sel: ".hero__features li", dir: "up", step: 90 },
    { sel: ".hero__actions .btn", dir: "up", step: 90 },
    { sel: ".hero__badge", dir: "right", step: 0 },
    { sel: ".stat", dir: "alt", step: 110 },
    { sel: ".cards .card", dir: "alt", step: 120 },
    { sel: ".gallery__head > div", dir: "left", step: 90 },
    { sel: ".gallery__head .btn", dir: "right", step: 90 },
    { sel: ".gallery__img", dir: "alt", step: 80 },
    { sel: ".beforeafter__lead", dir: "up", step: 0 },
    { sel: ".ba", dir: "up", step: 90 },
    { sel: ".about__media", dir: "right", step: 0 },
    { sel: ".about__body > p:not(.eyebrow), .about__list, .about__body > .btn", dir: "left", step: 80 },
    { sel: ".perks__grid .perk", dir: "alt", step: 100 },
    { sel: ".map", dir: "up", step: 0 },
    { sel: ".cta__left", dir: "left", step: 0 },
    { sel: ".cta__contacts li", dir: "left", step: 80 },
    { sel: ".cta__box", dir: "right", step: 0 },
    { sel: ".footer__grid > *", dir: "up", step: 90 },
  ];

  const all = [];
  groups.forEach(({ sel, dir, step = 90 }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      // u "alt" se směr střídá – liché prvky zleva, sudé zprava
      const d = dir === "alt" ? (i % 2 ? "right" : "left") : dir;
      el.classList.add("reveal", "reveal--" + d);
      el.style.transitionDelay = Math.min(i * step, 540) + "ms";
      all.push(el);
    });
  });

  // po dokončení přechodu uvolníme will-change (lehčí pro GPU)
  all.forEach((el) =>
    el.addEventListener("transitionend", (e) => {
      if (e.propertyName === "transform") el.classList.add("is-done");
    })
  );

  const obs = new IntersectionObserver(
    (entries, o) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          o.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );
  all.forEach((el) => obs.observe(el));
})();

/* ===== KARUSEL RECENZÍ ===== */
(() => {
  const track = document.getElementById("reviewsTrack");
  const dotsWrap = document.getElementById("reviewDots");
  if (!track || !dotsWrap) return;

  const cards = [...track.children];

  // počet karet ve výřezu = kolik se jich vejde do šířky tracku
  const perView = () => {
    const cw = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return Math.max(1, Math.round((track.clientWidth + gap) / (cw + gap)));
  };

  let pages = 1;

  const buildDots = () => {
    pages = Math.ceil(cards.length / perView());
    dotsWrap.innerHTML = "";
    for (let i = 0; i < pages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Stránka recenzí ${i + 1}`);
      b.addEventListener("click", () =>
        track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" })
      );
      dotsWrap.appendChild(b);
    }
    syncActive();
  };

  const syncActive = () => {
    const active = Math.round(track.scrollLeft / track.clientWidth);
    [...dotsWrap.children].forEach((d, i) =>
      d.classList.toggle("is-active", i === active)
    );
  };

  let raf = null;
  track.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      syncActive();
      raf = null;
    });
  });

  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      buildDots();
      start();
    }, 150);
  });

  /* --- automatické posouvání dokola --- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DELAY = 4500;
  let timer = null;

  const next = () => {
    const cur = Math.round(track.scrollLeft / track.clientWidth);
    const np = (cur + 1) % pages; // po poslední stránce zpět na začátek
    track.scrollTo({ left: np * track.clientWidth, behavior: "smooth" });
  };
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  const start = () => {
    stop();
    if (!reduce && pages > 1) timer = setInterval(next, DELAY);
  };

  // pauza při najetí / dotyku / ovládání z klávesnice, pak zase rozjet
  ["pointerenter", "pointerdown", "focusin"].forEach((ev) =>
    track.addEventListener(ev, stop)
  );
  ["pointerleave", "pointerup", "focusout"].forEach((ev) =>
    track.addEventListener(ev, start)
  );
  // pauza, když je karta mimo obrazovku (šetří výkon)
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start()
  );

  buildDots();
  start();
})();

/* ===== ANIMOVANÁ POČÍTADLA ===== */
const stats = [...document.querySelectorAll(".stat__num")];
if (stats.length) {
  const fmt = (n, sep) =>
    sep ? n.toLocaleString("cs-CZ").replace(/,/g, " ") : String(n);

  const run = (el) => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || "";
    const sep = el.dataset.sep === "true";
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(Math.round(target * eased), sep) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  stats.forEach((el) => statObserver.observe(el));
}

/* ===== PŘED / PO POSUVNÍK ===== */
const ba = document.getElementById("ba");
if (ba) {
  const before = document.getElementById("baBefore");
  const beforeImg = before.querySelector("img");
  const handle = document.getElementById("baHandle");
  const range = document.getElementById("baRange");

  // šířka vnitřního obrázku = šířka celého rámečku, aby se "před" neořezával jinak
  const sizeImg = () => (beforeImg.style.width = ba.offsetWidth + "px");

  const setPos = (pct) => {
    pct = Math.max(0, Math.min(100, pct));
    before.style.width = pct + "%";
    handle.style.left = pct + "%";
    range.value = pct;
  };

  const moveTo = (clientX) => {
    const rect = ba.getBoundingClientRect();
    setPos(((clientX - rect.left) / rect.width) * 100);
  };

  // tažení myší / prstem přímo přes rámeček
  let dragging = false;
  ba.addEventListener("pointerdown", (e) => {
    dragging = true;
    moveTo(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) moveTo(e.clientX);
  });
  window.addEventListener("pointerup", () => (dragging = false));

  // klávesnice / přístupnost
  range.addEventListener("input", () => setPos(+range.value));

  const init = () => {
    sizeImg();
    setPos(+range.value);
  };
  window.addEventListener("resize", init);
  if (beforeImg.complete) init();
  else beforeImg.addEventListener("load", init);
}

/* ===== LIGHTBOX GALERIE ===== */
const galleryImgs = [...document.querySelectorAll(".gallery__img, .card__img")];
const lb = document.getElementById("lightbox");

if (lb && galleryImgs.length) {
  const lbImg = document.getElementById("lbImg");
  const lbCounter = document.getElementById("lbCounter");
  // získání URL z inline stylu background-image
  const sources = galleryImgs.map((el) => {
    const m = el.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : "";
  });
  let current = 0;
  let single = false; // jednotlivý obrázek bez šipek (karty Naše služby)

  const show = (i) => {
    current = (i + sources.length) % sources.length;
    lbImg.src = sources[current];
    lbCounter.textContent = `${current + 1} / ${sources.length}`;
  };
  const open = (i, singleMode = false) => {
    single = singleMode;
    lb.classList.toggle("is-single", single); // skryje šipky + počítadlo
    show(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  galleryImgs.forEach((el, i) =>
    // obrázky z karet (Naše služby) otevři jako jednotlivé, bez přepínání
    el.addEventListener("click", () => open(i, el.classList.contains("card__img")))
  );
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!single) show(current - 1);
  });
  document.getElementById("lbNext").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!single) show(current + 1);
  });
  // klik mimo obrázek zavře
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  // klávesy
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (single) return;
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
}

/* ===== POPTÁVKOVÝ FORMULÁŘ ===== */
// Pro reálné odesílání e-mailem si zdarma vytvořte endpoint na https://formspree.io
// a vložte jeho adresu níže (např. "https://formspree.io/f/abcdwxyz").
// Dokud zůstane prázdný, formulář otevře připravený e-mail v poštovním klientovi.
const FORMSPREE_ENDPOINT = "";

const form = document.getElementById("poptavkaForm");
const status = document.getElementById("formStatus");

if (form) {
  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = "form__status" + (type ? " is-" + type : "");
  };

  // Odebrání chybového stavu při psaní
  form.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      el.classList.remove("is-invalid");
      el.closest(".gdpr")?.classList.remove("is-invalid");
    });
  });

  /* --- Nahrávání fotek --- */
  const MAX_FILES = 5;
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const fileInput = document.getElementById("fotky");
  const dropZone = form.querySelector(".upload");
  const fileList = document.getElementById("uploadList");
  let files = []; // vlastní seznam, aby šlo mazat jednotlivé položky

  const fmtSize = (b) =>
    b < 1024 * 1024 ? Math.round(b / 1024) + " kB" : (b / 1024 / 1024).toFixed(1) + " MB";

  const syncInput = () => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    fileInput.files = dt.files;
  };

  const renderFiles = () => {
    fileList.innerHTML = "";
    files.forEach((file, i) => {
      const li = document.createElement("li");
      li.className = "upload__item";
      const img = document.createElement("img");
      img.className = "upload__thumb";
      img.alt = "";
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      const name = document.createElement("span");
      name.className = "upload__name";
      name.textContent = file.name;
      const size = document.createElement("span");
      size.className = "upload__size";
      size.textContent = fmtSize(file.size);
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "upload__remove";
      rm.setAttribute("aria-label", "Odebrat " + file.name);
      rm.innerHTML = "&times;";
      rm.addEventListener("click", () => {
        files.splice(i, 1);
        syncInput();
        renderFiles();
      });
      li.append(img, name, size, rm);
      fileList.appendChild(li);
    });
  };

  const addFiles = (incoming) => {
    for (const file of incoming) {
      if (files.length >= MAX_FILES) {
        setStatus(`Lze přiložit maximálně ${MAX_FILES} fotek.`, "error");
        break;
      }
      if (!file.type.startsWith("image/")) {
        setStatus(`Soubor „${file.name}" není obrázek.`, "error");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setStatus(`Fotka „${file.name}" je větší než 5 MB.`, "error");
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      files.push(file);
    }
    syncInput();
    renderFiles();
  };

  fileInput.addEventListener("change", () => addFiles(fileInput.files));

  // otevření výběru souborů kliknutím / klávesnicí (spolehlivě napříč prohlížeči)
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((ev) =>
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-drag");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  const validate = () => {
    let ok = true;
    const required = ["jmeno", "telefon", "email"];
    required.forEach((name) => {
      const el = form.elements[name];
      const valid = el.value.trim() !== "" && (el.type !== "email" || /.+@.+\..+/.test(el.value));
      el.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    const souhlas = form.elements["souhlas"];
    if (!souhlas.checked) {
      souhlas.closest(".gdpr").classList.add("is-invalid");
      ok = false;
    }
    return ok;
  };

  /* animace odeslání: naplnění tlačítka → fajfka přes obrazovku */
  const overlay = document.getElementById("successOverlay");
  const playSuccess = (btn) =>
    new Promise((resolve) => {
      btn.classList.add("is-sending");
      setTimeout(() => {
        btn.classList.remove("is-sending");
        btn.classList.add("is-done");
        if (overlay) {
          overlay.classList.add("is-visible");
          overlay.setAttribute("aria-hidden", "false");
        }
        setTimeout(() => {
          if (overlay) {
            overlay.classList.remove("is-visible");
            overlay.setAttribute("aria-hidden", "true");
          }
          btn.classList.remove("is-done");
          resolve();
        }, 2200);
      }, 950);
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) {
      setStatus("Zkontrolujte prosím povinná pole (*) a souhlas.", "error");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector(".form__submit");

    // Bez endpointu → otevře předvyplněný e-mail
    if (!FORMSPREE_ENDPOINT) {
      const fotkyText = files.length
        ? `\n\nPřiložené fotky (${files.length}): přidejte je prosím ručně jako přílohu e-mailu:\n` +
          files.map((f) => "- " + f.name).join("\n")
        : "";
      const body =
        `Jméno: ${data.jmeno}\nTelefon: ${data.telefon}\nE-mail: ${data.email}\n` +
        `Typ plotu: ${data.typ || "neuvedeno"}\n\nZpráva:\n${data.zprava || "-"}` + fotkyText;
      const mailto =
        `mailto:snaplava@seznam.cz?subject=${encodeURIComponent("Poptávka plotu – " + data.jmeno)}` +
        `&body=${encodeURIComponent(body)}`;

      btn.disabled = true;
      await playSuccess(btn); // naplnění tlačítka + fajfka
      window.location.href = mailto; // otevře předvyplněný e-mail
      setStatus(
        files.length
          ? "Otevíráme e-mail s poptávkou – fotky prosím přidejte jako přílohu."
          : "Otevíráme váš e-mailový klient s předvyplněnou poptávkou…",
        "success"
      );
      form.reset();
      files = [];
      renderFiles();
      btn.disabled = false;
      return;
    }

    // S endpointem → reálné odeslání
    try {
      btn.disabled = true;
      setStatus("Odesílám…", "");
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        await playSuccess(btn); // naplnění tlačítka + fajfka
        form.reset();
        files = [];
        renderFiles();
        setStatus("Děkujeme! Vaši poptávku jsme přijali a brzy se ozveme.", "success");
      } else {
        throw new Error("server");
      }
    } catch (err) {
      setStatus("Odeslání se nezdařilo. Zavolejte nám prosím na +420 723 123 456.", "error");
    } finally {
      btn.disabled = false;
    }
  });
}

/* ===== COOKIE LIŠTA ===== */
(() => {
  const bar = document.getElementById("cookies");
  if (!bar) return;
  const KEY = "cookieConsent";

  const open = () => {
    bar.hidden = false;
    // dvojitý rAF, aby přechod proběhl i hned po zobrazení
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add("is-visible")));
  };
  const close = (choice) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    } catch (e) {}
    bar.classList.remove("is-visible");
    bar.addEventListener("transitionend", () => (bar.hidden = true), { once: true });
  };

  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch (e) {}
  if (!saved) open();

  document.getElementById("cookiesAccept")?.addEventListener("click", () => close("all"));
  document.getElementById("cookiesReject")?.addEventListener("click", () => close("necessary"));
  // odkaz v patičce – znovu otevře lištu pro změnu volby
  document.getElementById("cookiesSettings")?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
})();

/* ===== AI CHAT ===== */
(() => {
  const root = document.getElementById("chat");
  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const list = document.getElementById("chatMessages");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  if (!root || !toggle || !form) return;

  // ⚠️ POZOR: tento klíč je viditelný v kódu stránky – komukoliv, kdo si web otevře.
  // Vhodné JEN na testování / lokální zkoušení. Na veřejný web použijte backend
  // (api/chat.js) a klíč nechte na serveru. Sem vložte svůj klíč "sk-ant-...":
  const CLAUDE_API_KEY = "";

  // Model: nejschopnější je "claude-opus-4-8". Pro web bývá levnější "claude-haiku-4-5".
  const CLAUDE_MODEL = "claude-opus-4-8";

  const SYSTEM_PROMPT = `Jsi přátelský český asistent firmy Ploty Náplava – rodinné firmy z okolí Uherského Hradiště (sídlo Polešovice 297, 687 37 Polešovice), která staví ploty, brány a branky na klíč.

Co firma nabízí:
- Klasické pletivo – cenově dostupné oplocení pro každý pozemek i terén.
- Svařované pletivo / 3D panely – pevné a tuhé panely s vysokou odolností a dlouhou životností.
- Dřevěné ploty – přírodní vzhled a soukromí, dřevo na míru.
- Brány a branky – posuvné i křídlové brány, branky, možnost dálkového ovládání.
- Bezplatné zaměření a nezávazná cenová nabídka, vlastní montážní tým, práce v termínu.

Kontakt: telefon +420 723 123 456, e-mail snaplava@seznam.cz.
Otevírací doba: Po–Pá 8:00–17:00, So 9:00–12:00, Ne zavřeno (telefonicky i mimo dobu).

Jak odpovídat:
- Vždy česky, stručně, srdečně a k věci (ideálně 2–5 vět).
- NEUVÁDĚJ konkrétní ceny – cena závisí na zaměření; nabídni bezplatnou cenovou nabídku.
- Když má zákazník zájem, nasměruj ho k vyplnění poptávkového formuláře (sekce „Nezávazná poptávka") nebo k telefonu +420 723 123 456.
- Pokud něco nevíš jistě (přesné termíny, dostupnost, ceny), řekni, že to nejlépe upřesní firma po zaměření, a nabídni kontakt.
- Nevymýšlej si údaje, které tu nejsou uvedené.`;

  // zavolá Claude API přímo z prohlížeče
  const askClaude = async (msgs) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: msgs.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  };

  // historie konverzace pro kontext (role user/assistant)
  const history = [];
  let busy = false;
  let greeted = false;

  const open = () => {
    root.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    if (!greeted) {
      greeted = true;
      addMsg(
        "Dobrý den! 👋 Jsem asistent firmy Ploty Náplava. Poradím s výběrem plotu, bran nebo branek a nasměruji vás k nezávazné poptávce. S čím vám mohu pomoci?",
        "bot"
      );
    }
    setTimeout(() => input.focus(), 250);
  };
  const close = () => {
    root.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  };
  toggle.addEventListener("click", () =>
    root.classList.contains("is-open") ? close() : open()
  );

  // jednoduché vykreslení odkazů a zalomení
  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linkify = (s) =>
    escapeHtml(s)
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/(\+?\d[\d\s]{7,}\d)/g, (m) => `<a href="tel:${m.replace(/\s/g, "")}">${m}</a>`)
      .replace(/([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>');

  const addMsg = (text, who) => {
    const el = document.createElement("div");
    el.className = "chat__msg chat__msg--" + who;
    el.innerHTML = linkify(text);
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
    return el;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;

    addMsg(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";
    busy = true;

    const typing = document.createElement("div");
    typing.className = "chat__msg chat__msg--bot chat__msg--typing";
    typing.textContent = "Píšu…";
    list.appendChild(typing);
    list.scrollTop = list.scrollHeight;

    try {
      const reply = await askClaude(history);
      typing.remove();
      if (reply) {
        addMsg(reply, "bot");
        history.push({ role: "assistant", content: reply });
      } else {
        throw new Error("prázdná odpověď");
      }
    } catch (err) {
      typing.remove();
      addMsg(
        "Omlouvám se, teď se nemohu spojit. Zavolejte nám prosím na +420 723 123 456 nebo napište na snaplava@seznam.cz.",
        "bot"
      );
    } finally {
      busy = false;
      input.focus();
    }
  });
})();

/* ===== GALERIE – „zobrazit další realizace" (plnění → odhalení) ===== */
(() => {
  const btn = document.getElementById("galleryMore");
  if (!btn) return;
  const extras = [...document.querySelectorAll(".gallery__img--extra")];

  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-filling")) return;
    btn.classList.add("is-filling"); // efekt plnění zelenou

    // až doběhne plnění (~0,7 s), odhalíme skryté realizace
    setTimeout(() => {
      extras.forEach((el) => (el.style.display = "block"));

      // postupné nalétnutí – necháme element vykreslit ve skrytém stavu, pak spustíme přechod
      requestAnimationFrame(() => {
        extras.forEach((el, i) => {
          if (el.classList.contains("reveal")) {
            el.style.transitionDelay = i * 90 + "ms";
            el.classList.add("is-visible");
          }
        });
      });

      // tlačítko splnilo účel – plynule zmizí
      btn.style.transition = "opacity .45s ease, transform .45s ease";
      btn.style.opacity = "0";
      btn.style.transform = "translateY(-6px)";
      setTimeout(() => btn.remove(), 460);
    }, 720);
  });
})();

/* ===== HERO TLAČÍTKO „UKÁZKY PRACÍ" (plnění → scroll na sekci) ===== */
(() => {
  const btn = document.getElementById("heroGallery");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    if (btn.classList.contains("is-filling")) return;
    e.preventDefault();
    btn.classList.add("is-filling");
    setTimeout(() => {
      const target = document.getElementById("ukazky");
      if (target) {
        if (window.__lenis) window.__lenis.scrollTo(target, { offset: -88 });
        else target.scrollIntoView({ behavior: "smooth" });
      }
      // po dojetí efekt zruš, ať je tlačítko zase připravené
      setTimeout(() => btn.classList.remove("is-filling"), 600);
    }, 720);
  });
})();

/* ===== TLAČÍTKO NAVIGOVAT (plnění → otevření navigace) ===== */
(() => {
  const nav = document.getElementById("mapNav");
  if (!nav) return;

  nav.addEventListener("click", (e) => {
    if (nav.classList.contains("is-filling")) return; // už běží
    e.preventDefault();
    nav.classList.add("is-filling"); // efekt plnění zelenou

    // až doběhne plnění (~0,7 s), otevřeme navigaci
    setTimeout(() => {
      window.open(nav.href, "_blank", "noopener");
      nav.classList.remove("is-filling");
    }, 720);
  });
})();
