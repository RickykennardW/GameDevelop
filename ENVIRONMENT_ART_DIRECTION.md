# Celestial Void environment direction

Chapters 1–5 have independent generated material and prop libraries. The native
game still owns its routes, tower footprints, combat, UI and camera. Environment
art is orthographic, viewed about 60 degrees above the ground, with upper-left
lighting. Small props are transparent 256 × 256 PNGs; ground and path modules are
128 × 128. The shared visual material unit is 16 world units; the 60-unit road,
free placement and all logical collision sizes remain unchanged.

## Playable chapter identities

| Chapter | Materials and silhouette language | Landmarks | Distant world |
| --- | --- | --- | --- |
| Emberfall Expanse | Obsidian shards, columnar basalt, cooled ash; orange magma, crimson atmosphere, volcanic gold | Geothermal reactor, mining drill, turbine, excavator relic, fractured alien shrine | Molten planetary mountains and broken geothermal architecture |
| Nebula Frontier | Porous moonstone, spiral and radial crystals; indigo, cyan, restrained violet | Star observatory, astrolabe, orbital lens, gravity anchor, celestial portal | Deep nebula clouds and crystalline celestial matter |
| Frozen Reliquary | Shelves, icicles, snow-capped rock; glacier blue, white, frosted silver | Cryogenic chamber, frozen temple, ice observatory, cryo antenna | Glaciers, frozen moon horizon and cold ruins |
| Astral Ruins | Weathered sandstone, carved capitals and broken columns; antique gold, bronze, ivory, turquoise | Solar observatory, armillary sanctuary, alien gateway, colonnade | Monumental celestial temples in a golden atmosphere |
| Shattered Belt | Cratered meteorite, nickel spires, corroded plating; rust, copper, amber, charcoal | Derelict factory, salvage crane, breached habitat, mining tower | Asteroids and abandoned industrial structures |

Each library contains 12 ground modules, 8 road pieces plus one road material,
12 rocks/obstacles, 8 structures, 5 floating islands, 8 small decorations, 3
atmospheric cutouts, one horizon and one modular cliff-frame composition: 59
resources. The cliff composition reuses the chapter's own rock silhouettes; it
is not an additional set of hand-sculpted rocks. The environment manifest names
every actual file and its intended purpose. These are initial libraries, below
the suggested decoration and atmospheric variety targets in the master prompt.

Ground boundaries include edge, outer and inner corners. Other terrain roles
include material transition, obstacle-adjacent soil, inlay, broken material,
dust/ash, and special detail. Paths include straight, curve, corner,
intersection, transition, spawn, finish and endcap. Intersections are library
pieces for future maps; the existing five routes do not gain intersections.

The active game uses repeated native terrain, restrained material patches, a
road compiled from the exact shared centerline and material, individually
selected obstacle sprites, background islands, small decorations and distant
atmosphere. It does not flatten the battlefield into a background painting.
Road module assets are individually available in GDevelop; the current route
remains a continuous generated composite to keep art, collision and movement
aligned. Do not pretend every library piece is placed in every mission.

## Chapter 6 — The Void Dominion — PLANNED

Use near-black dark matter, graphite surfaces and negative-space architecture.
Choose black/blue, desaturated bone and tightly confined corrupted green-cyan
energy; avoid simply making Nebula darker. Ground is compressed dark-matter
strata with quiet ripples, and paths are pale fractured containment channels.
Rocks have impossible concavities, suspended rings and split gravity cores.
Structures include a collapsed containment vault, inversion gate, dark-matter
foundry, suspended obelisk array, corrupted celestial engine and broken gravity
anchors. Islands are hollow crescents, imploded shells and tethered fragments.
Decorations include containment shards, sparse corrupted filaments and floating
singularities. Atmosphere uses distant black megastructures silhouetted against
a weak cold rim, never a uniformly purple sky. Reserve bright effects for
recognizable enemy threats; decorative corruption must not resemble a hazard.

Build the same 12 terrain roles and 8 route roles before populating a real map.
Target 12 distinct obstacle silhouettes, 8 landmarks, 5 island silhouettes,
12 decorations and 4 restrained effects. Keep the 60-unit road as the starting
proposal; new routes, obstacle placements, missions and natural combat tests are
required before releasing or unlocking this chapter. No Chapter 6 assets have
been generated in this task.

## Chapter 7 — The Astral Deep — PLANNED

Use deep teal cosmic oceans, pale aqua bioluminescence, petrol blue shadows and
small coral/pearl accents. Give the world soft marine forms that differ from
Nebula's angular crystals. Ground is wet mineral shelf, quiet abyssal sediment,
mother-of-pearl plating and fossilized coral. Paths are pale pressure-sealed
causeways; their outline remains readable under restrained underwater haze.
Obstacles include shell arches, coral fans, pressure-ridged stone, fossil tubes,
pearl geodes and armored vent stacks. Landmarks include a submerged alien
observatory, tidal engine, pressure temple, broken bathyal station, acoustic
array and bioluminescent sanctuary. Islands have reef crowns and long mineral
undersides. Use sea grasses, small luminous polyps and vent bubbles as scenery.
Large celestial sea creatures belong far behind the battlefield, never over
enemy silhouettes or placement outlines. Keep light shafts static or low cost.

Prepare 12 terrain roles, 8 route roles, 12 obstacles, 8 structures, 5 islands,
12 decorations and 4 effects. All water imagery is presentation until a separate
gameplay design explicitly authorizes water placement rules. Routes, missions,
collision and progression are not implemented; no Chapter 7 assets were made.

## Chapter 8 — The Celestial Core — PLANNED

Use immense stellar architecture, warm white light, antique solar gold and deep
navy eclipse shadows. This world uses monumental radial and orbital forms;
avoid copying Astral Ruins' broken sandstone civilization. Ground materials are
solar ceramic, dense stellar metal and etched white-gold containment plates.
Paths are cooler pale-gold conduits, separated from bright stellar energy by a
dark readable border. Obstacles include solar fins, star-forged columns,
collapsed orbital ribs, radiant containment stones and eclipsed crystal cores.
Structures include a stellar regulator, colossal armillary engine, solar gate,
broken coronagraph, orbital cathedral and suspended fusion-heart machinery.
Islands are architectural crown fragments and orbital platforms with contained
stellar undersides. Decorations use tiny corona sparks, engraved constellations
and cold maintenance lights. Keep bloom under control; white enemies, damage
numbers, HP bars and placement circles must remain visible.

Prepare the same modular roles and initial silhouette targets. Build and test a
real final-chapter route, all missions and its boss before setting IMPLEMENTED.
No Chapter 8 assets, routes, missions or unlocks have been created here.

## Production requirements

Final props use alpha-zero padding and consistent centered image origins. Art
assigned to an existing blocker is scaled using its measured opaque radius so
its visible silhouette fits inside the original blocked circle. Decorative
sprites and atmosphere never enter the blocker list. Directional art is not
randomly rotated. Generated sheet resolution limits fine detail; do not call
these native 4K individually rendered props. Alpha normalization and crop QA
are part of asset integration, and close human inspection remains appropriate.

Generated art came from the built-in image tool. Its prompts specified the row
and cell contents recorded in `tools/build-environment-library.py`, along with
chapter palettes, upper-left lighting, a 60-degree camera, transparent cutouts,
no UI/enemies/towers and no copied artwork. `tools/environment-library.json`
records original sheet hashes and actual final resources. Original sheets are
external generation inputs, not backup copies of project assets. Regenerate or
provide those inputs to rebuild separated PNGs; normal map builds use the
already integrated library and need no generation service.
