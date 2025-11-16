// === builder.js – WIELE DOPASOWAŃ + SWIPE + STRZAŁKI ===
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof updateLanguage !== "function") {
    await new Promise(resolve => {
      const check = () => (typeof updateLanguage === "function" ? resolve() : setTimeout(check, 50));
      check();
    });
  }

  const selects = {
    boki: document.getElementById("bokiSelect"),
    gora: document.getElementById("goraSelect"),
    grzywka: document.getElementById("grzywkaSelect"),
    style: document.getElementById("styleSelect")
  };

  const result = {
    section: document.getElementById("resultSection"),
    card: document.getElementById("resultCard"),
    name: document.getElementById("resultName"),
    desc: document.getElementById("resultDesc"),
    variantDesc: document.getElementById("variantDesc"),
    img: document.getElementById("previewImg"),
    spinner: document.getElementById("loadingSpinner"),
    viewBtn: document.getElementById("viewDetailsBtn"),
    noMatch: document.getElementById("noMatch"),
    // NOWE
    counter: null,
    prevBtn: null,
    nextBtn: null
  };

  let hairstyles = [];
  let matches = [];
  let currentIndex = 0;
  const DEFAULT_IMAGE = "./images/haircut.jpg";
  let currentLang = "pl";

  try {
    const res = await fetch("hairstyles.json");
    hairstyles = await res.json();
  } catch (err) {
    console.error("Błąd ładowania hairstyles.json:", err);
    alert("Nie udało się załadować fryzur.");
    return;
  }

  const unique = arr => [...new Set(arr.flat().filter(Boolean))];
  const allBoki = unique(hairstyles.map(h => h.boki));
  const allGora = unique(hairstyles.map(h => h.gora));
  const allGrzywka = unique(hairstyles.map(h => h.grzywka));
  const allStyles = unique(hairstyles.map(h => h.style));

  function populateSelect(select, options) {
    select.innerHTML = `<option value="">${t("filter_any")}</option>`;
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = t(`filter_${opt}`) || opt;
      select.appendChild(option);
    });
  }

  populateSelect(selects.boki, allBoki);
  populateSelect(selects.gora, allGora);
  populateSelect(selects.grzywka, allGrzywka);
  populateSelect(selects.style, allStyles);

  // === FUNKCJA: pierwsze dostępne zdjęcie ===
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

  // === FUNKCJA: znajdź zdjęcie z pełną logiką fallbacków ===
  function getImage(hairstyle, boki, gora, grzywka) {
    const key = `${boki}_${gora}_${grzywka}`;
    const images = hairstyle.images || {};

    let src = "", desc = null;

    if (images[key]) {
      const img = images[key];
      src = typeof img === "string" ? img : (img.src || "");
      desc = typeof img === "object" ? img.desc : null;
    }

    if (!src && images.default) {
      const def = images.default;
      src = typeof def === "string" ? def : (def.src || "");
      desc = typeof def === "object" ? def.desc : null;
    }

    if (!src) {
      const first = getFirstAvailableImage(images);
      if (first) {
        src = first.src;
        desc = first.desc;
      }
    }

    if (!src) src = DEFAULT_IMAGE;

    return { src, desc };
  }

  // === WYŚWIETL DOPASOWANIE ===
  async function displayMatch(index) {
    if (!matches.length) return;

    const match = matches[index];
    currentIndex = index;

    // Aktualizacja tekstów
    currentLang = window.currentLang ? window.currentLang() : "pl";
    result.name.textContent = match.name[currentLang] || match.name.pl || match.name;
    result.desc.textContent = match.description[currentLang] || match.description.pl || "";

    // Zdjęcie
    const boki = selects.boki.value || match.boki?.[0] || "";
    const gora = selects.gora.value || match.gora?.[0] || "";
    const grzywka = selects.grzywka.value || match.grzywka?.[0] || "";

    const imgData = getImage(match, boki, gora, grzywka);

    result.spinner.style.display = "block";
    result.img.style.opacity = 0;

    const newImg = new Image();
    newImg.src = imgData.src;

    await new Promise(resolve => {
      newImg.onload = () => {
        result.img.src = newImg.src;
        result.img.style.opacity = 1;
        result.spinner.style.display = "none";
        resolve();
      };
      newImg.onerror = () => {
        result.img.src = DEFAULT_IMAGE;
        result.img.style.opacity = 1;
        result.spinner.style.display = "none";
        resolve();
      };
    });

    const descText = imgData.desc?.[currentLang] || imgData.desc?.pl || "";
    result.variantDesc.textContent = descText;
    result.variantDesc.style.display = descText ? "block" : "none";

    // Licznik
    result.counter.textContent = `${index + 1} / ${matches.length}`;

    // Strzałki
    result.prevBtn.disabled = index === 0;
    result.nextBtn.disabled = index === matches.length - 1;

    // Przycisk szczegółów
    result.viewBtn.onclick = () => {
      localStorage.setItem("selectedHairstyle", JSON.stringify(match));
      window.location.href = "details.html";
    };
  }

  // === ZNAJDŹ DOPASOWANIA ===
  async function findMatch() {
    const values = {
      boki: selects.boki.value,
      gora: selects.gora.value,
      grzywka: selects.grzywka.value,
      style: selects.style.value
    };

    matches = hairstyles.filter(h =>
      (!values.boki || h.boki?.includes(values.boki)) &&
      (!values.gora || h.gora?.includes(values.gora)) &&
      (!values.grzywka || h.grzywka?.includes(values.grzywka)) &&
      (!values.style || h.style?.includes(values.style))
    );

    // Usuń poprzednie elementy nawigacji
    if (result.counter) {
      result.counter.remove();
      result.prevBtn?.remove();
      result.nextBtn?.remove();
    }

    if (matches.length === 0) {
      result.section.style.display = "block";
      result.card.style.display = "none";
      result.noMatch.style.display = "block";
      result.noMatch.textContent = t("builder_no_match");
      result.viewBtn.style.display = "none";
      return;
    }

    result.section.style.display = "block";
    result.card.style.display = "block";
    result.noMatch.style.display = "none";

    // Dodaj nawigację tylko jeśli >1
    if (matches.length > 1) {
      // Licznik
      result.counter = document.createElement("p");
      result.counter.className = "match-counter";
      result.counter.style.cssText = "text-align:center; margin:0.5rem 0; color:#666; font-size:0.9rem;";
      result.card.parentNode.insertBefore(result.counter, result.card);

      // Strzałki
      const nav = document.createElement("div");
      nav.className = "match-nav";
      nav.style.cssText = "display:flex; justify-content:center; gap:1rem; margin-top:0.5rem;";

      result.prevBtn = document.createElement("button");
      result.prevBtn.innerHTML = "&#9664;";
      result.prevBtn.className = "nav-arrow";
      result.prevBtn.title = t("builder_prev") || "Poprzedni";

      result.nextBtn = document.createElement("button");
      result.nextBtn.innerHTML = "&#9654;";
      result.nextBtn.className = "nav-arrow";
      result.nextBtn.title = t("builder_next") || "Następny";

      nav.appendChild(result.prevBtn);
      nav.appendChild(result.nextBtn);
      result.card.parentNode.insertBefore(nav, result.viewBtn);

      // Obsługa strzałek
      result.prevBtn.onclick = () => {
        if (currentIndex > 0) displayMatch(currentIndex - 1);
      };
      result.nextBtn.onclick = () => {
        if (currentIndex < matches.length - 1) displayMatch(currentIndex + 1);
      };

      // Swipe (mobile)
      let touchStartX = 0;
      result.card.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      result.card.addEventListener("touchend", e => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0 && currentIndex < matches.length - 1) {
            displayMatch(currentIndex + 1);
          } else if (diff < 0 && currentIndex > 0) {
            displayMatch(currentIndex - 1);
          }
        }
      }, { passive: true });
    } else {
      result.viewBtn.style.display = "block";
    }

    currentIndex = 0;
    displayMatch(0);
    updateLanguage();
  }

  // === OBSŁUGA ZMIAN ===
  Object.values(selects).forEach(sel => sel.addEventListener("change", findMatch));

  // === ZMIANA JĘZYKA ===
  window.addEventListener("languageChanged", () => {
    currentLang = window.currentLang ? window.currentLang() : "pl";

    populateSelect(selects.boki, allBoki);
    populateSelect(selects.gora, allGora);
    populateSelect(selects.grzywka, allGrzywka);
    populateSelect(selects.style, allStyles);

    const prev = {
      boki: selects.boki.value,
      gora: selects.gora.value,
      grzywka: selects.grzywka.value,
      style: selects.style.value
    };

    findMatch();

    // Przywróć wybory
    Object.keys(prev).forEach(key => {
      if (prev[key]) selects[key].value = prev[key];
    });
  });

  // === INICJALIZACJA ===
  findMatch();
  updateLanguage();
});