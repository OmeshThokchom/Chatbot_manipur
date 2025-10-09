
import { useEffect, useRef } from 'react';


class TextScramble<T extends HTMLElement> {
  el: T;
  chars: string;
  _frameRequest: number | null = null;
  _frame = 0;
  _queue: { from: string; to: string; start: number; end: number; char?: string }[] = [];
  _resolve: (() => void) | null = null;

  constructor(el: T, chars = '!<>-_\/[]{}—=+*^?#________') {
    this.el = el;
    this.chars = chars;
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => (this._resolve = resolve));
    this._queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this._queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this._frameRequest!);
    this._frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this._queue.length; i < n; i++) {
      let { from, to, start, end, char } = this._queue[i];
      if (this._frame >= end) {
        complete++;
        output += to;
      } else if (this._frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this._queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this._queue.length) {
      this._resolve!();
    } else {
      this._frameRequest = requestAnimationFrame(this.update);
      this._frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

const useTextScramble = <T extends HTMLElement>(phrases: string[], interval: number) => {
  const scrambleRef = useRef<TextScramble<T> | null>(null);
  const elRef = useRef<T | null>(null);

  useEffect(() => {
    if (elRef.current) {
      scrambleRef.current = new TextScramble(elRef.current);
      let counter = 0;
      const next = () => {
        if (scrambleRef.current) {
          scrambleRef.current.setText(phrases[counter]).then(() => {
            setTimeout(next, interval);
          });
          counter = (counter + 1) % phrases.length;
        }
      };
      next();
    }
  }, [phrases, interval]);

  return { ref: elRef };
};

export default useTextScramble;
