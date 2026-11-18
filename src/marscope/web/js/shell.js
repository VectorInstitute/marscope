/* MARScope shell: language and theme switchers, shared strings. Used by index.html and app.html.
   Language and theme are user choices remembered in the browser; light and English by default. */
(function () {
  "use strict";

  const SHELL = {
    en: {
      tagline: "Video deepfake detectors, explained", docs: "Docs", faq: "FAQ", openApp: "Open the app",
      langLabel: "Language", themeLabel: "Theme", light: "Light", dark: "Dark",
      definition: "<strong>How MARScope reads a score</strong> Each detector gives a probability that a video is fake. MARScope shows how unusual that number is for a real video, using the scores the same model gave real and fake test videos, and shows the evidence behind it. There is no verdict: scores are not calibrated, detectors disagree, and everyday videos differ from test videos. MARScope is a study tool for learning how detectors work and where they fail.",
      legal: "This tool is for educational purposes only. Its scores are model outputs, not findings: they can be wrong, and they are not evidence that a video is real or fake. Do not use them for legal, forensic, journalistic or employment decisions, or to make claims about a person. Policy notes are educational and are not legal advice. Supported by the Province of Ontario, the Government of Canada through CIFAR, and the EU Horizon Europe AIXPERT project (grant 101214389). Provided as is under the Apache 2.0 licence, without warranty of any kind.",
      copyright: "© The Vector Institute for Artificial Intelligence · Apache 2.0",
    },
    fr: {
      tagline: "Les détecteurs d’hypertrucages vidéo, expliqués", docs: "Docs", faq: "FAQ", openApp: "Ouvrir l’application",
      langLabel: "Langue", themeLabel: "Thème", light: "Clair", dark: "Sombre",
      definition: "<strong>Comment MARScope lit un score</strong> Chaque détecteur donne une probabilité qu’une vidéo soit fausse. MARScope montre à quel point ce nombre est inhabituel pour une vraie vidéo, à partir des scores que le même modèle a donnés à de vraies et de fausses vidéos de test, et montre les indices qui le sous-tendent. Il n’y a pas de verdict : les scores ne sont pas calibrés, les détecteurs divergent et les vidéos du quotidien diffèrent des vidéos de test. MARScope est un outil d’étude pour comprendre comment les détecteurs fonctionnent et où ils échouent.",
      legal: "Cet outil est fourni à des fins pédagogiques seulement. Ses scores sont des sorties de modèles, pas des constats : ils peuvent se tromper et ne prouvent pas qu’une vidéo est vraie ou fausse. Ne les utilisez pas pour des décisions juridiques, judiciaires, journalistiques ou d’emploi, ni pour affirmer quoi que ce soit sur une personne. Les notes sont pédagogiques et ne constituent pas un avis juridique. Avec le soutien de la province de l’Ontario, du gouvernement du Canada par l’intermédiaire du CIFAR et du projet AIXPERT d’Horizon Europe (subvention 101214389). Fourni tel quel sous licence Apache 2.0, sans garantie.",
      copyright: "© L’Institut Vecteur pour l’intelligence artificielle · Apache 2.0",
    },
  };
  const LANGS = { en: "EN", fr: "FR-CA" };
  const THEMES = ["light", "dark"];
  const listeners = [];

  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (_) { /* storage blocked */ }
    return null;
  }
  let lang = store("marscope-lang") === "fr" ? "fr" : "en";
  let theme = store("marscope-theme") === "dark" ? "dark" : "light";

  // Strings: pages register their own tables; the shell table is always available.
  const tables = [SHELL];
  function t(key, vars) {
    let s = null;
    for (const tb of tables) { if (tb[lang] && tb[lang][key] != null) { s = tb[lang][key]; break; } }
    if (s == null) for (const tb of tables) { if (tb.en && tb.en[key] != null) { s = tb.en[key]; break; } }
    if (s == null) s = key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(String(vars[k])); });
    return s;
  }

  function applyStatic(root) {
    const r = root || document;
    document.documentElement.lang = lang === "fr" ? "fr-CA" : "en";
    r.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    r.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    r.querySelectorAll("[data-i18n-aria]").forEach((el) => { const s = t(el.dataset.i18nAria); el.setAttribute("aria-label", s); if (el.dataset.tip !== "no") el.title = s; });
    r.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    renderSwitchers();
  }

  function applyTheme() {
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else document.documentElement.dataset.theme = "light";
  }

  function renderSwitchers() {
    document.querySelectorAll("[data-switch]").forEach((sw) => {
      const kind = sw.dataset.switch, trigger = sw.querySelector(".switch-trigger"), menu = sw.querySelector(".switch-menu");
      const current = kind === "lang" ? LANGS[lang] : t(theme);
      trigger.textContent = current;
      trigger.setAttribute("aria-label", `${t(kind === "lang" ? "langLabel" : "themeLabel")}: ${current}`);
      const options = kind === "lang" ? Object.keys(LANGS).filter((k) => k !== lang).map((k) => [k, LANGS[k]]) : THEMES.filter((k) => k !== theme).map((k) => [k, t(k)]);
      menu.innerHTML = options.map(([v, label]) => `<button type="button" class="switch-option" role="option" data-value="${v}">${label}</button>`).join("");
    });
  }

  function closeMenus(except) {
    document.querySelectorAll("[data-switch]").forEach((sw) => {
      if (sw === except) return;
      sw.querySelector(".switch-menu").hidden = true;
      sw.querySelector(".switch-trigger").setAttribute("aria-expanded", "false");
    });
  }

  function initSwitchers() {
    document.querySelectorAll("[data-switch]").forEach((sw) => {
      const trigger = sw.querySelector(".switch-trigger"), menu = sw.querySelector(".switch-menu");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.hidden;
        closeMenus(sw);
        menu.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        if (open) { const first = menu.querySelector(".switch-option"); if (first) first.focus(); }
      });
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-value]"); if (!b) return;
        if (sw.dataset.switch === "lang") setLang(b.dataset.value); else setTheme(b.dataset.value);
        closeMenus(); trigger.focus();
      });
    });
    document.addEventListener("click", () => closeMenus());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenus(); });
  }

  function setLang(v) { lang = v === "fr" ? "fr" : "en"; store("marscope-lang", lang); applyStatic(); listeners.forEach((fn) => fn("lang")); }
  function setTheme(v) { theme = v === "dark" ? "dark" : "light"; store("marscope-theme", theme); applyTheme(); renderSwitchers(); listeners.forEach((fn) => fn("theme")); }

  applyTheme(); // as early as possible, before first paint of the body
  document.addEventListener("DOMContentLoaded", () => { initSwitchers(); applyStatic(); });

  window.MS = {
    t, lang: () => lang, theme: () => theme, applyStatic,
    addStrings: (table) => { tables.unshift(table); },
    onChange: (fn) => listeners.push(fn),
    esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  };
})();
