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

    const filtered = data.filter(item => {
      const matchLength = !lengthVal || item.length === lengthVal;
      const matchStyle = !styleVal || item.style === styleVal;
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

// === WALIDACJA OBRAZÓW (dostosowana do obiektu images) ===
async function loadValidImages(imageObj) {
  const DEFAULT_IMAGE = "./images/haircut.jpg";
  const validImages = [];

  for (const key in imageObj) {
    const data = imageObj[key];
    const src = typeof data === "string" ? data : data.src;
    if (!src || src.trim() === "") continue;

    const img = new Image();
    img.src = src.trim();

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        setTimeout(() => reject(), 5000);
      });
      validImages.push({ key, src: img.src, desc: typeof data === "object" ? data.desc : null });
    } catch (e) {
      // pomijamy nieistniejące
    }
  }

  return validImages.length > 0 ? validImages : [{ key: "default", src: DEFAULT_IMAGE, desc: null }];
}

// === WYŚWIETLANIE FRYZUR ===
async function displayHairstyles(list) {
  const container = document.getElementById("hairstyleContainer");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p style='text-align:center; color:#aaa; grid-column:1/-1;'>Brak fryzur spełniających kryteria.</p>";
    return;
  }

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    // Domyślny klucz
    const defaultKey = `${item.boki}_${item.gora}_${item.grzywka}`;
    const imageObj = item.images || {};
    const validImages = await loadValidImages(imageObj);

    // Znajdź domyślny obraz
    let defaultVariant = validImages.find(v => v.key === defaultKey);
    if (!defaultVariant && validImages.length > 0) {
      defaultVariant = validImages[0];
    } else if (!defaultVariant) {
      defaultVariant = { src: "./images/haircut.jpg", desc: null };
    }

    let galleryHTML = `
      <div class="gallery">
        <img src="${defaultVariant.src}" alt="${item.name}" class="active" loading="lazy">
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

    card.innerHTML = `
      ${galleryHTML}
      <h3>${item.name}</h3>
      <p><strong>Długość:</strong> ${item.length}</p>
      <p><strong>Styl:</strong> ${item.style}</p>
      <p>${item.description}</p>
    `;

    // Kliknięcie → szczegóły
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

// === GALERIA ===
function initGallery(card, images) {
  const gallery = card.querySelector('.gallery');
  const img = card.querySelector('.gallery img');
  const desc = card.querySelector('.variant-desc-small');
  const dots = card.querySelectorAll('.gallery-dots .dot');
  const prevBtn = card.querySelector('.gallery-nav.prev');
  const nextBtn = card.querySelector('.gallery-nav.next');

  let currentIndex = 0;

  function showImage(index) {
    const variant = images[index];
    img.src = variant.src;
    if (desc) {
      desc.textContent = variant.desc || "";
      desc.style.display = variant.desc ? "block" : "none";
    }
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentIndex = index;
  }

  function nextImage() {
    showImage((currentIndex + 1) % images.length);
  }

  function prevImage() {
    showImage((currentIndex - 1 + images.length) % images.length);
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextImage();
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevImage();
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(i);
    });
  });

  gallery.addEventListener('click', (e) => {
    if (e.target.closest('.gallery-nav') || e.target.closest('.gallery-dots')) return;
    nextImage();
  });

  card.tabIndex = 0;
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });
}

// === START ===
loadHairstyles();