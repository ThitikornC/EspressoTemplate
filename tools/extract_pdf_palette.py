#!/usr/bin/env python3
"""
Simple PDF palette extractor.
Usage:
  python tools/extract_pdf_palette.py "C:\path\to\file.pdf" [num_colors]

Dependencies:
  pip install pymupdf pillow

What it does:
  - Renders first page of the PDF to an image using PyMuPDF (fitz)
  - Downscales image and counts colors to find the most frequent colors
  - Prints top N colors as hex codes
"""
import sys
import os
from collections import Counter
try:
    import fitz  # PyMuPDF
    from PIL import Image
except Exception as e:
    print("Missing dependency:", e)
    print("Run: pip install pymupdf pillow")
    sys.exit(1)


def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb


def extract_palette(pdf_path, num_colors=6, thumb_size=(160, 160)):
    doc = fitz.open(pdf_path)
    if doc.page_count == 0:
        raise ValueError('PDF has no pages')
    page = doc.load_page(0)
    pix = page.get_pixmap(alpha=False)
    img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
    img = img.convert('RGB')
    img.thumbnail(thumb_size)

    # Reduce colors by counting pixels
    pixels = list(img.getdata())
    counts = Counter(pixels)
    most_common = counts.most_common(num_colors)
    hexes = [rgb_to_hex(c[0]) for c in most_common]
    return hexes


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python tools/extract_pdf_palette.py <path-to-pdf> [num_colors]')
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.exists(path):
        print('File not found:', path)
        sys.exit(1)
    n = int(sys.argv[2]) if len(sys.argv) >= 3 else 6
    try:
        palette = extract_palette(path, n)
        print('Palette:')
        for i, c in enumerate(palette, 1):
            print(f'{i}. {c}')
    except Exception as e:
        print('Error extracting palette:', e)
        sys.exit(1)
