import logging
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageStat

logger = logging.getLogger("ThumbnailDesigner")

# Default font path (system fonts)
FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Impact.ttf",  # macOS
    "/System/Library/Fonts/Helvetica.ttc",              # macOS fallback
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
    "C:/Windows/Fonts/impact.ttf",                      # Windows
]


def _find_font(preferred: Optional[str] = None) -> str:
    """Find available bold/impact font."""
    if preferred and Path(preferred).exists():
        return preferred
    for fp in FONT_PATHS:
        if Path(fp).exists():
            return fp
    return ""  # PIL default font


def _analyze_brightness(image: Image.Image) -> float:
    """Analyze average brightness of image (0-255). Low = dark, high = bright."""
    grayscale = image.convert("L")
    stat = ImageStat.Stat(grayscale)
    return stat.mean[0]


def _calc_text_layout(text: str, max_width: int, max_height: int,
                       font_path: str, start_size: int = 120) -> Tuple[ImageFont.FreeTypeFont, list, int]:
    """Calculate font size and line wrapping to fit text in bounds.
    Returns (font, lines, font_size)."""
    size = start_size
    while size > 20:
        try:
            font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
            break

        # Word wrap
        words = text.split()
        lines = []
        current_line = ""
        for word in words:
            test = f"{current_line} {word}".strip()
            bbox = font.getbbox(test)
            if bbox[2] > max_width * 0.9:
                if current_line:
                    lines.append(current_line)
                current_line = word
            else:
                current_line = test
        if current_line:
            lines.append(current_line)

        # Check total height
        line_height = font.getbbox("Ay")[3] + 10
        total_height = line_height * len(lines)
        if total_height <= max_height * 0.4:
            return font, lines, size

        size = int(size * 0.82)

    return font, [text], size


def _draw_text_3layer(draw: ImageDraw.Draw, position: Tuple[int, int],
                       text: str, font: ImageFont.FreeTypeFont,
                       fill_color: str, outline_color: str, shadow_color: str,
                       outline_width: int = 6, shadow_offset: int = 4):
    """Draw text with 3-layer effect: shadow + outline + fill."""
    x, y = position

    # Layer 1: Drop shadow
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)

    # Layer 2: Thick outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)

    # Layer 3: Fill text
    draw.text((x, y), text, font=font, fill=fill_color)


class ThumbnailDesigner:
    """Professional thumbnail generator with templates and branding."""

    TEMPLATES = {
        "classic": "Bottom gradient + centered text",
        "side_panel": "Side panel with text + image",
        "bold_number": "Large number/emoji + subtitle",
        "split_comparison": "Split comparison (vs.)",
        "minimal": "Minimal text, large visual",
    }

    def generate(self, bg_image_path: Path, text: str,
                 template: str = "classic",
                 output_path: Optional[Path] = None,
                 logo_path: Optional[str] = None,
                 color_primary: str = "#FF0000",
                 color_secondary: str = "#FFFFFF",
                 width: int = 1280, height: int = 720) -> Path:
        """Generate thumbnail with template, text overlay, and optional branding."""

        if output_path is None:
            output_path = bg_image_path.with_name("thumbnail_designed.jpg")

        # Open and resize background
        img = Image.open(bg_image_path).convert("RGB")
        img = img.resize((width, height), Image.LANCZOS)

        # Analyze brightness for text color
        brightness = _analyze_brightness(img)
        is_dark_bg = brightness < 128

        # Choose text colors based on brightness
        if is_dark_bg:
            fill_color = color_secondary or "#FFFFFF"
            outline_color = "#000000"
            shadow_color = "rgba(0,0,0,150)"
        else:
            fill_color = color_primary or "#FF0000"
            outline_color = "#FFFFFF"
            shadow_color = "rgba(255,255,255,150)"

        shadow_color = "#00000099"  # Consistent shadow

        # Find font
        font_path = _find_font()

        # Apply template
        if template == "classic":
            img = self._template_classic(img, text, font_path, fill_color, outline_color, shadow_color, width, height)
        elif template == "side_panel":
            img = self._template_side_panel(img, text, font_path, fill_color, outline_color, shadow_color, color_primary, width, height)
        elif template == "bold_number":
            img = self._template_bold_number(img, text, font_path, fill_color, outline_color, shadow_color, width, height)
        elif template == "split_comparison":
            img = self._template_split(img, text, font_path, fill_color, outline_color, shadow_color, color_primary, width, height)
        elif template == "minimal":
            img = self._template_minimal(img, text, font_path, fill_color, outline_color, shadow_color, width, height)
        else:
            img = self._template_classic(img, text, font_path, fill_color, outline_color, shadow_color, width, height)

        # Add logo watermark if provided
        if logo_path and Path(logo_path).exists():
            try:
                logo = Image.open(logo_path).convert("RGBA")
                logo_size = min(width // 8, 120)
                logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
                margin = 20
                img.paste(logo, (width - logo_size - margin, margin), logo)
            except Exception as e:
                logger.warning(f"Could not add logo: {e}")

        img.save(str(output_path), "JPEG", quality=95)
        logger.info(f"[Thumbnail] Generated: {output_path} ({template})")
        return output_path

    def _template_classic(self, img, text, font_path, fill, outline, shadow, w, h):
        """Bottom gradient + centered text."""
        draw = ImageDraw.Draw(img)

        # Bottom gradient overlay
        gradient = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(gradient)
        for y in range(h // 3, h):
            alpha = int(200 * (y - h // 3) / (h - h // 3))
            gdraw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), gradient).convert("RGB")
        draw = ImageDraw.Draw(img)

        font, lines, _ = _calc_text_layout(text, w, h, font_path)
        line_h = font.getbbox("Ay")[3] + 10
        total_h = line_h * len(lines)
        y_start = h - total_h - 40

        for i, line in enumerate(lines):
            bbox = font.getbbox(line)
            x = (w - bbox[2]) // 2
            _draw_text_3layer(draw, (x, y_start + i * line_h), line, font, fill, outline, shadow)

        return img

    def _template_side_panel(self, img, text, font_path, fill, outline, shadow, panel_color, w, h):
        """Left panel with text, right side is the image."""
        draw = ImageDraw.Draw(img)

        # Semi-transparent panel on left
        panel = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(panel)
        pdraw.rectangle([(0, 0), (w // 3, h)], fill=panel_color + "CC")
        img = Image.alpha_composite(img.convert("RGBA"), panel).convert("RGB")
        draw = ImageDraw.Draw(img)

        panel_w = w // 3 - 40
        font, lines, _ = _calc_text_layout(text, panel_w, h, font_path, start_size=80)
        line_h = font.getbbox("Ay")[3] + 8
        total_h = line_h * len(lines)
        y_start = (h - total_h) // 2

        for i, line in enumerate(lines):
            _draw_text_3layer(draw, (20, y_start + i * line_h), line, font, "#FFFFFF", "#000000", shadow)

        return img

    def _template_bold_number(self, img, text, font_path, fill, outline, shadow, w, h):
        """Large number/emoji at top + subtitle text below."""
        draw = ImageDraw.Draw(img)

        # Darken image
        dark = Image.new("RGBA", (w, h), (0, 0, 0, 120))
        img = Image.alpha_composite(img.convert("RGBA"), dark).convert("RGB")
        draw = ImageDraw.Draw(img)

        # Split: first word as big number, rest as subtitle
        parts = text.split(None, 1)
        big_text = parts[0] if parts else text
        sub_text = parts[1] if len(parts) > 1 else ""

        # Big number
        try:
            big_font = ImageFont.truetype(font_path, 200) if font_path else ImageFont.load_default()
        except Exception:
            big_font = ImageFont.load_default()
        bbox = big_font.getbbox(big_text)
        x = (w - bbox[2]) // 2
        _draw_text_3layer(draw, (x, h // 6), big_text, big_font, "#FFD700", "#000000", shadow, outline_width=8)

        # Subtitle
        if sub_text:
            font, lines, _ = _calc_text_layout(sub_text, w, h, font_path, start_size=60)
            line_h = font.getbbox("Ay")[3] + 8
            y_start = h // 2 + 40
            for i, line in enumerate(lines):
                bbox = font.getbbox(line)
                x = (w - bbox[2]) // 2
                _draw_text_3layer(draw, (x, y_start + i * line_h), line, font, "#FFFFFF", "#000000", shadow)

        return img

    def _template_split(self, img, text, font_path, fill, outline, shadow, divider_color, w, h):
        """Split comparison with VS in middle."""
        draw = ImageDraw.Draw(img)

        # Vertical divider
        div_x = w // 2
        draw.rectangle([(div_x - 3, 0), (div_x + 3, h)], fill=divider_color)

        # VS circle
        try:
            vs_font = ImageFont.truetype(font_path, 60) if font_path else ImageFont.load_default()
        except Exception:
            vs_font = ImageFont.load_default()
        draw.ellipse([(div_x - 50, h // 2 - 50), (div_x + 50, h // 2 + 50)], fill=divider_color)
        _draw_text_3layer(draw, (div_x - 25, h // 2 - 30), "VS", vs_font, "#FFFFFF", "#000000", shadow, outline_width=3)

        # Text at bottom
        font, lines, _ = _calc_text_layout(text, w, h, font_path, start_size=70)
        line_h = font.getbbox("Ay")[3] + 8
        y_start = h - line_h * len(lines) - 30
        for i, line in enumerate(lines):
            bbox = font.getbbox(line)
            x = (w - bbox[2]) // 2
            _draw_text_3layer(draw, (x, y_start + i * line_h), line, font, fill, outline, shadow)

        return img

    def _template_minimal(self, img, text, font_path, fill, outline, shadow, w, h):
        """Minimal — small text bottom-left."""
        draw = ImageDraw.Draw(img)
        font, lines, _ = _calc_text_layout(text, w // 2, h, font_path, start_size=48)
        line_h = font.getbbox("Ay")[3] + 6
        y_start = h - line_h * len(lines) - 30

        for i, line in enumerate(lines):
            _draw_text_3layer(draw, (30, y_start + i * line_h), line, font, fill, outline, shadow, outline_width=3)

        return img


# Singleton
thumbnail_designer = ThumbnailDesigner()
