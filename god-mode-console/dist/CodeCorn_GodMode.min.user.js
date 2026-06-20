const _GM_getValue = "undefined" != typeof GM_getValue ? GM_getValue : null,
  _GM_setValue = "undefined" != typeof GM_setValue ? GM_setValue : null,
  _GM_setClipboard =
    "undefined" != typeof GM_setClipboard ? GM_setClipboard : null,
  _GM_info = "undefined" != typeof GM_info ? GM_info : null,
  _unsafeWindow = "undefined" != typeof unsafeWindow ? unsafeWindow : null,
  _html2canvas = "undefined" != typeof html2canvas ? html2canvas : null;
(() => {
  "use strict";
  if (window.location.hostname.includes("chatgpt.com")) return;
  const e = {
    wpCustomizerControls: {
      selector:
        "#customize-controls, .wp-full-overlay-sidebar, #sub-accordion-panel-widgets",
      stopUI: !0,
      stopTools: !0,
    },
    wpAdminBar: { selector: "#wpadminbar", stopUI: !1, stopTools: !0 },
  };
  function t(t, o) {
    if (!t) return !1;
    for (const n in e) {
      const c = e[n];
      if (c[o] && (t.matches(c.selector) || t.closest(c.selector))) return !0;
    }
    return !1;
  }
  const o = "__cc_console_capture_logs_v4__",
    n = "__cc_godmode_settings_global__",
    c = {
      gap: 6,
      edgeOffset: 10,
      autoHide: !1,
      autoHideMs: 3e3,
      autoShowMs: 400,
      hoverZone: 40,
      maxLogs: 1500,
      blockClear: !1,
      networkSpy: !0,
      toolbarPosIdx: 0,
      toolbarVisible: !0,
      iframePropagation: !0,
    };
  let a = { ...c };
  try {
    const e = _GM_getValue
      ? _GM_getValue(n, null)
      : window.localStorage.getItem(n);
    if (e) {
      const t = JSON.parse(e);
      a = { ...c, ...t };
    }
  } catch (e) {}
  function i() {
    try {
      _GM_setValue
        ? _GM_setValue(n, JSON.stringify(a))
        : window.localStorage.setItem(n, JSON.stringify(a));
    } catch (e) {}
  }
  const r = { ctrlKey: !0, shiftKey: !0, code: "KeyX" },
    l = { ctrlKey: !0, shiftKey: !0, code: "KeyH" },
    s = { ctrlKey: !0, shiftKey: !0, code: "KeyB" },
    d = { ctrlKey: !0, shiftKey: !0, code: "KeyS" },
    p = { ctrlKey: !0, shiftKey: !0, code: "KeyE" },
    u = { ctrlKey: !0, shiftKey: !0, code: "KeyL" },
    f = { ctrlKey: !0, shiftKey: !0, code: "KeyM" },
    m = { ctrlKey: !0, shiftKey: !0, code: "KeyI" },
    h = { ctrlKey: !0, shiftKey: !0, code: "KeyJ" },
    g = { ctrlKey: !0, shiftKey: !0, code: "KeyO" },
    y = [],
    b = _unsafeWindow || window,
    x = b.console,
    _ = {
      log: x.log.bind(x),
      info: x.info.bind(x),
      warn: x.warn.bind(x),
      error: x.error.bind(x),
      debug: x.debug ? x.debug.bind(x) : x.log.bind(x),
      clear: x.clear ? x.clear.bind(x) : null,
    };
  function C(e) {
    const t = new Date(),
      o = (e) => e.toString().padStart(2, "0"),
      n = `${o(t.getDate())}/${o(t.getMonth() + 1)}/${t.getFullYear()} ${o(t.getHours())}:${o(t.getMinutes())}:${o(t.getSeconds())}`;
    _.info(
      `%c Code %c Corn %c [${n}] ${e}`,
      "background: #ffd700; color: #000; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 900; font-family: sans-serif;",
      "background: #000; color: #ffd700; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: 900; font-family: sans-serif;",
      "color: #94a3b8; font-family: monospace; font-size: 13px; margin-left: 8px;",
    );
  }
  function v() {
    try {
      return JSON.parse(b.localStorage.getItem(o) || "[]") || [];
    } catch {
      return [];
    }
  }
  function w(e, t = 0, o = new WeakSet()) {
    if (t > 15) return "[MaxDepth]";
    if (null == e) return String(e);
    if ("object" != typeof e && "function" != typeof e)
      return "bigint" == typeof e ? `${e}n` : e;
    if ("function" == typeof e) return `[Function: ${e.name || "anonymous"}]`;
    if (e instanceof Error)
      return { type: "Error", name: e.name, message: e.message };
    if (e instanceof Date) return e.toISOString();
    if (void 0 !== b.HTMLElement && e instanceof b.HTMLElement)
      return `[DOM Element: ${e.tagName}]`;
    if (o.has(e)) return "[Circular]";
    if ((o.add(e), Array.isArray(e))) return e.map((e) => w(e, t + 1, o));
    const n = {};
    for (const a of ((c = e),
    "[object Object]" === Object.prototype.toString.call(c)
      ? Object.keys(e)
      : Object.getOwnPropertyNames(e)))
      try {
        n[a] = w(e[a], t + 1, o);
      } catch (e) {
        n[a] = "[Error]";
      }
    var c;
    return n;
  }
  function E(e, t) {
    const n = {
      ts: new Date().toISOString(),
      url: b.location.href,
      method: e,
      args: Array.from(t).map((e) => w(e)),
    };
    y.push(n);
    const c = v();
    (c.push(n),
      (function (e) {
        try {
          b.localStorage.setItem(o, JSON.stringify(e.slice(-a.maxLogs)));
        } catch (e) {
          _.warn("[CC] History save failed", e);
        }
      })(c));
  }
  function S(e, t = !1) {
    const o = document.createElement("div");
    ((o.textContent = e),
      (o.style.cssText = `\n            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);\n            background: ${t ? "#dc2626" : "#16a34a"}; color: white;\n            padding: 10px 20px; border-radius: 8px; font-family: monospace; font-size: 14px;\n            z-index: 2147483647; box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n            transition: opacity 0.3s; pointer-events: none;\n        `),
      document.documentElement.appendChild(o),
      setTimeout(() => {
        ((o.style.opacity = "0"),
          setTimeout(() => {
            o.remove();
          }, 300));
      }, 2500));
  }
  (["log", "info", "warn", "error", "debug"].forEach((e) => {
    if (x[e]) {
      const t = (...t) => {
        (E(e, t), _[e].apply(_, t));
      };
      x[e] = t;
    }
  }),
    x.clear &&
      (x.clear = (...e) => {
        if (a.blockClear)
          return (
            C("🛡️ Console.clear() bloccato dal God Mode."),
            void E("clear_blocked", e)
          );
        (E("clear", e), _.clear && _.clear.apply(_, e));
      }));
  const k = b.fetch;
  b.fetch = async (...e) => {
    a.networkSpy && E("fetch (req)", e);
    try {
      const t = await k.apply(b, e);
      return (
        a.networkSpy && E("fetch (res)", [{ url: t.url, status: t.status }]),
        t
      );
    } catch (e) {
      throw (a.networkSpy && E("fetch (err)", [e]), e);
    }
  };
  const T = b.XMLHttpRequest.prototype.open;
  b.XMLHttpRequest.prototype.open = function (...e) {
    return ((this._cc_url = e[1]), T.apply(this, e));
  };
  const M = b.XMLHttpRequest.prototype.send;
  function $(e, t) {
    const o = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        url: b.location.href,
        type: t,
        data: e,
      },
      null,
      2,
    );
    try {
      if (!_GM_setClipboard) throw new Error("GM_setClipboard missing");
      (_GM_setClipboard(o, "text"), S(`✅ [${t}] Copiato!`));
    } catch (e) {
      navigator.clipboard
        .writeText(o)
        .then(() => {
          S(`✅ [${t}] Copiato!`);
        })
        .catch(() => {
          (S("❌ Errore copia", !0), _.error(o));
        });
    }
  }
  b.XMLHttpRequest.prototype.send = function (...e) {
    return (
      a.networkSpy &&
        (E("xhr (req)", [this._cc_url, e[0]]),
        this.addEventListener("load", () => {
          E("xhr (res)", [{ url: this._cc_url, status: this.status }]);
        })),
      M.apply(this, e)
    );
  };
  const z = () => {
      $(y, "Current Console");
    },
    I = () => {
      $(v(), "Full History");
    },
    D = () => {
      $(
        {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          cookie: document.cookie,
        },
        "State Dump",
      );
    };
  b.ccCopy = function (e) {
    const t = w(e),
      o = "object" == typeof t ? JSON.stringify(t, null, 2) : String(t);
    try {
      if (!_GM_setClipboard) throw new Error("GM missing");
      (_GM_setClipboard(o, "text"), S("✅ Dato copiato in clipboard!"));
    } catch (e) {
      navigator.clipboard
        .writeText(o)
        .then(() => {
          S("✅ Dato copiato in clipboard!");
        })
        .catch(() => {
          (S("❌ Errore copia clipboard", !0), _.error(o));
        });
    }
    return (C("📝 Eseguito ccCopy(). Guarda la clipboard."), _.log(e), e);
  };
  const H = (e, t) => {
    const o = document.createElement("a");
    ((o.download = `${t}_${(() => {
      const e = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }),
        ),
        t = (e) => e.toString().padStart(2, "0");
      return `${e.getFullYear()}${t(e.getMonth() + 1)}${t(e.getDate())}_${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}`;
    })()}.png`),
      (o.href = e.toDataURL()),
      o.click(),
      S(`📸 ${o.download}`));
  };
  async function L() {
    if (!_html2canvas) return S("❌ html2canvas non caricato", !0);
    S("📸 Screenshot in corso...");
    try {
      const e = await _html2canvas(document.body, { useCORS: !0, logging: !1 });
      H(e, "screenshot");
    } catch (e) {
      S("❌ Errore Screenshot", !0);
    }
  }
  let N = "none",
    O = null,
    K = null,
    G = null,
    A = [],
    j = null,
    B = [];
  function R() {
    ((N = "none"),
      O && O.remove(),
      K && K.remove(),
      B.forEach((e) => {
        e.remove();
      }),
      (B = []),
      (A = []),
      (j = null),
      document.removeEventListener("mousemove", V),
      document.removeEventListener("click", J, { capture: !0 }));
  }
  function P(e, t) {
    ("none" !== N && R(), (N = e));
    let o = "rgba(14, 165, 233, 0.2)",
      n = "#0ea5e9";
    ("thanos" === e && ((o = "rgba(239, 68, 68, 0.2)"), (n = "#ef4444")),
      "sniffer" === e && ((o = "rgba(217, 70, 239, 0.2)"), (n = "#d946ef")),
      "monitor" === e && ((o = "rgba(245, 158, 11, 0.2)"), (n = "#f59e0b")),
      "inspector" === e &&
        (t += " (Tieni premuto SHIFT per multi-selezione/area)"),
      S(t),
      (O = document.createElement("div")),
      (O.style.cssText = `position: fixed; pointer-events: none; z-index: 2147483645; transition: all 0.05s linear; background: ${o}; outline: 2px solid ${n};`),
      (K = document.createElement("div")),
      (K.style.cssText =
        "position: fixed; background: #0f172a; color: #fff; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; z-index: 2147483646; pointer-events: none; border: 1px solid #334155; display: none; white-space: pre-wrap;"),
      document.body.appendChild(O),
      document.body.appendChild(K),
      document.addEventListener("mousemove", V),
      document.addEventListener("click", J, { capture: !0 }));
  }
  function X(e) {
    if (!e || 0 === e.length) return null;
    if (1 === e.length) return e[0];
    const t = [];
    let o = e[0];
    for (; o; ) (t.push(o), (o = o.parentElement));
    for (let o of t) {
      let t = !0;
      for (let n = 1; n < e.length; n++)
        if (!o.contains(e[n])) {
          t = !1;
          break;
        }
      if (t) return o;
    }
    return document.body;
  }
  function F(e, t, o, n) {
    const c = document.createElement("span");
    return (n && (c.style.color = n), (c.textContent = o), e.appendChild(c), c);
  }
  function V(e) {
    const o = e.target;
    if (
      o &&
      (o.closest("#__cc_sidebar__") ||
        o.closest("#__cc_backdrop__") ||
        o === document.body ||
        o === document.documentElement ||
        t(o, "stopTools"))
    )
      return (
        0 === A.length &&
          O &&
          K &&
          ((O.style.display = "none"), (K.style.display = "none")),
        void (G = null)
      );
    G = o;
    let n = o,
      c = !1;
    if ("inspector" === N && A.length > 0 && o) {
      ((n = X([...A, o]) || o), (c = !0));
    }
    if (n && O && K) {
      const t = n.getBoundingClientRect();
      if (
        (c
          ? ((O.style.background = "rgba(34, 197, 94, 0.2)"),
            (O.style.outline = "2px solid #22c55e"))
          : "inspector" === N &&
            ((O.style.background = "rgba(14, 165, 233, 0.2)"),
            (O.style.outline = "2px solid #0ea5e9")),
        (O.style.display = "block"),
        (O.style.width = `${t.width}px`),
        (O.style.height = `${t.height}px`),
        (O.style.top = `${t.top}px`),
        (O.style.left = `${t.left}px`),
        (K.style.display = "block"),
        (K.style.top = `${e.clientY + 15}px`),
        (K.style.left = `${e.clientX + 15}px`),
        (K.textContent = ""),
        F(K, 0, n.tagName.toLowerCase(), "#f43f5e"),
        n.id && F(K, 0, `#${n.id}`, "#38bdf8"),
        n.className && F(K, 0, `.${n.className.replace(/ /g, ".")}`, "#a3e635"),
        K.appendChild(document.createElement("br")),
        F(K, 0, `${Math.round(t.width)}x${Math.round(t.height)}`, "#94a3b8"),
        c)
      ) {
        (K.appendChild(document.createElement("br")),
          F(K, 0, `📦 Area Contenitore (Elementi: ${A.length + 1})`, "#fbbf24"),
          K.appendChild(document.createElement("br")));
        F(
          K,
          0,
          "(Rilascia SHIFT e clicca per catturare)",
          "#cbd5e1",
        ).style.fontSize = "10px";
      }
    }
  }
  async function J(e) {
    const o = G || e.target;
    if (o && t(o, "stopTools")) return;
    (e.preventDefault(), e.stopPropagation());
    const n = N;
    if (o && o !== document.body) {
      if ("inspector" === n) {
        if (e.shiftKey)
          return void (
            A.includes(o) ||
            (A.push(o),
            (function (e) {
              const t = document.createElement("div");
              ((t.style.cssText = `position: fixed; pointer-events: none; z-index: 2147483644; background: rgba(250, 204, 21, 0.3); outline: 1px dashed #facc15; top: ${e.top}px; left: ${e.left}px; width: ${e.width}px; height: ${e.height}px;`),
                document.body.appendChild(t),
                B.push(t));
            })(o.getBoundingClientRect()),
            S(`📍 Elemento aggiunto (${A.length}). Continua o rilascia SHIFT.`))
          );
        {
          let e = o;
          (A.length > 0 && (A.push(o), (e = X(A) || o)),
            R(),
            S(
              A.length > 0
                ? "📸 Cattura Area Multipla..."
                : "📸 Cattura elemento singolo...",
            ));
          try {
            if (!_html2canvas) throw new Error("html2canvas err");
            const t = await _html2canvas(e, {
              useCORS: !0,
              logging: !1,
              backgroundColor: null,
            });
            H(t, A.length > 0 ? "area_multipla" : "element");
          } catch (e) {
            (S("❌ Errore cattura", !0), _.error(e));
          }
          return;
        }
      }
      if ((R(), "thanos" === n)) (o.remove(), S("💥 Elemento distrutto!"));
      else if ("sniffer" === n) {
        const e = window.getComputedStyle(o),
          t = [
            "color",
            "background-color",
            "font-family",
            "font-size",
            "font-weight",
            "line-height",
            "padding",
            "margin",
            "display",
            "width",
            "height",
            "border",
            "border-radius",
            "box-shadow",
          ];
        let n = {
          element: o.tagName.toLowerCase(),
          id: o.id,
          class: o.className,
        };
        (t.forEach((t) => {
          const o = e.getPropertyValue(t);
          o && "none" !== o && "0px" !== o && (n[t] = o);
        }),
          b.ccCopy && b.ccCopy(n));
      } else if ("monitor" === n) {
        const e = o.id
          ? `#${o.id}`
          : o.className
            ? `.${o.className.split(" ")[0]}`
            : `<${o.tagName.toLowerCase()}>`;
        (["click", "input", "change", "keydown", "focus", "blur"].forEach(
          (t) => {
            o.addEventListener(t, (o) => {
              const n = o.target;
              (C(`🎧 Monitor [${t}]: ${e} -> Valore: ${n.value || "N/A"}`),
                E("event_monitor", [{ event: t, target: e, value: n.value }]));
            });
          },
        ),
          S(`🎧 Monitor avviato su ${e}`));
      }
    } else R();
  }
  const q = () =>
      "inspector" === N ? R() : P("inspector", "🔍 Clicca per fotografare"),
    U = () =>
      "thanos" === N
        ? R()
        : P("thanos", "💥 Seleziona per distruggere (Esc annulla)"),
    W = () =>
      "sniffer" === N
        ? R()
        : P(
            "sniffer",
            "🎨 Seleziona elemento per copiare il CSS (Esc annulla)",
          ),
    Y = () =>
      "monitor" === N
        ? R()
        : P("monitor", "🎧 Seleziona elemento da monitorare (Esc annulla)");
  let Z = !1;
  function Q() {
    Z = !Z;
    let e = document.getElementById("__cc_xray__");
    Z
      ? (e ||
          ((e = document.createElement("style")),
          (e.id = "__cc_xray__"),
          (e.textContent =
            "* { outline: 1px solid rgba(255, 0, 0, 0.4) !important; background: rgba(0, 0, 0, 0.02) !important; }\n                                     #customize-controls *, .wp-full-overlay-sidebar *, #wpadminbar * { outline: none !important; background: transparent !important; }"),
          document.head.appendChild(e)),
        S("🩻 X-Ray Attivato"))
      : (e && e.remove(), S("🩻 X-Ray Disattivato"));
  }
  let ee = !1;
  function te() {
    ee = !ee;
    let e = document.getElementById("__cc_seo__");
    ee
      ? (e ||
          ((e = document.createElement("style")),
          (e.id = "__cc_seo__"),
          (e.textContent =
            '\n                    h1 { outline: 4px solid #16a34a !important; background: rgba(22, 163, 74, 0.2) !important; }\n                    h2 { outline: 3px solid #84cc16 !important; background: rgba(132, 204, 22, 0.2) !important; }\n                    img:not([alt]), img[alt=""] { outline: 4px dashed #dc2626 !important; filter: sepia(1) hue-rotate(300deg) saturate(100) !important; }\n                    a[href="#"], a:not([href]) { outline: 3px dotted #9333ea !important; background: rgba(147, 51, 234, 0.2) !important; }\n                '),
          document.head.appendChild(e)),
        S("🕷️ SEO/A11y Scanner Attivato"))
      : (e && e.remove(), S("🕷️ SEO/A11y Scanner Disattivato"));
  }
  function oe() {
    confirm(
      "☢️ ATTENZIONE! Vuoi piallare LocalStorage, SessionStorage, Cookie e ricaricare la pagina?",
    ) &&
      (window.localStorage.clear(),
      window.sessionStorage.clear(),
      document.cookie.split(";").forEach((e) => {
        document.cookie = e
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      }),
      C("☢️ Nuke Session completato. Ricaricamento..."),
      window.location.reload());
  }
  function ne() {
    let e = { images: [], videos: [], audio: [] };
    (document.querySelectorAll("img, picture source").forEach((t) => {
      const o = t;
      let n = o.src || o.srcset;
      n && n.startsWith("http") && e.images.push(n);
    }),
      document.querySelectorAll("video, video source").forEach((t) => {
        let o = t.src;
        o && o.startsWith("http") && e.videos.push(o);
      }),
      document.querySelectorAll("audio, audio source").forEach((t) => {
        let o = t.src;
        o && o.startsWith("http") && e.audio.push(o);
      }),
      (e.images = [...new Set(e.images)]),
      (e.videos = [...new Set(e.videos)]),
      (e.audio = [...new Set(e.audio)]),
      b.ccCopy && b.ccCopy(e));
  }
  let ce = !1,
    ae = null,
    ie = 0,
    re = performance.now();
  function le() {
    if (((ce = !ce), ce)) {
      function e() {
        if (!ce) return;
        ie++;
        let t = performance.now();
        if (t - re >= 1e3) {
          let e = Math.round((1e3 * ie) / (t - re));
          ((ie = 0), (re = t));
          let o = document.querySelectorAll("*").length;
          const n = performance;
          let c = n.memory
            ? (n.memory.usedJSHeapSize / 1048576).toFixed(1) + " MB"
            : "N/A";
          ae &&
            ((ae.textContent = ""),
            F(ae, 0, "FPS: ", "#a3e635"),
            ae.appendChild(document.createTextNode(`${e} `)),
            ae.appendChild(document.createElement("br")),
            F(ae, 0, "DOM: ", "#fbbf24"),
            ae.appendChild(document.createTextNode(`${o} nodi `)),
            ae.appendChild(document.createElement("br")),
            F(ae, 0, "RAM: ", "#c084fc"),
            ae.appendChild(document.createTextNode(c)));
        }
        requestAnimationFrame(e);
      }
      ((ae = document.createElement("div")),
        (ae.style.cssText =
          "position: fixed; top: 10px; right: 10px; background: rgba(15, 23, 42, 0.85); color: #38bdf8; padding: 12px 15px; border-radius: 8px; font-family: monospace; z-index: 2147483647; pointer-events: none; border: 1px solid #334155; font-size: 13px; line-height: 1.5; backdrop-filter: blur(4px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);"),
        document.body.appendChild(ae),
        e(),
        S("📊 HUD Performance Attivato"));
    } else (ae && ae.remove(), S("📊 HUD Performance Disattivato"));
  }
  const se = ["left", "top", "right", "bottom"];
  let de = a.toolbarPosIdx,
    pe = null,
    ue = null,
    fe = a.toolbarVisible;
  function me(e) {
    if (!e) return;
    const t = se[de],
      o = `${a.edgeOffset}px`;
    ((e.style.left = ""),
      (e.style.right = ""),
      (e.style.top = ""),
      (e.style.bottom = ""));
    let n = "";
    switch (t) {
      case "left":
        ((e.style.left = o),
          (e.style.top = "50%"),
          (n = "translateY(-50%)"),
          (e.style.flexDirection = "column"));
        break;
      case "top":
        ((e.style.top = o),
          (e.style.left = "50%"),
          (n = "translateX(-50%)"),
          (e.style.flexDirection = "row"));
        break;
      case "right":
        ((e.style.right = o),
          (e.style.top = "50%"),
          (n = "translateY(-50%)"),
          (e.style.flexDirection = "column"));
        break;
      case "bottom":
        ((e.style.bottom = o),
          (e.style.left = "50%"),
          (n = "translateX(-50%)"),
          (e.style.flexDirection = "row"));
    }
    ((e.dataset.baseTransform = n),
      (e.dataset.pos = t),
      fe
        ? ((e.style.transform = n),
          (e.style.opacity = "1"),
          (e.style.pointerEvents = "auto"),
          (e.style.filter = "blur(0px)"))
        : ((e.style.transform = `${n} scale(0.85)`),
          (e.style.opacity = "0"),
          (e.style.pointerEvents = "none"),
          (e.style.filter = "blur(4px)")));
  }
  function he(e) {
    const t = document.getElementById("__cc_sidebar__");
    t && ((fe = e), (a.toolbarVisible = e), i(), me(t));
  }
  function ge(e) {
    const t = e || document.getElementById("__cc_sidebar__");
    t && ((t.style.gap = `${a.gap}px`), me(t));
  }
  function ye() {
    clearTimeout(pe);
    const e = document.getElementById("__cc_backdrop__");
    a.autoHide &&
      fe &&
      !e &&
      (pe = setTimeout(() => {
        he(!1);
      }, a.autoHideMs));
  }
  function be() {
    (he(!fe),
      S(fe ? "👀 Toolbar mostrata" : "🙈 Toolbar nascosta"),
      fe && ye());
  }
  function xe() {
    if (!fe) return S("⚠️ La toolbar deve essere visibile per spostarla!", !0);
    ((de = (de + 1) % se.length),
      (a.toolbarPosIdx = de),
      i(),
      me(document.getElementById("__cc_sidebar__")),
      S(`🔀 Toolbar a: ${se[de].toUpperCase()}`),
      ye());
  }
  function _e() {
    const e = document.getElementById("__cc_backdrop__");
    (e && e.remove(), ye());
  }
  function Ce(e, t, o, n = "380px") {
    if (document.getElementById("__cc_backdrop__")) return _e();
    clearTimeout(pe);
    const c = (function () {
      const e = document.createElement("div");
      return (
        (e.id = "__cc_backdrop__"),
        (e.style.cssText =
          "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(6px); z-index: 2147483646; display: flex; align-items: center; justify-content: center;"),
        e
      );
    })();
    c.onclick = (e) => {
      e.target === c && _e();
    };
    const a = document.createElement("div");
    a.style.cssText = `background: #0f172a; color: #f8fafc; padding: 25px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); font-family: system-ui, sans-serif; min-width: ${n}; max-width: 90vw; max-height: 90vh; overflow-y: auto; border: 1px solid #334155; cursor: default; display: flex; flex-direction: column; gap: 15px;`;
    const i = document.createElement("div");
    i.style.cssText = `display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: ${"750px" === n ? "15px" : "0"};`;
    const r = document.createElement("h2");
    ((r.style.cssText = "margin: 0; font-size: 18px; color: #ffd700;"),
      (r.textContent = e));
    const l = document.createElement("button");
    ((l.style.cssText =
      "background: none; border: none; color: #ef4444; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;"),
      (l.textContent = "×"),
      (l.onclick = _e),
      i.appendChild(r),
      i.appendChild(l),
      a.appendChild(i),
      a.appendChild(t),
      c.appendChild(a),
      document.body.appendChild(c),
      o && o(a));
  }
  function ve(e, t, o) {
    const n = document.createElement("label");
    return (
      (n.style.cssText =
        "display: flex; justify-content: space-between; align-items: center;"),
      o && (n.title = o),
      n.appendChild(document.createTextNode(e)),
      n.appendChild(t),
      n
    );
  }
  function we() {
    const e = document.createElement("div");
    e.style.cssText =
      "display: grid; grid-template-columns: 1fr 1fr; gap: 30px;";
    const t = document.createElement("div");
    t.style.cssText = "display: flex; flex-direction: column; gap: 20px;";
    const o = document.createElement("div"),
      n = document.createElement("h3");
    ((n.style.cssText = "margin: 0 0 10px 0; font-size: 14px; color: #10b981;"),
      (n.textContent = "⌨️ Shortcuts"),
      o.appendChild(n));
    const c = document.createElement("div");
    c.style.cssText =
      "display: grid; grid-template-columns: auto 1fr; gap: 6px 15px; font-size: 13px; line-height: 1.4;";
    ([
      { key: "Ctrl+Shift+X", desc: "Copia Current Console", color: "#38bdf8" },
      { key: "Ctrl+Shift+H", desc: "Copia Full History", color: "#38bdf8" },
      { key: "Ctrl+Shift+B", desc: "Visibilità Toolbar", color: "#a3e635" },
      { key: "Ctrl+Shift+M", desc: "Sposta Toolbar", color: "#a3e635" },
      { key: "Ctrl+Shift+S", desc: "Full Screenshot", color: "#fbbf24" },
      { key: "Ctrl+Shift+E", desc: "Inspector Elemento", color: "#c084fc" },
      { key: "Ctrl+Shift+L", desc: "X-Ray Layout", color: "#f87171" },
      { key: "Ctrl+Shift+J", desc: "Live Injector", color: "#10b981" },
      { key: "Ctrl+Shift+O", desc: "Apre Power Tools", color: "#8b5cf6" },
      { key: "Esc", desc: "Chiude Modals / Disattiva Tool", color: "#ef4444" },
    ].forEach((e) => {
      const t = document.createElement("b");
      ((t.style.color = e.color), (t.textContent = e.key));
      const o = document.createElement("span");
      ((o.textContent = e.desc), c.appendChild(t), c.appendChild(o));
    }),
      o.appendChild(c),
      t.appendChild(o));
    const r = document.createElement("div");
    r.style.cssText = "border-top: 1px dashed #334155; padding-top: 15px;";
    const l = document.createElement("h3");
    ((l.style.cssText = "margin: 0 0 10px 0; font-size: 14px; color: #10b981;"),
      (l.textContent = "🛠️ API Globali"),
      r.appendChild(l));
    const s = document.createElement("div");
    s.style.cssText =
      "display: flex; flex-direction: column; gap: 6px; font-size: 13px;";
    const d = document.createElement("span"),
      p = document.createElement("code");
    ((p.style.color = "#fbbf24"),
      (p.textContent = "ccCopy(data)"),
      d.appendChild(p),
      d.appendChild(
        document.createTextNode(" - Copia oggetto/array in clipboard."),
      ));
    const u = document.createElement("span"),
      f = document.createElement("code");
    ((f.style.color = "#fbbf24"),
      (f.textContent = "cccg"),
      u.appendChild(f),
      u.appendChild(
        document.createTextNode(" - Oggetto globale dell'estensione."),
      ),
      s.appendChild(d),
      s.appendChild(u),
      r.appendChild(s),
      t.appendChild(r),
      e.appendChild(t));
    const m = document.createElement("div");
    m.style.cssText = "display: flex; flex-direction: column; gap: 20px;";
    const h = document.createElement("div"),
      g = document.createElement("h3");
    ((g.style.cssText = "margin: 0 0 10px 0; font-size: 14px; color: #10b981;"),
      (g.textContent = "⚙️ Impostazioni Barra & Sotto-Frame"),
      h.appendChild(g));
    const y = document.createElement("div");
    y.style.cssText =
      "display: flex; flex-direction: column; gap: 10px; font-size: 13px;";
    const b = (e, t, o, n, c) => {
        const a = document.createElement("input");
        return (
          (a.type = "number"),
          (a.id = e),
          (a.value = t.toString()),
          null !== o && (a.min = o.toString()),
          null !== n && (a.max = n.toString()),
          null !== c && (a.step = c.toString()),
          (a.style.cssText =
            "width: 60px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px; padding:2px 5px;"),
          a
        );
      },
      x = (e, t) => {
        const o = document.createElement("input");
        return ((o.type = "checkbox"), (o.id = e), (o.checked = t), o);
      };
    (y.appendChild(
      ve("Distanza bordo (px): ", b("cc_cfg_edge", a.edgeOffset, 0, 100, null)),
    ),
      y.appendChild(
        ve("Toolbar Gap (px): ", b("cc_cfg_gap", a.gap, 0, 30, null)),
      ),
      y.appendChild(
        ve("Auto-Hide Toolbar: ", x("cc_cfg_autohide", a.autoHide)),
      ));
    const _ = b("cc_cfg_automs", a.autoHideMs, null, null, 500);
    ((_.style.width = "70px"), y.appendChild(ve("Auto-Hide (ms): ", _)));
    const C = b("cc_cfg_showms", a.autoShowMs, null, null, 100);
    ((C.style.width = "70px"),
      y.appendChild(
        ve(
          "Auto-Show (ms): ",
          C,
          "Millisecondi di hover per mostrare la barra",
        ),
      ),
      y.appendChild(
        ve(
          "Hitbox (px): ",
          b("cc_cfg_zone", a.hoverZone, null, null, 5),
          "Profondità dal bordo per auto-show",
        ),
      ),
      y.appendChild(
        ve(
          "Deep Frame X-Ray/Tools: ",
          x("cc_cfg_iframe", a.iframePropagation),
          "Inietta i tool interattivi all'interno dei sotto-iframe (es. Anteprime WP Customizer)",
        ),
      ),
      h.appendChild(y),
      m.appendChild(h));
    const v = document.createElement("div");
    v.style.cssText = "border-top: 1px dashed #334155; padding-top: 15px;";
    const w = document.createElement("h3");
    ((w.style.cssText = "margin: 0 0 10px 0; font-size: 14px; color: #10b981;"),
      (w.textContent = "🛡️ Sistema"),
      v.appendChild(w));
    const E = document.createElement("div");
    ((E.style.cssText =
      "display: flex; flex-direction: column; gap: 10px; font-size: 13px;"),
      E.appendChild(
        ve(
          "Blocca console.clear(): ",
          x("cc_cfg_blockclear", a.blockClear),
          "Impedisce ai siti di usare console.clear()",
        ),
      ),
      E.appendChild(
        ve(
          "Network Spy (Fetch/XHR): ",
          x("cc_cfg_netspy", a.networkSpy),
          "Logga richieste Fetch e XHR",
        ),
      ));
    const S = b("cc_cfg_maxlogs", a.maxLogs, null, null, 500);
    ((S.style.width = "70px"),
      E.appendChild(ve("Max Log History: ", S)),
      v.appendChild(E),
      m.appendChild(v),
      e.appendChild(m),
      Ce(
        "🌽 God Mode Settings",
        e,
        () => {
          const e = (e, t, o = !1) => {
            const n = document.getElementById(e);
            n &&
              (n.onchange = (e) => {
                const n = e.target;
                ((a[t] = o ? n.checked : parseInt(n.value, 10)),
                  i(),
                  ge(),
                  "autoHide" === t
                    ? a.autoHide
                      ? ye()
                      : (clearTimeout(pe), he(!0))
                    : "autoHideMs" === t && ye());
              });
          };
          (e("cc_cfg_edge", "edgeOffset"),
            e("cc_cfg_gap", "gap"),
            e("cc_cfg_autohide", "autoHide", !0),
            e("cc_cfg_automs", "autoHideMs"),
            e("cc_cfg_showms", "autoShowMs"),
            e("cc_cfg_zone", "hoverZone"),
            e("cc_cfg_iframe", "iframePropagation", !0),
            e("cc_cfg_blockclear", "blockClear", !0),
            e("cc_cfg_netspy", "networkSpy", !0),
            e("cc_cfg_maxlogs", "maxLogs"));
        },
        "750px",
      ));
  }
  function Ee() {
    const e = document.createElement("div");
    e.style.cssText = "display: flex; flex-direction: column; gap: 15px;";
    const t = document.createElement("div");
    t.style.cssText = "display: flex; gap: 10px;";
    const o = document.createElement("label");
    o.style.cssText =
      "cursor:pointer; display:flex; align-items:center; gap:5px;";
    const n = document.createElement("input");
    ((n.type = "radio"),
      (n.name = "cc_inj_type"),
      (n.value = "css"),
      (n.checked = !0),
      o.appendChild(n),
      o.appendChild(document.createTextNode(" CSS")));
    const c = document.createElement("label");
    c.style.cssText =
      "cursor:pointer; display:flex; align-items:center; gap:5px;";
    const a = document.createElement("input");
    ((a.type = "radio"),
      (a.name = "cc_inj_type"),
      (a.value = "js"),
      c.appendChild(a),
      c.appendChild(document.createTextNode(" JS")),
      t.appendChild(o),
      t.appendChild(c),
      e.appendChild(t));
    const i = document.createElement("textarea");
    ((i.id = "__cc_inj_code__"),
      (i.spellcheck = !1),
      (i.placeholder = "/* Incolla il codice qui... */"),
      (i.style.cssText =
        "width: 100%; height: 250px; background: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box; outline: none;"),
      e.appendChild(i));
    const r = document.createElement("button");
    ((r.id = "__cc_run_inj__"),
      (r.textContent = "⚡ INIETTA CODICE"),
      (r.style.cssText =
        "background: #10b981; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; transition: 0.2s;"),
      e.appendChild(r),
      Ce(
        "💉 Live Injector",
        e,
        () => {
          const e = document.getElementById("__cc_inj_code__");
          e &&
            e.addEventListener("keydown", function (e) {
              const t = this;
              if ("Tab" === e.key) {
                e.preventDefault();
                const o = t.selectionStart,
                  n = t.selectionEnd,
                  c = "    ";
                ((t.value = t.value.substring(0, o) + c + t.value.substring(n)),
                  (t.selectionStart = t.selectionEnd = o + c.length));
              } else if ("Enter" === e.key) {
                e.preventDefault();
                const o = t.selectionStart,
                  n = (t.value.substring(0, o).split("\n").pop() || "").match(
                    /^\s*/,
                  ),
                  c = n ? n[0] : "";
                ((t.value =
                  t.value.substring(0, o) +
                  "\n" +
                  c +
                  t.value.substring(t.selectionEnd)),
                  (t.selectionStart = t.selectionEnd = o + 1 + c.length));
              }
            });
          const t = document.getElementById("__cc_run_inj__");
          t &&
            ((t.onmouseover = () => {
              t.style.background = "#059669";
            }),
            (t.onmouseout = () => {
              t.style.background = "#10b981";
            }),
            (t.onclick = () => {
              const t = document.querySelector(
                  'input[name="cc_inj_type"]:checked',
                ),
                o = t ? t.value : "js",
                n = e ? e.value.trim() : "";
              if (!n) return S("⚠️ Inserisci del codice!", !0);
              if ("css" === o) {
                const e = document.createElement("style");
                ((e.textContent = n),
                  document.head.appendChild(e),
                  S("🎨 CSS Iniettato!"),
                  _e());
              } else
                try {
                  (new Function(n)(), S("⚙️ JS Eseguito!"), _e());
                } catch (e) {
                  (_.error("[CC Injector]", e), S("❌ Errore JS", !0));
                }
            }));
        },
        "500px",
      ));
  }
  function Se() {
    const e = document.createElement("div"),
      t = document.createElement("div");
    t.style.cssText = "display:grid; grid-template-columns: 1fr 1fr; gap:10px;";
    const o = (e, o, n) => {
      const c = document.createElement("button");
      ((c.id = e),
        (c.style.cssText =
          "width:100%; text-align:left; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:8px; cursor:pointer; font-size:14px; transition:0.2s; display:flex; align-items:center; gap:10px; font-family:system-ui, sans-serif;"),
        (c.textContent = `${o} ${n}`),
        t.appendChild(c));
    };
    (o("pt_nuke", "☢️", "Nuke Session"),
      o("pt_hud", "📊", "Toggle HUD Info"),
      o("pt_asset", "🧲", "Asset Harvester"),
      o("pt_sniffer", "🎨", "Design Sniffer"),
      o("pt_seo", "🕷️", "Toggle SEO Scanner"),
      o("pt_monitor", "🎧", "Event Monitor"),
      e.appendChild(t));
    const n = document.createElement("div");
    ((n.style.cssText =
      "margin-top:10px; font-size:12px; color:#94a3b8; text-align:center;"),
      (n.textContent =
        "I Tool interattivi (Sniffer, Monitor) si chiudono cliccando su un elemento o premendo Esc."),
      e.appendChild(n),
      Ce(
        "🛠️ Power Tools",
        e,
        () => {
          const e = (e, t, o) => {
            const n = document.getElementById(e);
            n &&
              ((n.onmouseover = () => {
                n.style.background = t;
              }),
              (n.onmouseout = () => {
                n.style.background = "#1e293b";
              }),
              (n.onclick = () => {
                (o(), ["pt_sniffer", "pt_monitor"].includes(e) && _e());
              }));
          };
          (e("pt_nuke", "#ef4444", oe),
            e("pt_hud", "#38bdf8", le),
            e("pt_asset", "#8b5cf6", ne),
            e("pt_sniffer", "#d946ef", W),
            e("pt_seo", "#10b981", te),
            e("pt_monitor", "#f59e0b", Y));
        },
        "400px",
      ));
  }
  if (
    (document.addEventListener("mousemove", (e) => {
      if (fe || !a.autoHide)
        return void (ue && (clearTimeout(ue), (ue = null)));
      const t = se[de],
        o = a.hoverZone;
      let n = !1;
      switch (t) {
        case "left":
          n = e.clientX <= o;
          break;
        case "right":
          n = e.clientX >= window.innerWidth - o;
          break;
        case "top":
          n = e.clientY <= o;
          break;
        case "bottom":
          n = e.clientY >= window.innerHeight - o;
      }
      n
        ? ue ||
          (ue = setTimeout(() => {
            (he(!0), ye());
          }, a.autoShowMs))
        : ue && (clearTimeout(ue), (ue = null));
    }),
    (b.cccg = {
      help: we,
      injector: Ee,
      tools: Se,
      toggleUI: be,
      moveUI: xe,
      copyCurrent: z,
      copyHistory: I,
      copyData: b.ccCopy,
      screenshot: L,
      inspector: q,
      thanos: U,
      xray: Q,
      dump: D,
      version: "4.14.0",
      settings: a,
    }),
    _GM_info && _GM_info.script)
  ) {
    const e = _GM_info.script.version;
    e !== b.cccg.version &&
      _.warn(
        `%c [CodeCorn] WARNING: Disallineamento Versione! %c Header TM: ${e} | Core JS: ${b.cccg.version}`,
        "background: #dc2626; color: white; padding: 2px 5px; border-radius: 4px;",
        "color: #dc2626; font-weight: bold;",
      );
  }
  (window.addEventListener(
    "keydown",
    (e) => {
      if ("Escape" === e.key)
        return (
          "none" !== N && R(),
          void (document.getElementById("__cc_backdrop__") && _e())
        );
      if (e.ctrlKey && e.shiftKey)
        switch (e.code) {
          case r.code:
            (e.preventDefault(), z());
            break;
          case l.code:
            (e.preventDefault(), I());
            break;
          case s.code:
            (e.preventDefault(), be());
            break;
          case d.code:
            (e.preventDefault(), L());
            break;
          case p.code:
            (e.preventDefault(), q());
            break;
          case u.code:
            (e.preventDefault(), Q());
            break;
          case f.code:
            (e.preventDefault(), xe());
            break;
          case m.code:
            (e.preventDefault(), we());
            break;
          case h.code:
            (e.preventDefault(), Ee());
            break;
          case g.code:
            (e.preventDefault(), Se());
        }
    },
    !0,
  ),
    (window === window.top || a.iframePropagation) &&
      (window.addEventListener("DOMContentLoaded", () => {
        if (
          t(document.body, "stopUI") ||
          (window.location.pathname.includes("customize.php") &&
            !b.frameworkOverlayLoaded)
        )
          return;
        const e = document.createElement("style");
        ((e.textContent =
          '\n                .__cc-btn { height: 40px; min-width: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: flex-start; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; padding: 0 10px; box-sizing: border-box; outline: none; }\n                .__cc-btn-icon { font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; min-width: 20px; }\n                .__cc-btn-text { max-width: 0; opacity: 0; font-size: 13px; font-weight: 600; font-family: system-ui, sans-serif; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); white-space: nowrap; pointer-events: none; }\n                @media (min-width: 768px) {\n                    /* Orizzontale (Top/Bottom): Si allarga solo il bottone hoverato */\n                    #__cc_sidebar__[data-pos="top"] .__cc-btn:hover,\n                    #__cc_sidebar__[data-pos="bottom"] .__cc-btn:hover { padding-right: 15px; }\n                    #__cc_sidebar__[data-pos="top"] .__cc-btn:hover .__cc-btn-text,\n                    #__cc_sidebar__[data-pos="bottom"] .__cc-btn:hover .__cc-btn-text { max-width: 200px; opacity: 1; margin-left: 8px; }\n\n                    /* Verticale (Left/Right): Si allargano TUTTI i bottoni al passaggio sulla sidebar */\n                    #__cc_sidebar__[data-pos="left"]:hover .__cc-btn,\n                    #__cc_sidebar__[data-pos="right"]:hover .__cc-btn { padding-right: 15px; }\n                    #__cc_sidebar__[data-pos="left"]:hover .__cc-btn .__cc-btn-text,\n                    #__cc_sidebar__[data-pos="right"]:hover .__cc-btn .__cc-btn-text { max-width: 200px; opacity: 1; margin-left: 8px; }\n                }\n            '),
          document.head.appendChild(e));
        const o = document.createElement("div");
        ((o.id = "__cc_sidebar__"),
          (o.style.cssText =
            "position: fixed; display: flex; z-index: 2147483645; font-family: system-ui, sans-serif; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s ease;"),
          ge(o),
          o.addEventListener("mouseenter", () => {
            clearTimeout(pe);
          }),
          o.addEventListener("mouseleave", ye));
        const n = (e, t, o, n) => {
          const c = document.createElement("button");
          ((c.className = "__cc-btn"), (c.title = t));
          const a = t.split(" (")[0],
            i = document.createElement("div");
          ((i.className = "__cc-btn-icon"), (i.textContent = e));
          const r = document.createElement("div");
          return (
            (r.className = "__cc-btn-text"),
            (r.textContent = a),
            c.appendChild(i),
            c.appendChild(r),
            (c.onmouseover = () => {
              c.style.background = o;
            }),
            (c.onmouseout = () => {
              c.style.background = "#0f172a";
            }),
            (c.onclick = n),
            c
          );
        };
        (o.appendChild(n("📋", "Current Console (Ctrl+Shift+X)", "#1e293b", z)),
          o.appendChild(n("📜", "Full History (Ctrl+Shift+H)", "#0369a1", I)),
          o.appendChild(n("📦", "State Dump (Storage)", "#16a34a", D)),
          o.appendChild(n("📷", "Screenshot (Ctrl+Shift+S)", "#ca8a04", L)),
          o.appendChild(
            n("🎯", "Element Inspector (Ctrl+Shift+E)", "#7e22ce", q),
          ),
          o.appendChild(n("💥", "Thanos Snap", "#dc2626", U)),
          o.appendChild(n("🩻", "X-Ray Layout (Ctrl+Shift+L)", "#475569", Q)),
          o.appendChild(n("💉", "Live Injector (Ctrl+Shift+J)", "#10b981", Ee)),
          o.appendChild(n("🛠️", "Power Tools (Ctrl+Shift+O)", "#8b5cf6", Se)),
          o.appendChild(
            n("⚙️", "Settings & Shortcuts (Ctrl+Shift+I)", "#0ea5e9", we),
          ),
          document.documentElement.appendChild(o),
          ye());
      }),
      C(
        "God Mode v4.14.0 Inizializzato! 🚀 (Trusted Types Compliant & WP Customizer Fixed)",
      )));
})();
