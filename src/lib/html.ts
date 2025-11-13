import { HTMLImageElement, parseHTML } from 'linkedom';
import { getLogger } from '../logger';

const logger = getLogger();

export function removeInlineStyleDataUrls(html: string): string {
  let result = html.replace(
    /(\bstyle\s*=\s*["'])([\s\S]*?)background-image\s*:\s*url\s*\(\s*["']?data:[^;,]+;base64,[A-Za-z0-9+/=]+["']?\s*\)\s*;?\s*/gi,
    '$1$2',
  );
  result = result.replace(/\bstyle\s*=\s*["']\s*["']/gi, '');
  return result;
}

export function removeUnnecessaryElements(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n');
}

export function normalizeHTML(html: string): string {
  try {
    const { document } = parseHTML(html);
    return document.documentElement?.outerHTML || html;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to normalize HTML');
    return html;
  }
}

export function replacePlaceholderImages(html: string): string {
  try {
    const { document } = parseHTML(html);

    const images = document.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      if (img && typeof img.setAttribute === 'function') {
        img.setAttribute('src', 'https://placehold.jp/150x150.png');
        img.removeAttribute('srcset');
      }
    });

    return document.documentElement?.outerHTML || html;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to replace placeholder images');
    return html;
  }
}

export function extractStyles(html: string): string[] {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const matches = [...html.matchAll(styleRegex)];
  return matches.map(match => match[1]);
}

export function removeStyles(html: string): string {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  return html.replace(styleRegex, '');
}

export function addTailwindCDN(html: string): string {
  try {
    const { document } = parseHTML(html);

    let head = document.querySelector('head');

    if (!head) {
      head = document.createElement('head');
      const htmlElement = document.querySelector('html');

      if (htmlElement) {
        const body = document.querySelector('body');
        if (body) {
          htmlElement.insertBefore(head, body);
        } else {
          htmlElement.insertBefore(head, htmlElement.firstChild);
        }
      } else {
        logger.warn('<html> tag not found. Unable to add Tailwind CDN script.');
        return html;
      }
    }

    const script = document.createElement('script');
    script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4');
    head.appendChild(script);

    return document.documentElement?.outerHTML || html;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to append Tailwind CDN script');
    return html;
  }
}
