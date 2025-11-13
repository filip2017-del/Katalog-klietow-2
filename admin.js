// admin.js – Z PRZYCISKIEM ZAPISU ZMIAN
document.addEventListener("DOMContentLoaded", async () => {
  await waitForLang();
  let hairstyles = [];
  let originalHairstyles = [];
  let editingId = null;
  let hasUnsavedChanges = false;

  const listEl = document.getElementById("hairstylesList");
  const formEl = document.getElementById("editorForm");
  const formTitle = document.getElementById("formTitle");
  const form = document.getElementById("hairstyleForm");
  const addBtn = document.getElementById("addNewBtn");
  const cancelBtn = document.getElementById("cancelEdit");
  const imagesContainer = document.getElementById("imagesContainer");
  const saveBtn = document.getElementById("saveChangesBtn");
  const saveContainer = document.getElementById("saveChangesContainer");
  const changesStatus = document.getElementById("changesStatus");

  const options = {
    style: ["classic", "modern", "sport", "alternative", "retro", "natural", "military"],
    boki: ["high_fade", "mid_fade", "low_fade", "burst_fade", "taper", "undercut"],
    gora: ["short", "medium", "long", "textured", "voluminous", "spiky"],
    grzywka: ["none", "straight", "curtain", "side", "textured"],
    faceShapes: ["oval", "round", "square", "triangle", "diamond"],
    hairType: ["straight", "wavy", "curly"]
  };

  // === Ładowanie fryzur ===
  async function loadHairstyles() {
    try {
      const res = await fetch("hairstyles.json");
      hairstyles = await res.json();
      originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
      renderList();
      resetChanges();
    } catch (err) {
      listEl.innerHTML = `<p style="color: #f66;">Błąd ładowania: ${err.message}</p>`;
    }
  }

  // === Renderowanie listy z drag & drop ===
  function renderList() {
    listEl.innerHTML = hairstyles.length === 0
      ? `<p style="color: #aaa; text-align: center;">Brak fryzur. Dodaj pierwszą!</p>`
      : hairstyles.map((h, i) => `
        <div class="hairstyle-card" draggable="true" data-index="${i}">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${getDefaultImage(h)}" alt="${h.name?.pl || 'Brak'}" onerror="this.src='./images/haircut.jpg'" />
            <div>
              <strong>${h.name?.pl || "Brak nazwy"}</strong><br>
              <small>
                ${h.length || "?"} • 
                ${translateArray(h.style, 'filter') || "brak stylu"}
              </small>
            </div>
          </div>
          <div class="hairstyle-actions">
            <button onclick="editHairstyle(${i})" class="save-btn">Edytuj</button>
            <button onclick="deleteHairstyle(${i})" style="background:#c33;">Usuń</button>
          </div>
        </div>
      `).join("");

    // === DRAG & DROP ===
    const cards = listEl.querySelectorAll(".hairstyle-card");
    let dragged = null;

    cards.forEach(card => {
      card.addEventListener("dragstart", (e) => {
        dragged = card;
        setTimeout(() => card.classList.add("dragging"), 0);
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        dragged = null;
        markChanged();
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        card.classList.add("drag-over");
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");

        if (dragged && dragged !== card) {
          const fromIndex = parseInt(dragged.dataset.index);
          const toIndex = parseInt(card.dataset.index);

          const [moved] = hairstyles.splice(fromIndex, 1);
          hairstyles.splice(toIndex, 0, moved);

          renderList();
        }
      });
    });
  }

  // === Śledzenie zmian ===
  function markChanged() {
    if (!hasUnsavedChanges) {
      hasUnsavedChanges = true;
      saveContainer.style.display = "block";
      saveBtn.classList.add("enabled");
      saveBtn.disabled = false;
      changesStatus.textContent = "Masz niezapisane zmiany";
    }
  }

  function resetChanges() {
    hasUnsavedChanges = false;
    saveContainer.style.display = "none";
    saveBtn.classList.remove("enabled");
    saveBtn.disabled = true;
    changesStatus.textContent = "";
  }

  // === Zapis ===
  async function saveToFile() {
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hairstyles, null, 2));
    const a = document.createElement("a");
    a.href = data;
    a.download = "hairstyles.json";
    a.click();

    // Powiadomienie
    const notif = document.createElement("div");
    notif.className = "save-notification";
    notif.textContent = "Zapisano hairstyles.json";
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);

    // Reset
    originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
    resetChanges();
  }

  // === Przycisk zapisu zmian ===
  saveBtn.addEventListener("click", () => {
    if (hasUnsavedChanges) {
      saveToFile();
    }
  });

  function getDefaultImage(h) {
    if (!h?.images) return "./images/haircut.jpg";
    return h.images.default?.src || Object.values(h.images)[0]?.src || "./images/haircut.jpg";
  }

  function createCheckboxes(containerId, values, selected = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = values.map(val => `
      <label><input type="checkbox" value="${val}" ${selected.includes(val) ? "checked" : ""}> ${translateValue(val, 'filter')}</label>
    `).join("");
  }

  document.getElementById("addImage").addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "image-row";
    row.innerHTML = `
      <input type="text" placeholder="Klucz (np. high_fade_short_none)" class="image-key" />
      <input type="text" placeholder="Ścieżka do obrazu" class="image-src" />
      <input type="text" placeholder="Opis obrazu (PL)" class="image-desc-pl" />
      <button type="button" class="remove-image">Usuń</button>
    `;
    imagesContainer.appendChild(row);
    row.querySelector(".remove-image").addEventListener("click", () => row.remove());
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: { pl: get("namePl"), en: get("nameEn"), ua: get("nameUa") },
      length: get("length"),
      style: getChecked("styleCheckboxes"),
      boki: getChecked("bokiCheckboxes"),
      gora: getChecked("goraCheckboxes"),
      grzywka: getChecked("grzywkaCheckboxes"),
      faceShapes: getChecked("faceCheckboxes"),
      hairType: getChecked("hairCheckboxes"),
      description: { pl: get("descPl"), en: get("descEn"), ua: get("descUa") },
      images: {}
    };

    document.querySelectorAll(".image-row").forEach(row => {
      const key = row.querySelector(".image-key").value.trim();
      const src = row.querySelector(".image-src").value.trim();
      const descPl = row.querySelector(".image-desc-pl").value.trim();
      if (key && src) {
        data.images[key] = { src };
        if (descPl) data.images[key].desc = { pl: descPl };
      }
    });

    if (!data.images.default && Object.keys(data.images).length > 0) {
      data.images.default = Object.values(data.images)[0];
    }

    if (editingId === null) {
      hairstyles.push(data);
    } else {
      hairstyles[editingId] = data;
    }

    await saveToFile();
    closeForm();
    loadHairstyles();
  });

  function get(id) { return document.getElementById(id).value.trim(); }
  function getChecked(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(cb => cb.value);
  }

  window.editHairstyle = function(index) {
    const h = hairstyles[index];
    editingId = index;
    formTitle.textContent = "Edytuj fryzurę";
    formEl.style.display = "block";
    addBtn.style.display = "none";

    set("namePl", h.name?.pl);
    set("nameEn", h.name?.en);
    set("nameUa", h.name?.ua);
    set("length", h.length);
    set("descPl", h.description?.pl);
    set("descEn", h.description?.en);
    set("descUa", h.description?.ua);

    createCheckboxes("styleCheckboxes", options.style, h.style || []);
    createCheckboxes("bokiCheckboxes", options.boki, h.boki || []);
    createCheckboxes("goraCheckboxes", options.gora, h.gora || []);
    createCheckboxes("grzywkaCheckboxes", options.grzywka, h.grzywka || []);
    createCheckboxes("faceCheckboxes", options.faceShapes, h.faceShapes || []);
    createCheckboxes("hairCheckboxes", options.hairType, h.hairType || []);

    imagesContainer.innerHTML = "";
    Object.entries(h.images || {}).forEach(([key, img]) => {
      const row = document.createElement("div");
      row.className = "image-row";
      row.innerHTML = `
        <input type="text" value="${key}" class="image-key" />
        <input type="text" value="${img.src}" class="image-src" />
        <input type="text" value="${img.desc?.pl || ''}" class="image-desc-pl" />
        <button type="button" class="remove-image">Usuń</button>
      `;
      imagesContainer.appendChild(row);
      row.querySelector(".remove-image").addEventListener("click", () => row.remove());
    });
  };

  function set(id, value) { document.getElementById(id).value = value || ""; }

  window.deleteHairstyle = async function(index) {
    if (confirm("Na pewno usunąć?")) {
      hairstyles.splice(index, 1);
      await saveToFile();
      loadHairstyles();
    }
  };

  cancelBtn.addEventListener("click", closeForm);
  function closeForm() {
    formEl.style.display = "none";
    addBtn.style.display = "block";
    form.reset();
    editingId = null;
    imagesContainer.innerHTML = `<div class="image-row">
      <input type="text" placeholder="default" class="image-key" value="default" />
      <input type="text" placeholder="./images/nowa.jpg" class="image-src" />
      <input type="text" placeholder="Opis domyślny" class="image-desc-pl" />
      <button type="button" class="remove-image">Usuń</button>
    </div>`;
  }

  addBtn.addEventListener("click", () => {
    editingId = null;
    formTitle.textContent = "Dodaj nową fryzurę";
    formEl.style.display = "block";
    addBtn.style.display = "none";
    form.reset();

    Object.keys(options).forEach(key => {
      createCheckboxes(key + "Checkboxes", options[key], []);
    });

    imagesContainer.innerHTML = `<div class="image-row">
      <input type="text" placeholder="default" class="image-key" value="default" />
      <input type="text" placeholder="./images/nowa.jpg" class="image-src" />
      <input type="text" placeholder="Opis domyślny" class="image-desc-pl" />
      <button type="button" class="remove-image">Usuń</button>
    </div>`;
  });

  loadHairstyles();
  updateLanguage();
});

async function waitForLang() {
  return new Promise(resolve => {
    const check = () => (window.t && window.translateArray ? resolve() : setTimeout(check, 50));
    check();
  });
}