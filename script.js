// === script.js — wersja z poprawioną galerią ===

async function loadHairstyles() {
  const res = await fetch("hairstyles.json");
  const data = await res.json();

  const lengthFilter = document.getElementById("lengthFilter");
  const styleFilter = document.getElementById("styleFilter");
  const faceFilter = document.getElementById("faceFilter");

  async function applyFilters() {
    const lengthVal = lengthFilter.value;
    const styleVal = styleFilter.value;
    const faceVal = faceFilter.value;

    const filtered = data.filter(item => {
      const matchLength = !lengthVal || item.length === lengthVal;
      const matchStyle = !styleVal || (Array.isArray(item.style) ? item.style.includes(styleVal) : item.style === styleVal);
      const matchFace = !faceVal || (Array.isArray(item.faceShapes) ? item.faceShapes.includes(faceVal) : item.faceShapes === faceVal);
      return matchLength && matchStyle && matchFace;
    });

    await displayHairstyles(filtered);
  }

  lengthFilter.addEventListener("change", applyFilters);
  styleFilter.addEventListener("change", applyFilters);
  faceFilter.addEventListener("change", applyFilters);

  await applyFilters();
}

// === WALIDACJA OBRAZÓW Z FALLBACKIEM ===
async function loadValidImages(imageObj) {
  const DEFAULT_IMAGE = "./images/haircut.jpg";
  const validImages = [];

  const entries = Object.entries(imageObj || {});
  for (const [key, data] of entries) {
    const src = typeof data === "string" ? data : data.src;
    if (!src || src.trim() === "") continue;

    const img = new Image();
    img.src = src.trim();

    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(reject, 3000);
      });
      validImages.push({ key, src: img.src, desc: typeof data === "object" ? data.desc : null });
    } catch (_) {
      /* ignoruj błędy */
    }
  }

  return validImages.length > 0 ? validImages : [{ key: "default", src: DEFAULT_IMAGE, desc: null }];
}

// === WYBÓR DOMYŚLNEGO OBRAZU ===
function getDefaultImage(item, validImages) {
  const boki = Array.isArray(item.boki) ? item.boki[0] : item.boki;
  const gora = Array.isArray(item.gora) ? item.gora[0] : item.gora;
  const grzywka = Array.isArray(item.grzywka) ? item.grzywka[0] : item.grzywka;

  const exactKey = `${boki}_${gora}_${grzywka}`;
  const exactMatch = validImages.find(v => v.key === exactKey);

  return exactMatch || validImages[0];
}

// === WYŚWIETLANIE FRYZUR ===
async function displayHairstyles(list) {
  const container = document.getElementById("hairstyleContainer");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p style='text-align:center; color:#aaa; grid-column:1/-1;'>${t("builder_no_match")}</p>`;
    return;
  }

  const currentLang = localStorage.getItem("lang") || "pl";

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    const imageObj = item.images || {};
    const validImages = await loadValidImages(imageObj);
    const defaultImage = getDefaultImage(item, validImages);

    const nameText = typeof item.name === "object" ? (item.name[currentLang] || item.name.pl) : item.name;
    const descText = typeof item.description === "object" ? (item.description[currentLang] || item.description.pl) : item.description;

    const lengthTranslated = translateValue(item.length, "filter");
    const styleTranslated = translateArray(item.style, "filter");

    let galleryHTML = `
      <div class="gallery">
        <img src="${defaultImage.src}" alt="${nameText}" loading="lazy">
    `;

    // POPRAWKA: osobne przyciski zamiast kontenera
    if (validImages.length > 1) {
      galleryHTML += `
        <button class="gallery-nav prev" aria-label="Poprzednie">‹</button>
        <button class="gallery-nav next" aria-label="Następne">›</button>
        <div class="gallery-dots">
          ${validImages.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </div>
      `;
    }

    galleryHTML += `</div>`;

    card.innerHTML = `
      ${galleryHTML}
      <h3>${nameText}</h3>
      <p><strong>${t("details_length")}</strong> ${lengthTranslated}</p>
      <p><strong>${t("details_style")}</strong> ${styleTranslated}</p>
      <p>${descText}</p>
    `;

    card.addEventListener("click", () => {
      localStorage.setItem("selectedHairstyle", JSON.stringify(item));
      window.location.href = "details.html";
    });

    container.appendChild(card);

    if (validImages.length > 1) {
      setTimeout(() => initGallery(card, validImages), 0);
    }
  }
}

// === GALERIA — POPRAWIONA ===
function initGallery(card, images) {
  const img = card.querySelector('.gallery img');
  const dots = card.querySelectorAll('.gallery-dots .dot');
  const prevBtn = card.querySelector('.gallery-nav.prev');
  const nextBtn = card.querySelector('.gallery-nav.next');
  let currentIndex = 0;

  function showImage(i) {
    img.src = images[i].src;
    dots.forEach((d, n) => d.classList.toggle('active', n === i));
    currentIndex = i;
  }

  nextBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showImage((currentIndex + 1) % images.length);
  });

  prevBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showImage((currentIndex - 1 + images.length) % images.length);
  });

  dots.forEach((dot, i) =>
    dot.addEventListener('click', e => {
      e.stopPropagation();
      showImage(i);
    })
  );
}

// === RELOAD PO ZMIANIE JĘZYKA ===
window.addEventListener("languageChanged", () => {
  loadHairstyles();
});

// === START ===
loadHairstyles();