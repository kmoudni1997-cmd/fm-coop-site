/* =====================================================================
   CONFIGURAZIONE — MODIFICA SOLO QUESTI VALORI
   Telefono e WhatsApp usano lo STESSO numero.
   - NUMERO_DISPLAY : come appare sul sito (con spazi va bene)
   - NUMERO_WA      : stesso numero per WhatsApp/chiamata, SENZA "+",
                      SENZA spazi, con prefisso paese (es. 39 per Italia)
   - EMAIL          : indirizzo email per i contatti
   - WEB3FORMS_KEY  : chiave gratuita per ricevere il modulo via email
                      (vedi istruzioni: si crea in 2 minuti su web3forms.com)
   ===================================================================== */
const CONFIG = {
  NUMERO_DISPLAY: "+39 351 503 9851",
  NUMERO_WA:      "393515039851",
  EMAIL:          "info@fm-coop.com",
  WHATSAPP_MSG:   "Buongiorno, vi contatto dal sito FM Coop per richiedere un preventivo.",
  WEB3FORMS_KEY:  "INCOLLA-QUI-LA-TUA-ACCESS-KEY"
};

document.addEventListener("DOMContentLoaded", function () {
  /* Link WhatsApp / Telefono / Email */
  var waLink = "https://wa.me/" + CONFIG.NUMERO_WA + "?text=" + encodeURIComponent(CONFIG.WHATSAPP_MSG);
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.href = waLink; el.target = "_blank"; el.rel = "noopener";
  });
  document.querySelectorAll("[data-tel]").forEach(function (el) {
    el.href = "tel:" + CONFIG.NUMERO_DISPLAY.replace(/\s/g, "");
  });
  document.querySelectorAll("[data-email]").forEach(function (el) {
    el.href = "mailto:" + CONFIG.EMAIL;
  });
  document.querySelectorAll("[data-tel-label]").forEach(function (el) {
    el.textContent = CONFIG.NUMERO_DISPLAY;
  });
  document.querySelectorAll("[data-email-label]").forEach(function (el) {
    el.textContent = CONFIG.EMAIL;
  });

  /* Menu mobile */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", function () { menu.classList.toggle("open"); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("open"); });
    });
  }

  /* Anno footer */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* Velocità video hero (più dinamico) */
  var heroVid = document.querySelector("video.hero-media");
  if (heroVid) {
    var setSpeed = function () { try { heroVid.playbackRate = 1.5; } catch (e) {} };
    heroVid.addEventListener("loadedmetadata", setSpeed);
    heroVid.addEventListener("play", setSpeed);
    setSpeed();
  }

  /* Conteggio animato numeri in crescita */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var run = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1400, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* Modulo di contatto */
  var form = document.getElementById("contactForm");
  var msg = document.getElementById("formMsg");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      msg.className = "form-msg";
      if (CONFIG.WEB3FORMS_KEY === "INCOLLA-QUI-LA-TUA-ACCESS-KEY") {
        var body = encodeURIComponent(
          "Nome: " + form.nome.value +
          "\nContatto: " + form.contatto.value +
          "\n\n" + form.messaggio.value
        );
        window.location.href = "mailto:" + CONFIG.EMAIL +
          "?subject=Richiesta dal sito FM Coop&body=" + body;
        return;
      }
      var data = new FormData(form);
      data.append("access_key", CONFIG.WEB3FORMS_KEY);
      try {
        var r = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
        var j = await r.json();
        if (j.success) {
          msg.className = "form-msg ok";
          msg.textContent = "Grazie! Richiesta inviata, ti ricontattiamo a breve.";
          form.reset();
        } else {
          msg.className = "form-msg err";
          msg.textContent = "Errore nell'invio. Riprova o scrivici su WhatsApp.";
        }
      } catch (err) {
        msg.className = "form-msg err";
        msg.textContent = "Errore di connessione. Riprova o scrivici su WhatsApp.";
      }
    });
  }
});

/* ── Comparsa morbida degli elementi allo scorrimento ──────────────────
   Usa IntersectionObserver: costa quasi nulla e non blocca lo scorrimento.
   Se il browser non lo supporta, tutto resta semplicemente visibile.    */
document.addEventListener("DOMContentLoaded", function () {
  var elementi = document.querySelectorAll("[data-appare]");
  if (!elementi.length) return;
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elementi.forEach(function (e) { e.classList.add("visibile"); });
    return;
  }
  var osservatore = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (v.isIntersecting) {
        var ritardo = parseInt(v.target.getAttribute("data-appare"), 10) || 0;
        setTimeout(function () { v.target.classList.add("visibile"); }, ritardo);
        osservatore.unobserve(v.target);
      }
    });
  }, { threshold: 0.01, rootMargin: "220px 0px 220px 0px" });
  elementi.forEach(function (e) { osservatore.observe(e); });
});

/* ── I NUMERI SALGONO QUANDO ENTRANO IN VISTA ──────────────────────────
   Parte una volta sola. Chi ha disattivato le animazioni vede subito il
   numero finale, senza conteggio.                                       */
document.addEventListener("DOMContentLoaded", function () {
  var cifre = document.querySelectorAll("[data-conta]");
  if (!cifre.length) return;

  function scrivi(el, valore) {
    el.textContent = valore + (el.getAttribute("data-suffisso") || "");
  }
  var fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fermo || !("IntersectionObserver" in window)) {
    cifre.forEach(function (el) { scrivi(el, parseInt(el.getAttribute("data-conta"), 10)); });
    return;
  }
  function conta(el) {
    var meta = parseInt(el.getAttribute("data-conta"), 10);
    var durata = 1100, inizio = null;
    function passo(t) {
      if (!inizio) inizio = t;
      var q = Math.min((t - inizio) / durata, 1);
      var morbido = 1 - Math.pow(1 - q, 3);        // rallenta alla fine
      scrivi(el, Math.round(meta * morbido));
      if (q < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  var osservatore = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (v.isIntersecting) { conta(v.target); osservatore.unobserve(v.target); }
    });
  }, { threshold: 0.4 });
  cifre.forEach(function (el) { osservatore.observe(el); });
});

/* ── La luce segue il mouse dentro i blocchi ───────────────────────────
   Aggiorna due variabili CSS con la posizione del cursore: il chiarore
   nasce dove sta la mano. Costa pochissimo (nessun ridisegno).        */
document.addEventListener("DOMContentLoaded", function () {
  var blocchi = document.querySelectorAll(".blocco");
  if (!blocchi.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  blocchi.forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      b.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });
});
