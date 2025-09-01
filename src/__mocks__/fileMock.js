// Provide a non-empty placeholder string for static asset imports in tests.
// An empty string triggers React warnings when used as the `src` attribute
// on elements like `<img>` or `<source>`. Returning a stub string avoids
// those warnings without affecting test behavior.
module.exports = 'test-file-stub';
