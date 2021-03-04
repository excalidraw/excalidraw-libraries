const fetchJSONFile = (path, callback) => {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
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
      const bTime = new Date(a.date);
      const today = new Date();
      const diffA = today.getTime() - aTime.getTime();
      const diffB = today.getTime() - bTime.getTime();
      return diffA - diffB;
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
      console.log("author", a.authors);
      return b.authors[0].name.localeCompare(a.authors[0].name);
    },
  },
  name: {
    label: "Name",
    func: (a, b) => {
      console.log("author", a.name);
      return b.name.localeCompare(a.name);
    },
  },
};

const populateSorts = () => {
  const sortDiv = document.getElementById("sort-contents");
  for ([key, value] of Object.entries(sortBy).filter(
    ([key]) => key !== "default",
  )) {
    const link = `${window.location.origin}?sort=${key}`;
    sortDiv.innerHTML += ` &#183; `;
    sortDiv.innerHTML += `<a href="${link}">${value.label}</a>`;
  }
};

populateSorts();

fetchJSONFile("libraries.json", (libraries) => {
  fetchJSONFile("stats.json", (stats) => {
    const template = document.getElementById("template");
    const divElements = [];
    const libraries_ = [];
    for (library of libraries) {
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
    console.log("sort", sort);
    libraries_.sort(sortBy[sort ?? "default"].func);

    console.log(libraries_);

    for (library of libraries_) {
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
      for (author of library.authors) {
        authorsInnerHTML += `<a href="${author.url}" target="_blank">@${author.name}</a> `;
      }
      inner = inner.replace(/\{authors\}/g, authorsInnerHTML);
      inner = inner.replace(/\{preview\}/g, `libraries/${library.preview}`);
      inner = inner.replace(/\{updated\}/g, getDate(library.date));
      inner = inner.replace(
        "{addToLib}",
        `https://excalidraw.com/?addLibrary=${location.href.replace(
          "index.html",
          "",
        )}${source}`,
      );
      inner = inner.replace(/\{total\}/g, library.downloads.total);
      inner = inner.replace(/\{week\}/g, library.downloads.week);
      div.innerHTML = inner;
      template.after(div);
    }
  });
});
