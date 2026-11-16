/* ============================================================
   Loader.js — The bomb that hides the scene while it loads
   The loader is in index.html, so it shows at once. Here the
   spark burns down the fuse as each tracked load finishes, and
   when all are done the bomb blasts away to show the scene.
   ============================================================ */

const MIN_SECONDS = 1.6;    // Long enough to see the spark travel, even on a fast load
const BLAST_SECONDS = 0.9;  // The flash, as in index.html's loader-flash
const SPARK_SPEED = 1.4;    // Fuse lengths per second the spark may move at most

/**
 * How far along the fuse the spark should be, 0 to 1. It follows the loads
 * that have finished, creeps a little while it waits for the next one, and
 * never gets ahead of the minimum time, so a fast load still shows the spark.
 */
export function sparkProgress(done, total, seconds) {
  const timed = Math.min(1, seconds / MIN_SECONDS);
  if (!total) return 0;
  if (done >= total) return timed;
  const creeping = (done + 0.8 * (1 - Math.exp(-seconds / 4))) / total;
  return Math.min(timed, creeping);
}

export class Loader {
  constructor(element = document.getElementById('loader')) {
    this.element = element;
    this._total = 0;
    this._done = 0;
    this._shown = 0;
    this._start = performance.now();
    this._finished = null;
    if (!element) return;

    this._fuse = element.querySelector('.fuse');
    this._spark = element.querySelector('.spark');
    this._length = this._fuse.getTotalLength();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  /**
   * Count a load towards the fuse. Returns the same promise.
   */
  track(promise) {
    this._total++;
    const count = () => { this._done++; };
    promise.then(count, count);
    return promise;
  }

  /**
   * Once every tracked load is done and the spark has reached the bomb, blast
   * @returns {Promise<void>} resolves when the scene is showing
   */
  finish() {
    if (!this.element) return Promise.resolve();
    this._finishing = true;
    if (!this._finished) this._finished = new Promise(resolve => { this._resolve = resolve; });
    return this._finished;
  }

  _tick(now) {
    const seconds = (now - this._start) / 1000;
    const target = sparkProgress(this._done, this._total, seconds);
    const step = SPARK_SPEED / 60;
    // Only ever forward: a load counted late must not pull the spark back
    this._shown = Math.max(this._shown, Math.min(target, this._shown + step));
    this._draw(this._shown);

    if (this._finishing && this._shown >= 1 && this._done >= this._total) {
      this._blast();
      return;
    }
    requestAnimationFrame(this._tick);
  }

  // The fuse burns from its far end towards the bomb, with the spark at the burning point
  _draw(progress) {
    const left = this._length * (1 - progress);
    this._fuse.style.strokeDasharray = `${left} ${this._length}`;
    const point = this._fuse.getPointAtLength(left);
    this._spark.setAttribute('transform', `translate(${point.x} ${point.y})`);
  }

  _blast() {
    this.element.classList.add('blast');
    setTimeout(() => {
      this.element.classList.add('gone');
      this._resolve?.();
    }, BLAST_SECONDS * 1000);
  }
}
