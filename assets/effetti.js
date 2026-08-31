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

/* =====================================================================
   SECONDO LIVELLO
     5. cursore che inverte quello che ci sta sotto
     6. i titoli si "decodificano" quando entrano in vista
     7. i blocchi si inclinano seguendo la mano (profondita' vera)
     8. il video scorre piu' piano del testo (parallasse)
     9. il nastro delle zone accelera mentre scorri
   ===================================================================== */
(function () {
  "use strict";
  var FERMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOCCO = window.matchMedia("(pointer: coarse)").matches;

  /* ── 5. CURSORE A INVERSIONE ────────────────────────────────────────
     Un cerchio con fusione "differenza": sul nero diventa bianco, sul
     bianco diventa nero. Su un sito monocromatico e' l'effetto che si
     nota di piu' e costa quasi nulla.                                  */
  function cursore() {
    if (FERMO || TOCCO) return;
    var anello = document.createElement("div");
    anello.className = "cursore";
    document.body.appendChild(anello);
    document.body.classList.add("ha-cursore");

    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    document.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; });

    // ingrandisce sopra le cose cliccabili
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest("a,button,.blocco,.settore-riga,.voce,.area,input,textarea,label");
      anello.classList.toggle("grande", !!t);
    });

    (function segui() {
      x += (tx - x) * .18; y += (ty - y) * .18;      // inseguimento morbido
      anello.style.transform = "translate3d(" + (x - 19) + "px," + (y - 19) + "px,0)";
      requestAnimationFrame(segui);
    })();
  }

  /* ── 6. TITOLI CHE SI DECODIFICANO ──────────────────────────────────
     Le lettere partono come simboli e si sistemano una dopo l'altra.
     Solo sui titoli di sezione: sui paragrafi sarebbe illeggibile.     */
  function decodifica() {
    if (FERMO) return;
    var SIMBOLI = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/*+=<>";
    var titoli = document.querySelectorAll(".sez-cap h2, .area-cap h3");
    if (!titoli.length || !("IntersectionObserver" in window)) return;

    function gioca(el) {
      var finale = el.textContent, lung = finale.length, passo = 0;
      var durata = Math.min(lung * 1.5, 34);          // piu' corto = piu' veloce
      var id = setInterval(function () {
        var out = "";
        for (var i = 0; i < lung; i++) {
          var c = finale[i];
          if (c === " ") { out += " "; continue; }
          // le lettere si fissano da sinistra a destra
          if (i < passo * (lung / durata)) out += c;
          else out += SIMBOLI[Math.floor(Math.random() * SIMBOLI.length)];
        }
        el.textContent = out;
        if (++passo > durata) { clearInterval(id); el.textContent = finale; }
      }, 26);
    }

    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { gioca(v.target); oss.unobserve(v.target); }
      });
    }, { threshold: .55 });
    titoli.forEach(function (t) { oss.observe(t); });
  }

  /* ── 7. BLOCCHI CHE SI INCLINANO ────────────────────────────────────
     Rotazione minima (3 gradi): quel tanto che basta a dare profondita'
     senza sembrare un giocattolo.                                      */
  function inclina() {
    if (FERMO || TOCCO) return;
    document.querySelectorAll(".blocco").forEach(function (b) {
      b.style.transformStyle = "preserve-3d";
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        b.style.transform = "perspective(900px) rotateY(" + (px * 5.5) + "deg) rotateX(" +
                            (-py * 5.5) + "deg) translateZ(6px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ── 8. PARALLASSE DELL'HERO ────────────────────────────────────────
     Il video scende piu' piano del testo: nasce la sensazione di strati. */
  function parallasse() {
    if (FERMO) return;
    var hero = document.querySelector(".hero-full");
    if (!hero) return;
    var video = hero.querySelector("video"), testo = hero.querySelector(".wrap");
    if (!video) return;
    var pendente = false;
    function muovi() {
      var s = window.scrollY;
      if (s < hero.offsetHeight * 1.2) {
        video.style.transform = "translate3d(0," + (s * .32) + "px,0) scale(1.08)";
        if (testo) testo.style.transform = "translate3d(0," + (s * -.06) + "px,0)";
      }
      pendente = false;
    }
    addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(muovi); }
    }, { passive: true });
  }

  /* ── 9. IL NASTRO ACCELERA CON LO SCORRIMENTO ───────────────────── */
  function nastroVivo() {
    if (FERMO) return;
    var riga = document.querySelector(".nastro-riga");
    if (!riga) return;
    var ultimo = window.scrollY, pendente = false;
    function calcola() {
      var v = Math.abs(window.scrollY - ultimo);
      ultimo = window.scrollY;
      riga.style.animationDuration = Math.max(8, 42 - v * .9) + "s";
      pendente = false;
    }
    addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(calcola); }
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    cursore(); decodifica(); inclina(); parallasse(); nastroVivo();
  });
})();

/* =====================================================================
   TERZO LIVELLO
     10. sipario d'ingresso
     11. i settori scorrono di lato mentre scendi
   ===================================================================== */
(function () {
  "use strict";
  var FERMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 10. SIPARIO ────────────────────────────────────────────────────
     Solo alla prima visita della sessione: rivederlo a ogni pagina
     diventa un pedaggio.                                              */
  function sipario() {
    if (FERMO) return;
    try { if (sessionStorage.getItem("fm-visto")) return; } catch (e) {}
    if (!document.querySelector(".hero-full")) return;   // solo in home

    document.body.classList.add("in-ingresso");
    var s = document.createElement("div");
    s.className = "sipario"; s.innerHTML = "<span></span><span></span>";
    var m = document.createElement("div");
    m.className = "sipario-marchio";
    m.innerHTML = '<div class="sipario-blocco">' +
                  '<div class="sipario-logo-cassa">' +
                  '<img src="assets/logo.png" alt="FM Cooperativa" class="sipario-logo" />' +
                  '</div>' +
                  '<div class="sipario-riga"></div></div>';
    document.body.appendChild(s); document.body.appendChild(m);

    setTimeout(function () { m.classList.add("via"); }, 1150);
    setTimeout(function () {
      s.classList.add("apri");
      document.body.classList.remove("in-ingresso");
      try { sessionStorage.setItem("fm-visto", "1"); } catch (e) {}
    }, 1300);
    setTimeout(function () { s.remove(); m.remove(); }, 2500);
  }

  /* ── 11. SETTORI CHE SCORRONO DI LATO ───────────────────────────────
     La sezione resta agganciata e la fila si sposta in orizzontale in
     proporzione a quanto hai sceso. L'altezza della sezione e' calcolata
     sulla larghezza da percorrere: cosi' il movimento finisce esattamente
     quando la sezione finisce.                                        */
  function orizzontale() {
    var oriz = document.querySelector(".oriz");
    if (!oriz || FERMO || window.innerWidth <= 820) return;
    var fila = oriz.querySelector(".oriz-fila");
    if (!fila) return;

    var corsa = 0;
    function misura() {
      corsa = Math.max(0, fila.scrollWidth - window.innerWidth);
      oriz.style.height = (window.innerHeight + corsa) + "px";
    }
    var pendente = false;
    function muovi() {
      var r = oriz.getBoundingClientRect();
      var avanzamento = Math.min(Math.max(-r.top / (oriz.offsetHeight - window.innerHeight), 0), 1);
      fila.style.transform = "translate3d(" + (-avanzamento * corsa) + "px,0,0)";
      pendente = false;
    }
    addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(muovi); }
    }, { passive: true });
    addEventListener("resize", function () { misura(); muovi(); });
    misura(); muovi();
  }

  document.addEventListener("DOMContentLoaded", function () { sipario(); orizzontale(); });
})();

/* =====================================================================
   QUARTO LIVELLO
     12. passaggio morbido fra le pagine
     13. la frase grande cresce mentre scorri
     14. alone luminoso che segue il cursore sulle sezioni scure
   ===================================================================== */
(function () {
  "use strict";
  var FERMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOCCO = window.matchMedia("(pointer: coarse)").matches;

  /* ── 12. PASSAGGIO FRA PAGINE ──────────────────────────────────────
     Intercetta solo i link interni normali: mai i tasti speciali, mai
     i link esterni, mai il telefono o WhatsApp.                       */
  function passaggio() {
    if (FERMO) return;
    var velo = document.createElement("div");
    velo.className = "velo-uscita";
    document.body.appendChild(velo);

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (!/\.html$/.test(href) || href.indexOf("//") > -1) return;
      e.preventDefault();
      velo.classList.add("su");
      setTimeout(function () { location.href = href; }, 430);
    });

    // tornando indietro il velo non deve restare alzato
    addEventListener("pageshow", function () { velo.classList.remove("su"); });
  }

  /* ── 13. LA FRASE GRANDE CRESCE ─────────────────────────────────── */
  function manifestoVivo() {
    if (FERMO) return;
    var m = document.querySelector(".manifesto");
    if (!m) return;
    var pendente = false;
    function calcola() {
      var r = m.getBoundingClientRect();
      var centro = window.innerHeight / 2;
      var d = Math.abs(r.top + r.height / 2 - centro) / window.innerHeight;
      var s = 1 + Math.max(0, .055 - d * .075);      // massimo +5,5%
      m.style.transform = "scale(" + s + ")";
      m.style.transformOrigin = "left center";
      pendente = false;
    }
    addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(calcola); }
    }, { passive: true });
    calcola();
  }

  /* ── 14. ALONE CHE SEGUE IL CURSORE ─────────────────────────────── */
  function aloneLuce() {
    if (FERMO || TOCCO) return;
    var a = document.createElement("div");
    a.className = "alone";
    document.body.appendChild(a);
    var x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      // si accende solo sulle sezioni scure, dove ha senso
      var sotto = document.elementFromPoint(e.clientX, e.clientY);
      var scuro = sotto && sotto.closest(".dark,.hero-full,.cta-strip,footer");
      document.body.classList.toggle("alone-on", !!scuro);
    });
    (function segui() {
      x += (tx - x) * .1; y += (ty - y) * .1;
      a.style.transform = "translate3d(" + (x - 210) + "px," + (y - 210) + "px,0)";
      requestAnimationFrame(segui);
    })();
  }

  document.addEventListener("DOMContentLoaded", function () {
    passaggio(); manifestoVivo(); aloneLuce();
  });
})();

/* =====================================================================
   QUINTO LIVELLO
     15. la torcia: il cursore rivela il video sotto il velo
   ===================================================================== */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.addEventListener("DOMContentLoaded", function () {
    var hero = document.querySelector(".hero-full");
    if (!hero) return;

    var luce = document.createElement("div");
    luce.className = "torcia";
    hero.insertBefore(luce, hero.querySelector(".wrap"));

    var x = 0, y = 0, tx = 0, ty = 0, r = 0, tr = 0, dentro = false;

    hero.addEventListener("pointerenter", function () {
      dentro = true; tr = 300; hero.classList.add("torcia-on");
    });
    hero.addEventListener("pointerleave", function () {
      dentro = false; tr = 0; hero.classList.remove("torcia-on");
    });
    hero.addEventListener("pointermove", function (e) {
      var b = hero.getBoundingClientRect();
      tx = e.clientX - b.left; ty = e.clientY - b.top;
      if (!dentro) { x = tx; y = ty; }
    });

    (function anima() {
      // inseguimento morbido: la torcia arriva un attimo dopo la mano
      x += (tx - x) * .14; y += (ty - y) * .14; r += (tr - r) * .09;
      hero.style.setProperty("--tx", x + "px");
      hero.style.setProperty("--ty", y + "px");
      hero.style.setProperty("--tr", r + "px");
      requestAnimationFrame(anima);
    })();
  });
})();

/* =====================================================================
   TELEFONO — quello che col dito funziona meglio che col mouse
     16. barra in basso a portata di pollice
     17. pallini del carosello dei settori
     18. onda al tocco
     19. blocco dello scorrimento a menu aperto
   ===================================================================== */
(function () {
  "use strict";
  if (!window.matchMedia("(max-width: 820px)").matches) return;
  var FERMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 16. BARRA DEL POLLICE ──────────────────────────────────────────
     Le due azioni che contano dove il pollice arriva da solo. Si ritira
     mentre leggi scendendo, torna appena risali: non ruba spazio.     */
  function barraPollice() {
    if (document.querySelector(".barra-pollice")) return;
    var b = document.createElement("div");
    b.className = "barra-pollice";
    b.innerHTML =
      '<a class="b-prev" href="contatti.html">Richiedi un preventivo</a>' +
      '<a class="b-wa" data-wa aria-label="Scrivici su WhatsApp">' +
      '<svg viewBox="0 0 32 32"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2c1.8 1 3.9 1.5 6 1.5 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.7c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.4 1.2 1.2-4.3-.3-.4a10 10 0 0 1-1.6-5.5C5.2 9.6 10 5 16 5s10.8 4.6 10.8 10.5S22 25.7 16 25.7zm5.9-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.5 8.5 0 0 1-4.2-3.7c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.6s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4a4 4 0 0 0-1.2 3c0 1.8 1.3 3.5 1.5 3.7.2.3 2.6 4 6.3 5.5 2.3 1 3.2 1.1 4.4.9.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg></a>';
    document.body.appendChild(b);

    // site.js riempie i link WhatsApp al caricamento: questo arriva dopo
    var wa = b.querySelector("[data-wa]");
    var modello = document.querySelector("a[data-wa][href]");
    if (modello) { wa.href = modello.href; wa.target = "_blank"; wa.rel = "noopener"; }

    if (FERMO) return;
    var ultimo = window.scrollY, pendente = false;
    function guarda() {
      var y = window.scrollY;
      // si nasconde solo scendendo, e solo dopo il primo schermo
      b.classList.toggle("giu", y > ultimo + 6 && y > window.innerHeight * .6);
      ultimo = y; pendente = false;
    }
    addEventListener("scroll", function () {
      if (!pendente) { pendente = true; requestAnimationFrame(guarda); }
    }, { passive: true });
  }

  /* ── 17. PALLINI DEL CAROSELLO ──────────────────────────────────── */
  function pallini() {
    var fila = document.querySelector(".oriz-fila");
    if (!fila) return;
    var schede = fila.querySelectorAll(".blocco");
    if (schede.length < 2) return;

    var p = document.createElement("div");
    p.className = "oriz-punti";
    schede.forEach(function () { p.appendChild(document.createElement("i")); });
    fila.parentNode.appendChild(p);
    var punti = p.querySelectorAll("i");
    punti[0].classList.add("qui");

    var pendente = false;
    fila.addEventListener("scroll", function () {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () {
        var i = Math.round(fila.scrollLeft / (fila.scrollWidth / schede.length));
        i = Math.max(0, Math.min(schede.length - 1, i));
        punti.forEach(function (n, k) { n.classList.toggle("qui", k === i); });
        pendente = false;
      });
    }, { passive: true });
  }

  /* ── 18. ONDA AL TOCCO ──────────────────────────────────────────── */
  function onda() {
    if (FERMO) return;
    document.querySelectorAll(".blocco,.settore-riga,.voce").forEach(function (el) {
      el.addEventListener("pointerdown", function (e) {
        var r = el.getBoundingClientRect();
        var o = document.createElement("span");
        o.className = "onda";
        var d = Math.max(r.width, r.height) * 2.2;
        o.style.width = o.style.height = d + "px";
        o.style.left = (e.clientX - r.left) + "px";
        o.style.top = (e.clientY - r.top) + "px";
        el.appendChild(o);
        setTimeout(function () { o.remove(); }, 640);
      });
    });
  }

  /* ── 19. MENU A TUTTO SCHERMO: blocca lo scorrimento dietro ─────── */
  function menuPieno() {
    var burger = document.getElementById("burger");
    var menu = document.getElementById("menu");
    if (!burger || !menu) return;
    // site.js gia' apre/chiude: qui aggiungo solo il blocco dello sfondo
    new MutationObserver(function () {
      document.body.classList.toggle("menu-aperto", menu.classList.contains("open"));
      burger.textContent = menu.classList.contains("open") ? "✕" : "☰";
    }).observe(menu, { attributes: true, attributeFilter: ["class"] });
    // chiudendo con un link il menu deve sparire
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) menu.classList.remove("open");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    barraPollice(); pallini(); onda(); menuPieno();
  });
})();
