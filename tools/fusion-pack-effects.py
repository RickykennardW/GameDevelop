"""Animate the approved celestial seed and nebula textures into transparent clips."""

import hashlib
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "assets/towers/fusion"
LANCZOS = Image.Resampling.LANCZOS

# Name, motion, frame count, FPS, tile pixels, presentation world pixels, loop, tier.
EFFECTS = {
    "VenomCataclysm": [
        ("SeedPodLaunch", "flash", 8, 32, 96, 51, False, "All"),
        ("FlowerCorePulse", "reactor", 12, 16, 96, 63, True, "All"),
        ("VenomSeedImpact", "impact", 12, 25, 144, 106, False, "E1"),
        ("CataclysmSeedExplosion", "bloom", 16, 26, 192, 151, False, "E2"),
        ("PoisonGround", "ground", 1, 1, 160, 125, False, "All"),
        ("CosmicPoisonCloud", "cloud", 16, 14, 160, 125, True, "All"),
        ("FloatingSpores", "spores", 16, 16, 144, 104, True, "All"),
        ("PoisonZoneBoundary", "boundary", 12, 14, 160, 125, True, "All"),
        ("PoisonEnergySwirl", "swirl", 16, 16, 144, 105, True, "E2"),
        ("PoisonZoneFade", "fade", 12, 20, 160, 125, False, "All"),
        ("PoisonStatus", "status", 1, 1, 48, 15, False, "All"),
        ("ToxicCollapse", "collapse", 18, 27, 192, 150, False, "E3"),
        ("SeedExpiration", "expire", 8, 26, 96, 43, False, "All"),
    ],
    "PlaguebreakerCannon": [
        ("StellarCharge", "charge", 14, 23, 128, 78, False, "All"),
        ("MuzzleFlash", "flash", 8, 34, 96, 54, False, "All"),
        ("HeavyHitFlash", "cut", 10, 28, 128, 87, False, "E1"),
        ("SporeInfusion", "formation", 10, 24, 96, 53, False, "E1"),
        ("PoisonApplication", "spores_hit", 12, 26, 112, 67, False, "All"),
        ("PoisonStatus", "status", 1, 1, 48, 15, False, "All"),
        ("PoisonIntensity", "intensity", 3, 1, 48, 15, False, "E2"),
        ("CorruptedStellarExplosion", "bloom", 14, 27, 160, 116, False, "E2"),
        ("VenomDetonation", "detonation", 16, 25, 176, 133, False, "E3"),
        ("PoisonFragments", "fragments", 10, 25, 128, 79, False, "All"),
        ("BoltExpiration", "expire", 8, 26, 96, 42, False, "All"),
    ],
    "SupernovaObliterator": [
        ("SupernovaCharge", "charge", 16, 21, 144, 88, False, "All"),
        ("ReactorBloom", "reactor", 16, 16, 128, 73, True, "All"),
        ("MuzzleRelease", "flash", 8, 29, 112, 66, False, "All"),
        ("CoreHit", "impact", 12, 27, 144, 101, False, "E1"),
        ("LargeCelestialExplosion", "bloom", 20, 27, 224, 177, False, "All"),
        ("PrimaryShockwave", "ring", 14, 26, 192, 161, False, "E1"),
        ("SecondaryShockwave", "echo", 14, 27, 192, 156, False, "E2"),
        ("StellarFragments", "fragments", 12, 25, 144, 106, False, "All"),
        ("CosmicDissipation", "expire", 10, 25, 128, 74, False, "All"),
        ("SupernovaChainBurst", "chain", 14, 25, 160, 126, False, "E3"),
        ("SupernovaChainLink", "link", 10, 25, 160, 104, False, "E3"),
    ],
    "ToxicConstellation": [
        ("RapidSeedLaunch", "flash", 6, 36, 80, 36, False, "All"),
        ("SmallToxicImpact", "impact", 8, 31, 96, 51, False, "E1"),
        ("MiniPoisonZone", "mini_zone", 16, 16, 112, 65, True, "E1"),
        ("SporeScatter", "spores_hit", 12, 29, 112, 71, False, "E2"),
        ("MultiplePoisonZones", "cluster_zones", 16, 16, 192, 126, True, "E2"),
        ("ConstellationEnergyLine", "link_loop", 16, 20, 160, 96, True, "E3"),
        ("ToxicNetwork", "network", 16, 26, 160, 112, False, "E3"),
        ("PoisonZoneFade", "fade", 12, 20, 112, 65, False, "All"),
        ("PoisonStatus", "status", 1, 1, 48, 14, False, "All"),
        ("ShardExpiration", "expire", 8, 27, 80, 36, False, "All"),
    ],
    "MeteorStormArray": [
        ("RapidMeteorSeedLaunch", "flash", 6, 35, 96, 44, False, "All"),
        ("SmallMeteorExplosion", "impact", 10, 28, 112, 70, False, "E1"),
        ("CelestialBloomImpact", "bloom", 14, 26, 144, 109, False, "All"),
        ("ClusterBurst", "cluster", 16, 28, 160, 123, False, "E2"),
        ("ClusterSplit", "split", 12, 30, 144, 96, False, "E2"),
        ("FragmentImpact", "impact", 8, 30, 96, 57, False, "All"),
        ("SmallShockwaves", "echo", 14, 27, 144, 101, False, "E2"),
        ("MeteorRain", "rain", 24, 26, 224, 168, False, "E3"),
        ("EmberDissipation", "fragments", 12, 25, 112, 75, False, "All"),
        ("MeteorExpiration", "expire", 8, 26, 96, 45, False, "All"),
    ],
}
PROJECTILES = {
    "VenomCataclysm": [("VenomSeedPod", 0, 23, 62, "E1", "slow"), ("CataclysmSeedPod", 1, 22, 75, "E2/E3", "slow")],
    "PlaguebreakerCannon": [("PlaguebreakerBolt", 0, 30, 59, "E1/E2", "straight"), ("VenomDetonationShot", 1, 29, 68, "E3", "straight")],
    "SupernovaObliterator": [("CompressedSupernovaCore", 0, 23, 70, "E1/E2", "slow"), ("SupernovaShell", 1, 23, 81, "E3", "slow")],
    "ToxicConstellation": [("ToxicStarShard", 0, 32, 38, "E1/E2", "straight"), ("ConstellationVenomSeed", 1, 28, 50, "E2/E3", "slow")],
    "MeteorStormArray": [("MeteorFragment", 0, 30, 50, "E1", "tumble"), ("MeteorFragmentSmall", 0, 32, 35, "E2", "tumble_small"),
                        ("MeteorFragmentLarge", 0, 27, 64, "E2/E3", "tumble_large"), ("ClusterMeteor", 1, 26, 71, "E2/E3", "slow")],
}
SHARED = [
    ("SourceDissolve", "dissolve", 12, 28, 144, 115, False, "All"),
    ("EnergyTransfer", "transfer", 12, 28, 160, 130, False, "All"),
    ("CosmicConvergence", "converge", 12, 27, 176, 137, False, "All"),
    ("FusionCoreFormation", "formation", 12, 28, 144, 94, False, "All"),
    ("TowerMaterialization", "materialize", 14, 28, 176, 134, False, "All"),
    ("FinalEnergyPulse", "ring", 12, 30, 160, 128, False, "All"),
    ("PureAscensionAura", "ascend", 14, 27, 192, 142, False, "All"),
]


def texture(image, source, extent, center, opacity=1, angle=0):
    if extent < 1 or opacity <= 0:
        return
    scale = extent / max(source.size)
    part = source.resize(tuple(max(1, round(n * scale)) for n in source.size), LANCZOS)
    if angle:
        part = part.rotate(-angle, Image.Resampling.BICUBIC, expand=True)
    if opacity < 1:
        part.putalpha(part.getchannel("A").point(lambda value: round(value * opacity)))
    x, y = center
    image.alpha_composite(part, (round(x - part.width / 2), round(y - part.height / 2)))


@lru_cache(maxsize=48)
def grid(size):
    coordinates = (np.arange(size, dtype=np.float32) + .5) / (size / 2) - 1
    x, y = np.meshgrid(coordinates, coordinates)
    return x, y, np.hypot(x, y), np.arctan2(y, x)


def wash(image, color, opacity):
    layer = Image.new("RGBA", image.size, (*color, 0))
    layer.putalpha(Image.fromarray(np.uint8(np.clip(opacity, 0, 1) * 255)))
    image.alpha_composite(layer)


def halo(image, radius, color, opacity, scallop=0):
    _, _, r, theta = grid(image.width)
    wave = radius * (1 + scallop * np.cos(theta * 6))
    wash(image, color, opacity * np.exp(-((r - wave) / .071) ** 2))
    wash(image, color, opacity * .53 * np.exp(-((r - wave) / .018) ** 2))


@lru_cache(maxsize=160)
def scatter(seed, count):
    rng = np.random.default_rng(int.from_bytes(hashlib.sha256(seed.encode()).digest()[:8], "big"))
    return list(zip(rng.uniform(0, math.tau, count), rng.uniform(.28, .81, count), rng.uniform(.012, .038, count)))


def motes(image, seed, p, colors, count=18, opacity=1, inward=False, loop=False):
    d = ImageDraw.Draw(image)
    size = image.width
    c = size / 2
    for index, (angle, radius, length) in enumerate(scatter(seed, count)):
        age = (p + index / count) % 1 if loop else p
        visibility = math.sin(math.pi * age) ** 1.45 if loop else min(1, p * 17) * (1-p)**1.34
        r = c * radius * ((1 - .89 * age) if inward else .13 + .87 * age)
        a = angle + .56 * age
        x, y = c + r * math.cos(a), c + r * math.sin(a)
        span = max(1, size * length * (1 - .57 * age))
        alpha = round(237 * opacity * visibility)
        d.polygon(((x, y-span), (x+span*.38, y), (x, y+span*.7), (x-span*.38, y)),
                  fill=(*colors[index % len(colors)], alpha))


def trim_border(image):
    # Soft emission vanishes before the tile edge, even when the frame is bilinearly sampled.
    size = image.width
    axis = np.arange(size)
    margin = np.clip(np.minimum(axis, axis[::-1]) / 3, 0, 1)
    alpha = np.asarray(image.getchannel("A"), dtype=np.float32)
    image.putalpha(Image.fromarray(np.uint8(alpha * margin[:, None] * margin[None, :])))
    return image


def flight(size, phase, art, plume, color, style, special):
    image = Image.new("RGBA", (size, size))
    c = size / 2
    x, y, _, _ = grid(size)
    turn = math.tau * phase
    size_factor = {"tumble_small": .76, "tumble_large": 1.16}.get(style, 1)
    tail = np.exp(-((x - .036 * np.sin(y * 8 + turn)) / ((.10 + .055 * np.maximum(0, y))*size_factor))**2)
    tail *= np.exp(-((y - .28) / .47)**2) * np.clip((y + .08) * 2.1, 0, 1)
    wash(image, color, tail * (.39 if special else .28))
    for index in range(4):
        life = (phase + index / 4) % 1
        point = (c + math.sin(index * 2.4 + turn) * (1.8 + life * 5),
                 c + (12 + 24 * life) * size / 96)
        texture(image, plume, size * (.22 - life * .10), point, .31 * math.sin(math.pi * life))
    spins = {"tumble": 360, "tumble_small": 720, "tumble_large": -360}
    spin = spins[style] * phase if style in spins else 10 * math.sin(turn) if style == "slow" else 0
    extent = size * (.63 if special else .49) * size_factor * (1 + .045 * math.sin(turn))
    texture(image, art, extent, (c, c), 1, spin)
    return trim_border(image)


def zone(size, p, mode, colors, art, key):
    image = Image.new("RGBA", (size, size))
    c = size / 2
    _, _, r, theta = grid(size)
    angle = p * math.tau
    fade = (1 - p)**1.6 if mode == "fade" else 1
    if mode in ("ground", "mini_zone", "fade"):
        stone = np.exp(-(r / .69)**3) * (.63 + .37 * np.cos(12*r - 6*theta)**2)
        wash(image, colors[1], stone * .27 * fade)
        halo(image, .73, colors[0], .18 * fade, .064)
    if mode in ("cloud", "mini_zone", "fade", "swirl"):
        for index in range(3):
            a = angle + index * math.tau / 3
            center = (c + c * .25 * math.cos(a), c + c * .23 * math.sin(a))
            texture(image, art, size * (.66 if mode == "cloud" else .48), center,
                    (.13 if mode == "cloud" else .17) * fade, index * 117 + p * 360)
    if mode in ("boundary", "swirl"):
        halo(image, .77 if mode == "boundary" else .53, colors[0], .28, .052)
        motes(image, key, p, colors, count=10, opacity=.42, loop=True)
    if mode in ("mini_zone", "spores", "fade"):
        motes(image, key, p, colors, count=13, opacity=.54 * fade, loop=mode != "fade")
    return image


def link(size, p, colors, mode):
    image = Image.new("RGBA", (size, size))
    x, y, _, _ = grid(size)
    angle = math.tau * p
    travel = .83 * (2 * p - 1)
    path = .025 * np.sin(9 * x - angle) + .013 * np.sin(23 * x + angle)
    span = np.clip((.93 - np.abs(x)) / .14, 0, 1)
    if mode == "transfer":
        span *= np.exp(-((x-travel) / .34)**2)
    amp = .66 + .20 * math.sin(angle) if mode == "link_loop" else math.sin(math.pi * p)**.8
    wash(image, colors[1], np.exp(-((y-path)/.055)**2) * span * .47 * amp)
    wash(image, colors[0], np.exp(-((y-path)/.014)**2) * span * .78 * amp)
    wash(image, colors[2], np.exp(-((y-path)/.010)**2) * span * amp * np.cos(x*9-angle)**10)
    return image


def burst(size, p, mode, colors, plume, key):
    image = Image.new("RGBA", (size, size))
    c = size / 2
    _, _, r, theta = grid(size)
    rise = min(1, p * 19)
    decay = rise * (1 - p)**1.58
    expand = 1 - (1 - p)**2
    width = .14 + expand * .70
    if mode == "collapse":
        width = .73 - .62 * min(1, p / .49) + .58 * max(0, (p-.49)/.51)
    if mode not in ("ring", "echo", "fragments", "expire", "dissolve"):
        texture(image, plume, size * width, (c, c), min(.95, decay * 1.22),
                (82 if mode == "collapse" else 24) * p)
    if mode in ("bloom", "cluster", "detonation", "chain"):
        for number in range(5):
            a = number * math.tau / 5 + .85 * p
            center = (c + c * expand * .38 * math.cos(a), c + c * expand * .38 * math.sin(a))
            texture(image, plume, size * (.23 + .19*expand), center, decay * .38, math.degrees(a))
    if mode in ("ring", "echo", "bloom", "detonation", "collapse", "chain"):
        halo(image, .08 + .81*expand, colors[0], .67*decay, .049 if mode in ("bloom", "collapse") else .01)
    if mode in ("echo", "detonation", "chain"):
        halo(image, .12 + .50*expand, colors[2], .42*decay, .041)
    if mode in ("cut", "detonation"):
        x, y, _, _ = grid(size)
        slash = np.exp(-((y+.49*x)/(.020+.027*p))**2) * np.exp(-(r/(.18+.58*expand))**2)
        wash(image, colors[2], slash * .86 * decay)
    if mode in ("flash", "impact", "cut", "bloom", "collapse", "cluster", "chain", "detonation"):
        corona = np.exp(-(r / (.08 + .22*expand))**2)
        rays = (.36 + .64*np.cos(5*theta + 6*r)**8)
        wash(image, colors[2], corona * rays * np.exp(-5.1*p) * rise * .93)
    if mode != "ring":
        motes(image, key, p, colors, count=27 if mode in ("bloom", "dissolve", "collapse") else 16,
              opacity=.75 if mode == "expire" else .94, inward=mode == "collapse" and p < .48)
    return image


def converge(size, p, mode, colors, body, plume, key, tier):
    image = Image.new("RGBA", (size, size))
    c = size / 2
    amp = .58 + .42 * math.sin(math.tau*p) if mode == "reactor" else math.sin(math.pi*p)**.7
    gathering = .80 - .66*p
    if mode == "formation":
        texture(image, body, size * (.13 + .43*p), (c, c), amp, 78*p)
    else:
        texture(image, plume, size * (.23 + .47*(1-gathering)), (c, c), amp*.68, 110*p)
    halo(image, .48 + .08*math.sin(math.tau*p) if mode == "reactor" else gathering,
         colors[0], amp*.55, .061)
    if mode in ("materialize", "ascend", "network"):
        count = 3 if mode == "network" else (5 if tier == 2 else 7)
        angles = [i*math.tau/count - math.pi/2 + .65*p for i in range(count)]
        points = [(c + c*(.31+.39*p)*math.cos(a), c+c*(.31+.39*p)*math.sin(a)) for a in angles]
        if mode == "network":
            ImageDraw.Draw(image).line(points+[points[0]], fill=(*colors[2], round(166*amp)), width=2)
        for index, point in enumerate(points):
            texture(image, body, size*.16, point, amp*.82, math.degrees(angles[index]))
    else:
        motes(image, key, p, colors, count=20, inward=True, loop=mode=="reactor")
    return image


def falling_seeds(size, p, mode, colors, body, plume, key):
    image = Image.new("RGBA", (size, size))
    targets = [(.26, .42), (.65, .38), (.48, .67), (.76, .61), (.35, .72)]
    if mode == "split":
        for index, angle in enumerate((-43, 0, 43)):
            a = math.radians(angle)
            x = size * (.50 + .35*p*math.sin(a))
            y = size * (.67 - .51*p*math.cos(a))
            texture(image, plume, size*.25, (x, y+size*.07), .46*(1-p))
            texture(image, body, size*(.27-.11*p), (x, y), (1-p)**.56, angle+39*p)
        return image
    for index, (x, y) in enumerate(targets):
        age = (p - .116 * index) / .49
        if not 0 <= age <= 1:
            continue
        if age < .41:
            factor = (.41 - age) / .41
            head = (size*(x+.10*factor), size*(y-.19*factor))
            texture(image, plume, size*.29, (head[0]+size*.045, head[1]-size*.08), .45, -22)
            texture(image, body, size*.135, head, .95, 36+55*age)
        else:
            impact = burst(round(size*.37), (age-.41)/.59, "bloom", colors, plume, key+str(index))
            image.alpha_composite(impact, (round(size*x-impact.width/2), round(size*y-impact.height/2)))
    return image


def render(size, index, count, loop, mode, colors, art, key, tier=3):
    p = index/count if loop else (index+.32)/count
    body, special, plume = art
    if mode in ("ground", "cloud", "spores", "boundary", "swirl", "fade", "mini_zone"):
        result = zone(size, p, mode, colors, plume, key)
    elif mode == "cluster_zones":
        result = Image.new("RGBA", (size, size))
        for phase, (x, y) in enumerate(((.30,.40), (.68,.39), (.51,.66))):
            item = zone(round(size*.51), (p+phase/3)%1, "mini_zone", colors, plume, key+str(phase))
            result.alpha_composite(item, (round(size*x-item.width/2), round(size*y-item.height/2)))
    elif mode in ("link", "link_loop", "transfer"):
        result = link(size, p, colors, mode)
    elif mode in ("status", "intensity"):
        result = Image.new("RGBA", (size, size))
        texture(result, special, size*.78, (size/2, size*.45))
        draw = ImageDraw.Draw(result)
        for tick in range(index+1 if mode=="intensity" else 1):
            x = size*.27 + 8*tick
            draw.polygon(((x, size*.86), (x+2, size*.90), (x, size*.94), (x-2, size*.90)), fill=(*colors[2], 250))
    elif mode in ("charge", "reactor", "converge", "formation", "materialize", "ascend", "network"):
        result = converge(size, p, mode, colors, special, plume, key, tier)
    elif mode in ("rain", "split"):
        result = falling_seeds(size, p, mode, colors, body, plume, key)
    else:
        result = burst(size, p, mode, colors, plume, key)
    if mode in ("ground", "cloud", "spores", "boundary", "swirl", "fade", "mini_zone", "cluster_zones"):
        # Smooth opacity compression keeps layered zones legible at overlap.
        alpha = np.asarray(result.getchannel("A"), dtype=np.float32)
        result.putalpha(Image.fromarray(np.uint8(118 * -np.expm1(-alpha / 106))))
    return trim_border(result)


def build_effects(pack, spec, source, cut_cells, fit, sheet, clip_metadata):
    art_path = Path(source["file"])
    arts = cut_cells(art_path, 3, 5)
    pack.data["effectArtSource"] = {
        "tool": "Built-in imagegen",
        "sourceFile": art_path.name,
        "sha256": hashlib.sha256(art_path.read_bytes()).hexdigest(),
        "prompt": source["prompt"],
    }

    def write_effect(folder, id, definition, colors, art, tier=3):
        name, mode, count, fps, tile, world, loop, tier_label = definition
        frames = [render(tile, i, count, loop, mode, colors, art, id+"/"+name, tier) for i in range(count)]
        atlas, rects = sheet(frames, tile, columns=6)
        meta = clip_metadata(name, rects, fps, loop, (tile//2, tile//2))
        meta["axisDegrees"] = 0 if mode in ("link", "link_loop", "transfer") else -90
        if mode == "dissolve":
            meta["sourceOpacityByFrame"] = [round((1-i/(count-1))**1.25, 4) for i in range(count)]
        if mode == "intensity":
            meta["playback"] = "Select frame by intensity instead of autoplay"
        if name.startswith("AscendTo"):
            meta["switchTierAtFrame"] = count//2
        return pack.image(folder / f"{name}.png", atlas, id, "effectAtlas", tier=tier_label,
                          clip=meta, renderSizeWorldPx=world, blendMode="normal",
                          layerHint="Status row" if mode in ("status", "intensity") else
                          "Below enemies" if mode in ("ground", "cloud", "mini_zone", "cluster_zones", "boundary", "fade") else
                          "Below HP bars",
                          lifecycle="Loop until owner expires" if loop else "Play once, then remove")

    for index, tower in enumerate(spec["towers"]):
        id = tower["id"]
        colors, art = tower["colors"], arts[index]
        folder = PACK / tower["folder"]
        record = pack.data["towers"][id]
        record["projectiles"] = []
        for name, asset, fps, world, tier, motion in PROJECTILES[id]:
            tile, count = 96, 8
            frames = [flight(tile, n/count, art[asset], art[2], colors[0], motion, asset==1) for n in range(count)]
            atlas, rects = sheet(frames, tile)
            file = pack.image(folder / "projectiles" / f"{name}.png", atlas, id, "projectileAtlas",
                              tier=tier, renderSizeWorldPx=world, bakedTrail=True,
                              clip=clip_metadata(name, rects, fps, True, (48,48), restFacingDegrees=-90))
            record["projectiles"].append(file)
        record["effects"] = [
            write_effect(folder / "vfx", id, definition, colors, art) for definition in EFFECTS[id]
        ]
        for number in (2,3):
            definition = (f"AscendToE{number}", "ascend", 14, 27, 176, 139, False, f"E{number}")
            record["effects"].append(write_effect(folder / "vfx", id, definition, colors, art, number))
        print(f"{id}: {len(record['projectiles'])} projectile and {len(record['effects'])} effect clips", flush=True)
    colors = ((182,136,249), (98,79,222), (251,223,164))
    shared = pack.data["shared"]
    shared["effects"] = [write_effect(PACK/"shared"/"vfx", "Shared", definition, colors, arts[2]) for definition in SHARED]
    shared["materializationTimeline"] = [
        {"clip": name, "startSeconds": offset} for name, offset in
        [("SourceDissolve",0),("EnergyTransfer",.04),("CosmicConvergence",.11),
         ("FusionCoreFormation",.19),("TowerMaterialization",.29),("FinalEnergyPulse",.39)]
    ]
    shared["pureAccent"] = "PureAscensionAura"
    shared["peakSequenceDurationSeconds"] = .79
