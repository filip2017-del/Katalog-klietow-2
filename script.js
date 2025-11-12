// === GŁÓWNA FUNKCJA ===
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

    const styleMap = {
      naturalny: "casual",
      klasyczny: "classic",
      nowoczesny: "modern",
      sportowy: "sportowy",
      alternatywny: "alternatywny",
      retro: "retro",
      wojskowy: "wojskowy"
    };

    const filtered = data.filter(item => {
      const matchLength = !lengthVal || item.length === lengthVal;
      const matchStyle =
        !styleVal ||
        item.style === styleVal ||
        item.style === styleMap[styleVal];
      const matchFace = !faceVal || item.faceShapes.includes(faceVal);
      return matchLength && matchStyle && matchFace;
    });

    await displayHairstyles(filtered);
  }

  lengthFilter.addEventListener("change", applyFilters);
  styleFilter.addEventListener("change", applyFilters);
  faceFilter.addEventListener("change", applyFilters);

  await applyFilters();
}

// === WALIDACJA OBRAZÓW ===
async function loadValidImages(imageObj) {
  const DEFAULT_IMAGE = "./images/haircut.jpg";
  const validImages = [];

  const entries = Object.entries(imageObj);
  await Promise.all(entries.map(async ([key, data]) => {
    const src = typeof data === "string" ? data : data.src;
    if (!src || src.trim() === "") return;

    const img = new Image();
    img.src = src.trim();
    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        setTimeout(() => reject(), 3000);
      });
      validImages.push({ key, src: img.src, desc: typeof data === "object" ? data.desc : null });
    } catch (_) {}
  }));

  return validImages.length > 0
    ? validImages
    : [{ key: "default", src: DEFAULT_IMAGE, desc: null }];
}

// === WYŚWIETLANIE FRYZUR ===
async function displayHairstyles(list) {
  const container = document.getElementById("hairstyleContainer");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p style='text-align:center; color:#aaa; grid-column:1/-1;'>${t("builder_no_match")}</p>`;
    return;
  }

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    const defaultKey = `${item.boki}_${item.gora}_${item.grzywka}`;
    const imageObj = item.images || {};
    const validImages = await loadValidImages(imageObj);

    let defaultVariant = validImages.find(v => v.key === defaultKey) || validImages[0];
    if (!defaultVariant) defaultVariant = { src: "./images/haircut.jpg", desc: null };

    let galleryHTML = `
      <div class="gallery">
        <img src="${defaultVariant.src}" alt="${typeof item.name === 'object' ? item.name[currentLang] : item.name}" class="active" loading="lazy">
        ${defaultVariant.desc ? `<p class="variant-desc-small">${defaultVariant.desc}</p>` : ""}
    `;

    if (validImages.length > 1) {
      galleryHTML += `
        <button class="gallery-nav prev" aria-label="Poprzednie zdjęcie">‹</button>
        <button class="gallery-nav next" aria-label="Następne zdjęcie">›</button>
        <div class="gallery-dots">
          ${validImages.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>
    `;
    } else {
      galleryHTML += `</div>`;
    }

    // tłumaczenia
    const nameText = typeof item.name === "object" ? (item.name[currentLang] || item.name.pl) : item.name;
    const descText = typeof item.description === "object" ? (item.description[currentLang] || item.description.pl) : item.description;

    const lengthTranslated = {
      "krótkie": t("filter_short"),
      "średnie": t("filter_medium"),
      "długie": t("filter_long")
    }[item.length] || item.length;

    const styleTranslated = {
      "klasyczny": t("filter_classic"),
      "nowoczesny": t("filter_modern"),
      "sportowy": t("filter_sport"),
      "alternatywny": t("filter_alternative"),
      "retro": t("filter_retro"),
      "naturalny": t("filter_natural"),
      "wojskowy": t("filter_military")
    }[item.style] || item.style;

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

    if (validImages.length > 1) setTimeout(() => initGallery(card, validImages), 0);
  }
}

// === GALERIA ===
function initGallery(card, images) {
  const img = card.querySelector('.gallery img');
  const desc = card.querySelector('.variant-desc-small');
  const dots = card.querySelectorAll('.gallery-dots .dot');
  const prevBtn = card.querySelector('.gallery-nav.prev');
  const nextBtn = card.querySelector('.gallery-nav.next');
  let currentIndex = 0;

  function showImage(i) {
    const variant = images[i];
    img.src = variant.src;
    if (desc) {
      desc.textContent = variant.desc || "";
      desc.style.display = variant.desc ? "block" : "none";
    }
    dots.forEach((d, n) => d.classList.toggle('active', n === i));
    currentIndex = i;
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', e => { e.stopPropagation(); showImage((currentIndex + 1) % images.length); });
    prevBtn.addEventListener('click', e => { e.stopPropagation(); showImage((currentIndex - 1 + images.length) % images.length); });
  }

  dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); showImage(i); }));

  card.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') showImage((currentIndex + 1) % images.length);
    if (e.key === 'ArrowLeft') showImage((currentIndex - 1 + images.length) % images.length);
  });
}

// === RELOAD PO ZMIANIE JĘZYKA ===
async function reloadContent() {
  await loadHairstyles();
}

// === START ===
loadHairstyles();
