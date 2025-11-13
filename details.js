// === details.js – PEŁNA, POPRAWIONA WERSJA (BEZ BŁĘDÓW) ===
document.addEventListener("DOMContentLoaded", async () => {
  // Czekaj na lang.js
  while (!window.langReady || typeof t !== "function") {
    await new Promise(r => setTimeout(r, 50));
  }

  const container = document.getElementById("detailsContainer");
  const item = JSON.parse(localStorage.getItem("selectedHairstyle"));

  if (!item) {
    container.innerHTML = `<p style='text-align:center; color:#aaa;'>${t("builder_no_match")}</p>`;
    return;
  }

  // --- TŁUMACZENIA TEKSTOWE ---
  const currentLang = window.currentLang ? window.currentLang() : "pl";
  const nameText = typeof item.name === "object" 
    ? (item.name[currentLang] || item.name.pl || item.name)
    : item.name;

  const descText = typeof item.description === "object"
    ? (item.description[currentLang] || item.description.pl || "")
    : item.description || "";

  // --- WARIANTY ---
  const bokiOptions = Array.isArray(item.boki) ? item.boki.map(v => String(v).trim()) : [String(item.boki || "default").trim()];
  const goraOptions = Array.isArray(item.gora) ? item.gora.map(v => String(v).trim()) : [String(item.gora || "default").trim()];
  const grzywkaOptions = Array.isArray(item.grzywka) ? item.grzywka.map(v => String(v).trim()) : [String(item.grzywka || "default").trim()];

  const variants = [];
  const allImages = item.images || {};
  const DEFAULT_IMAGE = "./images/haircut.jpg";

  for (const b of bokiOptions) {
    for (const g of goraOptions) {
      for (const gr of grzywkaOptions) {
        const key = `${b}_${g}_${gr}`;
        const imageData = allImages[key] || allImages.default || {};
        const src = imageData.src || DEFAULT_IMAGE;
        const desc = imageData.desc || null;

        variants.push({ boki: b, gora: g, grzywka: gr, key, src, desc });
      }
    }
  }

  const defaultVariant = variants[0] || { src: DEFAULT_IMAGE };

  const unique = arr => [...new Set(arr)];
  const uniqueBoki = unique(bokiOptions);
  const uniqueGora = unique(goraOptions);
  const uniqueGrzywka = unique(grzywkaOptions);

  // --- ETYKIETY ---
  const variantLabels = {
    boki: t("builder_sides"),
    gora: t("builder_top"),
    grzywka: t("builder_bangs")
  };

  // --- GENEROWANIE HTML ---
  container.innerHTML = `
    <section class="details-gallery">
      <img id="mainImage" src="${defaultVariant.src}" alt="${nameText}" loading="lazy">
      <p id="variantDesc" class="variant-desc" style="display: none;"></p>
    </section>
    <section class="details-info">
      <h2>${nameText}</h2>
      <div class="variant-controls" id="variantControls"></div>
      <p><strong data-key="details_length">${t("details_length")}</strong> ${translateValue(item.length, "filter")}</p>
      <p><strong data-key="details_style">${t("details_style")}</strong> ${translateArray(item.style, "filter")}</p>
      <p><strong data-key="details_face">${t("details_face")}</strong> ${translateArray(item.faceShapes, "filter")}</p>
      <p><strong data-key="details_hair">${t("details_hair")}</strong> ${translateArray(item.hairType, "hair")}</p>
      <p>${descText}</p>
      <button id="backBtn" class="back-btn" data-key="back_button">${t("back_button")}</button>
    </section>
  `;

  // --- SELEKTORY WARIANTÓW ---
  const controls = document.getElementById("variantControls");
  const selectHTML = [];
  const variantPrefix = "variant";

  if (uniqueBoki.length > 1) {
    const options = uniqueBoki.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${o}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.boki}</label>
        <select id="bokiSelect">${options}</select>
      </div>
    `);
  }

  if (uniqueGora.length > 1) {
    const options = uniqueGora.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${o}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.gora}</label>
        <select id="goraSelect">${options}</select>
      </div>
    `);
  }

  if (uniqueGrzywka.length > 1) {
    const options = uniqueGrzywka.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${o}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.grzywka}</label>
        <select id="grzywkaSelect">${options}</select>
      </div>
    `);
  }

  controls.innerHTML = selectHTML.join("");
  if (selectHTML.length === 0) controls.style.display = "none";

  // --- TŁUMACZENIE SELECTÓW ---
  function translateSelects() {
    document.querySelectorAll("#variantControls option[data-key]").forEach(opt => {
      const key = opt.getAttribute("data-key");
      const translated = t(key);
      if (translated && translated !== key) {
        opt.textContent = translated;
      }
    });
  }

  // --- DOMYŚLNE WARTOŚCI ---
  if (uniqueBoki.length > 1) document.getElementById("bokiSelect").value = defaultVariant.boki;
  if (uniqueGora.length > 1) document.getElementById("goraSelect").value = defaultVariant.gora;
  if (uniqueGrzywka.length > 1) document.getElementById("grzywkaSelect").value = defaultVariant.grzywka;

  // --- AKTUALIZACJA OBRAZU ---
  const descEl = document.getElementById("variantDesc");
  const imgEl = document.getElementById("mainImage");

  function updateImage() {
    const boki = document.getElementById("bokiSelect")?.value || defaultVariant.boki;
    const gora = document.getElementById("goraSelect")?.value || defaultVariant.gora;
    const grzywka = document.getElementById("grzywkaSelect")?.value || defaultVariant.grzywka;
    
    const variant = variants.find(v => v.boki === boki && v.gora === gora && v.grzywka === grzywka) || variants[0];

    if (imgEl.src !== variant.src) {
      imgEl.style.opacity = 0;
      imgEl.onerror = null;
      imgEl.src = variant.src;
      imgEl.onerror = () => { 
        if (imgEl.src !== DEFAULT_IMAGE) imgEl.src = DEFAULT_IMAGE; 
      };
      imgEl.onload = () => { imgEl.style.opacity = 1; };
    }

    if (variant.desc) {
      const descText = typeof variant.desc === "object" 
        ? (variant.desc[currentLang] || variant.desc.pl || variant.desc.en || "")
        : variant.desc;
      descEl.textContent = descText;
      descEl.style.display = "block";
    } else {
      descEl.style.display = "none";
    }
  }

  ["bokiSelect", "goraSelect", "grzywkaSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateImage);
  });

  // --- INICJALIZACJA ---
  translateSelects();
  updateImage();

  // --- OBSŁUGA ZMIANY JĘZYKA (bez reloadu) ---
  window.addEventListener("languageChanged", () => {
    if (window.location.pathname.includes("details.html")) {
      window.updateLanguage();

      document.querySelectorAll("p").forEach(p => {
        if (p.innerHTML.includes("details_length")) {
          p.innerHTML = `<strong data-key="details_length">${t("details_length")}</strong> ${translateValue(item.length, "filter")}`;
        }
        if (p.innerHTML.includes("details_style")) {
          p.innerHTML = `<strong data-key="details_style">${t("details_style")}</strong> ${translateArray(item.style, "filter")}`;
        }
        if (p.innerHTML.includes("details_face")) {
          p.innerHTML = `<strong data-key="details_face">${t("details_face")}</strong> ${translateArray(item.faceShapes, "filter")}`;
        }
        if (p.innerHTML.includes("details_hair")) {
          p.innerHTML = `<strong data-key="details_hair">${t("details_hair")}</strong> ${translateArray(item.hairType, "hair")}`;
        }
      });

      translateSelects();
      updateImage();
    }
  });

  // --- PRZYCISK POWROTU ---
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});