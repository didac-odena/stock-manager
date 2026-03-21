# Error Log

## 2026-03-21 — ProductDetailPage crashed due to conditional hook order

**What happened**
- `web/src/pages/ProductDetailPage.jsx` started failing at runtime and the product detail page did not render.

**Root cause**
- The reviews `useEffect` was declared after `if (loading) return ...`, so hooks were not called in the same order on every render.
- This violated React hook rules (`react-hooks/rules-of-hooks`) and caused the page to break.

**Fix**
- Merged product and reviews loading into one `useEffect` using `Promise.all([getProduct(id), getReviews(id)])`.
- Removed the second `useEffect` and kept all hooks at top level.
