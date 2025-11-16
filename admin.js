// admin.js – PEŁNA WERSJA Z EDYCJĄ POD KARTĄ + NAPRAWIONY ZAPIS + POPRAWNE TŁUMACZENIE DŁUGOŚCI NA LIŚCIE
document.addEventListener("DOMContentLoaded", async () => {
  await waitForLang();
  let hairstyles = [];
  let originalHairstyles = [];
  let editingId = null;
  let hasUnsavedChanges = false;
  let currentEditorInstance = null;

  const listEl = document.getElementById("hairstylesList");
  const addBtn = document.getElementById("addNewBtn");
  const saveBtn = document.getElementById("saveChangesBtn");
  const saveContainer = document.getElementById("saveChangesContainer");
  const changesStatus = document.getElementById("changesStatus");

  const options = {
    length: ["short","medium","long"],
    style: ["classic", "modern", "sport", "alternative", "retro", "natural", "military"],
    boki: [
      "high_fade", "mid_fade", "low_fade", "burst_fade", "taper",
      "undercut", "tapered_3mm", "classic_scissors", "creative"
    ],
    gora: ["short", "medium", "long", "textured", "voluminous", "spiky"],
    grzywka: ["none", "straight", "curtain", "side", "textured"],
    faceShapes: ["oval", "round", "square", "triangle", "diamond"],
    hairType: ["straight", "wavy", "curly"]
  };

  async function loadHairstyles() {
    try {
      const res = await fetch("hairstyles.json");
      hairstyles = await res.json();
      originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
      renderList();
      resetChanges();
    } catch (err) {
      listEl.innerHTML = `<p style="color:#f66;">Błąd ładowania: ${err.message}</p>`;
    }
  }

  function normalizeLengthArray(h) {
    if (!Array.isArray(h.length)) {
      h.length = h.length ? [h.length] : [];
    }
  }

  function renderList() {
    listEl.innerHTML = hairstyles.length === 0
      ? `<p style="color:#aaa;text-align:center;">Brak fryzur. Dodaj pierwszą!</p>`
      : hairstyles.map((h, i) => {
          normalizeLengthArray(h);
          const lengths = Array.isArray(h.length) ? h.length : [];
          const translatedLengths = (translateArray(lengths, 'filter') || "?").replace(/,/g, ', ');
          const translatedStyles = translateArray(h.style || [], 'filter') || "brak stylu";

          return `
            <div class="hairstyle-card" draggable="true" data-index="${i}">
              <div style="display:flex;align-items:center;gap:1rem;">
                <img src="${getDefaultImage(h)}" alt="${h.name?.pl||'Brak'}" onerror="this.src='./images/haircut.jpg'" />
                <div>
                  <strong>${h.name?.pl||"Brak nazwy"}</strong><br>
                  <small>${translatedLengths} • ${translatedStyles}</small>
                </div>
              </div>
              <div class="hairstyle-actions">
                <button onclick="editHairstyle(${i})" class="save-btn">Edytuj</button>
                <button onclick="deleteHairstyle(${i})" style="background:#c33;">Usuń</button>
              </div>
            </div>
          `;
        }).join("");

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const cards = listEl.querySelectorAll(".hairstyle-card");
    let dragged = null;
    cards.forEach(c => {
      c.addEventListener("dragstart", e => { dragged = c; setTimeout(() => c.classList.add("dragging"), 0); });
      c.addEventListener("dragend", () => { c.classList.remove("dragging"); dragged = null; markChanged(); });
      c.addEventListener("dragover", e => { e.preventDefault(); c.classList.add("drag-over"); });
      c.addEventListener("dragleave", () => c.classList.remove("drag-over"));
      c.addEventListener("drop", e => {
        e.preventDefault(); c.classList.remove("drag-over");
        if (dragged && dragged !== c) {
          const from = +dragged.dataset.index;
          const to = +c.dataset.index;
          const [m] = hairstyles.splice(from, 1);
          hairstyles.splice(to, 0, m);
          renderList();
        }
      });
    });
  }

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

  async function saveToFile() {
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hairstyles, null, 2));
    const a = document.createElement("a");
    a.href = data;
    a.download = "hairstyles.json";
    a.click();

    const notif = document.createElement("div");
    notif.className = "save-notification";
    notif.textContent = "Zapisano hairstyles.json";
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);

    originalHairstyles = JSON.parse(JSON.stringify(hairstyles));
    resetChanges();
  }
  saveBtn.addEventListener("click", () => hasUnsavedChanges && saveToFile());

  function getDefaultImage(h) {
    if (!h?.images) return "./images/haircut.jpg";
    if (h.images.default?.src) return h.images.default.src;
    return Object.values(h.images)[0]?.src || "./images/haircut.jpg";
  }

  window.editHairstyle = function (idx) {
    if (currentEditorInstance) {
      currentEditorInstance.remove();
      currentEditorInstance = null;
    }

    const h = hairstyles[idx];
    editingId = idx;

    const template = document.getElementById("editorFormTemplate");
    const clone = template.cloneNode(true);
    clone.id = "editorForm";
    clone.style.display = "block";

    const card = document.querySelector(`.hairstyle-card[data-index="${idx}"]`);
    card.after(clone);
    currentEditorInstance = clone;

    const form = clone.querySelector("#hairstyleForm");
    const formTitle = clone.querySelector("#formTitle");
    formTitle.textContent = "Edytuj fryzurę";
    addBtn.style.display = "none";

    setInClone(clone, "namePl", h.name?.pl);
    setInClone(clone, "nameEn", h.name?.en);
    setInClone(clone, "nameUa", h.name?.ua);
    createCheckboxesInClone(clone, "lengthCheckboxes", options.length, h.length || []);
    setInClone(clone, "length", h.length);
    setInClone(clone, "descPl", h.description?.pl);
    setInClone(clone, "descEn", h.description?.en);
    setInClone(clone, "descUa", h.description?.ua);

    createCheckboxesInClone(clone, "styleCheckboxes", options.style, h.style || []);
    createCheckboxesInClone(clone, "bokiCheckboxes", options.boki, h.boki || []);
    createCheckboxesInClone(clone, "goraCheckboxes", options.gora, h.gora || []);
    createCheckboxesInClone(clone, "grzywkaCheckboxes", options.grzywka, h.grzywka || []);
    createCheckboxesInClone(clone, "faceCheckboxes", options.faceShapes, h.faceShapes || []);
    createCheckboxesInClone(clone, "hairCheckboxes", options.hairType, h.hairType || []);

    const imagesContainer = clone.querySelector("#imagesContainer");
    imagesContainer.innerHTML = "";

    if (h.images?.default) {
      addImageRowToContainer(imagesContainer, "default", h.images.default.src || "", h.images.default.desc?.pl || "");
    }
    Object.entries(h.images || {}).forEach(([k, img]) => {
      if (k !== "default") {
        addImageRowToContainer(imagesContainer, k, img.src || "", img.desc?.pl || "");
      }
    });
    if (Object.keys(h.images || {}).length === 0) {
      addImageRowToContainer(imagesContainer, "default", "./images/haircut.jpg", "Opis domyślny");
    }

    const cancelBtn = clone.querySelector("#cancelEdit");
    cancelBtn.onclick = () => {
      clone.remove();
      currentEditorInstance = null;
      addBtn.style.display = "block";
      editingId = null;
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      await saveFormDataFromClone(clone, idx);
    };

    const addImageBtn = clone.querySelector("#addImage");
    if (addImageBtn) {
      addImageBtn.onclick = () => {
        const available = generateAvailableKeysFromClone(clone);
        const firstKey = available[0] || "default";
        addImageRowToContainer(imagesContainer, firstKey, "./images/haircut.jpg", "Opis domyślny");
        markChanged();
      };
    }

    attachCheckboxListenersToClone(clone);
    refreshImageKeySelectsInClone(clone);
  };

  // === FUNKCJE POMOCNICZE ===
  function setInClone(clone, id, value) {
    const el = clone.querySelector(`#${id}`);
    if (el) el.value = value || "";
  }

  function createCheckboxesInClone(clone, containerId, values, selected = []) {
    const container = clone.querySelector(`#${containerId}`);
    if (!container) return;
    container.innerHTML = values.map(v => `
      <label><input type="checkbox" value="${v}" ${selected.includes(v)?"checked":""}> ${translateValue(v,'filter')}</label>
    `).join("");
  }

  function getCheckedFromClone(clone, id) {
    const container = clone.querySelector(`#${id}`);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  function getFromClone(clone, id) {
    const el = clone.querySelector(`#${id}`);
    return el ? el.value.trim() : "";
  }

  function generateAvailableKeysFromClone(clone) {
    const keys = new Set();
    const selectedBoki = getCheckedFromClone(clone, "bokiCheckboxes");
    const selectedGora = getCheckedFromClone(clone, "goraCheckboxes");
    const selectedGrzywka = getCheckedFromClone(clone, "grzywkaCheckboxes");

    if (selectedBoki.length && selectedGora.length && selectedGrzywka.length) {
      selectedBoki.forEach(b => {
        selectedGora.forEach(g => {
          selectedGrzywka.forEach(gr => {
            keys.add(`${b}_${g}_${gr}`);
          });
        });
      });
    }

    if (keys.size === 0) keys.add("default");
    return Array.from(keys).sort();
  }

  function refreshImageKeySelectsInClone(clone) {
    const available = generateAvailableKeysFromClone(clone);
    const hasDefaultInData = editingId !== null && hairstyles[editingId]?.images?.default;

    clone.querySelectorAll(".image-row").forEach(row => {
      const select = row.querySelector(".image-key");
      const current = select.value;
      const srcInput = row.querySelector(".image-src");
      const isDefaultRow = srcInput && srcInput.value.includes("default");

      const finalAvailable = [...new Set([...available, ...(hasDefaultInData || isDefaultRow ? ["default"] : [])])].sort();

      select.innerHTML = finalAvailable.map(k =>
        `<option value="${k}" ${k === current ? "selected" : ""}>${k}</option>`
      ).join("");

      if (!finalAvailable.includes(current) && finalAvailable.length > 0) {
        select.value = finalAvailable[0];
      }
    });
  }

  function attachCheckboxListenersToClone(clone) {
    ["bokiCheckboxes", "goraCheckboxes", "grzywkaCheckboxes"].forEach(id => {
      const container = clone.querySelector(`#${id}`);
      if (container) {
        container.removeEventListener("change", container._refreshHandler);
        container._refreshHandler = () => {
          refreshImageKeySelectsInClone(clone);
          markChanged();
        };
        container.addEventListener("change", container._refreshHandler);
      }
    });
  }

  function addImageRowToContainer(container, selectedKey = "default", src = "", descPl = "") {
    const row = document.createElement("div");
    row.className = "image-row";

    const available = generateAvailableKeysFromClone(container.closest('.editor-form') || document);
    const hasDefaultInData = editingId !== null && hairstyles[editingId]?.images?.default;
    const finalAvailable = [...new Set([...available, ...(hasDefaultInData || selectedKey === "default" ? ["default"] : [])])].sort();

    const optionsHtml = finalAvailable.map(k =>
      `<option value="${k}" ${k === selectedKey ? "selected" : ""}>${k}</option>`
    ).join("");

    row.innerHTML = `
      <select class="image-key">${optionsHtml}</select>
      <div class="src-with-preview">
        <input type="text" value="${src || './images/haircut.jpg'}" placeholder="Ścieżka do obrazu" class="image-src" />
        <button type="button" class="preview-btn" title="Podgląd zdjęcia">Podgląd</button>
      </div>
      <input type="text" value="${descPl || 'Opis domyślny'}" placeholder="Opis obrazu (PL)" class="image-desc-pl" />
      <button type="button" class="remove-image">Usuń</button>
    `;

    container.appendChild(row);

    row.querySelector(".remove-image").addEventListener("click", () => {
      row.remove();
      markChanged();
    });

    const srcInput = row.querySelector(".image-src");
    const previewBtn = row.querySelector(".preview-btn");
    previewBtn.addEventListener("click", () => {
      const currentSrc = srcInput.value.trim();
      if (!currentSrc) return;
      showImagePreview(currentSrc);
    });

    srcInput.addEventListener("input", markChanged);
    row.querySelector(".image-key").addEventListener("change", markChanged);
  }

  function showImagePreview(src) {
    if (!src) return;
    const popup = document.createElement("div");
    popup.className = "image-preview-popup";
    popup.innerHTML = `
      <div class="popup-content">
        <span class="popup-close">×</span>
        <img src="${src}" alt="Podgląd" onerror="this.src='./images/haircut.jpg'" />
      </div>
    `;
    document.body.appendChild(popup);

    const close = () => {
      popup.remove();
      document.removeEventListener("keydown", escHandler);
    };

    popup.querySelector(".popup-close").onclick = close;
    popup.addEventListener("click", e => { if (e.target === popup) close(); });

    const escHandler = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", escHandler);
  }

  async function saveFormDataFromClone(clone, idx) {
    const data = {
      name: { pl: getFromClone(clone, "namePl"), en: getFromClone(clone, "nameEn"), ua: getFromClone(clone, "nameUa") },
      length: getCheckedFromClone(clone, "lengthCheckboxes"),
      style: getCheckedFromClone(clone, "styleCheckboxes"),
      boki: getCheckedFromClone(clone, "bokiCheckboxes"),
      gora: getCheckedFromClone(clone, "goraCheckboxes"),
      grzywka: getCheckedFromClone(clone, "grzywkaCheckboxes"),
      faceShapes: getCheckedFromClone(clone, "faceCheckboxes"),
      hairType: getCheckedFromClone(clone, "hairCheckboxes"),
      description: { pl: getFromClone(clone, "descPl"), en: getFromClone(clone, "descEn"), ua: getFromClone(clone, "descUa") },
      images: {}
    };

    clone.querySelectorAll(".image-row").forEach(row => {
      const key = row.querySelector(".image-key").value;
      const src = row.querySelector(".image-src").value.trim();
      const descPl = row.querySelector(".image-desc-pl").value.trim();
      if (key && src) {
        data.images[key] = { src };
        if (descPl) data.images[key].desc = { pl: descPl };
      }
    });

    if (data.images.default && Object.keys(data.images).length > 1) {
      delete data.images.default;
    }
    if (Object.keys(data.images).length === 0) {
      data.images.default = { src: "./images/haircut.jpg" };
    }

    hairstyles[idx] = data;
    await saveToFile();
    clone.remove();
    currentEditorInstance = null;
    addBtn.style.display = "block";
    editingId = null;
    renderList();
  }

  window.deleteHairstyle = async function (idx) {
    if (confirm("Na pewno usunąć?")) {
      hairstyles.splice(idx, 1);
      await saveToFile();
      loadHairstyles();
    }
  };

  addBtn.addEventListener("click", () => {
    if (currentEditorInstance) return;
    const clone = document.getElementById("editorFormTemplate").cloneNode(true);
    clone.id = "editorForm";
    clone.style.display = "block";
    listEl.appendChild(clone);
    currentEditorInstance = clone;

    const formTitle = clone.querySelector("#formTitle");
    formTitle.textContent = "Dodaj nową fryzurę";
    addBtn.style.display = "none";

    Object.keys(options).forEach(k => createCheckboxesInClone(clone, k + "Checkboxes", options[k], []));
    createCheckboxesInClone(clone, "lengthCheckboxes", options.length, []);
    const imagesContainer = clone.querySelector("#imagesContainer");
    imagesContainer.innerHTML = "";
    addImageRowToContainer(imagesContainer, "default", "./images/haircut.jpg", "Opis domyślny");

    const form = clone.querySelector("#hairstyleForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: { pl: getFromClone(clone, "namePl"), en: getFromClone(clone, "nameEn"), ua: getFromClone(clone, "nameUa") },
        length: getCheckedFromClone(clone, "lengthCheckboxes"),
        style: getCheckedFromClone(clone, "styleCheckboxes"),
        boki: getCheckedFromClone(clone, "bokiCheckboxes"),
        gora: getCheckedFromClone(clone, "goraCheckboxes"),
        grzywka: getCheckedFromClone(clone, "grzywkaCheckboxes"),
        faceShapes: getCheckedFromClone(clone, "faceCheckboxes"),
        hairType: getCheckedFromClone(clone, "hairCheckboxes"),
        description: { pl: getFromClone(clone, "descPl"), en: getFromClone(clone, "descEn"), ua: getFromClone(clone, "descUa") },
        images: {}
      };

      clone.querySelectorAll(".image-row").forEach(row => {
        const key = row.querySelector(".image-key").value;
        const src = row.querySelector(".image-src").value.trim();
        const descPl = row.querySelector(".image-desc-pl").value.trim();
        if (key && src) {
          data.images[key] = { src };
          if (descPl) data.images[key].desc = { pl: descPl };
        }
      });

      if (data.images.default && Object.keys(data.images).length > 1) delete data.images.default;
      if (Object.keys(data.images).length === 0) data.images.default = { src: "./images/haircut.jpg" };

      hairstyles.push(data);
      await saveToFile();
      clone.remove();
      currentEditorInstance = null;
      addBtn.style.display = "block";
      renderList();
    };

    clone.querySelector("#cancelEdit").onclick = () => {
      clone.remove();
      currentEditorInstance = null;
      addBtn.style.display = "block";
    };

    const addImageBtn = clone.querySelector("#addImage");
    if (addImageBtn) {
      addImageBtn.onclick = () => {
        const available = generateAvailableKeysFromClone(clone);
        const firstKey = available[0] || "default";
        addImageRowToContainer(imagesContainer, firstKey, "./images/haircut.jpg", "Opis domyślny");
        markChanged();
      };
    }

    attachCheckboxListenersToClone(clone);
    refreshImageKeySelectsInClone(clone);
  });

  loadHairstyles();
  updateLanguage();
});

async function waitForLang() {
  return new Promise(r => {
    const check = () => (window.t && window.translateArray ? r() : setTimeout(check, 50));
    check();
  });
}