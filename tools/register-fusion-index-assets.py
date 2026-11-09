"""Add only the five sealed Index previews, using the existing archive objects."""

import copy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets/towers/fusion/manifest.json"


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, data):
    if read(path) != data:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def variable(name, value):
    if isinstance(value, dict):
        return {"name": name, "type": "structure", "children": [variable(k,v) for k,v in value.items()]}
    if isinstance(value, list):
        return {"name": name, "type": "array", "children": [variable(str(i),v) for i,v in enumerate(value)]}
    kind = "boolean" if isinstance(value,bool) else "string" if isinstance(value,str) else "number"
    return {"name": name, "type": kind, "value": value}


def append_exact(records, name, value):
    same_name = next((entry for entry in records if entry["name"] == name), None)
    if same_name is None:
        records.append(value)
    elif same_name != value:
        raise ValueError(f"Existing entry would be overwritten: {name}")


def register():
    project_path = ROOT / "Tower Defense.json"
    scene_path = ROOT / "layouts/game-scene.json"
    manifest = read(MANIFEST)
    if any(r['gameplayStatus'] == 'Playable' for r in manifest['towers'].values()):
        print('The Fusion Index is active. Use build-fusion-evolution.py to refresh its data.')
        return
    if len(manifest["towers"]) != 5 or any(r["productionStatus"] != "Complete" for r in manifest["towers"].values()):
        raise ValueError("Complete the five production and QA records before registering portraits.")
    project, scene = read(project_path), read(scene_path)
    resources = project["resources"]["resources"]
    index = next(o for o in scene["objects"] if o["name"] == "IndexShowcase")
    portraits = next(v for v in scene["variables"] if v["name"] == "IndexPortraitCatalog")["children"]
    catalog = next(v for v in scene["variables"] if v["name"] == "FusionCatalog")["children"]
    for record in manifest["towers"].values():
        tower_id = record["id"]
        # The production namespace keeps these display rows separate from saved
        # unlock identifiers and real recipes. The future activation can replace
        # the corresponding preview without migrating any existing discoveries.
        preview_id = "FusionPreview_" + tower_id
        animation_name = preview_id + "_E1"
        file = record["tiers"]["E1"]["index"]["portrait"]
        if not (ROOT / file).is_file():
            raise FileNotFoundError(file)
        if any(r["file"].casefold()==file.casefold() and r["name"]!=file for r in resources):
            raise ValueError(f"Resource path already registered with a different name: {file}")
        append_exact(resources, file, {"file": file, "kind": "image", "metadata": "", "name": file,
                                       "smoothed": True, "userAdded": True})
        animation = copy.deepcopy(index["animations"][0])
        animation["name"] = animation_name
        animation["directions"][0]["sprites"][0]["image"] = file
        append_exact(index["animations"], animation_name, animation)
        append_exact(portraits, preview_id, variable(preview_id, {
            "Animation": animation_name, "Image": file, "VisualBounds": manifest["assets"][file]["visualBounds"],
        }))
        entry = variable(str(len(catalog)), {
            "Id": preview_id, "Name": record["name"], "Kind": record["category"],
            "Animation": animation_name, "Hint": record["hint"],
            "Description": "A sealed celestial formation.",
            "AdaptiveVariants": False, "Variants": [],
        })
        existing = next((v for v in catalog if any(
            c["name"] == "Id" and c.get("value") == preview_id for c in v["children"])), None)
        if existing is None:
            catalog.append(entry)
        else:
            entry["name"] = existing["name"]
            if existing != entry:
                raise ValueError(f"Existing archive row differs: {preview_id}")
        record["gdevelopIndex"] = {"entryId": preview_id, "animation": animation_name,
                                  "object": "IndexShowcase", "resourceName": file,
                                  "importStatus": "RegisteredIndex", "recipeStatus": "SealedPreview"}
        manifest["assets"][file]["importStatus"] = "RegisteredIndex"
    write(project_path, project)
    write(scene_path, scene)
    write(MANIFEST, manifest)
    print("Registered five E1 portrait resources and five sealed Fusion Index entries.")


if __name__ == "__main__":
    register()
