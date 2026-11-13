/* ============================================================
   MenuPages.test.js — What the binder's pages say about levels
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { LEVELS, levelFacts, explodesOn, regionAt, OFFICE_MENU, GAME_MENU, OPTIONS_MENU, resultLines, freePlayTopic, FREE_PLAY_HELP } from '../src/js/menu/MenuPages.js';
import { freePlayConfig, DEFAULT_FREE_PLAY } from '../src/js/game/rules/FreePlayRules.js';
import { stepVolume } from '../src/js/utils/settings.js';
import { DIFFICULTY } from '../src/js/utils/constants.js';

describe('Binder levels', () => {
  it('lists every difficulty once, in order', () => {
    expect(LEVELS.map(level => level.id)).toEqual(Object.keys(DIFFICULTY));
    expect(LEVELS.map(level => level.number)).toEqual(['1.1', '1.2', '1.3', '1.4']);
  });

  it('gives every level a brief of its own', () => {
    const briefs = new Set(LEVELS.map(level => level.brief));
    expect(briefs.size).toBe(LEVELS.length);
  });

  it('counts needy modules apart from the modules to solve', () => {
    expect(levelFacts('medium')).toEqual([
      ['Modules', '5'],
      ['Needy modules', '1'],
      ['Time', '4:00'],
      ['Explodes on', 'strike 3'],
    ]);
    expect(levelFacts('easy')[1]).toEqual(['Needy modules', 'None']);
  });

  it('says when the bomb explodes in plain words', () => {
    expect(explodesOn(1)).toBe('the first strike');
    expect(explodesOn(2)).toBe('strike 2');
    expect(levelFacts('expert')[3]).toEqual(['Explodes on', 'the first strike']);
  });
});

describe('Page regions', () => {
  const regions = [
    { id: 'a', x: 10, y: 10, w: 100, h: 50 },
    { id: 'b', x: 10, y: 80, w: 100, h: 50 },
  ];

  it('finds the region under a point, edges included', () => {
    expect(regionAt(regions, 50, 30).id).toBe('a');
    expect(regionAt(regions, 110, 130).id).toBe('b');
  });

  it('finds nothing between regions', () => {
    expect(regionAt(regions, 50, 70)).toBeNull();
  });
});

describe('Menu sheets', () => {
  const ids = (menu) => menu.items.filter(item => !item.disabled).map(item => item.id);

  it('offers the manual and options in the office', () => {
    expect(ids(OFFICE_MENU)).toEqual(['manual', 'options']);
    expect(ids(OPTIONS_MENU)).toEqual(['sound', 'options-back']);
  });

  it('offers a restart and the way back during a game, but not the manual', () => {
    expect(ids(GAME_MENU)).toEqual(['restart', 'leave']);
    expect(GAME_MENU.footnote).toMatch(/keeps ticking/);
  });
});

describe('Results report', () => {
  it('describes an explosion with its cause', () => {
    const lines = resultLines({ level: 'easy', won: false, timeRemaining: 0, cause: 'Time ran out' });
    expect(lines).toEqual({
      identifier: '1.1  Easy',
      configuration: ['5:00', '3 Modules', '3 Strikes'],
      stamp: 'EXPLODED',
      timeRemaining: '0:00',
      cause: 'Time ran out',
    });
  });

  it('describes a defused bomb without a cause, rounding the time up', () => {
    const lines = resultLines({ level: 'expert', won: true, timeRemaining: 72.3, cause: null });
    expect(lines.stamp).toBe('DEFUSED');
    expect(lines.timeRemaining).toBe('1:13');
    expect(lines.cause).toBeNull();
    expect(lines.configuration).toEqual(['3:00', '9 Modules', '1 Strike']);
  });
});

describe('Volume steps', () => {
  it('moves in tenths and stays between 0 and 1', () => {
    expect(stepVolume(1, 0.1)).toBe(1);
    expect(stepVolume(1, -0.1)).toBe(0.9);
    expect(stepVolume(0.3, -0.1)).toBe(0.2);
    expect(stepVolume(0, -0.1)).toBe(0);
    expect(stepVolume(0.7, 0.1)).toBe(0.8);
  });
});

describe('Free Play pages', () => {
  it('names a Free Play bomb on the report from its own settings', () => {
    const config = freePlayConfig({ ...DEFAULT_FREE_PLAY, modules: 5, time: 420, hardcore: true });
    const lines = resultLines({ level: config, won: false, timeRemaining: 12, cause: 'Mazes' });
    expect(lines.identifier).toBe('Free Play, hardcore');
    expect(lines.configuration).toEqual(['7:00', '5 Modules', '1 Strike']);
    expect(lines.cause).toBe('Mazes');
  });

  it('explains whichever control is pointed at', () => {
    expect(freePlayTopic('fp-time-up')).toBe('time');
    expect(freePlayTopic('fp-modules-down')).toBe('modules');
    expect(freePlayTopic('fp-needy')).toBe('needy');
    expect(freePlayTopic('fp-start')).toBe('start');
    expect(freePlayTopic(null)).toBe('none');
    expect(FREE_PLAY_HELP.hardcore.join(' ')).toMatch(/SINGLE STRIKE/);
  });
});
