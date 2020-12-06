var static = require("node-static");

var file = new static.Server(".");
PORT = 8080;

console.info(`Running at http://localhost:${PORT}`);

require("http")
  .createServer(function (request, response) {
    request
      .addListener("end", function () {
        file.serve(request, response);
      })
      .resume();
  })
  .listen(PORT);
