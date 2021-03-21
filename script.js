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

const sortBy = {
  default: {
    label: "Default",
    func: (a, b) => {
      const aTime = new Date(a.date);
      const today = new Date();
      const diffA = (today.getTime() - aTime.getTime()) / DAY;
      if (diffA < 14) {
        return 1;
      }
      return a.downloads.week - b.downloads.week;
    },
  },
  new: {
    label: "New",
    func: (a, b) => {
      const aTime = new Date(a.date);
      const bTime = new Date(b.date);
      const today = new Date();
      const diffA = today.getTime() - aTime.getTime();
      const diffB = today.getTime() - bTime.getTime();
      return diffB - diffA;
    },
  },
  downloadsTotal: {
    label: "Total Downloads",
    func: (a, b) => {
      return a.downloads.total - b.downloads.total;
    },
  },
  downloadsWeek: {
    label: "Downloads This Week",
    func: (a, b) => {
      return a.downloads.week - b.downloads.week;
    },
  },
  author: {
    label: "Author",
    func: (a, b) => {
      return b.authors[0].name.localeCompare(a.authors[0].name);
    },
  },
  name: {
    label: "Name",
    func: (a, b) => {
      return b.name.localeCompare(a.name);
    },
  },
};

const libraries_ = [];
let currSort = null;

const populateLibraryList = () => {
  const template = document.getElementById("template");
  for (let library of libraries_) {
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
    inner = inner.replace(/\{preview\}/g, `libraries/${library.preview}`);
    inner = inner.replace(/\{updated\}/g, getDate(library.date));

    const searchParams = new URLSearchParams(location.search);
    const referrer = searchParams.get("referrer") || "https://excalidraw.com";
    const target = decodeURIComponent(searchParams.get("target") || "_blank");
    const libraryUrl = encodeURIComponent(`${location.origin}/${source}`);
    inner = inner.replace("{addToLib}", `${referrer}?addLibrary=${libraryUrl}`);
    inner = inner.replace("{target}", target);
    inner = inner.replace(/\{total\}/g, library.downloads.total);
    inner = inner.replace(/\{week\}/g, library.downloads.week);
    div.innerHTML = inner;
    template.after(div);
  }
};

const handleSort = (sortType) => {
  const items = [
    ...document.getElementById("template").parentNode.children,
  ].filter((x) => x.id !== "template");
  items.forEach((x) => x.remove());
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("sort", sortType);
  history.pushState("", "sort", `?` + searchParams.toString() + location.hash);

  libraries_.sort(sortBy[sortType ?? "default"].func);
  populateLibraryList();
  if (currSort) {
    const prev = document.getElementById(currSort);
    prev.classList.remove("sort-selected");
  }
  const curr = document.getElementById(sortType);
  curr?.classList.add("sort-selected");
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

    const urlParams = new URLSearchParams(window.location.search);
    const sort = urlParams.get("sort");
    handleSort(sort ?? "default");
    scrollToAnchor();
  });
});
