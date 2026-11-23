const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function element() {
  return {
    dataset: {},
    listeners: {},
    attributes: {},
    children: [],
    append(...children) { this.children.push(...children); },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    get valueAsNumber() { return this.value ? Number(this.value) : NaN; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    focus() {},
    querySelector() { return closeButton; },
    replaceChildren(...children) { this.children = children; }
  };
}
const ids = Object.fromEntries(["guide-dialog", "dialog-content", "shot-dialog", "shot-title", "shot-image", "shot-caption", "gallery", "thickness", "drop", "focus-error", "units", "speed-heading"].map(id => [id, element()]));
const closeButton = element();
const presets = [1.5, 3, 4, 6].map(n => Object.assign(element(), {dataset: {thickness: String(n)}}));
const speeds = [150, 100, 150, 20].map(n => Object.assign(element(), {dataset: {speed: String(n)}}));
const document = Object.assign(element(), {
  createElement: element,
  querySelector: selector => ids[selector.slice(1)],
  querySelectorAll: selector => ({"[data-thickness]": presets, "[data-speed]": speeds, ".nav nav a": []})[selector],
  getElementById: id => ({content: {cloneNode: () => id}})
});
const click = (dataset, name) => document.listeners.click({target: {closest: () => ({dataset, hasAttribute: key => key === name})}});
ids.thickness.value = "3";
ids.units.value = "min";
vm.runInNewContext(fs.readFileSync("guide.js", "utf8"), {document, window: element(), Intl});
assert.equal(ids.gallery.children.length, 10);
assert.equal(ids.drop.value, "14.00 mm");
presets[3].listeners.click();
assert.equal(ids.drop.value, "11.00 mm");
assert.equal(presets[3].attributes["aria-pressed"], "true");
for (const value of ["", "-1", "17.001"]) {
  ids.thickness.value = value;
  ids.thickness.listeners.input();
  assert.equal(ids.drop.value, "—");
  assert.equal(ids["focus-error"].hidden, false);
}
ids.thickness.value = "17";
ids.thickness.listeners.input();
assert.equal(ids.drop.value, "0.00 mm");
assert.deepEqual(speeds.map(speed => speed.textContent), ["9,000", "6,000", "9,000", "1,200"]);
ids.units.value = "sec";
ids.units.listeners.change();
assert.equal(ids["speed-heading"].textContent, "Speed (mm/s)");
assert.deepEqual(speeds.map(speed => speed.textContent), ["150", "100", "150", "20"]);
for (const id of ["install", "profile", "restore", "downloads"]) {
  click({dialog: id}, "data-dialog");
  assert.equal(ids["guide-dialog"].open, true);
  assert.deepEqual(ids["dialog-content"].children, [id]);
}
click({shot: "workspace"}, "data-shot");
assert.equal(ids["shot-title"].textContent, "Workspace");
assert.equal(ids["shot-dialog"].open, true);
click({shotStep: "-1"}, "data-shot-step");
assert.equal(ids["shot-title"].textContent, "Select a workpiece");
ids["shot-dialog"].listeners.keydown({key: "ArrowRight", preventDefault() {}});
assert.equal(ids["shot-title"].textContent, "Workspace");
for (const button of ids.gallery.children) assert.ok(fs.existsSync(`assets/${button.dataset.shot}.webp`));
console.log("Passed gallery, tutorial modal, Z-height, and speed conversion checks.");
