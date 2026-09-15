from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 1200, 630
ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "images" / "schedule-share.png"


def font(name: str, size: int):
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


image = Image.new("RGB", (WIDTH, HEIGHT), "#F6F7F8")
draw = ImageDraw.Draw(image)

# Warm brand halo and the main schedule card.
draw.ellipse((830, -210, 1290, 250), fill="#EEE8D9")
draw.rounded_rectangle((66, 58, 1134, 572), radius=48, fill="#0C2A23")
draw.rounded_rectangle((84, 76, 1116, 554), radius=38, outline="#28483F", width=2)

gold = "#CBB676"
white = "#FFFFFF"
soft = "#DCE5E1"

draw.rounded_rectangle((112, 104, 331, 162), radius=29, fill="#183B32")
draw.ellipse((132, 123, 151, 142), fill=gold)
draw.text((166, 116), "RIORIO CREW", font=font("malgunbd.ttf", 24), fill=gold)

draw.text((112, 214), "이번 주 근무표", font=font("malgunbd.ttf", 72), fill=white)
draw.text((116, 320), "출근일과 시간을 한눈에 확인하세요", font=font("malgun.ttf", 34), fill=soft)

# Abstract seven-day rhythm: decorative only, with no private schedule data.
start_x = 786
for index, height in enumerate((56, 82, 66, 104, 74, 120, 88)):
    x = start_x + index * 42
    draw.rounded_rectangle((x, 394 - height, x + 24, 394), radius=12, fill=gold if index in (3, 5) else "#315248")

draw.rounded_rectangle((112, 452, 426, 512), radius=30, fill="#FFFFFF")
draw.text((146, 464), "앱 설치 없이 바로 확인", font=font("malgunbd.ttf", 24), fill="#0C2A23")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT, "PNG", optimize=True)
print(OUTPUT)
