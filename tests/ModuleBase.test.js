/* ============================================================
   ModuleBase.test.js — Module lifecycle, parts and status light
   Uses small stand-in models, so no renderer or .glb is needed.
   ============================================================ */

import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleBase } from '../src/js/game/ModuleBase.js';
import { PlaceholderRules } from '../src/js/game/rules/PlaceholderRules.js';

function namedMesh(name) {
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
  mesh.name = name;
  return mesh;
}

vi.mock('../src/js/three/ModelLoader.js', () => ({
  loadModel: async (name) => {
    const model = new THREE.Group();
    if (name === 'module_housing') model.add(namedMesh('status_light'));
    else {
      const button = namedMesh('part_button');
      button.add(namedMesh('hit_button'));
      model.add(button, namedMesh('decoration'));
    }
    return model;
  },
}));

class TestModule extends ModuleBase {
  setup() {
    this.log = ['setup'];
    this.modelName = 'test';
    this.answer = 'button';
  }

  build() {
    this.log.push(`build ${this.answer}`);
  }

  onPartClick(partId) {
    this.log.push(`click ${partId}`);
    this.solve();
  }
}

function makeModule(callbacks = {}) {
  return new TestModule('front-0', new THREE.Group(), {}, callbacks);
}

describe('lifecycle', () => {
  it('sets up its data before building', async () => {
    const module = makeModule();
    await module.load();
    expect(module.log).toEqual(['setup', 'build button']);
    expect(module.root.parent).toBe(module.slotMesh);
  });

  it('stays off the bomb if disposed during loading', async () => {
    const module = makeModule();
    const loading = module.load();
    module.dispose();
    await loading;
    expect(module.slotMesh.children).toHaveLength(0);
    expect(module.parts.size).toBe(0);
  });

  it('leaves the slot empty after dispose', async () => {
    const module = makeModule();
    await module.load();
    module.dispose();
    expect(module.slotMesh.children).toHaveLength(0);
  });
});

describe('parts', () => {
  let module;

  beforeEach(async () => {
    module = makeModule();
    await module.load();
  });

  it('treats only part_ objects as clickable', () => {
    expect([...module.parts.keys()]).toEqual(['button']);
    const { type, interactive, slotId, partId } = module.parts.get('button').userData;
    expect({ type, interactive, slotId, partId }).toEqual({
      type: 'modulePart', interactive: true, slotId: 'front-0', partId: 'button',
    });
  });

  it('hides hit shapes but keeps them under their part', () => {
    const hit = module.root.getObjectByName('hit_button');
    expect(hit.visible).toBe(false);
    expect(hit.parent).toBe(module.parts.get('button'));
  });

  it('removes a part from the module', () => {
    const button = module.parts.get('button');
    module.setPartHover('button', true);
    module.removePart('button');
    expect(button.parent).toBeNull();
    expect(button.material.emissiveIntensity).toBe(0);
    expect(module.handlePartClick('button')).toBe(false);
  });

  it('ignores unknown parts', () => {
    expect(module.handlePartClick('missing')).toBe(false);
    expect(module.log).not.toContain('click missing');
  });

  it('stops taking clicks and hover once solved', () => {
    expect(module.handlePartClick('button')).toBe(true);
    expect(module.handlePartClick('button')).toBe(false);
    expect(module.setPartHover('button', true)).toBe(false);
  });

  it('clears the hover highlight', () => {
    const { material } = module.parts.get('button');
    expect(module.setPartHover('button', true)).toBe(true);
    expect(material.emissiveIntensity).toBeGreaterThan(0);
    module.setPartHover('button', false);
    expect(material.emissiveIntensity).toBe(0);
  });
});

describe('solve and strike', () => {
  const lightOf = module => module.root.getObjectByName('status_light').material;

  it('reports a solve once and turns the light green', async () => {
    const onSolve = vi.fn();
    const module = makeModule({ onSolve });
    await module.load();
    module.solve();
    module.solve();
    expect(onSolve).toHaveBeenCalledOnce();
    expect(onSolve).toHaveBeenCalledWith('front-0');
    expect(lightOf(module).emissive.getHex()).toBe(0x2ecc71);
  });

  it('flashes red on a strike, then goes dark', async () => {
    vi.useFakeTimers();
    const onStrike = vi.fn();
    const module = makeModule({ onStrike });
    await module.load();
    module.strike();
    expect(onStrike).toHaveBeenCalledWith('front-0');
    expect(lightOf(module).emissive.getHex()).toBe(0xe94560);
    vi.runAllTimers();
    expect(lightOf(module).emissiveIntensity).toBe(0);
    vi.useRealTimers();
  });

  it('keeps the light green when solved during a strike flash', async () => {
    vi.useFakeTimers();
    const module = makeModule();
    await module.load();
    module.strike();
    module.solve();
    vi.runAllTimers();
    expect(lightOf(module).emissive.getHex()).toBe(0x2ecc71);
    vi.useRealTimers();
  });

  it('gives each module its own status light material', async () => {
    const first = makeModule();
    const second = makeModule();
    await Promise.all([first.load(), second.load()]);
    expect(lightOf(first)).not.toBe(lightOf(second));
  });
});

describe('placeholder rules', () => {
  it.each([['solve', 'solve'], ['strike', 'strike']])('%s button gives %s', (part, result) => {
    expect(new PlaceholderRules().press(part)).toBe(result);
  });
});
