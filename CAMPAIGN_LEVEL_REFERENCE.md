# Galactic Campaign — Level & Wave Reference

Source of truth: `tools/campaign-config.json`. Register edits with `python tools/build-campaign.py`, then `python tools/embed-free-placement.py`. No tower statistics or recipes are changed by the campaign.

Gold is per run. Kill income below includes the boss reward and its conditional reinforcement group; it is an upper bound if the boss dies before that group is triggered. Wave-completion gifts remain0. No tutorial adds free Gold.

| Mission | Name | Start Gold | Lives | Waves | Potential kill Gold | Boss |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1-1 | First Contact | 600 | 20 | 5 | 290 | - |
| 1-2 | Drifting Signals | 675 | 20 | 5 | 378 | - |
| 1-3 | Astral Crossing | 750 | 20 | 6 | 569 | - |
| 1-4 | Frontier Watch | 825 | 20 | 6 | 683 | - |
| 1-5 | The Rift Devourer | 900 | 20 | 7 | 1255 | Yes |
| 2-1 | Violet Passage | 1200 | 18 | 6 | 920 | - |
| 2-2 | Dust Runners | 1350 | 18 | 7 | 1298 | - |
| 2-3 | Veil of Stone | 1500 | 18 | 7 | 1466 | - |
| 2-4 | Nebula Vigil | 1650 | 18 | 8 | 1888 | - |
| 2-5 | The Nebula Warden | 1800 | 18 | 8 | 2470 | Yes |
| 3-1 | Forgotten Beacon | 2100 | 16 | 7 | 1718 | - |
| 3-2 | Temple Approach | 2300 | 16 | 8 | 2306 | - |
| 3-3 | Ancient Procession | 2500 | 16 | 8 | 2524 | - |
| 3-4 | Sanctum Siege | 2700 | 16 | 9 | 3231 | - |
| 3-5 | The Astral Colossus | 2900 | 16 | 9 | 4209 | Yes |
| 4-1 | Falling Light | 3300 | 14 | 8 | 3075 | - |
| 4-2 | Gravity Wake | 3600 | 14 | 9 | 3843 | - |
| 4-3 | Shadow Convergence | 3900 | 14 | 9 | 4263 | - |
| 4-4 | Last Horizon | 4200 | 14 | 10 | 5284 | - |
| 4-5 | The Void Sovereign | 4500 | 14 | 10 | 6691 | Yes |
| 5-1 | Celestial Fracture | 9000 | 12 | 9 | 5796 | - |
| 5-2 | Convergent Stars | 11000 | 12 | 10 | 7037 | - |
| 5-3 | Entropy Rising | 13000 | 12 | 10 | 7599 | - |
| 5-4 | Bastion of Light | 15500 | 12 | 11 | 8902 | - |
| 5-5 | The Entropy Architect | 18000 | 12 | 12 | 12317 | Yes |

## Chapter 1 — Stellar Frontier

The edge of known space. Establish your first line of defense.

Opening:2Star Cannons cost600; the guided run places one, then demonstrates an existing160Gold upgrade.

Boss: **The Rift Devourer**. HP1200, armor5, speed36, kill reward250. Cast start-to-start cooldown14s; the native0.8s stationary cast/release at0.6s and Fortification armor buff are reused.

Rift pulse: a telegraphed pause before fortification. Keep firing.

Temporary percent defense: 0% for0s after release. Surge: ×1 for4s. One half-health reinforcement group: none. The boss must be killed before reaching Finish.

### 1-1 — First Contact

Starting Gold600; Lives20; intermission5s in Auto mode; 5waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×6 | 1.5 | 0.85 | 0.9 | 30 | - |
| 2 | Basic ×10 | 1.475 | 0.87 | 0.9 | 50 | - |
| 3 | Basic ×12 | 1.45 | 0.89 | 0.9 | 60 | - |
| 4 | Basic ×14 | 1.425 | 0.91 | 0.9 | 70 | - |
| 5 | Basic ×16 | 1.4 | 0.93 | 0.9 | 80 | - |

### 1-2 — Drifting Signals

Starting Gold675; Lives20; intermission5s in Auto mode; 5waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×9, VoidHound ×1 | 1.475 | 0.875 | 0.908 | 52 | - |
| 2 | VoidHound ×3, Basic ×9 | 1.45 | 0.895 | 0.908 | 66 | - |
| 3 | Basic ×11, VoidHound ×3 | 1.425 | 0.915 | 0.908 | 76 | - |
| 4 | Basic ×14, VoidHound ×2 | 1.4 | 0.935 | 0.908 | 84 | - |
| 5 | VoidHound ×5, Basic ×13 | 1.375 | 0.955 | 0.908 | 100 | - |

### 1-3 — Astral Crossing

Starting Gold750; Lives20; intermission5s in Auto mode; 6waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×8, VoidSentinel ×1, VoidHound ×3 | 1.45 | 0.9 | 0.916 | 67 | - |
| 2 | Basic ×8, VoidSentinel ×4, VoidHound ×2 | 1.425 | 0.92 | 0.916 | 78 | - |
| 3 | VoidSentinel ×6, Basic ×9, VoidHound ×1 | 1.4 | 0.94 | 0.916 | 88 | - |
| 4 | VoidSentinel ×5, Basic ×9, VoidHound ×4 | 1.375 | 0.96 | 0.916 | 103 | - |
| 5 | Basic ×11, VoidHound ×4, VoidSentinel ×5 | 1.35 | 0.98 | 0.916 | 113 | - |
| 6 | Basic ×15, VoidHound ×3, VoidSentinel ×4 | 1.325 | 1.0 | 0.916 | 120 | - |

### 1-4 — Frontier Watch

Starting Gold825; Lives20; intermission5s in Auto mode; 6waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×7, VoidSentinel ×4, VoidGuard ×2, VoidHound ×1 | 1.425 | 0.925 | 0.924 | 82 | - |
| 2 | VoidHound ×4, VoidGuard ×3, Basic ×2, VoidSentinel ×7 | 1.4 | 0.945 | 0.924 | 104 | - |
| 3 | Basic ×13, VoidGuard ×1, VoidSentinel ×3, VoidHound ×1 | 1.375 | 0.965 | 0.924 | 98 | - |
| 4 | VoidHound ×3, VoidGuard ×3, Basic ×10, VoidSentinel ×4 | 1.35 | 0.985 | 0.924 | 119 | - |
| 5 | VoidHound ×6, VoidSentinel ×7, Basic ×9 | 1.325 | 1.005 | 0.924 | 129 | - |
| 6 | VoidGuard ×6, VoidHound ×5, Basic ×10, VoidSentinel ×3 | 1.3 | 1.025 | 0.924 | 151 | - |

### 1-5 — The Rift Devourer

Starting Gold900; Lives20; intermission5s in Auto mode; 7waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidGuard ×3, VoidSentinel ×4, Basic ×7, VoidBrute ×2 | 1.4 | 0.95 | 0.932 | 103 | - |
| 2 | VoidBrute ×3, Basic ×9, VoidGuard ×2, VoidSentinel ×3, VoidHound ×1 | 1.375 | 0.97 | 0.932 | 116 | - |
| 3 | VoidHound ×3, VoidSentinel ×3, VoidBrute ×2, Basic ×10, VoidGuard ×2 | 1.35 | 0.99 | 0.932 | 125 | - |
| 4 | Basic ×9, VoidGuard ×3, VoidBrute ×3, VoidHound ×2, VoidSentinel ×5 | 1.325 | 1.01 | 0.932 | 143 | - |
| 5 | VoidHound ×3, VoidBrute ×4, VoidSentinel ×7, Basic ×8, VoidGuard ×2 | 1.3 | 1.03 | 0.932 | 159 | - |
| 6 | VoidGuard ×5, Basic ×11, VoidHound ×4, VoidBrute ×2, VoidSentinel ×4 | 1.275 | 1.05 | 0.932 | 167 | - |
| 7 | VoidGuard ×4, VoidBrute ×4, VoidHound ×6, Basic ×6, VoidSentinel ×8 | 1.25 | 1.07 | 0.932 | 442 | The Rift Devourer |

## Chapter 2 — Nebula Expanse

Read the currents. Adapt to fast and shielded enemy formations.

Establish several firing positions, then use damage or speed upgrades against mixed groups.

Boss: **The Nebula Warden**. HP3600, armor10, speed39, kill reward450. Cast start-to-start cooldown12s; the native0.8s stationary cast/release at0.6s and Fortification armor buff are reused.

Nebula shield: a brief, visible defense after each cast.

Temporary percent defense: 18% for4s after release. Surge: ×1 for4s. One half-health reinforcement group: none. The boss must be killed before reaching Finish.

### 2-1 — Violet Passage

Starting Gold1200; Lives18; intermission5s in Auto mode; 6waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidSentinel ×1, Basic ×8, VoidBrute ×3, VoidGuard ×4 | 1.15 | 1.0 | 0.95 | 108 | - |
| 2 | VoidSentinel ×5, VoidHound ×2, Basic ×7, VoidBrute ×3, VoidGuard ×2 | 1.125 | 1.02 | 0.95 | 125 | - |
| 3 | Basic ×12, VoidSentinel ×4, VoidHound ×3, VoidGuard ×3 | 1.1 | 1.04 | 0.95 | 129 | - |
| 4 | VoidGuard ×6, Basic ×10, VoidSentinel ×3, VoidHound ×3, VoidBrute ×3 | 1.075 | 1.06 | 0.95 | 167 | - |
| 5 | Basic ×13, VoidGuard ×6, VoidHound ×4, VoidBrute ×2, VoidSentinel ×3 | 1.05 | 1.08 | 0.95 | 179 | - |
| 6 | Basic ×11, VoidSentinel ×3, VoidHound ×7, VoidBrute ×5, VoidGuard ×5 | 1.025 | 1.1 | 0.95 | 212 | - |

### 2-2 — Dust Runners

Starting Gold1350; Lives18; intermission5s in Auto mode; 7waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidBrute ×4, Basic ×10, VoidSentinel ×3, VoidGuard ×1, VoidHound ×1 | 1.125 | 1.025 | 0.958 | 123 | - |
| 2 | VoidGuard ×6, Basic ×5, VoidSentinel ×6, VoidBrute ×2, VoidHound ×3 | 1.1 | 1.045 | 0.958 | 150 | - |
| 3 | VoidBrute ×5, VoidSentinel ×3, Basic ×11, VoidHound ×3, VoidGuard ×3 | 1.075 | 1.065 | 0.958 | 168 | - |
| 4 | VoidGuard ×2, VoidBrute ×5, Basic ×11, VoidHound ×8, VoidSentinel ×2 | 1.05 | 1.085 | 0.958 | 189 | - |
| 5 | Basic ×14, VoidSentinel ×3, VoidBrute ×6, VoidHound ×5, VoidGuard ×3 | 1.025 | 1.105 | 0.958 | 207 | - |
| 6 | VoidHound ×4, VoidGuard ×6, VoidSentinel ×8, Basic ×14, VoidBrute ×2 | 1.0 | 1.125 | 0.958 | 214 | - |
| 7 | VoidSentinel ×3, Basic ×15, VoidGuard ×6, VoidBrute ×5, VoidHound ×8 | 0.975 | 1.145 | 0.958 | 247 | - |

### 2-3 — Veil of Stone

Starting Gold1500; Lives18; intermission5s in Auto mode; 7waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidHound ×5, VoidBrute ×3, Basic ×6, VoidGuard ×3, VoidSentinel ×5 | 1.1 | 1.05 | 0.966 | 149 | - |
| 2 | Basic ×12, VoidBrute ×4, VoidGuard ×3, VoidSentinel ×4, VoidHound ×2 | 1.075 | 1.07 | 0.966 | 162 | - |
| 3 | VoidHound ×3, VoidBrute ×2, Basic ×12, VoidGuard ×5, VoidSentinel ×6, VoidGolem ×1 | 1.05 | 1.09 | 0.966 | 197 | - |
| 4 | VoidHound ×6, VoidSentinel ×4, VoidBrute ×6, VoidGuard ×5, Basic ×10 | 1.025 | 1.11 | 0.966 | 216 | - |
| 5 | VoidSentinel ×6, Basic ×17, VoidGuard ×4, VoidBrute ×3, VoidHound ×4 | 1.0 | 1.13 | 0.966 | 211 | - |
| 6 | VoidSentinel ×7, VoidBrute ×4, VoidGuard ×4, Basic ×13, VoidHound ×9, VoidGolem ×1 | 0.975 | 1.15 | 0.966 | 262 | - |
| 7 | Basic ×16, VoidBrute ×6, VoidSentinel ×4, VoidHound ×7, VoidGuard ×7 | 0.95 | 1.17 | 0.966 | 269 | - |

### 2-4 — Nebula Vigil

Starting Gold1650; Lives18; intermission5s in Auto mode; 8waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidBrute ×3, VoidHound ×2, VoidGuard ×3, Basic ×13, VoidSentinel ×4 | 1.075 | 1.075 | 0.974 | 157 | - |
| 2 | Basic ×14, VoidHound ×6, VoidSentinel ×4, VoidBrute ×2, VoidGuard ×2 | 1.05 | 1.095 | 0.974 | 172 | - |
| 3 | Basic ×10, VoidBrute ×3, VoidGuard ×4, VoidSentinel ×8, VoidHound ×6, VoidGolem ×1 | 1.025 | 1.115 | 0.974 | 222 | - |
| 4 | Basic ×14, VoidSentinel ×8, VoidGuard ×8, VoidHound ×3, VoidBrute ×1 | 1.0 | 1.135 | 0.974 | 213 | - |
| 5 | Basic ×19, VoidBrute ×8, VoidGuard ×3, VoidSentinel ×6, VoidHound ×1 | 0.975 | 1.155 | 0.974 | 242 | - |
| 6 | Basic ×18, VoidSentinel ×7, VoidGuard ×6, VoidBrute ×4, VoidHound ×5, VoidGolem ×1 | 0.95 | 1.175 | 0.974 | 275 | - |
| 7 | Basic ×18, VoidGuard ×11, VoidSentinel ×6, VoidHound ×4, VoidBrute ×4 | 0.925 | 1.195 | 0.974 | 282 | - |
| 8 | VoidHound ×4, VoidGuard ×7, VoidBrute ×10, Basic ×9, VoidSentinel ×16 | 0.9 | 1.215 | 0.974 | 325 | - |

### 2-5 — The Nebula Warden

Starting Gold1800; Lives18; intermission5s in Auto mode; 8waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×12, VoidGuard ×3, VoidSentinel ×7, VoidBrute ×3, VoidHound ×3 | 1.05 | 1.1 | 0.982 | 177 | - |
| 2 | Basic ×15, VoidSentinel ×4, VoidHound ×5, VoidGuard ×4, VoidBrute ×3 | 1.025 | 1.12 | 0.982 | 196 | - |
| 3 | Basic ×16, VoidBrute ×6, VoidHound ×2, VoidSentinel ×8, VoidGuard ×2, VoidGolem ×1 | 1.0 | 1.14 | 0.982 | 238 | - |
| 4 | VoidBrute ×6, Basic ×10, VoidSentinel ×9, VoidHound ×5, VoidGuard ×7 | 0.975 | 1.16 | 0.982 | 255 | - |
| 5 | Basic ×18, VoidSentinel ×7, VoidGuard ×5, VoidHound ×8, VoidBrute ×2 | 0.95 | 1.18 | 0.982 | 248 | - |
| 6 | VoidSentinel ×10, VoidHound ×4, Basic ×18, VoidGuard ×5, VoidBrute ×6, VoidGolem ×1 | 0.925 | 1.2 | 0.982 | 298 | - |
| 7 | VoidBrute ×5, VoidHound ×11, Basic ×20, VoidSentinel ×8, VoidGuard ×2 | 0.9 | 1.22 | 0.982 | 291 | - |
| 8 | VoidHound ×6, Basic ×17, VoidSentinel ×15, VoidBrute ×6, VoidGuard ×5 | 0.875 | 1.24 | 0.982 | 767 | The Nebula Warden |

## Chapter 3 — Ancient Celestial Ruins

Awaken the ruins. Hold your ground against ancient constructs.

Use cross-lane coverage and Nova splash against armor/support formations.

Boss: **The Astral Colossus**. HP4400, armor15, speed37, kill reward750. Cast start-to-start cooldown11s; the native0.8s stationary cast/release at0.6s and Fortification armor buff are reused.

Ancient procession: reinforcements arrive once at half health.

Temporary percent defense: 0% for0s after release. Surge: ×1 for4s. One half-health reinforcement group: VoidGuard, VoidGuard, VoidGuard, VoidGuard. The boss must be killed before reaching Finish.

### 3-1 — Forgotten Beacon

Starting Gold2100; Lives16; intermission5s in Auto mode; 7waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidSentinel ×4, Basic ×13, VoidHound ×2, VoidGuard ×3, VoidBrute ×4 | 0.95 | 1.1 | 1.0 | 167 | - |
| 2 | Basic ×14, VoidGuard ×6, VoidSentinel ×5, VoidBrute ×2, VoidHound ×3 | 0.925 | 1.12 | 1.0 | 189 | - |
| 3 | Basic ×14, VoidGuard ×7, VoidSentinel ×7, VoidHound ×4, VoidBrute ×2 | 0.9 | 1.14 | 1.0 | 216 | - |
| 4 | VoidGuard ×9, VoidSentinel ×7, VoidBrute ×7, Basic ×12, VoidHound ×3 | 0.875 | 1.16 | 1.0 | 265 | - |
| 5 | VoidSentinel ×13, Basic ×17, VoidHound ×8, VoidBrute ×3, VoidGuard ×1 | 0.85 | 1.18 | 1.0 | 257 | - |
| 6 | VoidSentinel ×7, Basic ×24, VoidHound ×5, VoidGuard ×5, VoidBrute ×5 | 0.825 | 1.2 | 1.0 | 287 | - |
| 7 | Basic ×17, VoidBrute ×8, VoidHound ×8, VoidGuard ×7, VoidSentinel ×10 | 0.8 | 1.22 | 1.0 | 337 | - |

### 3-2 — Temple Approach

Starting Gold2300; Lives16; intermission5s in Auto mode; 8waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×16, VoidHound ×3, VoidBrute ×2, VoidSentinel ×7, VoidGuard ×2 | 0.925 | 1.125 | 1.008 | 179 | - |
| 2 | VoidSentinel ×10, Basic ×15, VoidGuard ×2, VoidHound ×3, VoidBrute ×4 | 0.9 | 1.145 | 1.008 | 212 | - |
| 3 | VoidHound ×7, Basic ×14, VoidGuard ×5, VoidBrute ×6, VoidSentinel ×6 | 0.875 | 1.165 | 1.008 | 255 | - |
| 4 | Basic ×15, VoidSentinel ×8, VoidBrute ×8, VoidGuard ×5, VoidHound ×6 | 0.85 | 1.185 | 1.008 | 285 | - |
| 5 | VoidGuard ×6, VoidBrute ×11, Basic ×22, VoidSentinel ×6, VoidHound ×1 | 0.825 | 1.205 | 1.008 | 311 | - |
| 6 | VoidBrute ×11, VoidHound ×7, VoidSentinel ×9, Basic ×17, VoidGuard ×6 | 0.8 | 1.225 | 1.008 | 346 | - |
| 7 | VoidSentinel ×7, Basic ×23, VoidBrute ×8, VoidHound ×11, VoidGuard ×5 | 0.775 | 1.245 | 1.008 | 354 | - |
| 8 | VoidBrute ×5, VoidHound ×13, VoidSentinel ×14, Basic ×23, VoidGuard ×3 | 0.75 | 1.265 | 1.008 | 364 | - |

### 3-3 — Ancient Procession

Starting Gold2500; Lives16; intermission5s in Auto mode; 8waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×20, VoidBrute ×3, VoidGuard ×2, VoidSentinel ×5, VoidHound ×4 | 0.9 | 1.15 | 1.016 | 204 | - |
| 2 | Basic ×14, VoidGuard ×6, VoidHound ×8, VoidSentinel ×7, VoidBrute ×3 | 0.875 | 1.17 | 1.016 | 246 | - |
| 3 | VoidSentinel ×11, Basic ×15, VoidHound ×9, VoidBrute ×5, VoidGuard ×2, VoidGolem ×1 | 0.85 | 1.19 | 1.016 | 290 | - |
| 4 | VoidHound ×9, VoidBrute ×5, Basic ×13, VoidGuard ×8, VoidSentinel ×11 | 0.825 | 1.21 | 1.016 | 308 | - |
| 5 | Basic ×18, VoidGuard ×14, VoidSentinel ×6, VoidBrute ×5, VoidHound ×7 | 0.8 | 1.23 | 1.016 | 337 | - |
| 6 | VoidBrute ×6, VoidHound ×7, Basic ×20, VoidGuard ×8, VoidSentinel ×13, VoidGolem ×1 | 0.775 | 1.25 | 1.016 | 371 | - |
| 7 | Basic ×26, VoidHound ×9, VoidGuard ×8, VoidSentinel ×10, VoidBrute ×5 | 0.75 | 1.27 | 1.016 | 367 | - |
| 8 | VoidBrute ×7, Basic ×26, VoidSentinel ×9, VoidGuard ×7, VoidHound ×13 | 0.725 | 1.29 | 1.016 | 401 | - |

### 3-4 — Sanctum Siege

Starting Gold2700; Lives16; intermission5s in Auto mode; 9waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidBrute ×5, VoidGuard ×8, Basic ×14, VoidSentinel ×9, VoidHound ×2 | 0.875 | 1.175 | 1.024 | 252 | - |
| 2 | VoidSentinel ×6, VoidHound ×5, Basic ×16, VoidGuard ×7, VoidBrute ×8 | 0.85 | 1.195 | 1.024 | 287 | - |
| 3 | VoidBrute ×5, Basic ×22, VoidHound ×9, VoidGuard ×7, VoidSentinel ×3, VoidGolem ×1 | 0.825 | 1.215 | 1.024 | 317 | - |
| 4 | VoidGuard ×6, Basic ×24, VoidBrute ×6, VoidSentinel ×9, VoidHound ×5 | 0.8 | 1.235 | 1.024 | 317 | - |
| 5 | VoidSentinel ×13, VoidGuard ×9, Basic ×22, VoidHound ×7, VoidBrute ×3 | 0.775 | 1.255 | 1.024 | 339 | - |
| 6 | VoidSentinel ×13, VoidBrute ×7, Basic ×24, VoidGuard ×9, VoidHound ×5, VoidGolem ×1 | 0.75 | 1.275 | 1.024 | 395 | - |
| 7 | VoidHound ×7, Basic ×25, VoidGuard ×7, VoidBrute ×7, VoidSentinel ×16 | 0.725 | 1.295 | 1.024 | 396 | - |
| 8 | VoidBrute ×14, VoidGuard ×5, VoidSentinel ×16, Basic ×25, VoidHound ×6 | 0.7 | 1.315 | 1.024 | 443 | - |
| 9 | Basic ×25, VoidGuard ×14, VoidSentinel ×13, VoidHound ×10, VoidBrute ×8, VoidGolem ×1 | 0.675 | 1.335 | 1.024 | 485 | - |

### 3-5 — The Astral Colossus

Starting Gold2900; Lives16; intermission5s in Auto mode; 9waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×17, VoidHound ×6, VoidSentinel ×8, VoidGuard ×5, VoidBrute ×6 | 0.85 | 1.2 | 1.032 | 275 | - |
| 2 | VoidHound ×7, Basic ×17, VoidSentinel ×10, VoidGuard ×6, VoidBrute ×6 | 0.825 | 1.22 | 1.032 | 302 | - |
| 3 | Basic ×24, VoidSentinel ×9, VoidHound ×4, VoidGuard ×4, VoidBrute ×9, VoidGolem ×1 | 0.8 | 1.24 | 1.032 | 344 | - |
| 4 | VoidSentinel ×11, Basic ×25, VoidBrute ×6, VoidHound ×2, VoidGuard ×10 | 0.775 | 1.26 | 1.032 | 345 | - |
| 5 | Basic ×29, VoidSentinel ×12, VoidGuard ×5, VoidHound ×8, VoidBrute ×4 | 0.75 | 1.28 | 1.032 | 353 | - |
| 6 | Basic ×23, VoidSentinel ×11, VoidBrute ×9, VoidGuard ×9, VoidHound ×10, VoidGolem ×1 | 0.725 | 1.3 | 1.032 | 433 | - |
| 7 | VoidSentinel ×17, VoidGuard ×9, Basic ×22, VoidHound ×13, VoidBrute ×5 | 0.7 | 1.32 | 1.032 | 425 | - |
| 8 | VoidSentinel ×19, Basic ×30, VoidBrute ×6, VoidGuard ×10, VoidHound ×5 | 0.675 | 1.34 | 1.032 | 439 | - |
| 9 | VoidHound ×15, Basic ×26, VoidBrute ×12, VoidGuard ×5, VoidSentinel ×16, VoidGolem ×1 | 0.65 | 1.36 | 1.032 | 1293 | The Astral Colossus |

## Chapter 4 — Event Horizon

Where light bends. Watch the Finish and prepare for pressure.

Prepare a developed tower network and consider higher upgrades before the boss wave.

Boss: **The Void Sovereign**. HP6500, armor18, speed41, kill reward1100. Cast start-to-start cooldown10s; the native0.8s stationary cast/release at0.6s and Fortification armor buff are reused.

Horizon surge: a telegraphed burst of speed after casting.

Temporary percent defense: 10% for3s after release. Surge: ×1.3 for4s. One half-health reinforcement group: VoidGuard, VoidGuard, VoidGuard, VoidGuard, VoidGuard, VoidHound, VoidHound, VoidHound, VoidHound, VoidHound. The boss must be killed before reaching Finish.

### 4-1 — Falling Light

Starting Gold3300; Lives14; intermission5s in Auto mode; 8waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×18, VoidSentinel ×8, VoidGuard ×4, VoidBrute ×7, VoidHound ×3 | 0.8 | 1.25 | 1.04 | 261 | - |
| 2 | VoidGuard ×8, Basic ×11, VoidBrute ×8, VoidHound ×10, VoidSentinel ×8 | 0.775 | 1.27 | 1.04 | 317 | - |
| 3 | Basic ×20, VoidGuard ×6, VoidHound ×8, VoidSentinel ×7, VoidBrute ×9 | 0.75 | 1.29 | 1.04 | 336 | - |
| 4 | Basic ×24, VoidSentinel ×4, VoidGuard ×5, VoidBrute ×14, VoidHound ×8 | 0.725 | 1.31 | 1.04 | 380 | - |
| 5 | VoidBrute ×12, Basic ×18, VoidHound ×13, VoidGuard ×7, VoidSentinel ×10 | 0.7 | 1.33 | 1.04 | 417 | - |
| 6 | VoidBrute ×6, Basic ×20, VoidSentinel ×19, VoidGuard ×12, VoidHound ×8 | 0.675 | 1.35 | 1.04 | 426 | - |
| 7 | VoidHound ×9, VoidGuard ×9, VoidSentinel ×12, VoidBrute ×8, Basic ×32 | 0.65 | 1.37 | 1.04 | 447 | - |
| 8 | Basic ×31, VoidBrute ×10, VoidSentinel ×13, VoidGuard ×11, VoidHound ×10 | 0.625 | 1.39 | 1.04 | 491 | - |

### 4-2 — Gravity Wake

Starting Gold3600; Lives14; intermission5s in Auto mode; 9waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidHound ×7, Basic ×21, VoidSentinel ×7, VoidGuard ×6, VoidBrute ×4 | 0.775 | 1.275 | 1.048 | 284 | - |
| 2 | VoidHound ×11, Basic ×20, VoidGuard ×5, VoidBrute ×10, VoidSentinel ×4 | 0.75 | 1.295 | 1.048 | 341 | - |
| 3 | Basic ×23, VoidBrute ×9, VoidGuard ×9, VoidSentinel ×12, VoidHound ×2 | 0.725 | 1.315 | 1.048 | 363 | - |
| 4 | VoidGuard ×10, Basic ×24, VoidSentinel ×9, VoidBrute ×11, VoidHound ×6 | 0.7 | 1.335 | 1.048 | 406 | - |
| 5 | VoidSentinel ×12, VoidHound ×10, Basic ×25, VoidBrute ×9, VoidGuard ×9 | 0.675 | 1.355 | 1.048 | 429 | - |
| 6 | VoidGuard ×10, Basic ×26, VoidHound ×11, VoidSentinel ×17, VoidBrute ×6 | 0.65 | 1.375 | 1.048 | 449 | - |
| 7 | VoidGuard ×14, Basic ×34, VoidSentinel ×11, VoidBrute ×8, VoidHound ×8 | 0.625 | 1.395 | 1.048 | 484 | - |
| 8 | VoidGuard ×13, VoidBrute ×14, Basic ×31, VoidSentinel ×16, VoidHound ×6 | 0.6 | 1.415 | 1.048 | 537 | - |
| 9 | Basic ×40, VoidHound ×12, VoidGuard ×14, VoidBrute ×10, VoidSentinel ×9 | 0.575 | 1.435 | 1.048 | 550 | - |

### 4-3 — Shadow Convergence

Starting Gold3900; Lives14; intermission5s in Auto mode; 9waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidHound ×5, VoidSentinel ×8, VoidBrute ×9, Basic ×21, VoidGuard ×7 | 0.75 | 1.3 | 1.056 | 334 | - |
| 2 | VoidSentinel ×10, VoidBrute ×9, VoidHound ×12, Basic ×19, VoidGuard ×5 | 0.725 | 1.32 | 1.056 | 369 | - |
| 3 | VoidSentinel ×18, VoidHound ×10, Basic ×14, VoidGuard ×11, VoidBrute ×7, VoidGolem ×2 | 0.7 | 1.34 | 1.056 | 446 | - |
| 4 | VoidHound ×10, Basic ×23, VoidGuard ×10, VoidSentinel ×12, VoidBrute ×10 | 0.675 | 1.36 | 1.056 | 437 | - |
| 5 | VoidSentinel ×16, VoidHound ×13, Basic ×27, VoidBrute ×8, VoidGuard ×6 | 0.65 | 1.38 | 1.056 | 450 | - |
| 6 | VoidGuard ×6, VoidSentinel ×18, Basic ×32, VoidBrute ×10, VoidHound ×9, VoidGolem ×2 | 0.625 | 1.4 | 1.056 | 519 | - |
| 7 | Basic ×38, VoidGuard ×10, VoidSentinel ×16, VoidBrute ×9, VoidHound ×7 | 0.6 | 1.42 | 1.056 | 505 | - |
| 8 | VoidHound ×19, VoidBrute ×12, Basic ×27, VoidSentinel ×17, VoidGuard ×10 | 0.575 | 1.44 | 1.056 | 570 | - |
| 9 | Basic ×34, VoidBrute ×12, VoidGuard ×13, VoidSentinel ×18, VoidHound ×13, VoidGolem ×2 | 0.55 | 1.46 | 1.056 | 633 | - |

### 4-4 — Last Horizon

Starting Gold4200; Lives14; intermission5s in Auto mode; 10waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×22, VoidHound ×6, VoidBrute ×14, VoidSentinel ×8, VoidGuard ×5 | 0.725 | 1.325 | 1.064 | 380 | - |
| 2 | VoidHound ×8, VoidGuard ×14, VoidSentinel ×13, Basic ×18, VoidBrute ×7 | 0.7 | 1.345 | 1.064 | 406 | - |
| 3 | Basic ×27, VoidSentinel ×13, VoidBrute ×5, VoidGuard ×11, VoidHound ×9, VoidGolem ×2 | 0.675 | 1.365 | 1.064 | 454 | - |
| 4 | VoidSentinel ×17, Basic ×24, VoidGuard ×10, VoidBrute ×10, VoidHound ×9 | 0.65 | 1.385 | 1.064 | 465 | - |
| 5 | VoidSentinel ×11, Basic ×28, VoidHound ×14, VoidGuard ×12, VoidBrute ×10 | 0.625 | 1.405 | 1.064 | 500 | - |
| 6 | VoidBrute ×12, VoidHound ×8, Basic ×30, VoidSentinel ×14, VoidGuard ×16, VoidGolem ×2 | 0.6 | 1.425 | 1.064 | 578 | - |
| 7 | VoidHound ×9, VoidGuard ×11, Basic ×38, VoidSentinel ×15, VoidBrute ×12 | 0.575 | 1.445 | 1.064 | 551 | - |
| 8 | Basic ×34, VoidGuard ×15, VoidSentinel ×13, VoidHound ×19, VoidBrute ×9 | 0.55 | 1.465 | 1.064 | 591 | - |
| 9 | Basic ×35, VoidGuard ×16, VoidSentinel ×18, VoidHound ×15, VoidBrute ×11, VoidGolem ×2 | 0.525 | 1.485 | 1.064 | 666 | - |
| 10 | Basic ×27, VoidSentinel ×21, VoidHound ×18, VoidGuard ×17, VoidBrute ×17 | 0.5 | 1.505 | 1.064 | 693 | - |

### 4-5 — The Void Sovereign

Starting Gold4500; Lives14; intermission5s in Auto mode; 10waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×26, VoidGuard ×9, VoidSentinel ×12, VoidBrute ×9, VoidHound ×4 | 0.7 | 1.35 | 1.072 | 392 | - |
| 2 | Basic ×28, VoidBrute ×9, VoidHound ×11, VoidSentinel ×9, VoidGuard ×8 | 0.675 | 1.37 | 1.072 | 425 | - |
| 3 | VoidSentinel ×18, Basic ×17, VoidGuard ×9, VoidBrute ×13, VoidHound ×13, VoidGolem ×2 | 0.65 | 1.39 | 1.072 | 526 | - |
| 4 | VoidSentinel ×16, VoidGuard ×14, VoidBrute ×11, VoidHound ×6, Basic ×28 | 0.625 | 1.41 | 1.072 | 500 | - |
| 5 | VoidHound ×12, Basic ×34, VoidSentinel ×19, VoidBrute ×9, VoidGuard ×6 | 0.6 | 1.43 | 1.072 | 506 | - |
| 6 | VoidSentinel ×21, Basic ×33, VoidHound ×8, VoidGuard ×11, VoidBrute ×12, VoidGolem ×2 | 0.575 | 1.45 | 1.072 | 595 | - |
| 7 | VoidBrute ×14, VoidHound ×10, VoidSentinel ×17, Basic ×38, VoidGuard ×11 | 0.55 | 1.47 | 1.072 | 590 | - |
| 8 | Basic ×41, VoidGuard ×10, VoidSentinel ×21, VoidBrute ×14, VoidHound ×9 | 0.525 | 1.49 | 1.072 | 614 | - |
| 9 | Basic ×38, VoidHound ×17, VoidSentinel ×15, VoidBrute ×15, VoidGuard ×15, VoidGolem ×2 | 0.5 | 1.51 | 1.072 | 709 | - |
| 10 | Basic ×48, VoidGuard ×13, VoidSentinel ×23, VoidBrute ×10, VoidHound ×11 | 0.475 | 1.53 | 1.072 | 1834 | The Void Sovereign |

## Chapter 5 — Cosmic Singularity

The final fracture. Unite every lesson against the heart of the Void.

Build a broad defense and use late upgrades/Fusion when the run economy supports them.

Boss: **The Entropy Architect**. HP9000, armor20, speed42, kill reward1800. Cast start-to-start cooldown9s; the native0.8s stationary cast/release at0.6s and Fortification armor buff are reused.

Entropy convergence: shields, surges and one final reinforcement group.

Temporary percent defense: 15% for4s after release. Surge: ×1.2 for4s. One half-health reinforcement group: VoidGuard, VoidGuard, VoidGuard, VoidGuard, VoidGuard, VoidGuard, VoidHound, VoidHound, VoidHound, VoidHound, VoidHound, VoidHound. The boss must be killed before reaching Finish.

### 5-1 — Celestial Fracture

Starting Gold9000; Lives12; intermission5s in Auto mode; 9waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidGuard ×7, Basic ×22, VoidBrute ×15, VoidHound ×8, VoidSentinel ×22 | 0.7 | 1.45 | 1.08 | 504 | - |
| 2 | VoidSentinel ×11, VoidHound ×8, Basic ×38, VoidBrute ×14, VoidGuard ×9 | 0.675 | 1.47 | 1.08 | 524 | - |
| 3 | Basic ×34, VoidSentinel ×23, VoidHound ×12, VoidGuard ×8, VoidBrute ×9 | 0.65 | 1.49 | 1.08 | 546 | - |
| 4 | VoidHound ×13, VoidBrute ×15, VoidSentinel ×18, Basic ×36, VoidGuard ×10 | 0.625 | 1.51 | 1.08 | 609 | - |
| 5 | VoidBrute ×15, VoidSentinel ×20, VoidHound ×11, Basic ×41, VoidGuard ×11 | 0.6 | 1.53 | 1.08 | 640 | - |
| 6 | VoidSentinel ×21, VoidGuard ×13, Basic ×36, VoidHound ×15, VoidBrute ×19 | 0.575 | 1.55 | 1.08 | 705 | - |
| 7 | VoidGuard ×22, VoidSentinel ×22, Basic ×35, VoidBrute ×16, VoidHound ×15 | 0.55 | 1.57 | 1.08 | 748 | - |
| 8 | VoidHound ×17, VoidBrute ×14, Basic ×48, VoidGuard ×13, VoidSentinel ×24 | 0.525 | 1.59 | 1.08 | 747 | - |
| 9 | VoidGuard ×19, VoidSentinel ×27, Basic ×53, VoidHound ×12, VoidBrute ×11 | 0.5 | 1.61 | 1.08 | 773 | - |

### 5-2 — Convergent Stars

Starting Gold11000; Lives12; intermission5s in Auto mode; 10waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidHound ×5, VoidSentinel ×17, Basic ×30, VoidBrute ×15, VoidGuard ×13 | 0.675 | 1.475 | 1.088 | 541 | - |
| 2 | VoidGuard ×13, VoidHound ×18, Basic ×26, VoidSentinel ×19, VoidBrute ×10 | 0.65 | 1.495 | 1.088 | 574 | - |
| 3 | Basic ×38, VoidGuard ×11, VoidBrute ×21, VoidSentinel ×16, VoidHound ×6 | 0.625 | 1.515 | 1.088 | 626 | - |
| 4 | VoidSentinel ×19, Basic ×38, VoidBrute ×19, VoidGuard ×12, VoidHound ×10 | 0.6 | 1.535 | 1.088 | 660 | - |
| 5 | VoidSentinel ×19, Basic ×43, VoidHound ×13, VoidBrute ×16, VoidGuard ×13 | 0.575 | 1.555 | 1.088 | 684 | - |
| 6 | VoidSentinel ×31, Basic ×45, VoidGuard ×11, VoidHound ×11, VoidBrute ×12 | 0.55 | 1.575 | 1.088 | 696 | - |
| 7 | VoidSentinel ×22, Basic ×51, VoidBrute ×13, VoidHound ×11, VoidGuard ×19 | 0.525 | 1.595 | 1.088 | 746 | - |
| 8 | Basic ×48, VoidSentinel ×22, VoidBrute ×17, VoidHound ×19, VoidGuard ×16 | 0.5 | 1.615 | 1.088 | 803 | - |
| 9 | VoidGuard ×21, VoidBrute ×18, Basic ×54, VoidSentinel ×19, VoidHound ×16 | 0.475 | 1.635 | 1.088 | 844 | - |
| 10 | VoidSentinel ×35, Basic ×47, VoidBrute ×12, VoidGuard ×18, VoidHound ×22 | 0.45 | 1.655 | 1.088 | 863 | - |

### 5-3 — Entropy Rising

Starting Gold13000; Lives12; intermission5s in Auto mode; 10waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidSentinel ×17, Basic ×30, VoidHound ×15, VoidGuard ×15, VoidBrute ×9 | 0.65 | 1.5 | 1.096 | 567 | - |
| 2 | VoidGuard ×6, Basic ×33, VoidBrute ×20, VoidSentinel ×17, VoidHound ×16 | 0.625 | 1.52 | 1.096 | 627 | - |
| 3 | VoidGuard ×17, Basic ×43, VoidSentinel ×17, VoidBrute ×11, VoidHound ×10, VoidGolem ×2 | 0.6 | 1.54 | 1.096 | 673 | - |
| 4 | Basic ×39, VoidGuard ×12, VoidBrute ×15, VoidSentinel ×24, VoidHound ×14 | 0.575 | 1.56 | 1.096 | 683 | - |
| 5 | Basic ×37, VoidBrute ×21, VoidSentinel ×18, VoidGuard ×19, VoidHound ×15 | 0.55 | 1.58 | 1.096 | 760 | - |
| 6 | VoidBrute ×17, Basic ×44, VoidSentinel ×25, VoidGuard ×11, VoidHound ×19, VoidGolem ×2 | 0.525 | 1.6 | 1.096 | 801 | - |
| 7 | VoidHound ×17, VoidGuard ×20, Basic ×41, VoidSentinel ×27, VoidBrute ×17 | 0.5 | 1.62 | 1.096 | 816 | - |
| 8 | Basic ×46, VoidHound ×23, VoidSentinel ×27, VoidGuard ×15, VoidBrute ×17 | 0.475 | 1.64 | 1.096 | 843 | - |
| 9 | Basic ×58, VoidHound ×14, VoidBrute ×17, VoidGuard ×18, VoidSentinel ×27, VoidGolem ×2 | 0.45 | 1.66 | 1.096 | 904 | - |
| 10 | VoidGuard ×22, Basic ×53, VoidSentinel ×25, VoidHound ×22, VoidBrute ×18 | 0.425 | 1.68 | 1.096 | 925 | - |

### 5-4 — Bastion of Light

Starting Gold15500; Lives12; intermission5s in Auto mode; 11waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | VoidGuard ×12, Basic ×31, VoidHound ×16, VoidBrute ×14, VoidSentinel ×19 | 0.625 | 1.525 | 1.104 | 617 | - |
| 2 | VoidGuard ×11, VoidHound ×16, VoidSentinel ×20, Basic ×41, VoidBrute ×10 | 0.6 | 1.545 | 1.104 | 625 | - |
| 3 | Basic ×37, VoidBrute ×20, VoidSentinel ×11, VoidHound ×16, VoidGuard ×20, VoidGolem ×2 | 0.575 | 1.565 | 1.104 | 763 | - |
| 4 | Basic ×36, VoidHound ×20, VoidSentinel ×26, VoidBrute ×15, VoidGuard ×13 | 0.55 | 1.585 | 1.104 | 730 | - |
| 5 | VoidSentinel ×27, VoidHound ×17, Basic ×44, VoidBrute ×13, VoidGuard ×15 | 0.525 | 1.605 | 1.104 | 751 | - |
| 6 | VoidSentinel ×20, Basic ×55, VoidBrute ×13, VoidHound ×18, VoidGuard ×16, VoidGolem ×2 | 0.5 | 1.625 | 1.104 | 819 | - |
| 7 | VoidBrute ×16, Basic ×57, VoidHound ×12, VoidSentinel ×26, VoidGuard ×17 | 0.475 | 1.645 | 1.104 | 821 | - |
| 8 | Basic ×61, VoidHound ×19, VoidGuard ×14, VoidSentinel ×21, VoidBrute ×19 | 0.45 | 1.665 | 1.104 | 866 | - |
| 9 | VoidSentinel ×30, Basic ×67, VoidBrute ×17, VoidGuard ×12, VoidHound ×14, VoidGolem ×2 | 0.425 | 1.685 | 1.104 | 919 | - |
| 10 | Basic ×56, VoidSentinel ×22, VoidGuard ×24, VoidBrute ×24, VoidHound ×20 | 0.4 | 1.705 | 1.104 | 984 | - |
| 11 | VoidHound ×19, Basic ×64, VoidSentinel ×28, VoidBrute ×29, VoidGuard ×12 | 0.38 | 1.725 | 1.104 | 1007 | - |

### 5-5 — The Entropy Architect

Starting Gold18000; Lives12; intermission5s in Auto mode; 12waves. Victory requires every configured wave cleared with Lives>0, plus the boss killed on boss missions.

| Wave | Regular enemies (type × count) | Interval s | HP × | Speed × | Potential kill Gold | Boss |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Basic ×41, VoidBrute ×10, VoidSentinel ×19, VoidGuard ×12, VoidHound ×16 | 0.6 | 1.55 | 1.112 | 627 | - |
| 2 | VoidSentinel ×16, VoidBrute ×17, Basic ×46, VoidHound ×10, VoidGuard ×15 | 0.575 | 1.57 | 1.112 | 686 | - |
| 3 | Basic ×45, VoidBrute ×13, VoidSentinel ×21, VoidHound ×16, VoidGuard ×15, VoidGolem ×2 | 0.55 | 1.59 | 1.112 | 753 | - |
| 4 | Basic ×47, VoidSentinel ×25, VoidGuard ×17, VoidHound ×12, VoidBrute ×15 | 0.525 | 1.61 | 1.112 | 755 | - |
| 5 | VoidSentinel ×28, Basic ×41, VoidHound ×18, VoidGuard ×21, VoidBrute ×14 | 0.5 | 1.63 | 1.112 | 807 | - |
| 6 | VoidSentinel ×28, VoidBrute ×19, Basic ×50, VoidGuard ×13, VoidHound ×18, VoidGolem ×2 | 0.475 | 1.65 | 1.112 | 878 | - |
| 7 | VoidHound ×16, VoidGuard ×21, Basic ×58, VoidBrute ×22, VoidSentinel ×17 | 0.45 | 1.67 | 1.112 | 892 | - |
| 8 | Basic ×56, VoidHound ×29, VoidGuard ×16, VoidSentinel ×22, VoidBrute ×17 | 0.425 | 1.69 | 1.112 | 913 | - |
| 9 | VoidSentinel ×33, VoidHound ×27, Basic ×50, VoidGuard ×20, VoidBrute ×16, VoidGolem ×2 | 0.4 | 1.71 | 1.112 | 997 | - |
| 10 | VoidGuard ×14, Basic ×60, VoidSentinel ×37, VoidHound ×21, VoidBrute ×20 | 0.38 | 1.73 | 1.112 | 981 | - |
| 11 | Basic ×63, VoidHound ×21, VoidSentinel ×36, VoidGuard ×20, VoidBrute ×18 | 0.38 | 1.75 | 1.112 | 1018 | - |
| 12 | Basic ×69, VoidBrute ×25, VoidGuard ×24, VoidSentinel ×29, VoidHound ×17, VoidGolem ×2 | 0.38 | 1.77 | 1.112 | 3010 | The Entropy Architect |

## Manual playtesting checklist

- Use a fresh isolated profile to exercise both introductions without clearing a player’s existing saves.
- Play missions1-1 and1-2 using both first-time and Skip flows; compare one upgraded opening tower against two unupgraded openings.
- Play every mission without fixture damage; record failed placements, escapes, remaining Lives, total spending, completion time and chosen upgrades.
- Test both upgrade paths,5-2/2-5 locking and Pure Fusion on later missions.
- Recheck armor/splash interaction and all boss ability telegraphs with a sparse defense and a developed defense.
- Test manual/auto,1×/2×, Tactical Fusion0.5×, Index opening, audio settings and desktop minimize/restore.
- Defeat, Restart, Return to Levels and replay a completed mission; verify no extra unlocks or erased progress.
- Reload the application and confirm completion/tutorial flags, original audio preferences and Fusion discoveries remain.

Automated integration tests cover all25mission contracts; they are not a human win-rate study. Full natural-combat coverage and boss-wave benchmark results are reported in `CAMPAIGN_REPORT.md`.
