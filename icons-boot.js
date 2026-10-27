/* JayOd Studios — where every glyph in the hero's floating field stands.
 *
 * This file is a classic script, not a module, and that is the whole point: the
 * parser reaches it while it is still at the hero, so the field is placed before
 * the first paint. It used to be placed by icons.js, an ES module that imports
 * GSAP — by the time that had downloaded the visitor had already seen every glyph
 * at its no-JavaScript slot and then watched the field jump into position. Same
 * maths, earlier clock; icons.js now reads it back through window.JayodField.
 *
 * icons.js owns the motion (the home spring, pointer and glyph-to-glyph
 * repulsion, the click shockwave). This file owns the layout.
 *
 * Where a glyph may stand is whatever the frame is not using, and the frame is
 * measured rather than assumed — motion.js's morph resizes it, the copy takes the
 * middle band once it fades in, and the viewport decides the rest. So:
 *
 *   1. carve the frame, plus its clearance, out of the field. What is left is one
 *      band per side — which is where the left/right/top/bottom names come from;
 *   2. carve the copy's *text* out of those bands. The rects come from a Range, so
 *      the keep-out hugs the words instead of the full-width block box, which is
 *      what leaves room for glyphs beside the headline rather than only above and
 *      below it;
 *   3. deal each band's glyphs into the pieces it has left, in proportion to area;
 *   4. pack each piece as a grid, drop each glyph in its cell, and add a little
 *      seeded jitter so the result reads as a drifting field rather than a table.
 *
 * A band with no room gives its glyphs to the side band nearer their home. That
 * case is real: once the frame has docked, the strip above it is the gap under
 * the copy and the strip below is the caption, and neither can hold a glyph.
 *
 * The check is tooling/check-field.cjs — nine viewport widths x both frame states,
 * reporting every glyph's visible fraction. The constants that look arbitrary
 * (EDGE, TEXT_EDGE, GAP, OVERHANG) are the ones that test holds.
 */

(function (root) {
  "use strict";

  var EDGE = 24; // clearance between a glyph and the frame
  var TEXT_EDGE = 10; // clearance between a glyph and the copy's words
  var GAP = 6; // the gap a cell tries to leave around its glyph
  var OVERHANG = 6; // how far a glyph may hang over the field's own edge
  var MAX_COLS = 4; // never more than four glyphs side by side in one piece
  var MIN_BLOCK = 6; // ignore a text rect smaller than this (a stray mark)

  /* Deterministic scatter. Integer multiply rather than a seeded PRNG, so a glyph
     lands in the same place in the browser and in the Node check. */
  function hash(n) {
    return ((n * 2654435761) % 1000) / 1000;
  }

  function inflate(box, by) {
    return { x: box.x - by, y: box.y - by, w: box.w + by * 2, h: box.h + by * 2 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function area(box) {
    return box.w * box.h;
  }

  /* One box minus one block -> up to four boxes. */
  function subtract(box, block) {
    if (!overlap(box, block)) return [box];

    var bx0 = box.x;
    var by0 = box.y;
    var bx1 = box.x + box.w;
    var by1 = box.y + box.h;
    var kx0 = Math.max(bx0, block.x);
    var ky0 = Math.max(by0, block.y);
    var kx1 = Math.min(bx1, block.x + block.w);
    var ky1 = Math.min(by1, block.y + block.h);
    var out = [];

    if (kx0 > bx0) out.push({ x: bx0, y: by0, w: kx0 - bx0, h: box.h });
    if (kx1 < bx1) out.push({ x: kx1, y: by0, w: bx1 - kx1, h: box.h });
    if (ky0 > by0) out.push({ x: kx0, y: by0, w: kx1 - kx0, h: ky0 - by0 });
    if (ky1 < by1) out.push({ x: kx0, y: ky1, w: kx1 - kx0, h: by1 - ky1 });

    return out;
  }

  function carve(box, blocks) {
    var pieces = [box];

    for (var b = 0; b < blocks.length; b += 1) {
      var next = [];
      for (var p = 0; p < pieces.length; p += 1) {
        next = next.concat(subtract(pieces[p], blocks[b]));
      }
      pieces = next;
      if (!pieces.length) break;
    }

    return pieces.filter(function (piece) {
      return piece.w > 2 && piece.h > 2;
    });
  }

  /* Which band a leftover piece of the field belongs to. */
  function nameFor(piece, frame, w) {
    if (!frame) return piece.x + piece.w / 2 < w / 2 ? "left" : "right";

    if (piece.y + piece.h <= frame.y + 1) return "top";
    if (piece.y >= frame.y + frame.h - 1) return "bottom";
    if (piece.x + piece.w <= frame.x + 1) return "left";
    if (piece.x >= frame.x + frame.w - 1) return "right";

    return piece.x + piece.w / 2 < frame.x + frame.w / 2 ? "left" : "right";
  }

  /* A grid inside one piece: pick the column count that leaves the most air
     around the largest glyph standing in it, and prefer square-ish cells when
     two counts are equally roomy. */
  function grid(slice, box) {
    var maxSize = 0;
    var i;

    for (i = 0; i < slice.length; i += 1) {
      if (slice[i].size > maxSize) maxSize = slice[i].size;
    }

    var limit = Math.min(MAX_COLS, slice.length);
    var best = null;

    for (var cols = 1; cols <= limit; cols += 1) {
      var rows = Math.ceil(slice.length / cols);
      var cellW = box.w / cols;
      var cellH = box.h / rows;
      var slack = Math.min(cellW - maxSize, cellH - maxSize);
      var square = Math.abs(cellW - cellH);

      if (
        !best ||
        slack > best.slack + 0.5 ||
        (Math.abs(slack - best.slack) <= 0.5 && square < best.square)
      ) {
        best = { cols: cols, rows: rows, cellW: cellW, cellH: cellH, slack: slack, square: square };
      }
    }

    return best;
  }

  function clampToField(point, size, w, h) {
    var half = size / 2;
    return {
      x: Math.min(w - half + OVERHANG, Math.max(half - OVERHANG, point.x)),
      y: Math.min(h - half + OVERHANG, Math.max(half - OVERHANG, point.y)),
    };
  }

  function pack(slice, box, w, h) {
    if (!slice.length) return [];

    var layout = grid(slice, box);
    var maxSize = 0;
    var i;

    for (i = 0; i < slice.length; i += 1) {
      if (slice[i].size > maxSize) maxSize = slice[i].size;
    }

    // Whatever air the cell has beyond the largest glyph is where the jitter may
    // go, so two glyphs in neighbouring cells can never be pushed into each other.
    var slackX = Math.max(0, (layout.cellW - maxSize) / 2);
    var slackY = Math.max(0, (layout.cellH - maxSize) / 2);
    var out = [];

    for (i = 0; i < slice.length; i += 1) {
      var item = slice[i];
      var col = i % layout.cols;
      var row = Math.floor(i / layout.cols);
      var point = {
        x: box.x + col * layout.cellW + layout.cellW / 2 + (hash(item.index + 11) - 0.5) * slackX * 1.2,
        y: box.y + row * layout.cellH + layout.cellH / 2 + (hash(item.index + 23) - 0.5) * slackY * 1.2,
      };

      out.push({ index: item.index, x: clampToField(point, item.size, w, h).x, y: clampToField(point, item.size, w, h).y });
    }

    return out;
  }

  /* Deal n glyphs into pieces in proportion to their area, one at a time for the
     remainder, so a big piece takes the extra rather than a small one. */
  function deal(slice, pieces) {
    var buckets = pieces.map(function (piece) {
      return { box: piece, slice: [] };
    });

    if (!buckets.length) return [];

    var total = 0;
    var i;
    for (i = 0; i < buckets.length; i += 1) total += Math.max(1, area(buckets[i].box));

    var quotas = buckets.map(function (bucket) {
      return Math.max(1, Math.floor((slice.length * Math.max(1, area(bucket.box))) / total));
    });

    var sum = quotas.reduce(function (a, b) {
      return a + b;
    }, 0);

    while (sum > slice.length) {
      var biggest = 0;
      for (i = 1; i < quotas.length; i += 1) if (quotas[i] > quotas[biggest]) biggest = i;
      if (quotas[biggest] <= 1) break;
      quotas[biggest] -= 1;
      sum -= 1;
    }

    while (sum < slice.length) {
      var roomiest = 0;
      for (i = 1; i < buckets.length; i += 1) {
        if (area(buckets[i].box) > area(buckets[roomiest].box)) roomiest = i;
      }
      quotas[roomiest] += 1;
      sum += 1;
    }

    var cursor = 0;
    for (i = 0; i < buckets.length; i += 1) {
      buckets[i].slice = slice.slice(cursor, cursor + quotas[i]);
      cursor += quotas[i];
    }

    return buckets;
  }

  /* plan(view) -> homes, indexed by the glyph's document order. Pure: no DOM. */
  function plan(view) {
    var w = view.w;
    var h = view.h;
    var glyphs = view.glyphs || [];
    var homes = new Array(glyphs.length);
    var blocks = (view.blocks || [])
      .map(function (block) {
        return inflate(block, TEXT_EDGE);
      })
      .filter(function (block) {
        return block.w >= MIN_BLOCK && block.h >= MIN_BLOCK;
      });

    if (!w || !h || !glyphs.length) return homes;

    var frame = view.shell ? inflate(view.shell, EDGE) : null;
    var free = frame ? carve({ x: 0, y: 0, w: w, h: h }, [frame]) : [{ x: 0, y: 0, w: w, h: h }];

    // The side bands keep their full height — the copy's text is in the middle of
    // the field, not out here. The strips above and below the frame span the whole
    // width, so there the copy does cut the band in two, and those two niches are
    // exactly the room beside a headline.
    var pieces = { left: [], right: [], top: [], bottom: [] };

    free.forEach(function (piece) {
      var name = nameFor(piece, frame, w);

      if (name === "top" || name === "bottom") {
        carve(piece, blocks).forEach(function (bit) {
          if (bit.w >= MIN_BLOCK && bit.h >= MIN_BLOCK) pieces[name].push(bit);
        });
      } else {
        pieces[name].push(piece);
      }
    });

    var groups = { left: [], right: [], top: [], bottom: [] };

    glyphs.forEach(function (glyph, index) {
      var band = groups[glyph.band] ? glyph.band : "left";
      groups[band].push({ index: index, size: glyph.size });
    });

    // A band with nowhere to stand: hand its glyphs to the sides, alternating, so
    // they arrive evenly rather than all on one side.
    var homeless = [];

    ["top", "bottom"].forEach(function (band) {
      var smallest = Infinity;
      groups[band].forEach(function (glyph) {
        if (glyph.size < smallest) smallest = glyph.size;
      });

      var room = pieces[band].filter(function (piece) {
        return piece.w >= smallest && piece.h >= smallest;
      });

      if (!room.length) {
        homeless = homeless.concat(groups[band]);
        groups[band] = [];
        return;
      }

      pieces[band] = room;
    });

    homeless.forEach(function (glyph, i) {
      groups[i % 2 === 0 ? "left" : "right"].push(glyph);
    });

    ["left", "right", "top", "bottom"].forEach(function (band) {
      var slice = groups[band];
      if (!slice.length) return;

      var room = pieces[band];
      if (!room.length) {
        // No measured band at all (no frame yet): the whole field is fair game.
        pack(slice, { x: 0, y: 0, w: w, h: h }, w, h).forEach(function (home) {
          homes[home.index] = { x: home.x, y: home.y };
        });
        return;
      }

      deal(slice, room).forEach(function (bucket) {
        pack(bucket.slice, bucket.box, w, h).forEach(function (home) {
          homes[home.index] = { x: home.x, y: home.y };
        });
      });
    });

    return homes;
  }

  /* ---------- The DOM side ---------- */

  function field() {
    return document.getElementById("iconField");
  }

  /* The copy's words, as boxes. A Range's client rects are per line box and hug
     the text; the element's own rect is the full width of the column, which would
     wall off the whole middle of the field. */
  function textBoxes(el, fieldRect) {
    var boxes = [];
    var range = document.createRange();

    Array.prototype.forEach.call(el.children, function (child) {
      if (child.getAttribute("aria-hidden") === "true" && !child.textContent.trim()) return;

      try {
        range.selectNodeContents(child);
      } catch (error) {
        return;
      }

      var rects = range.getClientRects();
      var top = Infinity;
      var left = Infinity;
      var right = -Infinity;
      var bottom = -Infinity;

      for (var i = 0; i < rects.length; i += 1) {
        var rect = rects[i];
        if (rect.width < 2 || rect.height < 2) continue;
        top = Math.min(top, rect.top);
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
      }

      if (top === Infinity) return;
      boxes.push({ x: left - fieldRect.left, y: top - fieldRect.top, w: right - left, h: bottom - top });
    });

    return boxes;
  }

  function measure() {
    var el = field();
    if (!el) return null;
    if (root.getComputedStyle && root.getComputedStyle(el).display === "none") return null;

    var fieldRect = el.getBoundingClientRect();
    if (!fieldRect.width || !fieldRect.height) return null;

    var shellEl = document.getElementById("labShell");
    var shellRect = shellEl ? shellEl.getBoundingClientRect() : null;
    var copy = document.getElementById("heroCopy");
    var blocks = [];
    var visible = false;

    if (copy) {
      visible = parseFloat(root.getComputedStyle(copy).opacity || "1") > 0.08;
      // While the copy is faded behind the full-screen frame it is not there for
      // the eye, so it must not push glyphs around either.
      if (visible) blocks = textBoxes(copy, fieldRect);
    }

    var chips = el.querySelectorAll(".ip");
    var glyphs = [];
    for (var i = 0; i < chips.length; i += 1) {
      glyphs.push({
        band: chips[i].getAttribute("data-band") || "left",
        size: chips[i].offsetWidth || parseFloat(chips[i].getAttribute("data-size")) || 32,
      });
    }

    return {
      w: fieldRect.width,
      h: fieldRect.height,
      glyphs: glyphs,
      shell: shellRect && shellRect.width
        ? {
            x: shellRect.left - fieldRect.left,
            y: shellRect.top - fieldRect.top,
            w: shellRect.width,
            h: shellRect.height,
          }
        : null,
      blocks: blocks,
    };
  }

  /* Everything the physics needs, in the field's own coordinates: where each glyph
     wants to be, and the two things it must not sit on top of. */
  function layout() {
    var view = measure();
    if (!view) return null;

    var homes = plan(view);
    var el = field();
    var fieldRect = el.getBoundingClientRect();

    return {
      venue: { w: view.w, h: view.h },
      fieldRect: fieldRect,
      shell: view.shell,
      blocks: view.blocks
        .map(function (block) {
          return inflate(block, TEXT_EDGE);
        })
        .filter(function (block) {
          return block.w >= MIN_BLOCK && block.h >= MIN_BLOCK;
        }),
      homes: homes,
    };
  }

  function place() {
    var el = field();
    if (!el) return null;

    var view = measure();
    if (!view) return null;

    var homes = plan(view);
    var chips = el.querySelectorAll(".ip");

    for (var i = 0; i < chips.length; i += 1) {
      var chip = chips[i];
      var home = homes[i];
      if (!home) continue;

      var half = (view.glyphs[i].size || 32) / 2;
      // The stylesheet's slot positions the no-JavaScript arrangement with `left`
      // and `top`. From here a glyph is positioned by its transform alone, so those
      // have to be zeroed — leaving them in place would displace every glyph by its
      // own slot, which is a jump of a few hundred pixels for the ones on the right.
      chip.style.left = "0px";
      chip.style.top = "0px";
      chip.style.transform =
        "translate(" + (home.x - half).toFixed(1) + "px, " + (home.y - half).toFixed(1) + "px)";
    }

    return homes;
  }

  var api = {
    plan: plan,
    measure: measure,
    layout: layout,
    place: place,
    EDGE: EDGE,
    TEXT_EDGE: TEXT_EDGE,
  };

  root.JayodField = api;

  /* ---------- Before the first paint ---------- */

  if (typeof document !== "undefined" && field()) {
    var docEl = document.documentElement;

    try {
      // The opening frame is drawn by the stylesheet and measured against the
      // masthead, so this has to be set before the frame is measured.
      var header = document.getElementById("siteHeader");
      if (header) {
        docEl.style.setProperty("--masthead-h", Math.round(header.getBoundingClientRect().height) + "px");
      }

      place();
    } catch (error) {
      /* A field that cannot be placed falls back to the stylesheet's slots. */
    }

    docEl.classList.add("icons-ready");
  }
})(typeof window !== "undefined" ? window : globalThis);
