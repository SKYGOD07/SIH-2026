/**
 * Local text-splitting utility.
 *
 * GSAP SplitText is a Club plugin and is not assumed to be licensed here, so
 * this reimplements the parts we need: split into lines / words / chars, each
 * child optionally wrapped in an overflow-hidden mask so masked reveals work.
 *
 * Line detection measures word offsetTop after a words-split — the same trick
 * SplitText uses. It survives responsive reflow because `revert()` restores the
 * original markup, letting the caller re-split on resize.
 */

export type SplitType = 'chars' | 'words' | 'lines';

export interface SplitResult {
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[];
  /** Animatable targets for the requested type, in document order. */
  targets: HTMLElement[];
  revert: () => void;
}

export interface SplitOptions {
  type?: SplitType;
  /** Wrap each target in an overflow:hidden span so it can slide in from below. */
  mask?: boolean;
  /** Extra class applied to every target element. */
  className?: string;
}

function make(tag: string, cls: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = cls;
  return node;
}

function wrapInMask(node: HTMLElement): HTMLElement {
  const mask = make('span', 'split-mask');
  node.parentNode!.insertBefore(mask, node);
  mask.appendChild(node);
  return mask;
}

export function splitText(root: HTMLElement, options: SplitOptions = {}): SplitResult {
  const { type = 'lines', mask = true, className = '' } = options;
  const original = root.innerHTML;

  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];
  const lines: HTMLElement[] = [];

  // --- pass 1: words (always needed; lines are grouped from word positions)
  const splitNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((chunk) => {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(' '));
          return;
        }
        const word = make('span', 'split-word split-child');
        word.textContent = chunk;
        words.push(word);
        frag.appendChild(word);
      });
      node.parentNode!.replaceChild(frag, node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(splitNode);
    }
  };
  Array.from(root.childNodes).forEach(splitNode);

  // --- pass 2: group words into visual lines by vertical offset
  if (type === 'lines') {
    const rows = new Map<number, HTMLElement[]>();
    words.forEach((w) => {
      // round to 2px to absorb sub-pixel baseline drift
      const key = Math.round(w.offsetTop / 2) * 2;
      const bucket = rows.get(key);
      if (bucket) bucket.push(w);
      else rows.set(key, [w]);
    });

    Array.from(rows.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([, group]) => {
        const line = make('span', ('split-line split-child ' + className).trim());
        line.style.display = 'block';
        group[0].parentNode!.insertBefore(line, group[0]);
        group.forEach((w) => {
          // pull the whitespace node following the word into the line too
          const next = w.nextSibling;
          line.appendChild(w);
          if (next && next.nodeType === Node.TEXT_NODE) line.appendChild(next);
          w.classList.remove('split-child');
        });
        lines.push(line);
      });
  }

  // --- pass 3: chars
  if (type === 'chars') {
    words.forEach((word) => {
      const text = word.textContent || '';
      word.textContent = '';
      word.classList.remove('split-child');
      Array.from(text).forEach((c) => {
        const ch = make('span', ('split-char split-child ' + className).trim());
        ch.textContent = c;
        chars.push(ch);
        word.appendChild(ch);
      });
    });
  }

  if (type === 'words' && className) {
    words.forEach((w) => w.classList.add(...className.split(/\s+/).filter(Boolean)));
  }

  const targets = type === 'chars' ? chars : type === 'words' ? words : lines;
  if (mask) targets.forEach(wrapInMask);

  return {
    chars,
    words,
    lines,
    targets,
    revert: () => {
      root.innerHTML = original;
    },
  };
}
