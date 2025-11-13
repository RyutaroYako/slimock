import { describe, expect, it } from 'vitest';
import {
  extractStyles,
  normalizeHTML,
  removeInlineStyleDataUrls,
  removeStyles,
  removeUnnecessaryElements,
  replacePlaceholderImages,
} from '../src/lib/html';

describe('HTML helpers', () => {
  it('removes inline style data URLs and cleans empty style attributes', () => {
    const input = '<div style="background-image:url(data:image/png;base64,AAAA); color:red"></div>';
    const result = removeInlineStyleDataUrls(input);

    expect(result).not.toContain('data:image');
    expect(result).toContain('color:red');
    expect(result).not.toContain('style=""');
  });

  it('replaces img sources with placeholders and strips srcset', () => {
    const input = '<img src="real.png" srcset="real@2x.png 2x" />';
    const result = replacePlaceholderImages(input);

    expect(result).toContain('https://placehold.jp/150x150.png');
    expect(result).not.toContain('srcset');
  });

  it('extracts and removes style tags consistently', () => {
    const html = '<style>.a{}</style><div>ok</div><style>.b{}</style>';
    expect(extractStyles(html)).toHaveLength(2);
    expect(removeStyles(html)).toBe('<div>ok</div>');
  });

  it('normalizes HTML using DOM parser', () => {
    const html = '<html><body><div>text</div></body></html>';
    expect(normalizeHTML(html)).toContain('<html');
  });

  it('removes comments, meta/link/script tags, and collapses whitespace', () => {
    const messy = `
      <!-- comment -->
      <meta charset="utf-8" />
      <link rel="stylesheet" href="a.css" />
      <script>console.log('x')</script>

      <div>content</div>
    `;

    const cleaned = removeUnnecessaryElements(messy);

    expect(cleaned).not.toContain('meta');
    expect(cleaned).not.toContain('link');
    expect(cleaned).not.toContain('script');
    expect(cleaned).not.toContain('comment');
    expect(cleaned).toContain('<div>content</div>');
  });
});
