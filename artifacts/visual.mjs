import { chromium } from "playwright";

const URL = process.env.SITE_URL || "http://127.0.0.1:8901/index.html";
const OUT = "/workspace/chats/4ecd652189b715e6263ad7a5/artifacts";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`);
});

await page.goto(URL, { waitUntil: "load" });
await page.waitForTimeout(2600);

// --- hero ---
await page.screenshot({ path: `${OUT}/v3-hero.png` });
const lab = await page.evaluate(() => ({
  labVisible: Boolean(document.getElementById("lab")),
  codeLines: document.querySelectorAll("#codeLines li").length,
  state: document.getElementById("labState")?.textContent,
  caption: document.getElementById("labCaption")?.textContent,
  stepsDone: document.querySelectorAll("#labSteps li.is-done").length,
  bars: document.querySelectorAll(".mock-bars i").length,
  barsHeight: getComputedStyle(document.querySelector(".mock-bars i")).height,
}));
console.log("LAB:", JSON.stringify(lab));

// hover inspection link: hovering a mock node should light the code line
const node = page.locator('.mock-node[data-sel="headline"]').first();
await node.hover();
await page.waitForTimeout(300);
const lit = await page.evaluate(() => ({
  litInCode: document.querySelectorAll('#codeLines li.is-lit').length,
  litInMock: document.querySelectorAll('.mock-node.is-lit').length,
}));
console.log("INSPECT:", JSON.stringify(lit));
await page.screenshot({ path: `${OUT}/v3-hero-inspect.png` });

// --- scroll down to work ---
await page.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
await page.waitForTimeout(1800);
const down = await page.evaluate(() => {
  const card = document.querySelector(".card");
  const h2 = document.querySelector("#work .section-head h2");
  return {
    cardOpacity: getComputedStyle(card).opacity,
    cardTransform: getComputedStyle(card).transform,
    headingOpacity: getComputedStyle(h2).opacity,
  };
});
console.log("AFTER SCROLL DOWN:", JSON.stringify(down));
await page.screenshot({ path: `${OUT}/v3-work.png` });

// --- scroll back up: animations must reverse, not stay played ---
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(1800);
const up = await page.evaluate(() => {
  const card = document.querySelector(".card");
  return { cardOpacity: getComputedStyle(card).opacity };
});
console.log("AFTER SCROLL BACK UP:", JSON.stringify(up));

// --- scroll down again: must replay without a reload ---
await page.evaluate(() => window.scrollTo({ top: document.getElementById("work").offsetTop, behavior: "instant" }));
await page.waitForTimeout(1600);
const again = await page.evaluate(() => ({ cardOpacity: getComputedStyle(document.querySelector(".card")).opacity }));
console.log("SECOND PASS DOWN:", JSON.stringify(again));

// --- further sections ---
for (const [id, name] of [["faq", "faq"], ["approach", "approach"], ["studio", "studio"], ["contact", "contact"]]) {
  await page.evaluate((sectionId) => window.scrollTo({ top: document.getElementById(sectionId).offsetTop - 40, behavior: "instant" }), id);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/v3-${name}.png` });
}

// FAQ interaction
await page.locator("#faq-t1").click();
await page.waitForTimeout(700);
const faq = await page.evaluate(() => ({
  expanded: document.getElementById("faq-t1").getAttribute("aria-expanded"),
  panelVisible: getComputedStyle(document.getElementById("faq-p1")).display,
  panelText: (document.getElementById("faq-p1").textContent || "").trim().slice(0, 48),
}));
console.log("FAQ:", JSON.stringify(faq));
await page.screenshot({ path: `${OUT}/v3-faq-open.png` });

// --- mobile ---
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(URL, { waitUntil: "load" });
await mobile.waitForTimeout(2200);
await mobile.screenshot({ path: `${OUT}/v3-mobile-hero.png` });
await mobile.evaluate(() => window.scrollTo({ top: document.getElementById("faq").offsetTop - 30, behavior: "instant" }));
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: `${OUT}/v3-mobile-faq.png` });
const overflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
console.log("MOBILE OVERFLOW:", JSON.stringify(overflow));

// --- light theme ---
await page.evaluate(() => {
  document.documentElement.setAttribute("data-theme", "light");
});
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/v3-light-hero.png` });

console.log("ERRORS:", errors.length ? JSON.stringify(errors.slice(0, 6)) : "none");
await browser.close();
