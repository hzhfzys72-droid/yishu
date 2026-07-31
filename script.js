const data = window.portfolioData;

function bindText() {
  document.querySelectorAll("[data-bind]").forEach((node) => {
    const key = node.dataset.bind;
    if (data[key]) node.textContent = data[key];
  });

  document.querySelectorAll("[data-bind-attr]").forEach((node) => {
    node.dataset.bindAttr.split(",").forEach((binding) => {
      const [attr, key] = binding.split(":").map((part) => part.trim());
      if (key === "emailHref") node.setAttribute(attr, `mailto:${data.email}`);
      if (key === "githubHref") node.setAttribute(attr, data.github || "#");
    });
    if (node.dataset.bindAttr.includes("emailHref")) node.textContent = data.email;
  });
}

function renderTags() {
  const cloud = document.querySelector("#about-tags");
  if (!cloud) return;
  cloud.innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join("");
}

function renderCurrently() {
  const list = document.querySelector("#currently-list");
  if (!list) return;
  list.innerHTML = data.currently.map((item) => `<li>${item}</li>`).join("");
}

function renderProjects() {
  const grid = document.querySelector("#project-grid");
  if (!grid) return;
  grid.innerHTML = data.projects
    .map(
      (project, index) => `
        <article class="project-card reveal" data-href="${project.href}" style="--tilt:${index % 2 ? "1.3deg" : "-1deg"}">
          <div class="project-cover">
            ${
              project.coverImage
                ? `<img src="${project.coverImage}" alt="${project.title} 项目封面" loading="lazy" decoding="async">`
                : `<span>${project.cover}</span>`
            }
          </div>
          <div class="project-body">
            <div class="project-label">${project.no ? `${project.no} / ` : ""}${project.time}</div>
            <h2>${project.title}</h2>
            <p>${project.intro}</p>
            <dl>
              <div><dt>Role</dt><dd>${project.role}</dd></div>
              <div><dt>Highlight</dt><dd>${project.highlight}</dd></div>
            </dl>
            ${
              project.tags
                ? `<div class="project-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
                : ""
            }
            <a class="detail-link" href="${project.href}">${project.cta || "View Project"}</a>
          </div>
        </article>
      `
    )
    .join("");
}

function getWorkActionLabel(work) {
  if (work.type === "Video") return "查看视频";
  return "查看作品";
}

function getWorkPreviewImages(work) {
  if (work.previewImages?.length) return work.previewImages;
  return [work.detailImage, work.coverImage].filter(Boolean);
}

function renderWorks() {
  const board = document.querySelector("#works-board");
  if (!board) return;
  board.innerHTML = data.works
    .map((work, index) => {
      const isVideo = work.type === "Video";
      const previewImages = getWorkPreviewImages(work);
      const hasPreview = !isVideo && previewImages.length;
      return `
        <article
          class="work-tile reveal tile-${index + 1}${work.featured ? " featured-work" : ""}${work.coverImage ? " has-cover" : ""}${work.coverFit === "top-crop" ? " top-crop-cover" : ""}"
          ${hasPreview ? `data-preview-index="${index}" role="button" tabindex="0"` : ""}
        >
          <span class="work-thumb">
            ${
              work.coverImage
                ? `<img src="${work.coverImage}" alt="${work.title} 作品封面" loading="lazy" decoding="async">`
                : `<span>${work.type}</span><small>${work.coverNote || "作品待补充"}</small>`
            }
          </span>
          <span class="work-title">${work.title}</span>
          <span class="work-intro">${work.intro}</span>
          ${
            work.tags
              ? `<span class="work-tags">${work.tags.map((tag) => `<i>${tag}</i>`).join("")}</span>`
              : ""
          }
          ${
            isVideo && work.link
              ? `<a class="work-action" href="${work.link}" target="_blank" rel="noopener noreferrer">${getWorkActionLabel(work)}</a>`
              : hasPreview
              ? `<button class="work-action" type="button" data-preview-trigger="${index}">${getWorkActionLabel(work)}</button>`
              : `<span class="work-empty-note">等待补充对应作品素材</span>`
          }
        </article>
      `;
    })
    .join("");
}

function setupLightbox() {
  const lightbox = document.querySelector("#work-lightbox");
  if (!lightbox) {
    setupImagePreview();
    return;
  }
  const preview = lightbox.querySelector(".lightbox-card");
  const close = lightbox.querySelector("button");
  const openWorkPreview = (index) => {
    const work = data.works[Number(index)];
    if (!work) return;
    const previewImages = getWorkPreviewImages(work);
    if (!previewImages.length || work.type === "Video") return;

    preview.innerHTML = `
      <div class="work-preview-note">
        <span class="eyebrow">${work.type || "Work"} archive</span>
        <h2>${work.title}</h2>
        <p>${work.intro}</p>
        <div class="work-modal-gallery">
          ${previewImages
            .map(
              (image, imageIndex) => `
                <figure class="work-modal-photo${work.coverFit === "top-crop" ? " long-image" : ""}">
                  <img src="${image}" alt="${work.title} 作品预览 ${imageIndex + 1}" loading="lazy" decoding="async">
                  <figcaption>${imageIndex === 0 ? "cover / saved page" : `archive page ${imageIndex + 1}`}</figcaption>
                </figure>
              `
            )
            .join("")}
        </div>
        ${
          work.detail?.thinking
            ? `<section class="work-detail-section">
                <h3>${work.type === "PPT" || work.type === "Plan" ? "创作记录" : "创作思路"}</h3>
                <p>${work.detail.thinking}</p>
              </section>`
            : ""
        }
        ${
          work.detail?.record
            ? `<section class="work-detail-section">
                <h3>${work.type === "Plan" ? "项目总结" : "内容复盘"}</h3>
                ${
                  work.detail.recordItems
                    ? `<div class="work-record-tags">${work.detail.recordItems.map((item) => `<span>${item}</span>`).join("")}</div>`
                    : ""
                }
                <p>${work.detail.record}</p>
              </section>`
            : ""
        }
        ${
          work.tags
            ? `<div class="work-tags preview-tags">${work.tags.map((tag) => `<i>${tag}</i>`).join("")}</div>`
            : ""
        }
      </div>
    `;

    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };
  const closeWorkPreview = () => {
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll(".work-tile[data-preview-index]").forEach((tile) => {
    tile.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openWorkPreview(tile.dataset.previewIndex);
    });
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openWorkPreview(tile.dataset.previewIndex);
      }
    });
  });

  document.querySelectorAll(".work-action[data-preview-trigger]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWorkPreview(button.dataset.previewTrigger);
    });
  });

  close.addEventListener("click", closeWorkPreview);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeWorkPreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") closeWorkPreview();
  });

  setupImagePreview();
}

function setupImagePreview() {
  const images = document.querySelectorAll(".project-photo img, .universe-photo img");
  if (!images.length) return;

  let lightbox = document.querySelector("#image-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";
    lightbox.id = "image-lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML = `
      <button type="button" aria-label="Close image preview">Close</button>
      <img alt="">
    `;
    document.body.appendChild(lightbox);
  }

  const preview = lightbox.querySelector("img");
  const close = lightbox.querySelector("button");

  images.forEach((image) => {
    image.addEventListener("click", () => {
      preview.src = image.currentSrc || image.src;
      preview.alt = image.alt || "项目图片预览";
      lightbox.classList.toggle("universe-lightbox", image.closest(".universe-photo") !== null);
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  close.addEventListener("click", () => lightbox.setAttribute("aria-hidden", "true"));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.setAttribute("aria-hidden", "true");
  });
}

function setupProjectCardLinks() {
  document.querySelectorAll(".project-card[data-href]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.href = card.dataset.href;
    });
  });
}

function createDeepSeaParticles() {
  const layer = document.createElement("div");
  const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
  const particleCount = isSmallScreen ? 10 : 22;

  layer.className = "deep-sea-particles";
  layer.setAttribute("aria-hidden", "true");

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const size = Math.round(2 + Math.random() * 4);
    const duration = Math.round(10 + Math.random() * 15);
    const delay = Math.round(Math.random() * -25);
    const drift = Math.round(18 + Math.random() * 54);
    const opacity = (0.3 + Math.random() * 0.3).toFixed(2);

    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--left", `${Math.random() * 100}%`);
    particle.style.setProperty("--duration", `${duration}s`);
    particle.style.setProperty("--delay", `${delay}s`);
    particle.style.setProperty("--drift", `${index % 2 ? "-" : ""}${drift}px`);
    particle.style.setProperty("--opacity", opacity);

    layer.appendChild(particle);
  }

  document.body.prepend(layer);
}

function setupScrollReveal() {
  document.querySelectorAll(".reveal").forEach((node) => {
    node.classList.remove("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  const revealTargets = document.querySelectorAll(
    [
      "main > *",
      ".paper-sheet",
      ".polaroid",
      ".project-card",
      ".work-tile",
      ".contact-sheet",
      ".detail-sections section",
      ".page-note",
      ".student-info div",
      ".currently-card",
      ".book-page",
      ".project-photo",
      ".proof-gallery",
      ".archive-gallery",
    ].join(", ")
  );

  revealTargets.forEach((node, index) => {
    node.classList.add("deep-reveal");
    node.style.setProperty("--reveal-delay", `${(index % 6) * 0.12}s`);
    observer.observe(node);
  });

  window.setTimeout(() => {
    document.querySelectorAll(".deep-reveal:not(.is-visible)").forEach((node) => {
      node.classList.add("is-visible");
    });
  }, 1400);
}

bindText();
renderTags();
renderCurrently();
renderProjects();
renderWorks();
setupProjectCardLinks();
setupLightbox();
createDeepSeaParticles();
setupScrollReveal();
