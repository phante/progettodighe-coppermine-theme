import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Il tema tiene una copia degli asset del sito principale invece di puntarci a
// runtime: il CSS di Hugo è fingerprinted, quindi non ha un URL stabile, e la
// gallery deve restare in piedi anche se il sito non risponde. La copia però
// deve restare una copia — è quello che verifica questo test.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITO = resolve(REPO, "../progettodighe/themes/progettodighe");

const COPPIE = [
  ["asset/css/tachyons.css", "assets/asset/css/tachyons.css"],
  ["asset/brand/PDLogo.svg", "static/asset/brand/PDLogo.svg"],
];

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

for (const [locale, remoto] of COPPIE) {
  test(`${locale} è allineato al sito principale`, (t) => {
    const origine = resolve(SITO, remoto);
    if (!existsSync(origine)) {
      t.skip("../progettodighe non è clonato accanto");
      return;
    }
    assert.equal(
      sha256(resolve(REPO, locale)),
      sha256(origine),
      `${locale} è divergente da ${remoto}: ricopialo dal sito principale`,
    );
  });
}
