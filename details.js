document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("detailsContainer");
  const item = JSON.parse(localStorage.getItem("selectedHairstyle"));

  if (!item) {
    container.innerHTML = "<p style='text-align:center; color:#aaa;'>Nie znaleziono danych fryzury.</p>";
    return;
  }

  document.getElementById("hairstyleName").textContent = item.name;

  // === 1. Warianty z images (obiekt z opcjonalnym desc) ===
  const variants = Object.keys(item.images || {}).map(key => {
    const [boki, gora, grzywka] = key.split("_");
    const data = item.images[key];
    return {
      boki,
      gora,
      grzywka,
      src: typeof data === "string" ? data : data.src,
      desc: typeof data === "object" ? data.desc : null
    };
  });

  if (variants.length === 0) {
    variants.push({ boki: item.boki, gora: item.gora, grzywka: item.grzywka, src: "./images/haircut.jpg" });
  }

  // === 2. Unikalne opcje ===
  const unique = (arr) => [...new Set(arr)];
  const bokiOptions = unique(variants.map(v => v.boki));
  const goraOptions = unique(variants.map(v => v.gora));
  const grzywkaOptions = unique(variants.map(v => v.grzywka));

  // === 3. Domyślny wariant ===
  const defaultKey = `${item.boki}_${item.gora}_${item.grzywka}`;
  const defaultVariant = variants.find(v => `${v.boki}_${v.gora}_${v.grzywka}` === defaultKey) || variants[0];

  // === 4. HTML z wariantami pod nazwą ===
  container.innerHTML = `
    <section class="details-gallery">
      <img id="mainImage" src="${defaultVariant.src}" alt="${item.name}" loading="lazy">
      <p id="variantDesc" class="variant-desc"></p>
    </section>

    <section class="details-info">
      <h2>${item.name}</h2>

      <!-- WARIANTY POD NAZWĄ -->
      <div class="variant-bar" id="variantBar"></div>

      <!-- PRZEŁĄCZNIKI -->
      <div class="variant-controls" id="variantControls"></div>

      <p><strong>Długość:</strong> ${item.length}</p>
      <p><strong>Styl:</strong> ${item.style}</p>
      <p><strong>Kształt twarzy:</strong> ${item.faceShapes?.join(", ") || "—"}</p>
      <p><strong>Typ włosów:</strong> ${item.hairType?.join(", ") || "—"}</p>
      <p>${item.description}</p>

      <button id="backBtn" class="back-btn">Powrót do katalogu</button>
    </section>
  `;

  // === 5. Pasek wariantów – tylko jeśli >1 opcja ===
  const variantBar = document.getElementById("variantBar");
  const items = [];

  if (bokiOptions.length > 1) {
    items.push(`
      <div class="variant-item">
        <svg class="variant-icon icon-sides" viewBox="0 0 24 24"><path d="M4 4h4v16H4V4zm6 0h4v16h-4V4zm6 0h4v16h-4V4z"/></svg>
        <span><strong>${item.boki}</strong> boki</span>
      </div>
    `);
  }

  if (goraOptions.length > 1) {
    items.push(`
      <div class="variant-item">
        <svg class="variant-icon icon-top" viewBox="0 0 24 24"><path d="M12 2L2 12h3v8h14v-8h3L12 2z"/></svg>
        <span><strong>${item.gora}</strong> góra</span>
      </div>
    `);
  }

  if (grzywkaOptions.length > 1) {
    items.push(`
      <div class="variant-item">
        <svg class="variant-icon icon-bangs" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-1.66 0-3 1.34-3 3h2c0-.55.45-1 1-1s1 .45 1 1h2c0-1.66-1.34-3-3-3z"/></svg>
        <span><strong>${item.grzywka}</strong> grzywka</span>
      </div>
    `);
  }

  if (items.length === 0) {
    variantBar.style.display = "none";
  } else {
    variantBar.innerHTML = items.join("");
  }

  // === 6. Selecty – tylko jeśli >1 opcja ===
  const controls = document.getElementById("variantControls");
  const selectHTML = [];

  if (bokiOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>Boki</label>
        <select id="bokiSelect">${bokiOptions.map(o => `<option value="${o}">${o}</option>`).join("")}</select>
      </div>
    `);
  }

  if (goraOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>Góra</label>
        <select id="goraSelect">${goraOptions.map(o => `<option value="${o}">${o}</option>`).join("")}</select>
      </div>
    `);
  }

  if (grzywkaOptions.length > 1) {
    selectHTML.push(`
      <div class="variant-group">
        <label>Grzywka</label>
        <select id="grzywkaSelect">${grzywkaOptions.map(o => `<option value="${o}">${o}</option>`).join("")}</select>
      </div>
    `);
  }

  if (selectHTML.length > 0) {
    controls.innerHTML = selectHTML.join("");
    if (bokiOptions.length > 1) document.getElementById("bokiSelect").value = defaultVariant.boki;
    if (goraOptions.length > 1) document.getElementById("goraSelect").value = defaultVariant.gora;
    if (grzywkaOptions.length > 1) document.getElementById("grzywkaSelect").value = defaultVariant.grzywka;
  } else {
    controls.style.display = "none";
  }

  // === 7. Aktualizacja obrazu + opis ===
  const descEl = document.getElementById("variantDesc");

  function updateImage() {
    const boki = document.getElementById("bokiSelect")?.value || item.boki;
    const gora = document.getElementById("goraSelect")?.value || item.gora;
    const grzywka = document.getElementById("grzywkaSelect")?.value || item.grzywka;

    const key = `${boki}_${gora}_${grzywka}`;
    const variant = variants.find(v => `${v.boki}_${v.gora}_${v.grzywka}` === key) || variants[0];
    const src = variant.src;
    const desc = variant.desc;

    const img = document.getElementById("mainImage");
    if (img.src !== src) {
      img.style.opacity = 0;
      setTimeout(() => {
        img.src = src;
        img.style.opacity = 1;
      }, 200);
    }

    if (desc) {
      descEl.textContent = desc;
      descEl.style.display = "block";
    } else {
      descEl.style.display = "none";
    }
  }

  ["bokiSelect", "goraSelect", "grzywkaSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateImage);
  });

  updateImage(); // pierwsze uruchomienie

  // Powrót
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});