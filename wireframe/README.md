# Sip n Bite — mobile app wireframe

Light-themed, low-fidelity wireframe of the Sip n Bite mobile app, covering every
feature across the three roles (customer, POS operator, admin / super-admin).

## Contents

```
wireframe/
  index.html      Open in any browser — 12 phone screens, forced light theme
  assets/         SVG image assets referenced by index.html
    logo.svg      hero.svg       chart.svg
    shake-*.svg   snack.svg      product-*.svg   avatar-*.svg
```

## View it

Just open `index.html` in a browser. The only external dependency is the Tabler
icon font (loaded from a CDN), so keep an internet connection for the icons; the
image assets are all local under `assets/`.

To present full-screen, press `F11`. To export a PDF, use the browser's
print-to-PDF (print styles keep each phone from splitting across pages).

## Notes

Screens map to the app's real routes, shared enums/schemas, and API surface.
Sign-in, image upload, and the dashboard chart are shown as intended designs —
they are listed as TODOs and not yet built.
