"""Assemble the production pack from approved imagegen boards and original cues.

Ingest consumes file paths and prompts on stdin. Only the aligned sprites, clips
and artwork that ship in the pack are written inside the project.
"""

import argparse
import hashlib
import json
import math
import runpy
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "assets/towers/fusion"
MANIFEST = PACK / "manifest.json"
SPEC_PATH = ROOT / "tools/fusion-art-direction.json"
SPEC = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
TIERS = ("E1", "E2", "E3")
PARTS = ("base", "turret", "emitter", "core", "petal")
SIZE = 192
PIVOT = (96, 96)
EMITTER_TIP = (56, 12)
REFERENCE_SCALE = .66
LANCZOS = Image.Resampling.LANCZOS


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def rgba(path):
    with Image.open(path) as image:
        return image.convert("RGBA")


def fit(image, width, height):
    scale = min(width / image.width, height / image.height)
    return image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), LANCZOS)


def put(image, part, x, y):
    image.alpha_composite(part, (round(x - part.width / 2), round(y - part.height / 2)))


def alpha_bounds(image):
    result = image.getchannel("A").point(lambda alpha: 255 if alpha >= 12 else 0).getbbox()
    if not result:
        raise ValueError("Empty sprite")
    return result


def cut_cells(path, columns, rows):
    """Locate actual transparent gutters, then normalize the imported alpha matte."""
    image = rgba(path)
    alpha = np.asarray(image.getchannel("A"))
    solid = alpha >= 164

    def cuts(projection, count, expected_edges=None):
        length = len(projection)
        positions = [0]
        smoothed = np.convolve(projection, np.ones(7), mode="same")
        edges = expected_edges or [index / count for index in range(1, count)]
        for edge in edges:
            expected = length * edge
            radius = max(5, round(length / count * .165))
            options = range(round(expected) - radius, round(expected) + radius + 1)
            positions.append(min(options, key=lambda p: (float(smoothed[p]), abs(p - expected))))
        return positions + [length]

    # The approved modular boards reserve extra width for the petal chassis.
    # Anchor the gutter search there so a narrow emitter cell cannot include
    # the adjacent wing, even when it has no alpha at the nominal grid line.
    edges = [.217, .476, .642, .828] if columns == 5 else None
    xs = cuts(solid.sum(axis=0), columns, edges)
    cells = [[] for _ in range(rows)]
    for left, right in zip(xs, xs[1:]):
        ys = cuts(solid[:, left:right].sum(axis=1), rows)
        for row, (top, bottom) in enumerate(zip(ys, ys[1:])):
            cell = image.crop((left, top, right, bottom))
            alpha = cell.getchannel("A")
            opaque = alpha.point(lambda value: 255 if value >= 164 else 0)
            bounds = opaque.getbbox()
            if not bounds or bounds[2] - bounds[0] < 26 or bounds[3] - bounds[1] < 26:
                raise ValueError(f"{path.name} has an empty or undersized cell in row {row + 1}")
            l, t, r, b = bounds
            # Work from the authored silhouette. Remove low-alpha matte fringe;
            # keep the solid colored material and resample with antialiasing.
            crop = (max(0, l - 3), max(0, t - 3), min(cell.width, r + 3), min(cell.height, b + 3))
            cell = cell.crop(crop)
            matte = cell.getchannel("A").point(lambda value: round(255 * max(0, min(1, (value - 115) / 111))))
            cell.putalpha(matte)
            cells[row].append(cell)
    return cells


class Pack:
    def __init__(self):
        self.data = read_json(MANIFEST) if MANIFEST.exists() else {
            "schemaVersion": 1,
            "project": "Starfall Bastion",
            "artDirection": SPEC_PATH.relative_to(ROOT).as_posix(),
            "towers": {},
            "shared": {},
            "assets": {},
        }

    def record(self, path, tower_id, kind, **fields):
        file = path.relative_to(ROOT).as_posix()
        previous = self.data["assets"].get(file, {})
        self.data["assets"][file] = {
            "towerId": tower_id,
            "file": file,
            "resourceName": file,
            "assetType": kind,
            "status": "Complete",
            "importStatus": previous.get("importStatus", "ReadyToImport"),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            **fields,
        }
        return file

    def image(self, path, image, tower_id, kind, **fields):
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, compress_level=6)
        l, t, r, b = alpha_bounds(image)
        return self.record(path, tower_id, kind, dimensions=list(image.size), visualBounds=[l, t, r-l, b-t], **fields)

    def save(self):
        records = self.data["towers"]
        self.data["towers"] = {spec["id"]: records[spec["id"]]
                               for spec in SPEC["towers"] if spec["id"] in records}
        write_json(MANIFEST, self.data)


def assemble_parts(spec, cells):
    base = Image.new("RGBA", (SIZE, SIZE))
    put(base, fit(cells[0], spec["baseSize"], spec["baseSize"]), *PIVOT)
    turret = Image.new("RGBA", (SIZE, SIZE))
    width, height, x, y = spec["chassisBox"]
    put(turret, fit(cells[1], width, height), x, y)
    emitter = Image.new("RGBA", (112, 128))
    trimmed = fit(cells[2], *spec["emitterFit"])
    x = (emitter.width - trimmed.width) // 2
    center = EMITTER_TIP[0] - x
    column = np.asarray(trimmed.getchannel("A"))[:, center]
    rows = np.flatnonzero(column >= 128)
    if rows.size == 0:
        raise ValueError(f'{spec["id"]}: emitter art has no central muzzle lip')
    emitter.alpha_composite(trimmed, (x, EMITTER_TIP[1] - int(rows[0])))
    heart = fit(cells[3], *spec["heartBox"][:2])
    core = Image.new("RGBA", (80, 80))
    put(core, heart, 40, 40)
    petal = Image.new("RGBA", (88, 88))
    put(petal, fit(cells[4], spec["petalSize"] * .84, spec["petalSize"]), 44, 44)
    return dict(zip(PARTS, (base, turret, emitter, core, petal)))


def glow(image, point, color, radius, amount):
    if amount <= 0:
        return
    x, y = point
    light = Image.new("RGBA", image.size)
    ImageDraw.Draw(light).ellipse((x-radius, y-radius, x+radius, y+radius),
                                  fill=(*color, int(255 * min(.93, amount))))
    image.alpha_composite(light.filter(ImageFilter.GaussianBlur(radius * .65)))


def rotate_point(x, y, degrees):
    angle = math.radians(degrees)
    return x * math.cos(angle) - y * math.sin(angle), x * math.sin(angle) + y * math.cos(angle)


def pose(spec, tier_index, parts, opening=0, pulse=0, recoil=0, flash=0, muzzle_index=0):
    """Render the pivot-aligned head. The pedestal remains a separate sprite."""
    image = Image.new("RGBA", (SIZE, SIZE))
    petal_distance = spec["petalRadius"] + opening * (7 if spec["floralMotion"] else 3)
    for angle in spec["petalAngles"]:
        x, y = rotate_point(0, -petal_distance, angle)
        rotation = angle + math.copysign(opening * 9, angle)
        part = parts["petal"].rotate(-rotation, Image.Resampling.BICUBIC, expand=True)
        put(image, part, PIVOT[0] + x, PIVOT[1] + y)
    image.alpha_composite(parts["turret"])
    points = []
    for index, (x, y) in enumerate(spec["muzzles"][tier_index]):
        offset = round(recoil * (3 if spec["floralMotion"] else 8)) if index == muzzle_index else 0
        y += offset
        points.append([x, y])
        image.alpha_composite(parts["emitter"], (x - EMITTER_TIP[0], y - EMITTER_TIP[1]))
    cx, cy = spec["heartBox"][2:]
    scale = 1 + .095 * pulse
    core = parts["core"].resize((round(80 * scale), round(80 * scale)), LANCZOS)
    put(image, core, cx, cy)
    glow(image, (cx, cy), spec["colors"][0], 12, .31 * pulse)
    if flash > 0:
        x, y = points[muzzle_index]
        glow(image, (x, y), spec["colors"][0], 9, .88 * flash)
        glow(image, (x, y), spec["colors"][2], 4, .96 * flash)
        flash_layer = Image.new("RGBA", image.size)
        rays = ImageDraw.Draw(flash_layer)
        hot = (*spec["colors"][2], round(215 * flash))
        rays.polygon(((x, y - 12 * flash), (x + 3, y), (x, y + 5), (x - 3, y)), fill=hot)
        rays.line((x - 5 * flash, y, x + 5 * flash, y), fill=hot, width=1)
        image.alpha_composite(flash_layer)
    return image, points


def clip_metadata(name, rects, fps, loop, origin, **fields):
    return {
        "animationName": name,
        "frameCount": len(rects),
        "fps": fps,
        "loop": loop,
        "durationSeconds": round(len(rects) / fps, 5),
        "origin": list(origin),
        "frameRects": rects,
        **fields,
    }


def sheet(frames, tile, columns=8):
    columns = min(columns, len(frames), 2048 // tile)
    rows = math.ceil(len(frames) / columns)
    if rows * tile > 2048:
        raise ValueError("Atlas exceeds 2048px texture budget")
    image = Image.new("RGBA", (columns * tile, rows * tile))
    rects = []
    for index, frame in enumerate(frames):
        if frame.size != (tile, tile):
            raise ValueError("Mismatched frame canvas")
        x, y = (index % columns) * tile, (index // columns) * tile
        image.alpha_composite(frame, (x, y))
        rects.append([x, y, tile, tile])
    return image, rects


def motion_clips(spec, tier_index, parts):
    names = [
        ("Idle", 10, 12, True), ("EnergyPulse", 10, 16, True), ("AimReady", 1, 1, False),
        ("PreFire", 6, 24, False), ("Charge", 10, 22, False),
        ("Recoil", 6, 28, False), ("Recovery", 6, 26, False),
        ("Reload", 8, 20, False), ("SpecialAttack", 10, 24, False),
    ]
    names.extend((f"Fire_M{index + 1}", 8, 32, False) for index in range(len(spec["muzzles"][tier_index])))
    frames, records = [], []
    for name, count, fps, loop in names:
        begin = len(frames)
        points = []
        active_muzzle = int(name[-1]) - 1 if name.startswith("Fire_M") else 0
        for index in range(count):
            p = index / count if loop else index / max(1, count - 1)
            opening, pulse, recoil, flash = 0, 0, 0, 0
            if name in ("Idle", "EnergyPulse"):
                cycle = .5 - .5 * math.cos(math.tau * p)
                opening = cycle * .27
                pulse = cycle * (.8 if name == "EnergyPulse" else .42)
            elif name in ("PreFire", "Charge"):
                opening = p * (.48 if name == "PreFire" else .92)
                pulse = p * (.45 if name == "PreFire" else 1)
            elif name.startswith("Fire_M") or name == "SpecialAttack":
                opening = .72 * (1 - p)
                recoil = math.sin(math.pi * p) ** .8
                pulse = 1 - .76 * p
                flash = (1 - p) ** 2.1
                if name == "SpecialAttack":
                    opening = math.sin(math.pi * p)
            elif name == "Recoil":
                recoil = p
                opening = .48 * p
                pulse = .62 * (1 - p)
            elif name == "Recovery":
                recoil = (1 - p) ** 1.45
                opening = .48 * (1 - p)
                pulse = .38 * (1 - p)
            elif name == "Reload":
                opening = .64 * math.sin(math.pi * p)
                pulse = .7 * math.sin(math.pi * p)
            frame, mouths = pose(spec, tier_index, parts, opening, pulse, recoil, flash, active_muzzle)
            frames.append(frame)
            points.append(mouths)
        records.append((name, begin, count, fps, loop, active_muzzle, points))
    atlas, rects = sheet(frames, SIZE, columns=10)
    clips = {}
    for name, begin, count, fps, loop, active_muzzle, points in records:
        clips[name] = clip_metadata(
            name, rects[begin:begin+count], fps, loop, PIVOT,
            muzzlePointsByFrame=points,
            activeMuzzle=active_muzzle if name.startswith("Fire_M") else None,
            projectileReleaseFrame=0 if name.startswith("Fire_M") or name == "SpecialAttack" else None,
        )
    return atlas, clips


def index_art(source, tier, accent):
    portrait = Image.new("RGBA", (512, 512))
    fitted = fit(source, 462, 466)
    portrait.alpha_composite(fitted, ((512 - fitted.width) // 2, 489 - fitted.height))
    silhouette = Image.new("RGBA", portrait.size)
    silhouette.putalpha(portrait.getchannel("A"))
    thumbnail = portrait.resize((128, 128), LANCZOS)
    icon = Image.new("RGBA", (192, 192))
    draw = ImageDraw.Draw(icon)
    vertices = [(96 + 87 * math.cos(i * math.tau / 8 - math.pi / 2),
                 96 + 87 * math.sin(i * math.tau / 8 - math.pi / 2)) for i in range(8)]
    draw.polygon(vertices, fill=(25, 16, 53, 241), outline=(221, 182, 105, 255), width=3)
    draw.ellipse((17, 17, 175, 175), outline=(*accent, 146), width=2)
    small = fit(source, 149, 149)
    put(icon, small, 96, 92)
    for number in range(tier):
        x = 96 + (number - (tier - 1) / 2) * 17
        draw.polygon(((x, 170), (x+5, 175), (x, 180), (x-5, 175)), fill=(255, 221, 151, 255))
    return {"portrait": portrait, "silhouette": silhouette,
            "thumbnail": thumbnail, "icon": icon.resize((96, 96), LANCZOS)}


def base_accessories(base):
    silhouette = base.getchannel("A")
    edge = ImageChops.subtract(silhouette.filter(ImageFilter.MaxFilter(7)), silhouette)
    outline = Image.new("RGBA", base.size, (240, 214, 155, 0))
    outline.putalpha(edge.point(lambda a: round(a * .82)))
    shadow = Image.new("RGBA", base.size, (13, 9, 32, 0))
    shadow.putalpha(silhouette.filter(ImageFilter.GaussianBlur(5)).point(lambda a: round(a * .26)))
    return {"selection": outline, "shadow": shadow}


def ingest(pack, spec, sources):
    tower_id = spec["id"]
    folder = PACK / spec["folder"]
    part_rows = cut_cells(Path(sources["parts"]), 5, 3)
    portraits = cut_cells(Path(sources["portraits"]), 3, 1)[0]
    previous = pack.data["towers"].get(tower_id, {})
    record = {
        **previous,
        "id": tower_id,
        "name": spec["name"],
        "folder": spec["folder"],
        "category": spec["category"],
        "recipe": [{"object": name, "path1": a, "path2": b} for name, a, b in spec["recipe"]],
        "hint": spec["hint"],
        "silhouetteIdentity": spec["silhouette"],
        "productionStatus": "NeedsReview",
        "gameplayStatus": "AwaitingLogic",
        "assetScaleWorldPerPixel": REFERENCE_SCALE,
        "tiers": {},
        "artSources": {
            kind: {
                "tool": "Built-in imagegen",
                "sourceFile": Path(sources[kind]).name,
                "sourceSHA256": hashlib.sha256(Path(sources[kind]).read_bytes()).hexdigest(),
                "prompt": sources["prompts"][kind],
            } for kind in ("parts", "portraits")
        },
    }
    for i, tier in enumerate(TIERS):
        part_images = assemble_parts(spec, part_rows[i])
        dir_path = folder / tier.lower()
        if i == 0:
            record["accessories"] = {
                name: pack.image(folder / f"{name}.png", image, tower_id, name, tier="All", origin=list(PIVOT))
                for name, image in base_accessories(part_images["base"]).items()
            }
        anchors = {"base": PIVOT, "turret": PIVOT, "emitter": EMITTER_TIP, "core": (40, 40), "petal": (44, 44)}
        parts = {
            name: pack.image(dir_path / f"{name}.png", image, tower_id, "towerPart",
                             tier=tier, part=name, origin=list(anchors[name]))
            for name, image in part_images.items()
        }
        top, mouths = pose(spec, i, part_images)
        preview = part_images["base"].copy()
        preview.alpha_composite(top)
        preview_file = pack.image(dir_path / "preview.png", preview, tower_id, "towerPreview", tier=tier, origin=list(PIVOT))
        atlas, clips = motion_clips(spec, i, part_images)
        atlas_file = pack.image(dir_path / "motion.png", atlas, tower_id, "towerMotionAtlas",
                               tier=tier, clips=clips, tileSize=[SIZE, SIZE])
        art = {
            name: pack.image(folder / "index" / f"{tier.lower()}_{name}.png", image, tower_id, f"index_{name}",
                             tier=tier, origin=[image.width // 2, image.height // 2])
            for name, image in index_art(portraits[i], i+1, spec["colors"][0]).items()
        }
        record["tiers"][tier] = {
            "name": spec["evolutions"][i],
            "parts": parts,
            "preview": preview_file,
            "motionAtlas": atlas_file,
            "index": art,
            "rig": {
                "canvas": [SIZE, SIZE],
                "pivot": list(PIVOT),
                "restFacingDegrees": -90,
                "baseRotates": False,
                "emitterOrigin": list(EMITTER_TIP),
                "muzzlePoints": mouths,
                "muzzleOffsetsWorld": [[round((x-PIVOT[0])*REFERENCE_SCALE, 2),
                                        round((y-PIVOT[1])*REFERENCE_SCALE, 2)] for x, y in mouths],
                "coreCenter": spec["heartBox"][2:],
                "petalAngles": spec["petalAngles"],
                "petalRadius": spec["petalRadius"],
                "motionType": "Petal release and recovery" if spec["floralMotion"] else "Emitter recoil and recovery",
            },
        }
        print(f"{tower_id} {tier}: parts, motion and Index art", flush=True)
    pack.data["towers"][tower_id] = record


def font(size, bold=False):
    path = Path("C:/Windows/Fonts") / ("segoeuib.ttf" if bold else "segoeui.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default(size=size)


def proof_board(pack, tower_id=None):
    """The art gate and final contact sheet show real production PNGs at two scales."""
    towers = pack.data["towers"]
    width = 1550
    if tower_id:
        height = 632
        selected = towers[tower_id]
        items = [
            ("NEBULA BLOOM", "ORIGINAL 5-2", SPEC["references"]["bloomPortrait"], SPEC["references"]["bloomToxic"]),
            *((selected["name"].upper(), tier + "  /  " + r["name"], r["index"]["portrait"], r["preview"])
              for tier, r in selected["tiers"].items()),
            ("STARBURST CANNON", "EXISTING PURE FUSION", SPEC["references"]["starburstPortrait"], SPEC["references"]["starburstOverhead"]),
        ]
        title = "Venom Cataclysm   /   Art Gate"
        filename = "Venom_Cataclysm_Art_Gate.png"
    else:
        height = 106 + 222 * len(towers)
        title = "Celestial Fusion   /   Production Art"
        filename = "Fusion_Production_Catalog.png"
    board = Image.new("RGBA", (width, height), (12, 11, 28, 255))
    d = ImageDraw.Draw(board)
    d.text((42, 25), title, font=font(39, True), fill=(245, 231, 205))
    d.text((44, 78), "STARFALL BASTION    •    IVORY / GOLD / VIOLET NEBULA", font=font(14, True), fill=(180, 168, 211))
    d.line((42, 101, width-42, 101), fill=(128, 99, 134), width=1)
    if tower_id:
        for index, (name, tier, portrait, top) in enumerate(items):
            x = 37 + 296 * index
            d.rounded_rectangle((x, 122, x+280, 600), 12, fill=(25, 21, 48), outline=(88, 71, 117), width=1)
            d.text((x+14, 140), name, font=font(16, True), fill=(227, 205, 164))
            d.text((x+14, 170), tier, font=font(13), fill=(201, 187, 220))
            put(board, fit(rgba(ROOT/portrait), 244, 248), x+140, 327)
            d.line((x+17, 465, x+263, 465), fill=(88, 71, 117))
            put(board, fit(rgba(ROOT/top), 104, 104), x+140, 530)
    else:
        for row, tower in enumerate(towers.values()):
            y = 114 + row * 222
            d.rounded_rectangle((40, y, 1510, y+207), 11, fill=(24, 19, 45), outline=(79, 63, 106), width=1)
            d.text((60, y+43), tower["name"], font=font(23, True), fill=(241, 220, 183))
            d.text((62, y+80), tower["category"].upper() + " FUSION", font=font(14, True), fill=(180, 160, 220))
            for index, (tier, r) in enumerate(tower["tiers"].items()):
                x = 380 + index * 375
                d.text((x, y+16), tier + "   " + r["name"], font=font(16, True), fill=(222, 208, 234))
                put(board, fit(rgba(ROOT/r["index"]["portrait"]), 170, 159), x+105, y+120)
                put(board, fit(rgba(ROOT/r["preview"]), 104, 104), x+261, y+120)
    (ROOT / "validation").mkdir(exist_ok=True)
    board.convert("RGB").save(ROOT / "validation" / filename, optimize=True)
    print(f"Saved validation/{filename}", flush=True)


def audit_starburst():
    scene = read_json(ROOT / "layouts/game-scene.json")
    project = read_json(ROOT / "Tower Defense.json")

    def value(variable):
        kind = variable["type"]
        if kind == "structure":
            return {x["name"]: value(x) for x in variable.get("children", [])}
        if kind == "array":
            return [value(x) for x in variable.get("children", [])]
        return variable.get("value")

    variables = {v["name"]: value(v) for v in scene["variables"]}
    objects = {o["name"]: o for o in scene["objects"]}
    resources = {r["name"]: r["file"] for r in project["resources"]["resources"]}
    config = variables["StarburstConfig"]
    projectile = next(a for a in objects["StarCannonProjectile"]["animations"] if a["name"] == "Starburst")["directions"][0]
    portrait = variables["IndexPortraitCatalog"]["StarburstCannon"]
    impact = variables["StarCannonVFXConfig"]["NovaExplosion"]
    sfx = variables["AudioConfig"]["SFX"]
    result = {
        "id": "StarburstCannon",
        "status": "ExistingAudited",
        "ownerObject": "StarCannonTower",
        "recipe": [{"object": "StarCannonTower", "path1": 5, "path2": 2},
                   {"object": "StarCannonTower", "path1": 2, "path2": 5}],
        "componentAtlas": config["Kit"]["Image"],
        "componentSlots": list(config["Kit"]["Frames"]),
        "preview": config["Preview"],
        "aiming": "Static pedestal; runtime rotates head/core and recoils the fired barrel",
        "muzzles": len(config["State"]["Turret"]["Muzzles"]),
        "projectileFrames": [p["image"] for p in projectile["sprites"]],
        "projectileFPS": 1 / projectile["timeBetweenFrames"],
        "sharedImpact": {"file": impact["Image"], "frameCount": len(impact["Frames"]), "seconds": impact["Duration"]},
        "sharedSfx": {key: sfx[key]["File"] for key in ("StarCannonFire", "ProjectileImpact", "TowerMajorUpgrade")},
        "portrait": portrait["Image"],
        "silhouette": "Existing Archive tints the actual portrait black",
        "evolutions": {"E1": "Existing playable form", "E2": "Not authored", "E3": "Not authored"},
        "authoredInRebuild": 0,
    }
    names = [result["componentAtlas"], result["preview"], result["portrait"], impact["Image"],
             *result["projectileFrames"], *result["sharedSfx"].values()]
    result["resolvedResources"] = [{"resourceName": name, "file": resources[name]} for name in names]
    if not all((ROOT / item["file"]).is_file() for item in result["resolvedResources"]):
        raise FileNotFoundError("An existing Starburst resource is unavailable")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ingest", choices=[t["folder"] for t in SPEC["towers"]])
    parser.add_argument("--proof", help="Tower ID for a source comparison board, or all")
    parser.add_argument("--effects", action="store_true", help="Build effect clips from approved seed art paths on stdin")
    parser.add_argument("--audio", action="store_true", help="Synthesize the final cue pack")
    parser.add_argument("--viewer", action="store_true", help="Build the local production asset bench")
    parser.add_argument("--audit-starburst", action="store_true", help="Record existing Starburst art and audio references")
    args = parser.parse_args()
    pack = Pack()
    if args.ingest:
        spec = next(t for t in SPEC["towers"] if t["folder"] == args.ingest)
        ingest(pack, spec, json.load(sys.stdin))
        pack.save()
    if args.effects:
        render = runpy.run_path(str(ROOT / "tools/fusion-pack-effects.py"))
        render["build_effects"](pack, SPEC, json.load(sys.stdin), cut_cells, fit, sheet, clip_metadata)
        pack.save()
    if args.audio:
        synth = runpy.run_path(str(ROOT / "tools/fusion-pack-audio.py"))
        synth["build_audio"](pack, SPEC, PACK)
        pack.save()
    if args.audit_starburst:
        pack.data["starburstAudit"] = audit_starburst()
        pack.save()
    if args.proof:
        proof_board(pack, None if args.proof == "all" else args.proof)
    if args.viewer:
        template = (ROOT / "tools/fusion-pack-viewer.html").read_text(encoding="utf-8")
        payload = json.dumps(pack.data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        (ROOT / "validation/Fusion_Asset_Preview.html").write_text(
            template.replace("__FUSION_MANIFEST__", payload), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
