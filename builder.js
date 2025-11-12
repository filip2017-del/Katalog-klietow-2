// === builder.js (pełna poprawiona wersja z tłumaczeniem i dynamicznymi opcjami) ===
document.addEventListener("DOMContentLoaded", async () => {
  // Czekamy na lang.js
  if (typeof updateLanguage !== "function") {
    console.warn("lang.js nie załadowany – czekam...");
    await new Promise(resolve => {
      const check = () => (typeof updateLanguage === "function" ? resolve() : setTimeout(check, 50));
      check();
    });
  }

  const bokiSelect = document.getElementById("bokiSelect");
  const goraSelect = document.getElementById("goraSelect");
  const grzywkaSelect = document.getElementById("grzywkaSelect");
  const styleSelect = document.getElementById("styleSelect");

  const resultSection = document.getElementById("resultSection");
  const resultCard = document.getElementById("resultCard");
  const resultName = document.getElementById("resultName");
  const resultDesc = document.getElementById("resultDesc");
  const variantDesc = document.getElementById("variantDesc");
  const previewImg = document.getElementById("previewImg");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const viewDetailsBtn = document.getElementById("viewDetailsBtn");
  const noMatch = document.getElementById("noMatch");

  let hairstyles = [];
  let currentMatch = null;
  const DEFAULT_IMAGE = "./images/haircut.jpg";

  // === 1. ŁADOWANIE hairstyles.json ===
  try {
    const res = await fetch("hairstyles.json");
    if (!res.ok) throw new Error("Nie można załadować hairstyles.json");
    hairstyles = await res.json();
  } catch (err) {
    console.error(err);
    alert("Błąd ładowania fryzur.");
    return;
  }

  // === 2. ZBIERANIE UNIKALNYCH WARTOŚCI Z DANYCH ===
  const unique = (arr) => [...new Set(arr.filter(Boolean))];

  const allBoki = unique(hairstyles.map(h => h.boki));
  const allGora = unique(hairstyles.map(h => h.gora));
  const allGrzywka = unique(hairstyles.map(h => h.grzywka));
  const allStyles = unique(hairstyles.map(h => h.style));

  // === 3. MAPA TŁUMACZEŃ WARIANTÓW (tak jak w details.js) ===
  const variantMap = {
    boki: {
      "taper": "Taper", "low fade": "Low Fade", "mid fade": "Mid Fade",
      "high fade": "variant_high_fade", "burst fade": "Burst Fade",
      "undercut": "variant_undercut", "średnie": "Średnie boki", "długie": "Długie boki"
    },
    gora: {
      "krótka": "Krótka", "luźna": "variant_loose", "klasyczna": "Klasyczna",
      "długa": "Długa", "tekstura": "variant_textured", "quiff": "Quiff",
      "pompadour": "Pompadour"
    },
    grzywka: {
      "brak": "variant_none", "prosta": "Prosta", "curtain": "variant_curtain",
      "tekstura": "variant_textured", "side": "variant_side"
    },
    style: {
      "klasyczny": "filter_classic", "nowoczesny": "filter_modern",
      "sportowy": "filter_sport", "retro": "filter_retro",
      "naturalny": "filter_natural", "alternatywny": "filter_alternative"
    }
  };

  // === 4. TŁUMACZENIE WARTOŚCI ===
  function translateVariant(value, type) {
    if (!value) return value;
    const map = variantMap[type];
    if (!map) return value;
    const key = value.toString().trim().toLowerCase();
    const translationKey = map[key];
    return translationKey ? t(translationKey) : value;
  }

  // === 5. WYPEŁNIANIE SELECTÓW DYNAMICZNIE ===
  function populateSelect(select, options, type) {
    select.innerHTML = `<option value="">${t("filter_any")}</option>`;
    options.forEach(opt => {
      const translated = translateVariant(opt, type);
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = translated;
      select.appendChild(option);
    });
  }

  populateSelect(bokiSelect, allBoki, "boki");
  populateSelect(goraSelect, allGora, "gora");
  populateSelect(grzywkaSelect, allGrzywka, "grzywka");
  populateSelect(styleSelect, allStyles, "style");

  // === 6. TŁUMACZENIE ETYKIET ===
  function translateLabels() {
    document.querySelectorAll(".control-group h3").forEach(h3 => {
      const text = h3.textContent.trim();
      if (text === "Boki") h3.textContent = t("builder_sides");
      if (text === "Góra") h3.textContent = t("builder_top");
      if (text === "Grzywka") h3.textContent = t("builder_bangs");
      if (text === "Styl") h3.textContent = t("builder_style");
    });
    const resultH3 = document.querySelector(".result h3");
    if (resultH3) resultH3.textContent = t("builder_match");
  }

  // === 7. WALIDACJA ZDJĘĆ ===
  async function validateVariants(item) {
    const imageObj = item.images || {};
    const variants = [];

    for (const key in imageObj) {
      const data = imageObj[key];
      const src = typeof data === "string" ? data : data.src;
      const desc = typeof data === "object" ? data.desc : null;
      if (!src?.trim()) continue;

      const parts = key.split("_");
      if (parts.length !== 3) continue;

      const [boki, gora, grzywka] = parts;
      variants.push({ key, boki, gora, grzywka, src: src.trim(), desc });
    }

    if (variants.length === 0) {
      variants.push({
        key: `${item.boki || "brak"}_${item.gora || "krótka"}_${item.grzywka || "brak"}`,
        boki: item.boki || "brak",
        gora: item.gora || "krótka",
        grzywka: item.grzywka || "brak",
        src: DEFAULT_IMAGE,
        desc: null
      });
    }

    const validated = [];
    for (const v of variants) {
      if (v.src === DEFAULT_IMAGE) {
        validated.push(v);
        continue;
      }
      const img = new Image();
      img.src = v.src;
      const loaded = await new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 5000);
      });
      if (loaded) validated.push(v);
    }

    if (validated.length === 0 && variants.length > 0) {
      const fallback = variants[0];
      fallback.src = DEFAULT_IMAGE;
      validated.push(fallback);
    }

    return validated;
  }

  // === 8. ZNAJDŹ DOPASOWANIE ===
  async function findMatch() {
    const boki = bokiSelect.value;
    const gora = goraSelect.value;
    const grzywka = grzywkaSelect.value;
    const styl = styleSelect.value;

    const matches = hairstyles.filter(item => {
      return (!boki || item.boki === boki) &&
             (!gora || item.gora === gora) &&
             (!grzywka || item.grzywka === grzywka) &&
             (!styl || item.style === styl);
    });

    if (matches.length === 0) {
      resultSection.style.display = "block";
      resultCard.style.display = "none";
      noMatch.style.display = "block";
      noMatch.textContent = t("builder_no_match");
      viewDetailsBtn.style.display = "none";
      return;
    }

    currentMatch = matches.reduce((best, curr) => {
      const bestScore = (!boki || best.boki === boki ? 1 : 0) +
                        (!gora || best.gora === gora ? 1 : 0) +
                        (!grzywka || best.grzywka === grzywka ? 1 : 0) +
                        (!styl || best.style === styl ? 1 : 0);
      const currScore = (!boki || curr.boki === boki ? 1 : 0) +
                        (!gora || curr.gora === gora ? 1 : 0) +
                        (!grzywka || curr.grzywka === grzywka ? 1 : 0) +
                        (!styl || curr.style === styl ? 1 : 0);
      return currScore > bestScore ? curr : best;
    }, matches[0]);

    const validVariants = await validateVariants(currentMatch);
    const key = `${currentMatch.boki}_${currentMatch.gora}_${currentMatch.grzywka}`;
    let variant = validVariants.find(v => v.key === key) || validVariants[0];

    // === POKAŻ WYNIK ===
    resultSection.style.display = "block";
    resultCard.style.display = "block";
    noMatch.style.display = "none";
    viewDetailsBtn.style.display = "block";

    const nameText = typeof currentMatch.name === "object" ? (currentMatch.name[currentLang] || currentMatch.name.pl) : currentMatch.name;
    const descText = typeof currentMatch.description === "object" ? (currentMatch.description[currentLang] || currentMatch.description.pl) : currentMatch.description;

    resultName.textContent = nameText;
    resultDesc.textContent = descText;
    viewDetailsBtn.textContent = t("builder_view_details");

    // Spinner
    loadingSpinner.style.display = "block";
    loadingSpinner.textContent = t("loading");
    previewImg.style.opacity = 0;

    const newImg = new Image();
    newImg.src = variant.src;

    await new Promise(resolve => {
      newImg.onload = () => {
        previewImg.src = newImg.src;
        previewImg.style.opacity = 1;
        loadingSpinner.style.display = "none";
        resolve();
      };
      newImg.onerror = () => {
        previewImg.src = DEFAULT_IMAGE;
        previewImg.style.opacity = 1;
        loadingSpinner.style.display = "none";
        resolve();
      };
    });

    if (variant.desc) {
      const descText = typeof variant.desc === "object" ? (variant.desc[currentLang] || variant.desc.pl) : variant.desc;
      variantDesc.textContent = descText;
      variantDesc.style.display = "block";
    } else {
      variantDesc.style.display = "none";
    }

    updateLanguage();
  }

  // === 9. OBSŁUGA ZMIAN ===
  [bokiSelect, goraSelect, grzywkaSelect, styleSelect].forEach(sel => {
    sel.addEventListener("change", findMatch);
  });

  viewDetailsBtn.addEventListener("click", () => {
    if (!currentMatch) return;
    localStorage.setItem("selectedHairstyle", JSON.stringify(currentMatch));
    window.location.href = "details.html";
  });

  // === 10. OBSŁUGA ZMIANY JĘZYKA ===
  window.addEventListener("languageChanged", () => {
    populateSelect(bokiSelect, allBoki, "boki");
    populateSelect(goraSelect, allGora, "gora");
    populateSelect(grzywkaSelect, allGrzywka, "grzywka");
    populateSelect(styleSelect, allStyles, "style");
    translateLabels();
    findMatch();
  });

  // === 11. INICJALIZACJA ===
  translateLabels();
  findMatch();
  updateLanguage();
});