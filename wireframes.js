/* JayOd Studios — generated wireframe art.
 *
 * One set of abstract layout drawings, used twice: as the thumbnail on a work
 * card, and as the hero stage that assembles itself. They are line art, not
 * screenshots, so nothing here can impersonate a real product.
 *
 *   buildWireframe(kind, { chrome: true }) -> <svg>
 *
 * Coordinates are a fixed 320 x 200 space; the SVG scales to whatever box it is
 * placed in, so the same drawing works at thumbnail and hero size.
 */

(function () {
  const NS = "http://www.w3.org/2000/svg";

  function node(name, attributes) {
    const element = document.createElementNS(NS, name);
    Object.keys(attributes).forEach((key) => element.setAttribute(key, String(attributes[key])));
    return element;
  }

  const block = (x, y, width, height, cls, radius) =>
    node("rect", { x, y, width, height, rx: radius === undefined ? 3 : radius, class: cls || "pv-block" });

  const bar = (x, y, width, height, cls) =>
    node("rect", {
      x,
      y,
      width,
      height: height === undefined ? 4 : height,
      rx: (height === undefined ? 4 : height) / 2,
      class: cls || "pv-line",
    });

  const dot = (cx, cy, r, cls) =>
    node("circle", { cx, cy, r: r === undefined ? 2.4 : r, class: cls || "pv-dot" });

  const LAYOUTS = {
    dashboard() {
      return [
        block(0, 22, 58, 178, "pv-panel", 0),
        bar(10, 40, 38),
        bar(10, 54, 28),
        bar(10, 68, 34),
        block(70, 34, 74, 38, "pv-panel"),
        block(152, 34, 74, 38, "pv-panel"),
        block(234, 34, 74, 38, "pv-panel"),
        bar(78, 44, 30, 4),
        bar(160, 44, 26, 4),
        bar(242, 44, 34, 4),
        block(70, 82, 238, 106, "pv-panel"),
        ...Array.from({ length: 9 }, (_, index) =>
          block(
            82 + index * 24,
            150 - index * 6,
            14,
            30 + index * 6,
            index % 3 === 0 ? "pv-accent" : "pv-block",
            2
          )
        ),
      ];
    },

    editorial() {
      return [
        bar(20, 34, 54, 5, "pv-accent"),
        block(20, 48, 176, 16, "pv-head"),
        block(20, 70, 132, 16, "pv-head"),
        bar(20, 100, 150),
        bar(20, 110, 168),
        bar(20, 120, 96),
        block(212, 40, 88, 60, "pv-panel"),
        bar(212, 110, 88),
        bar(212, 120, 64),
        block(20, 144, 280, 1, "pv-rule", 0),
        bar(20, 158, 120, 6),
        bar(20, 172, 168),
      ];
    },

    commerce() {
      const tiles = [];
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const x = 16 + col * 100;
          const y = 62 + row * 70;
          tiles.push(block(x, y, 88, 44, "pv-panel"));
          tiles.push(bar(x, y + 50, 56));
          tiles.push(bar(x, y + 58, 30, 3, "pv-accent"));
        }
      }
      return [
        block(0, 22, 320, 30, "pv-panel", 0),
        bar(12, 33, 40, 6),
        bar(232, 34, 26),
        bar(266, 34, 26),
        dot(300, 36, 5, "pv-accent"),
        ...tiles,
      ];
    },

    landing() {
      return [
        block(46, 40, 228, 16, "pv-head"),
        block(86, 64, 148, 10),
        bar(120, 82, 80, 4),
        block(104, 96, 50, 16, "pv-accent"),
        block(162, 96, 50, 16, "pv-outline"),
        block(16, 132, 92, 50, "pv-panel"),
        block(114, 132, 92, 50, "pv-panel"),
        block(212, 132, 92, 50, "pv-panel"),
        bar(26, 144, 40, 4),
        bar(124, 144, 40, 4),
        bar(222, 144, 40, 4),
      ];
    },

    docs() {
      return [
        block(0, 22, 70, 178, "pv-panel", 0),
        bar(12, 40, 44),
        bar(12, 54, 34),
        bar(12, 68, 46),
        bar(12, 82, 30),
        block(86, 36, 150, 12, "pv-head"),
        bar(86, 58, 210),
        bar(86, 68, 186),
        bar(86, 78, 200),
        block(86, 94, 218, 74, "pv-code"),
        bar(96, 106, 70, 4, "pv-accent"),
        bar(96, 120, 120),
        bar(96, 132, 90),
        bar(96, 144, 140),
      ];
    },

    studio() {
      return [
        block(20, 46, 232, 18, "pv-head"),
        block(20, 72, 156, 18, "pv-head"),
        block(20, 106, 280, 1, "pv-rule", 0),
        block(20, 122, 80, 54, "pv-panel"),
        block(112, 122, 80, 54, "pv-panel"),
        block(204, 122, 80, 54, "pv-panel"),
        bar(20, 186, 60, 4),
        bar(112, 186, 48, 4),
      ];
    },
  };

  function buildWireframe(kind, options) {
    const settings = options || {};
    const withChrome = settings.chrome !== false;
    const shapes = (LAYOUTS[kind] || LAYOUTS.editorial)();

    const svg = node("svg", {
      class: settings.className || "preview",
      // Without drawn chrome the stage has an HTML bar, so crop the empty band
      // the chrome used to occupy and let the artwork fill the frame.
      viewBox: withChrome ? "0 0 320 200" : "0 22 320 178",
      "aria-hidden": "true",
      focusable: "false",
      preserveAspectRatio: "xMidYMid slice",
    });

    svg.append(node("rect", { x: 0, y: 0, width: 320, height: 200, class: "pv-bg" }));

    if (withChrome) {
      svg.append(
        node("rect", { x: 0, y: 0, width: 320, height: 22, class: "pv-chrome" }),
        dot(11, 11, 2.6),
        dot(20, 11, 2.6),
        dot(29, 11, 2.6),
        node("rect", { x: 116, y: 6, width: 88, height: 10, rx: 5, class: "pv-url" })
      );
    }

    shapes.forEach((shape) => svg.append(shape));

    return svg;
  }

  window.buildWireframe = buildWireframe;
  window.WIREFRAME_KINDS = Object.keys(LAYOUTS);
})();
