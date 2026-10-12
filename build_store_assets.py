import os
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r"d:\Project\bandi"
SOURCE_DIR = os.path.join(BASE_DIR, "store_source")
OUT_DIR = os.path.join(BASE_DIR, "store_assets")
PLAY_DIR = os.path.join(OUT_DIR, "01_PlayStore_플레이스토어")
APP_DIR = os.path.join(OUT_DIR, "02_AppStore_앱스토어")
LAUNCHER_DIR = os.path.join(OUT_DIR, "03_Android_Launcher_Icons_앱빌드용")

os.makedirs(PLAY_DIR, exist_ok=True)
os.makedirs(APP_DIR, exist_ok=True)
os.makedirs(LAUNCHER_DIR, exist_ok=True)

# 1. Generate App Icons (Solid #00BDF8 background, no pre-rounded transparent corners)
print("Generating App Icons...")
orig_icon = Image.open(os.path.join(SOURCE_DIR, "store_main.png")).convert("RGBA")
W, H = orig_icon.size

# Fill solid #00BDF8 background
solid_bg = Image.new("RGBA", (W, H), (0, 189, 248, 255))
solid_icon = Image.alpha_composite(solid_bg, orig_icon)

# Play Store: 512 x 512 PNG
play_icon = solid_icon.resize((512, 512), Image.Resampling.LANCZOS)
play_icon.save(os.path.join(PLAY_DIR, "01_앱아이콘_512x512.png"), "PNG")

# App Store: 1024 x 1024 RGB PNG (Apple strictly forbids alpha channel in 1024x1024 app store icon)
app_icon = solid_icon.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB")
app_icon.save(os.path.join(APP_DIR, "01_앱아이콘_1024x1024.png"), "PNG")

print("App Icons created successfully.")

# 2. Extract BANDICON Logo for Banner
header_crop = Image.open(os.path.join(SOURCE_DIR, "1.png")).convert("RGBA").crop((150, 40, 930, 200))
# Make white background transparent
data = header_crop.getdata()
new_data = []
for item in data:
    # If pixel is whitish (R > 230, G > 230, B > 230), make transparent
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
header_crop.putdata(new_data)
bbox = header_crop.getbbox()
if bbox:
    logo_trans = header_crop.crop(bbox)
else:
    logo_trans = header_crop

# 3. Create Feature Graphic (1024 x 500) - Version 1: Bright POP Style
print("Creating Feature Graphics...")
brain_dir = r"C:\Users\snyun\.gemini\antigravity-ide\brain\37638474-a175-4256-9a9f-8736853b5044"
clean_bg_path = None
for f in os.listdir(brain_dir):
    if f.startswith("feature_graphic_clean_") and f.endswith(".jpg"):
        clean_bg_path = os.path.join(brain_dir, f)
        break

if clean_bg_path and os.path.exists(clean_bg_path):
    bg1 = Image.open(clean_bg_path).convert("RGBA")
    # Resize and crop to 1024x500
    # Original aspect ratio is 16:9 (~1792x1024). Target is 1024x500 (2.048:1)
    target_w, target_h = 1024, 500
    # Scale keeping aspect ratio to fill
    scale = max(target_w / bg1.width, target_h / bg1.height)
    resized_bg = bg1.resize((int(bg1.width * scale), int(bg1.height * scale)), Image.Resampling.LANCZOS)
    
    # Center crop
    left = (resized_bg.width - target_w) // 2
    top = (resized_bg.height - target_h) // 2
    fg1 = resized_bg.crop((left, top, left + target_w, top + target_h))

    # Add overlay subtle card or branding
    draw1 = ImageDraw.Draw(fg1)
    
    # Place BANDICON Logo on the top center or left
    # Let's scale logo
    logo_w = int(logo_trans.width * 0.7)
    logo_h = int(logo_trans.height * 0.7)
    scaled_logo = logo_trans.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    # Place at top center
    logo_x = (target_w - logo_w) // 2
    logo_y = 35
    fg1.paste(scaled_logo, (logo_x, logo_y), scaled_logo)
    
    # Add subtitle text with shadow
    try:
        font_main = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 26)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 17)
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    t1 = "세상에서 가장 쉬운 밴드 관리 & 합주"
    t2 = "합주실 예약 · 세션 모집 · 일정 조율 · 밴드 커뮤니티"
    
    # Draw text bottom center with soft pill badge background
    bbox_t1 = draw1.textbbox((0, 0), t1, font=font_main)
    w_t1 = bbox_t1[2] - bbox_t1[0]
    bbox_t2 = draw1.textbbox((0, 0), t2, font=font_sub)
    w_t2 = bbox_t2[2] - bbox_t2[0]
    
    # Draw dark frosted glass pill at bottom
    pill_w = max(w_t1, w_t2) + 60
    pill_h = 90
    pill_x = (target_w - pill_w) // 2
    pill_y = target_h - pill_h - 25
    
    # Overlay pill
    pill_overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pill_draw = ImageDraw.Draw(pill_overlay)
    pill_draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=20, fill=(255, 255, 255, 230), outline=(0, 189, 248, 180), width=2)
    fg1 = Image.alpha_composite(fg1, pill_overlay)
    
    draw1 = ImageDraw.Draw(fg1)
    draw1.text(((target_w - w_t1) // 2, pill_y + 14), t1, fill=(20, 30, 50), font=font_main)
    draw1.text(((target_w - w_t2) // 2, pill_y + 52), t2, fill=(80, 100, 130), font=font_sub)
    
    fg1.convert("RGB").save(os.path.join(PLAY_DIR, "02_피처그래픽_1024x500_밝은버전.png"), "PNG")
    print("Bright Feature Graphic created.")

# 4. Create Feature Graphic - Version 2: Stage Neon Dark Glow Style
dark_bg_path = None
for f in os.listdir(brain_dir):
    if f.startswith("feature_graphic_bg_") and f.endswith(".jpg"):
        dark_bg_path = os.path.join(brain_dir, f)
        break

if dark_bg_path and os.path.exists(dark_bg_path):
    bg2 = Image.open(dark_bg_path).convert("RGBA")
    target_w, target_h = 1024, 500
    scale = max(target_w / bg2.width, target_h / bg2.height)
    resized_bg2 = bg2.resize((int(bg2.width * scale), int(bg2.height * scale)), Image.Resampling.LANCZOS)
    
    left = (resized_bg2.width - target_w) // 2
    top = (resized_bg2.height - target_h) // 2
    fg2 = resized_bg2.crop((left, top, left + target_w, top + target_h))

    # Pill overlay for dark theme
    pill_w = 720
    pill_h = 160
    pill_x = (target_w - pill_w) // 2
    pill_y = (target_h - pill_h) // 2
    
    pill_overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pill_draw = ImageDraw.Draw(pill_overlay)
    pill_draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=24, fill=(5, 15, 35, 220), outline=(0, 200, 255, 230), width=3)
    fg2 = Image.alpha_composite(fg2, pill_overlay)
    
    # Draw logo and text
    draw2 = ImageDraw.Draw(fg2)
    logo_w2 = int(logo_trans.width * 0.65)
    logo_h2 = int(logo_trans.height * 0.65)
    scaled_logo2 = logo_trans.resize((logo_w2, logo_h2), Image.Resampling.LANCZOS)
    fg2.paste(scaled_logo2, ((target_w - logo_w2) // 2, pill_y + 14), scaled_logo2)
    
    t1 = "세상에서 가장 쉬운 밴드 관리 & 합주"
    t2 = "합주실 예약 · 세션 모집 · 일정 조율 · 밴드 커뮤니티"
    try:
        font_main2 = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 20)
        font_sub2 = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 14)
    except:
        font_main2 = ImageFont.load_default()
        font_sub2 = ImageFont.load_default()
        
    bbox_t1 = draw2.textbbox((0, 0), t1, font=font_main2)
    w_t1 = bbox_t1[2] - bbox_t1[0]
    bbox_t2 = draw2.textbbox((0, 0), t2, font=font_sub2)
    w_t2 = bbox_t2[2] - bbox_t2[0]
    
    draw2.text(((target_w - w_t1) // 2, pill_y + 92), t1, fill=(255, 255, 255), font=font_main2)
    draw2.text(((target_w - w_t2) // 2, pill_y + 124), t2, fill=(160, 210, 255), font=font_sub2)
    
    fg2.convert("RGB").save(os.path.join(PLAY_DIR, "02_피처그래픽_1024x500_스테이지버전.png"), "PNG")
    print("Stage Dark Feature Graphic created.")

# 5. Copy & Organize Screenshots for PlayStore and AppStore
print("Organizing screenshots...")
screenshots = [
    ("1.png", "03_스크린샷_01_홈화면_1080x1920.png"),
    ("2.png", "03_스크린샷_02_클랜합주방_1080x1920.png"),
    ("3.png", "03_스크린샷_03_일정조율_1080x1920.png"),
    ("4.png", "03_스크린샷_04_익명게시판_1080x1920.png"),
    ("5.png", "03_스크린샷_05_엠버서더_1080x1920.png"),
]

for src_name, dst_name in screenshots:
    src_path = os.path.join(SOURCE_DIR, src_name)
    if os.path.exists(src_path):
        # Play Store copy
        shutil.copyfile(src_path, os.path.join(PLAY_DIR, dst_name))
        # App Store copy (replace prefix 03_ to 02_)
        app_dst_name = dst_name.replace("03_", "02_")
        shutil.copyfile(src_path, os.path.join(APP_DIR, app_dst_name))

# 5-1. Create Enhanced Slide 5 (with 3D Masterclass Star Badge)
badge_path = None
for f in os.listdir(brain_dir):
    if f.startswith("ambassador_3d_badge_") and f.endswith(".jpg"):
        badge_path = os.path.join(brain_dir, f)
        break

if badge_path and os.path.exists(badge_path):
    slide5 = Image.open(os.path.join(SOURCE_DIR, "5.png")).convert("RGBA")
    # Clean out the middle question mark area (from y=450 to y=1550) with background color (247, 249, 251)
    draw_s5 = ImageDraw.Draw(slide5)
    draw_s5.rectangle([0, 450, 1080, 1550], fill=(247, 249, 251, 255))
    
    # Load badge
    badge_img = Image.open(badge_path).convert("RGBA")
    # Remove white background of badge
    b_data = []
    for p in badge_img.getdata():
        if p[0] > 245 and p[1] > 245 and p[2] > 245:
            b_data.append((247, 249, 251, 0))
        else:
            b_data.append(p)
    badge_img.putdata(b_data)
    
    badge_scaled = badge_img.resize((820, 820), Image.Resampling.LANCZOS)
    slide5.paste(badge_scaled, ((1080 - 820) // 2, 580), badge_scaled)
    
    slide5.save(os.path.join(PLAY_DIR, "03_스크린샷_05_엠버서더_3D디자인버전_1080x1920.png"), "PNG")
    slide5.save(os.path.join(APP_DIR, "02_스크린샷_05_엠버서더_3D디자인버전_1080x1920.png"), "PNG")
    print("Enhanced Slide 5 created.")

# 6. Generate Android Launcher Icons
print("Generating Android Launcher Icons...")
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
for folder, size in mipmap_sizes.items():
    folder_path = os.path.join(LAUNCHER_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)
    icon_resized = solid_icon.resize((size, size), Image.Resampling.LANCZOS)
    icon_resized.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

# Adaptive Icon Foreground (432x432 with transparent background)
fg_icon = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
scaled_logo_ad = orig_icon.resize((432, 432), Image.Resampling.LANCZOS)
fg_icon.paste(scaled_logo_ad, (0, 0), scaled_logo_ad)
fg_icon.save(os.path.join(LAUNCHER_DIR, "ic_launcher_foreground.png"), "PNG")

# Adaptive Icon Background (432x432 solid #00BDF8)
bg_icon = Image.new("RGBA", (432, 432), (0, 189, 248, 255))
bg_icon.save(os.path.join(LAUNCHER_DIR, "ic_launcher_background.png"), "PNG")

print("All assets successfully created and organized!")
