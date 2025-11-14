import { describe, expect, it } from 'vitest';
import { purgeCSSInHTML } from '../src/lib/purgecss-runner';

describe('Vendor prefix removal', () => {
  it('removes webkit vendor prefixes from CSS', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            input::-webkit-datetime-edit-year-field {
              color: blue;
            }
            input::-webkit-calendar-picker-indicator {
              display: none;
            }
            .regular-class {
              color: red;
            }
          </style>
        </head>
        <body>
          <div class="regular-class">Test</div>
        </body>
      </html>
    `;

    const result = await purgeCSSInHTML(html, html);

    // Vendor prefixes should be removed
    expect(result).not.toContain('::-webkit-datetime-edit-year-field');
    expect(result).not.toContain('::-webkit-calendar-picker-indicator');

    // Regular classes should remain
    expect(result).toContain('.regular-class');
    expect(result).toContain('color: red');
  });

  it('removes multiple types of vendor prefixes', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .box {
              -webkit-transform: rotate(45deg);
              -moz-transform: rotate(45deg);
              -ms-transform: rotate(45deg);
              transform: rotate(45deg);
              color: green;
            }
          </style>
        </head>
        <body>
          <div class="box">Test</div>
        </body>
      </html>
    `;

    const result = await purgeCSSInHTML(html, html);

    // Vendor prefixed properties should be removed
    expect(result).not.toContain('-webkit-transform');
    expect(result).not.toContain('-moz-transform');
    expect(result).not.toContain('-ms-transform');

    // Standard property should remain
    expect(result).toContain('transform: rotate(45deg)');
    expect(result).toContain('color: green');
  });
});
