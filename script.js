// copied from excalidraw/excalidraw
const debounce = (fn, timeout) => {
  let handle = 0;
  let lastArgs = null;
  const ret = (...args) => {
    lastArgs = args;
    clearTimeout(handle);
    handle = window.setTimeout(() => {
      lastArgs = null;
      fn(...args);
    }, timeout);
  };
  ret.flush = () => {
    clearTimeout(handle);
    if (lastArgs) {
      const _lastArgs = lastArgs;
      lastArgs = null;
      fn(..._lastArgs);
    }
  };
  ret.cancel = () => {
    lastArgs = null;
    clearTimeout(handle);
  };
  return ret;
};

const fetchJSONFile = (path, callback) => {
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        let data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open("GET", path);
  httpRequest.send();
};

const getDate = (date) => {
  const d = new Date(date);
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const DAY = 24 * 60 * 60 * 1000;
const sortByDate = (property) => (a, b) => {
  const aTime = new Date(a[property]);
  const bTime = new Date(b[property]);
  const today = new Date();
  const diffA = today.getTime() - aTime.getTime();
  const diffB = today.getTime() - bTime.getTime();
  return diffB - diffA;
};
const sortBy = {
  default: {
    label: "Default",
    func: (items) => {
      const sortedByNewAsc = sortBy.new.func(items);

      const TWO_WEEKS = 12096e5;

      const timeTwoWeeksAgo = new Date(Date.now() - TWO_WEEKS);

      const indexOfItemOlderThan2WeeksAsc =
        sortedByNewAsc.length -
        sortedByNewAsc
          .slice()
          .reverse()
          .findIndex((x) => {
            return new Date(x.created) <= timeTwoWeeksAgo;
          });

      const topNewItemsAsc = sortedByNewAsc.slice(
        indexOfItemOlderThan2WeeksAsc,
      );

      const downloadPerWeekAsc = sortBy.downloadsWeek.func(
        sortedByNewAsc.slice(0, indexOfItemOlderThan2WeeksAsc),
      );

      return downloadPerWeekAsc.concat(topNewItemsAsc);
    },
  },
  new: {
    label: "New",
    func: (items) => items.sort(sortByDate("created")),
  },
  updates: {
    label: "Updated",
    func: (items) => items.sort(sortByDate("updated")),
  },
  downloadsTotal: {
    label: "Total Downloads",
    func: (items) =>
      items.sort((a, b) => {
        return a.downloads.total - b.downloads.total;
      }),
  },
  downloadsWeek: {
    label: "Downloads This Week",
    func: (items) =>
      items.sort((a, b) => {
        return a.downloads.week - b.downloads.week;
      }),
  },
  author: {
    label: "Author",
    func: (items) =>
      items.sort((a, b) => {
        return b.authors[0].name.localeCompare(a.authors[0].name);
      }),
  },
  name: {
    label: "Name",
    func: (items) =>
      items.sort((a, b) => {
        return b.name.localeCompare(a.name);
      }),
  },
};

// -----------------------------------------------------------------------------
const APP_NAMES = {
  "Excalidraw+": "https://app.excalidraw.com",
  Excalidraw: "https://excalidraw.com",
  Excalideck: "https://app.excalideck.com",
};

let appName = "";

const getAppName = (referrer) => {
  return (appName =
    appName ||
    Object.entries(APP_NAMES).find(([appName, domain]) => {
      return referrer.includes(domain);
    })?.[0] ||
    "Excalidraw");
};
// -----------------------------------------------------------------------------

let libraries_ = [];
let currSort = null;

const searchKeys = ["name", "description"];

let IMG_INTERSECTION_OBSERVER = null;

const initImageLazyLoading = () => {
  if (IMG_INTERSECTION_OBSERVER) {
    IMG_INTERSECTION_OBSERVER.disconnect();
  }
  const lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  if ("IntersectionObserver" in window) {
    const lazyImageObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            let lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.remove("lazy");
            lazyImageObserver.unobserve(lazyImage);
          }
        });
      },
      {
        rootMargin: "0px 0px 500px 0px",
      },
    );
    IMG_INTERSECTION_OBSERVER = lazyImageObserver;
    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    lazyImages.forEach(function (lazyImage) {
      lazyImage.src = lazyImage.dataset.src;
    });
  }
};

const populateLibraryList = (filterQuery = "") => {
  const items = [
    ...document.getElementById("template").parentNode.children,
  ].filter((x) => x.id !== "template");
  items.forEach((x) => x.remove());

  filterQuery = filterQuery.trim().toLowerCase();
  let libraries = libraries_;
  if (filterQuery) {
    libraries = libraries.filter((library) =>
      searchKeys.some((key) =>
        (library[key] || "").toLowerCase().includes(filterQuery),
      ),
    );
  }
  const template = document.getElementById("template");
  const searchParams = new URLSearchParams(location.search);
  const referrer = searchParams.get("referrer") || "https://excalidraw.com";
  const appName = getAppName(referrer);
  const target = decodeURIComponent(searchParams.get("target") || "_blank");
  const useHash = searchParams.get("useHash");
  const csrfToken = searchParams.get("token");
  for (let library of libraries) {
    const div = document.createElement("div");
    div.classList.add("library");
    div.setAttribute("id", library.id);
    let inner = template.innerHTML;
    const source = `libraries/${library.source}`;
    let authorsInnerHTML = "";
    inner = inner.replace(/\{libraryId\}/g, library.id);
    inner = inner.replace(/\{name\}/g, library.name);
    inner = inner.replace(/\{description\}/g, library.description);
    inner = inner.replace(/\{source\}/g, source);
    for (let author of library.authors) {
      authorsInnerHTML += `<a href="${author.url}" target="_blank">@${author.name}</a> `;
    }
    inner = inner.replace(/\{authors\}/g, authorsInnerHTML);
    inner = inner.replace(
      /\{preview\}/g,
      `libraries/${library.preview}?v=${library.updated || 0}`,
    );
    inner = inner.replace(/\{created\}/g, getDate(library.created));
    if (library.created !== library.updated) {
      inner = inner.replace(/\{updated\}/g, getDate(library.updated));
    } else {
      inner = inner.replace('<p class="updated">Updated: {updated}</p>', "");
    }
    inner = inner.replace(/\{appName\}/g, appName);
    const libraryUrl = encodeURIComponent(`${location.origin}/${source}`);
    inner = inner.replace(
      "{addToLib}",
      `${referrer}${useHash ? "#" : "?"}addLibrary=${libraryUrl}${
        csrfToken ? `&token=${csrfToken}` : ""
      }`,
    );
    inner = inner.replace("{target}", target);
    inner = inner.replace(/\{total\}/g, library.downloads.total);
    inner = inner.replace(/\{week\}/g, library.downloads.week);
    div.innerHTML = inner;
    div.setAttribute("data-version", library.version || "1");
    template.after(div);
  }
  initImageLazyLoading();
};

const handleSort = (sortType) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("sort", sortType);
  history.pushState("", "sort", `?` + searchParams.toString() + location.hash);

  libraries_ = sortBy[sortType ?? "default"].func(libraries_);
  populateLibraryList();
  if (currSort) {
    const prev = document.getElementById(currSort);
    prev.classList.remove("option-selected");
  }
  const curr = document.getElementById(sortType);
  curr?.classList.add("option-selected");
  currSort = sortType;
};

const populateSorts = () => {
  const sortTemplate = document.getElementById("sort-template");
  for ([key, value] of Object.entries(sortBy).filter(
    ([key]) => key !== "default",
  )) {
    const spacer = document.createElement("span");
    spacer.innerHTML = ` &#183; `;
    sortTemplate.before(spacer);
    const el = sortTemplate.cloneNode(true);
    el.setAttribute("id", key);
    el.innerText = el.innerText.replace(/\{label\}/g, value.label);
    el.setAttribute("href", "#");
    const handler = (sort) => () => {
      history.replaceState(null, null, " ");
      handleSort(sort);
    };
    el.onclick = handler(key);
    sortTemplate.before(el);
  }
};

const scrollToAnchor = () => {
  if (location.hash) {
    const target = location.hash;
    const element = document.querySelector(target);
    if (element) {
      window.scrollTo(0, element.offsetTop);
    }
  }
};

const handleTheme = (theme) => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("theme", theme);
  history.pushState("", "theme", `?` + searchParams.toString() + location.hash);

  if (theme === "dark") {
    document.querySelector("html").classList.add("theme--dark");
    document.querySelector("#light").classList.remove("is-hidden");
    document.querySelector("#dark").classList.add("is-hidden");
  } else if (theme === "light") {
    document.querySelector("#light").classList.add("is-hidden");
    document.querySelector("#dark").classList.remove("is-hidden");
    document.querySelector("html").classList.remove("theme--dark");
  }
};

// -----------------------------------------------------------------------------
//                                      init
// -----------------------------------------------------------------------------

// Add listeners to handle theme change
const themes = document.querySelectorAll("#theme .option");
themes.forEach((theme) =>
  theme.addEventListener("click", () => handleTheme(theme.id)),
);

const urlParams = new URLSearchParams(window.location.search);

const searchInput = document.getElementById("search-input");
searchInput.addEventListener(
  "input",
  debounce((event) => {
    populateLibraryList(event.target.value);
  }, 200),
);

document.documentElement.addEventListener("keypress", (event) => {
  if (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    /^[a-z0-9]$/i.test(event.key)
  ) {
    if (searchInput !== document.activeElement) {
      searchInput.select();
    }
  }
});

handleTheme(urlParams.get("theme") ?? "light");
populateSorts();

fetchJSONFile("libraries.json", (libraries) => {
  fetchJSONFile("stats.json", (stats) => {
    for (let library of libraries) {
      const replaceText = { "/": "-", ".excalidrawlib": "" };
      const libraryId = library.source
        .toLowerCase()
        .replace(/\/|.excalidrawlib/g, (match) => replaceText[match]);
      library["id"] = libraryId;
      library["downloads"] = {
        total: libraryId in stats ? stats[libraryId].total : 0,
        week: libraryId in stats ? stats[libraryId].week : 0,
      };
      libraries_.push(library);
    }

    const sort = urlParams.get("sort");

    handleSort(sort ?? "default");
    scrollToAnchor();
  });
});

// update footer with current year
const footer = document.getElementById("footer");
footer.innerHTML = footer.innerHTML.replace(/{currentYear}/g, () =>
  new Date().getFullYear(),
);

document.addEventListener("click", (event) => {
  if (event.target.closest(".install-library")) {
    const libraryItemNode = event.target.closest(".library");
    const libraryVersion = parseInt(
      libraryItemNode.getAttribute("data-version") || "1",
    );

    const referrer = urlParams.get("referrer");
    const referrerVersion = parseInt(urlParams.get("version") || "1");

    if (referrer && referrerVersion < libraryVersion) {
      let message =
        "It seems the Excalidraw editor's version is older than the library version. Installing this library may not work correctly.";
      if (referrer.includes("excalidraw.com")) {
        message += `\n\nTo ensure you are on the latest version, hard-reload the excalidraw.com tab (Mac: Cmd-Shift-R, Window: Ctrl-F5). If that doesn't work, ensure you only have a single excalidraw.com tab open.`;
      }
      window.alert(message);
    }
  }
});
