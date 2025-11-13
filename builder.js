// === builder.js – wersja dla neutralnych wartości JSON ===
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
    noMatch: document.getElementById("noMatch")
  };

  let hairstyles = [];
  let currentMatch = null;
  const DEFAULT_IMAGE = "./images/haircut.jpg";

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

  function populateSelect(select, options, type) {
    select.innerHTML = `<option value="">${t("filter_any")}</option>`;
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = t(`filter_${opt}`) || opt;
      select.appendChild(option);
    });
  }

  populateSelect(selects.boki, allBoki, "boki");
  populateSelect(selects.gora, allGora, "gora");
  populateSelect(selects.grzywka, allGrzywka, "grzywka");
  populateSelect(selects.style, allStyles, "style");

  function getImage(hairstyle, boki, gora, grzywka) {
    const key = `${boki}_${gora}_${grzywka}`;
    if (hairstyle.images?.[key]) return hairstyle.images[key];
    return Object.values(hairstyle.images || {})[0] || { src: DEFAULT_IMAGE };
  }

  async function findMatch() {
    const values = {
      boki: selects.boki.value,
      gora: selects.gora.value,
      grzywka: selects.grzywka.value,
      style: selects.style.value
    };

    const matches = hairstyles.filter(h =>
      (!values.boki || h.boki.includes(values.boki)) &&
      (!values.gora || h.gora.includes(values.gora)) &&
      (!values.grzywka || h.grzywka.includes(values.grzywka)) &&
      (!values.style || h.style.includes(values.style))
    );

    if (matches.length === 0) {
      result.section.style.display = "block";
      result.card.style.display = "none";
      result.noMatch.style.display = "block";
      result.noMatch.textContent = t("builder_no_match");
      result.viewBtn.style.display = "none";
      return;
    }

    currentMatch = matches[0];
    result.section.style.display = "block";
    result.card.style.display = "block";
    result.noMatch.style.display = "none";
    result.viewBtn.style.display = "block";

    result.name.textContent = currentMatch.name[currentLang] || currentMatch.name.pl;
    result.desc.textContent = currentMatch.description[currentLang] || currentMatch.description.pl;
    result.viewBtn.textContent = t("builder_view_details");

    const imgData = getImage(currentMatch,
      values.boki || currentMatch.boki[0],
      values.gora || currentMatch.gora[0],
      values.grzywka || currentMatch.grzywka[0]
    );

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

    result.variantDesc.textContent =
      imgData.desc?.[currentLang] || imgData.desc?.pl || "";
    result.variantDesc.style.display = imgData.desc ? "block" : "none";

    updateLanguage();
  }

  Object.values(selects).forEach(sel => sel.addEventListener("change", findMatch));
  result.viewBtn.addEventListener("click", () => {
    if (!currentMatch) return;
    localStorage.setItem("selectedHairstyle", JSON.stringify(currentMatch));
    window.location.href = "details.html";
  });

  window.addEventListener("languageChanged", () => {
    populateSelect(selects.boki, allBoki);
    populateSelect(selects.gora, allGora);
    populateSelect(selects.grzywka, allGrzywka);
    populateSelect(selects.style, allStyles);
    findMatch();
  });

  findMatch();
  updateLanguage();
});
