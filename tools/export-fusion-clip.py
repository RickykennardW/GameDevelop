"""Export one named atlas clip as an evenly spaced PNG sheet for Piskel."""

import argparse
import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets/towers/fusion/manifest.json"


def extract(asset, name):
    clip = asset.get("clips", {}).get(name)
    if clip is None and asset.get("clip", {}).get("animationName") == name:
        clip = asset["clip"]
    if clip is None:
        raise ValueError("This atlas has no animation named "+name)
    frames = clip["frameRects"]
    width, height = frames[0][2:]
    count = len(frames)
    # A divisor avoids empty frames when Piskel imports the whole grid.
    columns = max(c for c in range(1,min(count, 2048//width)+1) if count%c==0 and math.ceil(count/c)*height<=2048)
    sheet = Image.new("RGBA", (columns*width, count//columns*height))
    with Image.open(ROOT/asset["file"]) as atlas:
        for index, (x,y,w,h) in enumerate(frames):
            sheet.alpha_composite(atlas.crop((x,y,x+w,y+h)), ((index%columns)*width,(index//columns)*height))
    return sheet, clip


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("asset", help="Project-relative atlas path from manifest.json")
    parser.add_argument("animation", help="Exact animationName from manifest.json")
    parser.add_argument("output", type=Path, help="New PNG destination")
    args = parser.parse_args()
    if args.output.suffix.lower() != ".png" or args.output.exists():
        raise ValueError("Choose a new PNG destination")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    sheet, clip = extract(manifest["assets"][args.asset],args.animation)
    sheet.save(args.output,compress_level=6)
    print(f'{clip["animationName"]}: {clip["frameCount"]} frames, {clip["fps"]} FPS, origin {clip["origin"]}')


if __name__=="__main__":
    main()
