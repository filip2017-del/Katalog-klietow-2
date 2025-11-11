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

  await applyFilters(); // pierwsze wyświetlenie
}

// === WALIDACJA OBRAZÓW ===
async function loadValidImages(imagePaths) {
  const DEFAULT_IMAGE = "./images/haircut.jpg";
  const validImages = [];

  for (const src of imagePaths) {
    if (!src || src.trim() === "") continue;

    const img = new Image();
    img.src = src.trim();

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        setTimeout(() => reject(), 5000); // timeout 5s
      });
      validImages.push(img.src);
    } catch (e) {
      // pomijamy nieistniejące
    }
  }

  return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
}

// === WYŚWIETLANIE FRYZUR ===
async function displayHairstyles(list) {
  const container = document.getElementById("hairstyleContainer");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>Brak fryzur spełniających kryteria.</p>";
    return;
  }

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    const rawImages = (item.images || [])
      .filter(src => src && src.trim() !== "")
      .map(src => src.trim());

    const validImages = await loadValidImages(rawImages);

    let galleryHTML = `
      <div class="gallery">
        ${validImages.map((src, i) => `
          <img src="${src}" alt="${item.name}" ${i === 0 ? 'class="active"' : ''} loading="lazy">
        `).join('')}
        
        ${validImages.length > 1 ? `
          <button class="gallery-nav prev" aria-label="Poprzednie zdjęcie">‹</button>
          <button class="gallery-nav next" aria-label="Następne zdjęcie">›</button>
          <div class="gallery-dots">
            ${validImages.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    card.innerHTML = `
      ${galleryHTML}
      <h3>${item.name}</h3>
      <p><strong>Długość:</strong> ${item.length}</p>
      <p><strong>Styl:</strong> ${item.style}</p>
      <p>${item.description}</p>
    `;

    // === NOWA FUNKCJA: kliknięcie w kartę otwiera szczegóły ===
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

// === GALERIA ZDJĘĆ (nawigacja, dotyk, klawiatura) ===
function initGallery(card, images) {
  const gallery = card.querySelector('.gallery');
  const imgs = card.querySelectorAll('.gallery img');
  const dots = card.querySelectorAll('.gallery-dots .dot');
  const prevBtn = card.querySelector('.gallery-nav.prev');
  const nextBtn = card.querySelector('.gallery-nav.next');

  let currentIndex = 0;
  let startX = 0;
  let isSwiping = false;

  function showImage(index) {
    imgs.forEach((img, i) => img.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentIndex = index;
  }

  function nextImage() {
    showImage((currentIndex + 1) % images.length);
  }

  function prevImage() {
    showImage((currentIndex - 1 + images.length) % images.length);
  }

  // Przyciski
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

  // Dotyk (mobile)
  gallery.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    gallery.classList.add('swiping');
  });

  gallery.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    e.preventDefault();
  }, { passive: false });

  gallery.addEventListener('touchend', (event) => {
    if (!isSwiping) return;
    const endX = event.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextImage() : prevImage();
    }
    isSwiping = false;
    gallery.classList.remove('swiping');
  });

  // Kliknięcie w zdjęcie przełącza na kolejne
  gallery.addEventListener('click', (e) => {
    if (e.target.closest('.gallery-nav')) return;
    if (e.target.tagName === 'IMG') {
      nextImage();
    }
  });

  // Obsługa klawiatury
  card.tabIndex = 0;
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });
}

// === START ===
loadHairstyles();
