/* =====================================================================
   FM COOP — EFFETTI
   Quattro cose che fanno fermare chi arriva:
     1. una rete di punti che reagisce al cursore, dietro l'hero
     2. il titolo che sale parola per parola
     3. i pulsanti che si avvicinano alla mano
     4. la barra che segna quanto hai letto
   Tutto rispetta l'impostazione di sistema "riduci animazioni":
   se e' attiva, non parte niente.
   ===================================================================== */
(function () {
  "use strict";
  var FERMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. RETE DI PUNTI SOPRA IL VIDEO ────────────────────────────────
     Punti che vagano piano e si collegano fra loro quando sono vicini.
     Vicino al cursore si illuminano. Disegnata su canvas: non appesantisce
     la pagina perche' e' un solo elemento, non centinaia di nodi HTML.  */
  function rete() {
    var hero = document.querySelector(".hero-full");
    if (!hero || FERMO) return;

    var tela = document.createElement("canvas");
    tela.className = "rete-punti";
    hero.insertBefore(tela, hero.querySelector(".wrap"));
    var ctx = tela.getContext("2d", { alpha: true });

    var punti = [], mouse = { x: -999, y: -999 }, larg = 0, alt = 0, dpr = 1;
    var DIST = 132;                       // distanza entro cui si collegano
    var attivo = true;

    function dimensiona() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      larg = hero.offsetWidth; alt = hero.offsetHeight;
      tela.width = larg * dpr; tela.height = alt * dpr;
      tela.style.width = larg + "px"; tela.style.height = alt + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // densita' proporzionale all'area, con un tetto per i portatili lenti
      var quanti = Math.min(Math.round((larg * alt) / 17000), 78);
      punti = [];
      for (var i = 0; i < quanti; i++) {
        punti.push({
          x: Math.random() * larg, y: Math.random() * alt,
          vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
          r: Math.random() * 1.3 + .7
        });
      }
    }

    function disegna() {
      if (!attivo) return;
      ctx.clearRect(0, 0, larg, alt);

      for (var i = 0; i < punti.length; i++) {
        var p = punti[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > larg) p.vx *= -1;
        if (p.y < 0 || p.y > alt) p.vy *= -1;

        var dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        var vicino = dm < 170 ? 1 - dm / 170 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + vicino * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + (.16 + vicino * .55) + ")";
        ctx.fill();

        for (var j = i + 1; j < punti.length; j++) {
          var q = punti[j];
          var d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < DIST) {
            var forza = (1 - d / DIST) * .17;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(185,192,199," + (forza + vicino * .22) + ")";
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(disegna);
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
    window.addEventListener("resize", dimensiona);

    // si ferma quando l'hero esce dallo schermo: non consuma a vuoto
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (v) {
        var eraFermo = !attivo;
        attivo = v[0].isIntersecting;
        if (attivo && eraFermo) disegna();
      }, { threshold: 0 }).observe(hero);
    }

    dimensiona();
    disegna();
  }

  /* ── 2. IL TITOLO SALE PAROLA PER PAROLA ───────────────────────────── */
  function titoloAParole() {
    var h1 = document.querySelector(".hero-full h1");
    if (!h1 || FERMO || h1.dataset.spezzato) return;
    h1.dataset.spezzato = "1";

    // ricostruisco il titolo avvolgendo ogni parola, senza perdere lo
    // <span class="accent"> che colora la seconda riga
    function avvolgi(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {                     // testo
          var pezzi = n.textContent.split(/(\s+)/);
          var frammento = document.createDocumentFragment();
          pezzi.forEach(function (t) {
            if (!t.trim()) { frammento.appendChild(document.createTextNode(t)); return; }
            var est = document.createElement("span"); est.className = "parola";
            var int = document.createElement("span"); int.className = "parola-int";
            int.textContent = t; est.appendChild(int);
            frammento.appendChild(est);
          });
          nodo.replaceChild(frammento, n);
        } else if (n.nodeType === 1) {
          avvolgi(n);
        }
      });
    }
    avvolgi(h1);

    var parole = h1.querySelectorAll(".parola-int");
    parole.forEach(function (p, i) { p.style.transitionDelay = (i * 42) + "ms"; });

    // Rete di sicurezza: se la pagina viene aperta in una scheda di sfondo,
    // il browser congela le transizioni e il titolo resterebbe a meta'.
    // Quindi: parto solo a scheda visibile, e comunque dopo 2,5s lo mostro.
    function mostra() {
      h1.classList.add("parole-su");
      clearTimeout(salvagente);
    }
    var salvagente = setTimeout(function () {
      parole.forEach(function (p) { p.style.transition = "none"; p.style.transform = "translateY(0)"; });
      h1.classList.add("parole-su");
    }, 2500);

    if (document.visibilityState === "visible") {
      requestAnimationFrame(mostra);
    } else {
      document.addEventListener("visibilitychange", function avvia() {
        if (document.visibilityState === "visible") {
          document.removeEventListener("visibilitychange", avvia);
          requestAnimationFrame(mostra);
        }
      });
    }
  }

  /* ── 3. PULSANTI CHE SI AVVICINANO ALLA MANO ───────────────────────── */
  function pulsantiMagnetici() {
    if (FERMO || window.matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * .22;
        var dy = (e.clientY - (r.top + r.height / 2)) * .3;
        b.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ── 4. BARRA DI LETTURA ───────────────────────────────────────────── */
  function barraLettura() {
    var barra = document.createElement("div");
    barra.className = "barra-lettura";
    document.body.appendChild(barra);
    var pendente = false;
    function aggiorna() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      barra.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
      pendente = false;
    }
    window.addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(aggiorna); }
    }, { passive: true });
    aggiorna();
  }

  document.addEventListener("DOMContentLoaded", function () {
    rete();
    titoloAParole();
    pulsantiMagnetici();
    barraLettura();
  });
})();
