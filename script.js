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

fetchJSONFile("libraries.json", (libraries) => {
  const template = document.getElementById("template");
  for (library of libraries) {
    const divLib = document.createElement("div");
    divLib.classList.add("library");
    let inner = template.innerHTML;

    const source = `libraries/${library.source}`;
    inner = inner.replace("{name}", library.name);
    inner = inner.replace("{description}", library.description);
    inner = inner.replace("{source}", source);
    inner = inner.replace("{url}", library.url);
    inner = inner.replace("{author}", library.author);
    inner = inner.replace("{preview}", `libraries/${library.preview}`);
    inner = inner.replace("{updated}", getDate(library.date));
    inner = inner.replace(
      "{addToLib}",
      `https://excalidraw.com/?addLibrary=${location.href.replace("index.html", "")}${source}`
    );
    divLib.innerHTML = inner;
    template.after(divLib);
  }
});
