// === details.js (pełna poprawiona wersja z tłumaczeniem wariantów i przeładowaniem) ===
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof updateLanguage !== "function") {
    await new Promise(resolve => {
      const check = () => (typeof updateLanguage === "function" ? resolve() : setTimeout(check, 50));
      check();
    });
  }

  const container = document.getElementById("detailsContainer");
  const item = JSON.parse(localStorage.getItem("selectedHairstyle"));

  if (!item) {
    container.innerHTML = `<p style='text-align:center; color:#aaa;'>${t("builder_no_match")}</p>`;
    return;
  }

  // --- mapy tłumaczeń wartości
  const valueTranslationMap = {
    length: { "krótkie": "filter_short", "średnie": "filter_medium", "długie": "filter_long" },
    style: {
      "klasyczny": "filter_classic", "nowoczesny": "filter_modern", "sportowy": "filter_sport",
      "alternatywny": "filter_alternative", "retro": "filter_retro",
      "naturalny": "filter_natural", "wojskowy": "filter_military", "casual": "filter_natural"
    },
    face: {
      "owalna": "filter_oval", "okrągła": "filter_round", "kwadratowa": "filter_square",
      "trójkątna": "filter_triangle", "diamentowa": "filter_diamond"
    },
    hairType: { "proste": "hair_straight", "falowane": "hair_wavy", "kręcone": "hair_curly" },
    variant: {
      "brak": "variant_none",
      "side": "variant_side",
      "bok": "variant_side",
      "curtain": "variant_curtain",
      "kurtyna": "variant_curtain",
      "tekstura": "variant_textured",
      "teksturalna": "variant_textured",
      "luźna": "variant_loose",
      "luźne": "variant_loose",
      "high fade": "variant_high_fade",
      "wysoki fade": "variant_high_fade",
      "undercut": "variant_undercut"
    }
  };

  // --- poprawiona funkcja tłumaczenia (niezależna od wielkości liter)
  function translateValue(value, kind) {
    if (!value) return value;
    const map = valueTranslationMap[kind];
    if (!map) return value;
    const normalize = v => v.toString().trim().toLowerCase();
    if (Array.isArray(value)) {
      return value.map(v => {
        const key = normalize(v);
        return map[key] ? t(map[key]) : v;
      }).join(", ");
    }
    const key = normalize(value);
    return map[key] ? t(map[key]) : value;
  }

  // --- tłumaczenia tekstowe
  const nameText = typeof item.name === "object" ? (item.name[currentLang] || item.name.pl) : item.name;
  const descText = typeof item.description === "object" ? (item.description[currentLang] || item.description.pl) : item.description;

  // --- warianty fryzur
  const variants = Object.keys(item.images || {}).map(key => {
    const [boki, gora, grzywka] = key.split("_");
    const data = item.images[key];
    return {
      boki, gora, grzywka,
      src: typeof data === "string" ? data : data.src,
      desc: typeof data === "object" ? data.desc : null
    };
  });

  if (variants.length === 0) {
    variants.push({ boki: item.boki, gora: item.gora, grzywka: item.grzywka, src: "./images/haircut.jpg" });
  }

  const unique = arr => [...new Set(arr)];
  const bokiOptions = unique(variants.map(v => v.boki));
  const goraOptions = unique(variants.map(v => v.gora));
  const grzywkaOptions = unique(variants.map(v => v.grzywka));

  const defaultKey = `${item.boki}_${item.gora}_${item.grzywka}`;
  const defaultVariant = variants.find(v => `${v.boki}_${v.gora}_${v.grzywka}` === defaultKey) || variants[0];

  // --- TŁUMACZONE ETYKIETY DLA WARIANTÓW ---
  const variantLabels = {
    boki: t("builder_sides"),
    gora: t("builder_top"),
    grzywka: t("builder_bangs")
  };

  // --- generowanie HTML
  container.innerHTML = `
    <section class="details-gallery">
      <img id="mainImage" src="${defaultVariant.src}" alt="${nameText}" loading="lazy">
      <p id="variantDesc" class="variant-desc"></p>
    </section>

    <section class="details-info">
      <h2>${nameText}</h2>
      <div class="variant-controls" id="variantControls"></div>

      <p><strong data-key="details_length">${t("details_length")}</strong> ${translateValue(item.length, "length")}</p>
      <p><strong data-key="details_style">${t("details_style")}</strong> ${translateValue(item.style, "style")}</p>
      <p><strong data-key="details_face">${t("details_face")}</strong> ${translateValue(item.faceShapes || [], "face")}</p>
      <p><strong data-key="details_hair">${t("details_hair")}</strong> ${translateValue(item.hairType || [], "hairType")}</p>
      <p>${descText}</p>

      <button id="backBtn" class="back-btn" data-key="back_button">${t("back_button")}</button>
    </section>
  `;

  // --- selektory wariantów
  const controls = document.getElementById("variantControls");
  const selectHTML = [];

  if (bokiOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.boki}</label>
        <select id="bokiSelect">
          ${bokiOptions.map(o => `<option value="${o}">${translateValue(o, "variant")}</option>`).join("")}
        </select>
      </div>
    `);
  }

  if (goraOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.gora}</label>
        <select id="goraSelect">
          ${goraOptions.map(o => `<option value="${o}">${translateValue(o, "variant")}</option>`).join("")}
        </select>
      </div>
    `);
  }

  if (grzywkaOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>${variantLabels.grzywka}</label>
        <select id="grzywkaSelect">
          ${grzywkaOptions.map(o => `<option value="${o}">${translateValue(o, "variant")}</option>`).join("")}
        </select>
      </div>
    `);
  }

  controls.innerHTML = selectHTML.join("");
  if (selectHTML.length === 0) controls.style.display = "none";

  if (bokiOptions.length > 1) document.getElementById("bokiSelect").value = defaultVariant.boki;
  if (goraOptions.length > 1) document.getElementById("goraSelect").value = defaultVariant.gora;
  if (grzywkaOptions.length > 1) document.getElementById("grzywkaSelect").value = defaultVariant.grzywka;

  // --- aktualizacja obrazu
  const descEl = document.getElementById("variantDesc");
  function updateImage() {
    const boki = document.getElementById("bokiSelect")?.value || item.boki;
    const gora = document.getElementById("goraSelect")?.value || item.gora;
    const grzywka = document.getElementById("grzywkaSelect")?.value || item.grzywka;
    const key = `${boki}_${gora}_${grzywka}`;
    const variant = variants.find(v => `${v.boki}_${v.gora}_${v.grzywka}` === key) || variants[0];

    const img = document.getElementById("mainImage");
    if (img.src !== variant.src) {
      img.style.opacity = 0;
      setTimeout(() => {
        img.src = variant.src;
        img.style.opacity = 1;
      }, 150);
    }

    if (variant.desc) {
      descEl.textContent = typeof variant.desc === "object" ? (variant.desc[currentLang] || variant.desc.pl) : variant.desc;
      descEl.style.display = "block";
    } else {
      descEl.style.display = "none";
    }
  }

  ["bokiSelect", "goraSelect", "grzywkaSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateImage);
  });

  updateImage();
  document.getElementById("backBtn").addEventListener("click", () => window.location.href = "index.html");

  // --- OBSŁUGA ZMIANY JĘZYKA ---
  const handleLanguageChange = () => {
    if (window.location.pathname.includes("details.html")) {
      // Przeładuj stronę, by odświeżyć tłumaczenia
      window.location.reload();
    }
  };

  window.addEventListener("languageChanged", handleLanguageChange);

  // Pierwsze wywołanie updateLanguage
  await new Promise(r => setTimeout(r, 50));
  updateLanguage();
});