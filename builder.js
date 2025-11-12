// builder.js
document.addEventListener("DOMContentLoaded", async () => {
  // Czekamy na załadowanie lang.js
  if (typeof updateLanguage !== "function") {
    console.warn("lang.js nie załadowany – czekam...");
    await new Promise(resolve => {
      const check = () => {
        if (typeof updateLanguage === "function") resolve();
        else setTimeout(check, 50);
      };
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

  // === 1. ŁADOWANIE DANYCH ===
  try {
    const res = await fetch("hairstyles.json");
    if (!res.ok) throw new Error("Nie można załadować hairstyles.json");
    hairstyles = await res.json();
  } catch (err) {
    console.error(err);
    alert("Błąd ładowania fryzur.");
    return;
  }

  // === 2. WALIDACJA ZDJĘĆ DLA WARIANTÓW ===
  async function validateVariants(item) {
    const imageObj = item.images || {};
    const variants = [];

    for (const key in imageObj) {
      const data = imageObj[key];
      const src = typeof data === "string" ? data : data.src;
      const desc = typeof data === "object" ? data.desc : null;

      if (!src || src.trim() === "") continue;

      const parts = key.split("_");
      if (parts.length !== 3) continue;

      const [boki, gora, grzywka] = parts;
      variants.push({ key, boki, gora, grzywka, src: src.trim(), desc });
    }

    if (variants.length === 0) {
      const fallbackKey = `${item.boki || "brak"}_${item.gora || "krótka"}_${item.grzywka || "brak"}`;
      variants.push({
        key: fallbackKey,
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

    if (validated.length === 0) {
      const fallback = variants[0];
      fallback.src = DEFAULT_IMAGE;
      validated.push(fallback);
    }

    return validated;
  }

  // === 3. ZNAJDŹ NAJLEPSZE DOPASOWANIE ===
  async function findMatch() {
    const boki = bokiSelect.value;
    const gora = goraSelect.value;
    const grzywka = grzywkaSelect.value;
    const styl = styleSelect.value;

    const matches = hairstyles.filter(item => {
      const matchBoki = !boki || item.boki === boki;
      const matchGora = !gora || item.gora === gora;
      const matchGrzywka = !grzywka || item.grzywka === grzywka;
      const matchStyl = !styl || item.style === styl;
      return matchBoki && matchGora && matchGrzywka && matchStyl;
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

    resultName.textContent = currentMatch.name;
    resultDesc.textContent = currentMatch.description;
    viewDetailsBtn.textContent = t("builder_view_details");

    // Spinner + zdjęcie
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
      variantDesc.textContent = variant.desc;
      variantDesc.style.display = "block";
    } else {
      variantDesc.style.display = "none";
    }

    // Aktualizacja po zmianie języka
    updateLanguage();
  }

  // === 4. NASŁUCHIWANIE ZMIAN ===
  [bokiSelect, goraSelect, grzywkaSelect, styleSelect].forEach(sel => {
    sel.addEventListener("change", findMatch);
  });

  // === 5. ZOBACZ SZCZEGÓŁY ===
  viewDetailsBtn.addEventListener("click", () => {
    if (!currentMatch) return;
    localStorage.setItem("selectedHairstyle", JSON.stringify(currentMatch));
    window.location.href = "details.html";
  });

  // === 6. INICJALIZACJA ===
  findMatch();

  // === 7. Przełączniki języka ===
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      setTimeout(() => {
        findMatch(); // Odśwież wynik po zmianie języka
        updateLanguage();
      }, 50);
    });
  });

  // === 8. Tłumaczenie etykiet w selectach ===
  function translateSelectLabels() {
    document.querySelectorAll(".control-group h3").forEach(h3 => {
      const text = h3.textContent.trim();
      if (text === "Boki") h3.textContent = t("builder_sides");
      if (text === "Góra") h3.textContent = t("builder_top");
      if (text === "Grzywka") h3.textContent = t("builder_bangs");
      if (text === "Styl") h3.textContent = t("builder_style");
    });

    document.querySelector(".result h3").textContent = t("builder_match");
  }

  // Wywołaj przy starcie i po zmianie języka
  translateSelectLabels();
  updateLanguage();
});