const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204); res.end(); return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { model, max_tokens, system, messages } = JSON.parse(body);
      const payload = JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: max_tokens || 1000, system, messages });
      const options = {
        hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" }
      };
      const apiReq = https.request(options, apiRes => {
        let data = "";
        apiRes.on("data", chunk => data += chunk);
        apiRes.on("end", () => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(data); });
      });
      apiReq.on("error", e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
      apiReq.write(payload); apiReq.end();
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, "dist", req.url === "/" ? "index.html" : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { fs.readFile(path.join(__dirname, "dist", "index.html"), (e, d) => { res.writeHead(200); res.end(d); }); return; }
    res.writeHead(200); res.end(data);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
