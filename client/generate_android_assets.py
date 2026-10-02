import os
from PIL import Image, ImageDraw

def generate_icons_and_splash():
    base_res = r"client\android\app\src\main\res"
    icon_src_path = r"client\public\images\quickserve_app_icon.png"
    logo_src_path = r"client\public\images\quickserve_logo.png"

    icon_img = Image.open(icon_src_path).convert("RGBA")
    # Crop to non-transparent bbox
    bbox = icon_img.getbbox()
    if bbox:
        icon_cropped = icon_img.crop(bbox)
    else:
        icon_cropped = icon_img

    logo_img = Image.open(logo_src_path).convert("RGBA")

    # Mipmap densities and sizes: (folder, launcher_size, foreground_size)
    densities = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432),
    ]

    for folder, l_size, fg_size in densities:
        dir_path = os.path.join(base_res, folder)
        os.makedirs(dir_path, exist_ok=True)

        # 1. ic_launcher.png (square with subtle rounded corner / white background)
        launcher = Image.new("RGBA", (l_size, l_size), (255, 255, 255, 255))
        # icon inside launcher - about 82% of size
        target_icon_size = int(l_size * 0.82)
        ratio = min(target_icon_size / icon_cropped.width, target_icon_size / icon_cropped.height)
        new_w = int(icon_cropped.width * ratio)
        new_h = int(icon_cropped.height * ratio)
        resized_icon = icon_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (l_size - new_w) // 2
        offset_y = (l_size - new_h) // 2
        launcher.paste(resized_icon, (offset_x, offset_y), resized_icon)
        launcher.save(os.path.join(dir_path, "ic_launcher.png"), "PNG")

        # 2. ic_launcher_round.png (circular mask with white background)
        round_launcher = Image.new("RGBA", (l_size, l_size), (0, 0, 0, 0))
        mask = Image.new("L", (l_size, l_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, l_size - 1, l_size - 1), fill=255)
        round_bg = Image.new("RGBA", (l_size, l_size), (255, 255, 255, 255))
        round_bg.paste(resized_icon, (offset_x, offset_y), resized_icon)
        round_launcher.paste(round_bg, (0, 0), mask)
        round_launcher.save(os.path.join(dir_path, "ic_launcher_round.png"), "PNG")

        # 3. ic_launcher_foreground.png (transparent canvas of fg_size, icon in safe zone ~65%)
        fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        safe_zone = int(fg_size * 0.65)
        ratio_fg = min(safe_zone / icon_cropped.width, safe_zone / icon_cropped.height)
        fg_w = int(icon_cropped.width * ratio_fg)
        fg_h = int(icon_cropped.height * ratio_fg)
        resized_fg_icon = icon_cropped.resize((fg_w, fg_h), Image.Resampling.LANCZOS)
        fg_offset_x = (fg_size - fg_w) // 2
        fg_offset_y = (fg_size - fg_h) // 2
        fg.paste(resized_fg_icon, (fg_offset_x, fg_offset_y), resized_fg_icon)
        fg.save(os.path.join(dir_path, "ic_launcher_foreground.png"), "PNG")

        print(f"Generated {folder}: ic_launcher ({l_size}), round ({l_size}), fg ({fg_size})")

    # Splash screens: (folder, width, height)
    splash_targets = [
        ("drawable", 480, 800),
        ("drawable-port-mdpi", 320, 480),
        ("drawable-port-hdpi", 480, 800),
        ("drawable-port-xhdpi", 720, 1280),
        ("drawable-port-xxhdpi", 960, 1600),
        ("drawable-port-xxxhdpi", 1280, 1920),
        ("drawable-land-mdpi", 480, 320),
        ("drawable-land-hdpi", 800, 480),
        ("drawable-land-xhdpi", 1280, 720),
        ("drawable-land-xxhdpi", 1600, 960),
        ("drawable-land-xxxhdpi", 1920, 1280),
    ]

    for folder, w, h in splash_targets:
        dir_path = os.path.join(base_res, folder)
        os.makedirs(dir_path, exist_ok=True)

        splash = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        # Center the logo: about 48% of the min dimension
        target_logo_dim = int(min(w, h) * 0.48)
        ratio_logo = min(target_logo_dim / logo_img.width, target_logo_dim / logo_img.height)
        new_logo_w = int(logo_img.width * ratio_logo)
        new_logo_h = int(logo_img.height * ratio_logo)
        resized_logo = logo_img.resize((new_logo_w, new_logo_h), Image.Resampling.LANCZOS)

        pos_x = (w - new_logo_w) // 2
        pos_y = (h - new_logo_h) // 2
        splash.paste(resized_logo, (pos_x, pos_y), resized_logo)
        splash.save(os.path.join(dir_path, "splash.png"), "PNG")
        print(f"Generated splash for {folder} ({w}x{h})")

if __name__ == "__main__":
    generate_icons_and_splash()
