// === details.js – POPRAWIONE TŁUMACZENIE DŁUGOŚCI + TABLICE + LOGIKA ZDJĘĆ ===

document.addEventListener("DOMContentLoaded", async () => {
  // Czekaj na tłumaczenia
  while (!window.langReady || typeof t !== "function") {
    await new Promise(r => setTimeout(r, 50));
  }

  const container = document.getElementById("detailsContainer");
  const item = JSON.parse(localStorage.getItem("selectedHairstyle"));

  if (!item) {
    container.innerHTML = `<p style='text-align:center; color:#aaa;'>${t("builder_no_match")}</p>`;
    return;
  }

  const currentLang = window.currentLang ? window.currentLang() : "pl";
  const nameText = typeof item.name === "object" 
    ? (item.name[currentLang] || item.name.pl || item.name)
    : item.name;

  const descText = typeof item.description === "object"
    ? (item.description[currentLang] || item.description.pl || "")
    : item.description || "";

  // === NORMALIZACJA TABLIC (bezpieczeństwo) ===
  const normalizeArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

  const lengthArr = normalizeArray(item.length);
  const styleArr = normalizeArray(item.style);
  const faceArr = normalizeArray(item.faceShapes);
  const hairArr = normalizeArray(item.hairType);

  const bokiOptions = normalizeArray(item.boki);
  const goraOptions = normalizeArray(item.gora);
  const grzywkaOptions = normalizeArray(item.grzywka);

  const allImages = item.images || {};
  const DEFAULT_FALLBACK = "./images/haircut.jpg";

  // === SPRAWDZENIE: CZY FRYZURA MA JAKIEKOLWIEK ZDJĘCIA? ===
  const hasAnyImage = Object.values(allImages).some(img => {
    const src = typeof img === "string" ? img : (img.src || "");
    return src.trim() !== "";
  });

  // === TŁUMACZENIA DLA PÓL ===
  const lengthTranslated = translateArray(lengthArr, "filter") || "?";
  const styleTranslated = translateArray(styleArr, "filter") || "brak stylu";
  const faceTranslated = translateArray(faceArr, "filter") || "dowolny";
  const hairTranslated = translateArray(hairArr, "hair") || "dowolny";

  // === Jeśli brak zdjęć – tylko fallback + brak selectów ===
  if (!hasAnyImage) {
    container.innerHTML = `
      <section class="details-gallery">
        <div class="image-wrapper">
          <img id="mainImage" src="${DEFAULT_FALLBACK}" alt="${nameText}" loading="lazy">
        </div>
        <p id="variantDesc" class="variant-desc" style="display: none;"></p>
      </section>
      <section class="details-info">
        <h2>${nameText}</h2>
        <div class="variant-controls" style="display:none;"></div>
        <p><strong data-key="details_length">${t("details_length")}</strong> ${lengthTranslated}</p>
        <p><strong data-key="details_style">${t("details_style")}</strong> ${styleTranslated}</p>
        <p><strong data-key="details_face">${t("details_face")}</strong> ${faceTranslated}</p>
        <p><strong data-key="details_hair">${t("details_hair")}</strong> ${hairTranslated}</p>
        <p>${descText}</p>
        <button id="backBtn" class="back-btn" data-key="back_button">${t("back_button")}</button>
      </section>
    `;
    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "index.html";
    });
    return;
  }

  // === POMOCNICZA FUNKCJA: znajdź pierwsze dostępne zdjęcie ===
  const getFirstAvailableImage = (imagesObj) => {
    for (const key in imagesObj) {
      const img = imagesObj[key];
      const src = typeof img === "string" ? img : (img.src || "");
      if (src && src.trim() !== "") {
        return { src, desc: typeof img === "object" ? img.desc : null };
      }
    }
    return null;
  };

  // === BUDOWANIE WARIANTÓW Z PEŁNĄ LOGIKĄ ZDJĘĆ ===
  const variants = [];
  for (const b of bokiOptions) {
    for (const g of goraOptions) {
      for (const gr of grzywkaOptions) {
        const key = `${b}_${g}_${gr}`;

        let imageData = allImages[key];
        let src = "";
        let desc = null;

        // 1. Sprawdź konkretny wariant
        if (imageData) {
          src = typeof imageData === "string" ? imageData : (imageData.src || "");
          desc = typeof imageData === "object" ? imageData.desc : null;
        }

        // 2. Jeśli brak → sprawdź default
        if (!src && allImages.default) {
          const def = allImages.default;
          src = typeof def === "string" ? def : (def.src || "");
          desc = typeof def === "object" ? def.desc : null;
        }

        // 3. Jeśli nadal brak → pierwsze dostępne zdjęcie
        if (!src) {
          const first = getFirstAvailableImage(allImages);
          if (first) {
            src = first.src;
            desc = first.desc;
          }
        }

        // 4. Ostateczny fallback
        if (!src) {
          src = DEFAULT_FALLBACK;
        }

        variants.push({ boki: b, gora: g, grzywka: gr, key, src, desc });
      }
    }
  }

  // === DOMYŚLNY WARIANT (z gwarancją zdjęcia) ===
  let defaultVariant = variants[0];
  if (!defaultVariant || !defaultVariant.src) {
    const firstImg = getFirstAvailableImage(allImages);
    defaultVariant = {
      src: firstImg?.src || DEFAULT_FALLBACK,
      desc: firstImg?.desc || null,
      boki: bokiOptions[0] || "",
      gora: goraOptions[0] || "",
      grzywka: grzywkaOptions[0] || ""
    };
  }

  const unique = arr => [...new Set(arr)];
  const uniqueBoki = unique(bokiOptions);
  const uniqueGora = unique(goraOptions);
  const uniqueGrzywka = unique(grzywkaOptions);

  const variantLabels = {
    boki: t("builder_sides"),
    gora: t("builder_top"),
    grzywka: t("builder_bangs")
  };

  // === HTML ===
  container.innerHTML = `
    <section class="details-gallery">
      <div class="image-wrapper">
        <img id="mainImage" src="${defaultVariant.src}" alt="${nameText}" loading="lazy">
      </div>
      <p id="variantDesc" class="variant-desc" style="display: none;"></p>
    </section>
    <section class="details-info">
      <h2>${nameText}</h2>
      <div class="variant-controls" id="variantControls"></div>
      <p><strong data-key="details_length">${t("details_length")}</strong> ${lengthTranslated}</p>
      <p><strong data-key="details_style">${t("details_style")}</strong> ${styleTranslated}</p>
      <p><strong data-key="details_face">${t("details_face")}</strong> ${faceTranslated}</p>
      <p><strong data-key="details_hair">${t("details_hair")}</strong> ${hairTranslated}</p>
      <p>${descText}</p>
      <button id="backBtn" class="back-btn" data-key="back_button">${t("back_button")}</button>
    </section>
  `;

  const controls = document.getElementById("variantControls");
  const selectHTML = [];
  const variantPrefix = "filter";

  // === SELECTY ===
  if (uniqueBoki.length >= 1) {
    const options = uniqueBoki.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${translateValue(o, variantPrefix)}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.boki}</label>
        <select id="bokiSelect">${options}</select>
      </div>
    `);
  }

  if (uniqueGora.length >= 1) {
    const options = uniqueGora.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${translateValue(o, variantPrefix)}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.gora}</label>
        <select id="goraSelect">${options}</select>
      </div>
    `);
  }

  if (uniqueGrzywka.length >= 1) {
    const options = uniqueGrzywka.map(o => {
      const key = o.toLowerCase().replace(/ /g, "_");
      return `<option value="${o}" data-key="${variantPrefix}_${key}">${translateValue(o, variantPrefix)}</option>`;
    }).join("");
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.grzywka}</label>
        <select id="grzywkaSelect">${options}</select>
      </div>
    `);
  }

  controls.innerHTML = selectHTML.join("");

  // === USTAWIENIE DOMYŚLNYCH WARTOŚCI ===
  if (document.getElementById("bokiSelect")) document.getElementById("bokiSelect").value = defaultVariant.boki;
  if (document.getElementById("goraSelect")) document.getElementById("goraSelect").value = defaultVariant.gora;
  if (document.getElementById("grzywkaSelect")) document.getElementById("grzywkaSelect").value = defaultVariant.grzywka;

  // === TŁUMACZENIE SELECTÓW ===
  function translateSelects() {
    document.querySelectorAll("#variantControls option[data-key]").forEach(opt => {
      const key = opt.getAttribute("data-key");
      const translated = t(key);
      if (translated && translated !== key) {
        opt.textContent = translated;
      }
    });
  }

  // === AKTUALIZACJA ZDJĘCIA ===
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
      imgEl.onerror = () => { if (imgEl.src !== DEFAULT_FALLBACK) imgEl.src = DEFAULT_FALLBACK; };
      imgEl.onload = () => { imgEl.style.opacity = 1; };
    }

    if (variant.desc?.[currentLang] || variant.desc?.pl) {
      const descText = variant.desc[currentLang] || variant.desc.pl || "";
      descEl.textContent = descText;
      descEl.style.display = "block";
    } else {
      descEl.style.display = "none";
    }
  }

  // === OBSŁUGA ZMIANY SELECTÓW ===
  ["bokiSelect", "goraSelect", "grzywkaSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateImage);
  });

  // === INICJALIZACJA ===
  translateSelects();
  updateImage();

  // === ZMIANA JĘZYKA ===
  window.addEventListener("languageChanged", () => {
    if (window.location.pathname.includes("details.html")) {
      window.updateLanguage();

      // Aktualizacja pól tekstowych
      document.querySelectorAll("p").forEach(p => {
        if (p.innerHTML.includes("details_length")) {
          p.innerHTML = `<strong data-key="details_length">${t("details_length")}</strong> ${translateArray(lengthArr, "filter") || "?"}`;
        }
        if (p.innerHTML.includes("details_style")) {
          p.innerHTML = `<strong data-key="details_style">${t("details_style")}</strong> ${translateArray(styleArr, "filter") || "brak stylu"}`;
        }
        if (p.innerHTML.includes("details_face")) {
          p.innerHTML = `<strong data-key="details_face">${t("details_face")}</strong> ${translateArray(faceArr, "filter") || "dowolny"}`;
        }
        if (p.innerHTML.includes("details_hair")) {
          p.innerHTML = `<strong data-key="details_hair">${t("details_hair")}</strong> ${translateArray(hairArr, "hair") || "dowolny"}`;
        }
      });

      translateSelects();
      updateImage();
    }
  });

  // === PRZYCISK POWROTU ===
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});