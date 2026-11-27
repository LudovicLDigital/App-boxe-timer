"""Génère les icônes de l'app (chrono rouge sur fond sombre). Usage : python3 scripts/make-icons.py"""
from PIL import Image, ImageDraw

def icon(size: int, path: str) -> None:
    s = size * 4  # suréchantillonnage pour l'anticrénelage
    img = Image.new("RGB", (s, s), "#0b0b0f")
    d = ImageDraw.Draw(img)
    cx, cy, r = s / 2, s * 0.54, s * 0.30
    w = s * 0.07
    # bouton du chrono
    d.rounded_rectangle([cx - s * 0.06, cy - r - s * 0.13, cx + s * 0.06, cy - r - s * 0.04], radius=s * 0.02, fill="#e53935")
    # cadran
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline="#e53935", width=int(w))
    # secteur « round »
    d.pieslice([cx - r + w * 1.6, cy - r + w * 1.6, cx + r - w * 1.6, cy + r - w * 1.6], start=-90, end=30, fill="#e53935")
    img.resize((size, size), Image.LANCZOS).save(path)

icon(192, "public/pwa-192.png")
icon(512, "public/pwa-512.png")
icon(180, "public/apple-touch-icon.png")
