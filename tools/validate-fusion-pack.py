"""Verify every produced Fusion file, animation frame, rig and authored change."""

import argparse
import hashlib
import json
import runpy
import subprocess
import wave
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "assets/towers/fusion"
MANIFEST = PACK / "manifest.json"
REPORT = ROOT / "validation/fusion-pack-static.json"


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seal", action="store_true", help="Mark the inspected production pack complete")
    args = parser.parse_args()
    manifest = read(MANIFEST)
    assets = manifest["assets"]
    towers = manifest["towers"]
    checks = 0
    clip_count = frame_count = 0
    audio_peaks, audio_rms, durations = [], [], []
    sweep = {}
    frame_alpha = {}

    def ok(value, message):
        nonlocal checks
        if not value:
            raise ValueError(message)
        checks += 1

    def validate_clip(image, clip, file):
        nonlocal clip_count, frame_count
        name = clip["animationName"]
        rects = clip["frameRects"]
        ok(clip["frameCount"] == len(rects) and clip["fps"] > 0 and isinstance(clip["loop"], bool),
           f"{file}/{name}: clip timing")
        ok(abs(clip["durationSeconds"] - len(rects)/clip["fps"]) < .00002, f"{file}/{name}: duration")
        unique = set()
        alpha_peak = 0
        for index, (x, y, w, h) in enumerate(rects):
            ok(0 <= x < x+w <= image.width and 0 <= y < y+h <= image.height, f"{file}/{name}: rectangle {index}")
            ok((w,h)==tuple(rects[0][2:]), f"{file}/{name}: consistent frame canvas")
            frame = image.crop((x, y, x+w, y+h))
            alpha = np.asarray(frame.getchannel("A"))
            alpha_peak = max(alpha_peak, int(alpha.max()))
            ok(alpha.min() == 0, f"{file}/{name}: transparent background")
            ok(max(alpha[0].max(), alpha[-1].max(), alpha[:,0].max(), alpha[:,-1].max()) < 18,
               f"{file}/{name}: frame {index} has visible alpha on the canvas edge")
            if alpha.max() == 0:
                ok(not clip["loop"] and index in (0, len(rects)-1), f"{file}/{name}: unexpected empty frame {index}")
            unique.add(hashlib.sha256(frame.tobytes()).hexdigest())
            for px, py in clip.get("muzzlePointsByFrame", [[] for _ in rects])[index]:
                ok(0 < px < w-1 and 0 < py < h-1 and alpha[py-1:py+2, px-1:px+2].max() >= 128,
                   f"{file}/{name}: emitter coordinates leave the visible muzzle at frame {index}")
        ok(alpha_peak > 12, f"{file}/{name}: visible clip")
        if len(rects) > 1:
            ok(len(unique) >= min(3,len(rects)), f"{file}/{name}: contains real animation")
        clip_count += 1
        frame_count += len(rects)
        frame_alpha[f"{file}/{name}"] = alpha_peak

    ok(len(towers) == 5, "Five Fusion families are present")
    actual = {path.relative_to(ROOT).as_posix() for path in PACK.rglob("*") if path.is_file() and path != MANIFEST}
    ok(actual == set(assets), f"Pack inventory mismatch: {sorted(actual.symmetric_difference(assets))}")
    ok(len({name.casefold() for name in assets}) == len(assets), "No case-insensitive file collisions")
    ok(len({asset["sha256"] for asset in assets.values()}) == len(assets), "No redundant byte-identical files")
    for file, asset in assets.items():
        path = (ROOT/file).resolve()
        ok(path.is_relative_to(PACK.resolve()) and file == asset["file"] and asset["resourceName"]==file,
           "Manifest path: "+file)
        ok(path.stat().st_size==asset["bytes"] and digest(path)==asset["sha256"], "Checksum: "+file)
        ok(asset["status"]=="Complete" and asset["importStatus"] in ("RegisteredIndex","RegisteredGameplay","ReadyToImport"),
           "Production state: "+file)
        if asset["assetType"] == "audio":
            with wave.open(str(path), "rb") as audio:
                ok(audio.getnchannels()==1 and audio.getsampwidth()==2 and audio.getframerate()==44100 and audio.getcomptype()=="NONE",
                   "PCM format: "+file)
                samples = np.frombuffer(audio.readframes(audio.getnframes()), dtype="<i2").astype(np.float32)/32768
            peak = float(np.max(np.abs(samples)))
            rms = float(np.sqrt(np.mean(samples**2)))
            duration = len(samples)/44100
            ok(.06 < peak < .81 and rms > .012 and abs(duration-asset["durationSeconds"])<.00002, "Audible unclipped WAV: "+file)
            ok(abs(samples[0])<.0002 and abs(samples[-1])<.0002 and duration<1, "Tapered short cue: "+file)
            audio_peaks.append(20*np.log10(peak))
            audio_rms.append(20*np.log10(rms))
            durations.append(duration)
            continue
        with Image.open(path) as source:
            ok(source.format == "PNG" and source.mode=="RGBA" and list(source.size)==asset["dimensions"],
               "RGBA PNG dimensions: "+file)
            source.load()
            alpha = source.getchannel("A")
            ok(alpha.getextrema()[0]==0 and alpha.getextrema()[1]>12 and max(source.size)<=2048, "Visible alpha and texture budget: "+file)
            for clip in asset.get("clips", {}).values():
                validate_clip(source, clip, file)
            if "clip" in asset:
                validate_clip(source, asset["clip"], file)

    for id, record in towers.items():
        ok(set(record["tiers"])=={"E1","E2","E3"} and len(record["recipe"])==2, id+" progression and recipe")
        ok(len(record["projectiles"])>=2 and len(record["effects"])>=11 and len(record["audio"])>=9, id+" complete effect and cue sets")
        tier_peaks = {}
        for tier, details in record["tiers"].items():
            rig = details["rig"]
            ok(rig["pivot"]==[96,96] and rig["restFacingDegrees"]==-90 and rig["baseRotates"] is False,
               id+" "+tier+" fixed pedestal and head pivot")
            ok(set(details["parts"])=={"base","turret","emitter","core","petal"}, id+" "+tier+" rig components")
            expected = {"Idle","EnergyPulse","AimReady","PreFire","Charge","Recoil","Recovery","Reload","SpecialAttack"}
            expected.update(f"Fire_M{n+1}" for n in range(len(rig["muzzlePoints"])))
            ok(expected == set(assets[details["motionAtlas"]]["clips"]), id+" "+tier+" complete motion and muzzle set")
            with Image.open(ROOT/details["index"]["portrait"]) as portrait, Image.open(ROOT/details["index"]["silhouette"]) as silhouette:
                ok(portrait.size==silhouette.size==(512,512) and portrait.getchannel("A").tobytes()==silhouette.getchannel("A").tobytes(),
                   id+" "+tier+" identical portrait/silhouette alpha")
                ok(np.asarray(silhouette)[...,:3].max()==0, id+" "+tier+" black silhouette")
            with Image.open(ROOT/details["preview"]) as preview:
                ys, xs = np.nonzero(np.asarray(preview.getchannel("A")) >= 128)
                radius = float(np.hypot(xs-96, ys-96).max()*record["assetScaleWorldPerPixel"])
                tier_peaks[tier] = round(radius, 2)
                ok(radius<=68, id+" "+tier+" art reference envelope fits the Nebula scale guide")
        sweep[id] = tier_peaks
        if args.seal:
            record["productionStatus"] = "Complete"
    for id in ("VenomCataclysm","ToxicConstellation"):
        for file in towers[id]["effects"]:
            asset = assets[file]
            if asset["layerHint"]=="Below enemies" and asset["clip"]["loop"]:
                peak = frame_alpha[f"{file}/{asset['clip']['animationName']}"]
                ok(peak < 145, "Zone visibility budget: "+file)
    ok(len(manifest["shared"]["effects"])==7 and len(manifest["shared"]["audio"])==1, "Shared fusion materialization set")

    baseline = read(ROOT/"validation/fusion-rebuild-cleanup.json")["baselineCommit"]
    old = lambda file: json.loads(subprocess.check_output(["git","show",baseline+":"+file],cwd=ROOT).decode("utf-8-sig"))
    project = read(ROOT/"Tower Defense.json")
    scene = read(ROOT/"layouts/game-scene.json")
    registered = {asset["resourceName"] for asset in assets.values() if asset["importStatus"]!="ReadyToImport"}
    resources = project["resources"]["resources"]
    for file in registered:
        ok(sum(r["name"]==file and r["file"]==file for r in resources)==1, "Native resource entry: "+file)
    project["resources"]["resources"] = [r for r in resources if r["name"] not in registered]
    ok(project==old("Tower Defense.json"), "Project differences limited to new Fusion resources")
    scope = runpy.run_path(str(ROOT/'tools/nebula-bloom-scope.py'))
    original_scene = old('layouts/game-scene.json')
    gameplay = all(t['gameplayStatus']=='Playable' for t in towers.values())
    if gameplay:
        def unpack(value):
            if value['type']=='structure': return {c['name']:unpack(c) for c in value['children']}
            if value['type']=='array': return [unpack(c) for c in value['children']]
            return value['value']

        variables = {v['name']:v for v in scene['variables']}
        config = read(ROOT/'tools/fusion-evolution-config.json')
        catalog = {r['Id']:r for r in unpack(variables['FusionCatalog'])}
        signatures = []
        for r in catalog.values():
            recipe = r['Variants'][0]['Recipe']
            signatures.append(tuple(sorted((p['Type'],p['Path1'],p['Path2']) for p in recipe)))
        ok(set(catalog)=={'StarburstCannon',*towers} and len(set(signatures))==6,'Six distinct order-independent canonical recipes')
        for id, family in towers.items():
            ok(catalog[id]['Variants'][0]['Recipe'][0]['Type']==family['recipe'][0]['object'], id+' active recipe')
            for tier, detail in family['tiers'].items():
                config['Towers'][id]['Tiers'][int(tier[1])-1]['Name']=detail['name']
        ok(unpack(variables['FusionEvolutionConfig'])==config, 'Balance source matches native scene variables')
        native_images = {s['image'] for o in scene['objects'] for a in o.get('animations',[]) for d in a['directions'] for s in d['sprites']}
        audio = unpack(variables['AudioConfig'])['SFX']
        for file, asset in assets.items():
            if file not in registered: continue
            if asset['assetType']=='audio':
                ok(audio['Fusion_'+asset['sfxName']]['File']==file,'Native SFX reference: '+file)
            else:
                ok(file in native_images,'Native scene preloads image: '+file)
        new_objects = {'FusionEvolutionArtSource',*towers}
        ok(new_objects <= {o['name'] for o in scene['objects']},'Five native tower owners and one art registry')
        scene['objects'] = [o for o in scene['objects'] if o['name'] not in new_objects]
        folder = next(f for f in scene['objectsFolderStructure']['children'] if f['folderName']=='03_TOWERS')
        folder['children'] = [f for f in folder['children'] if f.get('folderName')!='Fusion Evolutions']
        changed_sources = {'starburst-fusion-runtime.js','fusion-archive-runtime.js','free-placement-runtime.js',
                           'world-selection-runtime.js','selected-panel-runtime.js','unit-index-runtime.js',
                           'star-cannon-runtime.js','nebula-bloom-runtime.js','nebula-bloom-render.js','audio-runtime.js',
                           'developer-cheats-runtime.js','nova-wave-manager.js','nova-death-runtime.js'}
        added_events = []
        for root, children, name in read(ROOT/'tools/source-mapping.json'):
            event = scene['events'][root]
            for index in children: event=event['events'][index]
            ok(event['inlineCode']==(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines(),'Embedded source matches: '+name)
            if name in changed_sources:
                previous = original_scene['events'][root]
                for index in children: previous=previous['events'][index]
                event['inlineCode']=previous['inlineCode']
            elif name in {'fusion-evolution-runtime.js','fusion-evolution-combat.js'}:
                added_events.append(children[0])
        for index in sorted(added_events,reverse=True): del scene['events'][0]['events'][index]
        scene['variables'] = [v for v in scene['variables'] if v['name'] not in {'FusionEvolutionConfig','FusionEvolutionArt'}]
    scene['objects'] = [scope['without_fusion_object'](o) for o in scene['objects']]
    scene['variables'] = [scope['without_fusion_variable'](v) for v in scene['variables']]
    ok(scene==original_scene, "Unrelated Game Scene events, instances and settings match the original")
    for file in ("layouts/levels.json","layouts/main-menu.json","eventsFunctionsExtensions/health.json"):
        ok(read(ROOT/file)==old(file), "Preserved "+file)
    changed = subprocess.check_output(["git","diff",baseline,"--name-only","--","assets"], cwd=ROOT, text=True).splitlines()
    ok(all(name.startswith("assets/towers/fusion/") for name in changed), "Original asset bytes are preserved")
    ok(not any((ROOT/entry["path"]).exists() for entry in read(ROOT/"validation/fusion-rebuild-cleanup.json")["deleted"]),
       "Rejected files remain removed")

    if args.seal:
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    report = {
        "passed": True,
        "checks": checks,
        "families": len(towers),
        "tiers": 3*len(towers),
        "assets": len(assets),
        "assetTypes": dict(Counter(x["assetType"] for x in assets.values())),
        "totalBytes": sum(x["bytes"] for x in assets.values()),
        "animationClips": clip_count,
        "framesChecked": frame_count,
        "audioCount": len(audio_peaks),
        "audioPeakDbFS": [round(min(audio_peaks),2),round(max(audio_peaks),2)],
        "audioRmsDbFS": [round(min(audio_rms),2),round(max(audio_rms),2)],
        "audioDurationSeconds": [round(min(durations),3),round(max(durations),3)],
        "referenceArtRadiusWorldPx": sweep,
        "registeredIndexResources": sum(a['importStatus']=='RegisteredIndex' for a in assets.values()),
        "registeredGameplayResources": sum(a['importStatus']=='RegisteredGameplay' for a in assets.values()),
        "baselineCommit": baseline,
    }
    REPORT.write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__=="__main__":
    main()
