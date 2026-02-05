(() => {
  const BLOCKED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "svg", "webp", "zip"];
  let isNavigating = false;

  const isInternalLink = (link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return false;
    }

    if (link.hasAttribute("download")) {
      return false;
    }

    if (link.target && link.target !== "_self") {
      return false;
    }

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    const parts = url.pathname.split(".");
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        return false;
      }
    }

    return true;
  };

  const updateActiveNav = (url) => {
    const nextPath = new URL(url, window.location.href).pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav__link").forEach((link) => {
      link.classList.remove("is-active");
      const linkPath = new URL(link.getAttribute("href"), window.location.href).pathname.split("/").pop() || "index.html";
      if (linkPath === nextPath) {
        link.classList.add("is-active");
      }
    });
  };

  const updateMeta = (doc) => {
    const newDescription = doc.querySelector('meta[name="description"]');
    if (newDescription) {
      const current = document.querySelector('meta[name="description"]');
      if (current) {
        current.setAttribute("content", newDescription.getAttribute("content") || "");
      }
    }
  };

  const navigate = async (url, pushState = true) => {
    if (isNavigating) return;
    const main = document.querySelector("main");
    if (!main) {
      window.location.href = url;
      return;
    }

    isNavigating = true;
    document.body.classList.add("is-loading");

    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Navigation failed");
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newMain = doc.querySelector("main");

      if (!newMain) {
        window.location.href = url;
        return;
      }

      document.title = doc.title || document.title;
      updateMeta(doc);
      main.replaceWith(newMain);
      updateActiveNav(url);

      if (pushState) {
        history.pushState({}, "", url);
      }

      if (url.includes("#")) {
        const targetId = url.split("#")[1];
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) {
            target.scrollIntoView();
            return;
          }
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.location.href = url;
    } finally {
      document.body.classList.remove("is-loading");
      isNavigating = false;
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !isInternalLink(link)) {
      return;
    }

    event.preventDefault();
    navigate(link.href, true);
  });

  window.addEventListener("popstate", () => {
    navigate(window.location.href, false);
  });
})();
