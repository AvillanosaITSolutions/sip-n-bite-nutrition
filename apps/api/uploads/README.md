# Static uploads

Files in this folder are served at `http://localhost:3000/uploads/<subdir>/<file>`.

## Product images

Drop product photos into `products/` and name each file after the product's **SKU**:

```
apps/api/uploads/products/
  f1-wildberry-550g.jpg
  f1-dutchchoc-550g.jpg
  htc-applechamomile-102g.png
  hac-mandarin-473ml.webp
  ...
```

Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.

Then run the linker to set the `imageUrl` on each matching `products` row:

```bash
pnpm --filter @snb/api seed:product-images
```

## Menu images

Same idea — put files at `apps/api/uploads/menu/<slug>.jpg`, where `<slug>` is the menu item's
name converted to lowercase-with-hyphens (e.g. `triple-chocolate.jpg`, `strawberry-cheesecake.jpg`).
