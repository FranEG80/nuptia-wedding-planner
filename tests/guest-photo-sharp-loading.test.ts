import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

test("un binario de sharp ausente solo falla al procesar una foto, no al cargar las acciones", () => {
  const script = `
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const original = Module._extensions['.node'];
    Module._extensions['.node'] = (module, filename) => {
      if (filename.includes('sharp')) throw new Error('TEST_NATIVE_SHARP_MISSING');
      return original(module, filename);
    };
    const { sharpGuestPhotoImageProcessor } = require('./src/domains/guest-photos/adapters/sharp/sharp-guest-photo-image-processor.ts');
    assert.equal(typeof sharpGuestPhotoImageProcessor.process, 'function');
    sharpGuestPhotoImageProcessor.process(new Uint8Array([1])).then(
      () => { console.error('Expected native module failure'); process.exitCode = 1; },
      error => { assert.match(error.message, /TEST_NATIVE_SHARP_MISSING/); }
    );
  `
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=commonjs", "-e", script], {
    cwd: process.cwd(), encoding: "utf8",
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})
