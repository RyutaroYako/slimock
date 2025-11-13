import { describe, expect, it } from 'vitest';
import {
  removeDataUrls,
  removeFontFaces,
  removeUnusedPropertyRules,
} from '../src/lib/css';

describe('CSS cleanup helpers', () => {
  it('removes data URLs while keeping other declarations intact', () => {
    const input = `
      .hero {
        background-image: url("data:image/png;base64,AAAA");
        color: red;
      }
    `;

    const result = removeDataUrls(input);

    expect(result).not.toContain('data:image');
    expect(result).not.toContain('background-image');
    expect(result).toContain('color: red');
  });

  it('strips @font-face blocks entirely', () => {
    const input = `
      @font-face { font-family: "A"; src: url(a.woff2); }
      .body { font-family: "A"; }
    `;

    expect(removeFontFaces(input)).not.toContain('@font-face');
  });

  it('removes unused @property declarations and keeps used ones', () => {
    const input = `
      @property --used {
        syntax: '<color>';
        inherits: false;
        initial-value: red;
      }
      @property --unused {
        syntax: '<number>';
        inherits: false;
        initial-value: 1;
      }
      :root {
        --used: red;
      }
      .btn {
        color: var(--used);
      }
    `;

    const cleansed = removeUnusedPropertyRules(input);

    expect(cleansed).toContain('--used');
    expect(cleansed).not.toContain('--unused');
  });
});
