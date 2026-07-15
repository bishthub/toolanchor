/* ToolAnchor embed loader — https://toolanchor.com/widgets
 *
 * Usage:
 *   <div data-toolanchor="bmi-calculator" data-theme="dark" data-accent="4f46e5"></div>
 *   <script async src="https://toolanchor.com/embed.js"></script>
 *
 * Attributes (all optional except data-toolanchor):
 *   data-theme  : auto | light | dark        (default: auto — follows visitor's OS)
 *   data-accent : hex color without "#"      (default: ToolAnchor indigo)
 *   data-radius : corner radius in px        (default: 12)
 *   data-width  : CSS width                  (default: 100%)
 *
 * The widget runs entirely in the visitor's browser — no data is sent to
 * ToolAnchor or anyone else. The iframe auto-resizes to fit its content.
 */
(function () {
  "use strict";

  var ORIGIN = "https://toolanchor.com";
  // Allow self-hosted/staging via <script src=".../embed.js" data-base="...">
  var script = document.currentScript;
  if (script && script.getAttribute("data-base")) {
    ORIGIN = script.getAttribute("data-base").replace(/\/$/, "");
  }

  var counter = 0;

  function build(node) {
    var tool = node.getAttribute("data-toolanchor");
    if (!tool || node.getAttribute("data-ta-ready")) return;
    node.setAttribute("data-ta-ready", "1");

    var id = "ta-" + ++counter + "-" + Math.random().toString(36).slice(2, 7);
    var params = [];
    var theme = node.getAttribute("data-theme");
    var accent = (node.getAttribute("data-accent") || "").replace(/^#/, "");
    if (theme === "light" || theme === "dark") params.push("theme=" + theme);
    if (/^[0-9a-fA-F]{3,8}$/.test(accent)) params.push("accent=" + accent);
    params.push("id=" + id);

    var frame = document.createElement("iframe");
    frame.src = ORIGIN + "/embed/" + encodeURIComponent(tool) + "?" + params.join("&");
    frame.title = tool.replace(/-/g, " ") + " — ToolAnchor";
    frame.loading = "lazy";
    frame.setAttribute("data-ta-id", id);
    frame.style.width = node.getAttribute("data-width") || "100%";
    frame.style.height = "420px"; /* placeholder until first resize message */
    frame.style.border = "0";
    frame.style.display = "block";
    frame.style.borderRadius = (parseInt(node.getAttribute("data-radius"), 10) || 12) + "px";
    frame.style.colorScheme = "auto"; /* keep OS-dark iframes from forcing white */
    node.appendChild(frame);
  }

  function init() {
    var nodes = document.querySelectorAll("[data-toolanchor]");
    for (var i = 0; i < nodes.length; i++) build(nodes[i]);
  }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "toolanchor:resize" || !d.id) return;
    if (e.origin !== ORIGIN) return;
    var frame = document.querySelector('iframe[data-ta-id="' + String(d.id).replace(/[^\w-]/g, "") + '"]');
    var h = parseInt(d.height, 10);
    if (frame && h > 0 && h < 10000) frame.style.height = h + "px";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
