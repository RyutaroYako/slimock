import type { Plugin } from 'postcss';

/**
 * PostCSS plugin to remove vendor-prefixed selectors (pseudo-elements and pseudo-classes)
 * Examples: ::-webkit-scrollbar, ::-moz-selection, :-webkit-full-screen
 */
export const removeVendorSelectors = (): Plugin => {
  return {
    postcssPlugin: 'remove-vendor-selectors',
    Rule(rule) {
      // Check if the selector contains vendor-specific pseudo-elements or pseudo-classes
      // Matches: ::-webkit-, :-webkit-, ::-moz-, :-moz-, etc.
      const vendorPrefixPattern = /::?-(webkit|moz|ms|o)-[a-zA-Z-]+/;

      if (vendorPrefixPattern.test(rule.selector)) {
        rule.remove();
      }
    },
  };
};

removeVendorSelectors.postcss = true;
