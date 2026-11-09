"""Original crystalline and nebula SFX, synthesized directly to short WAV files."""

import hashlib
import wave

import numpy as np


SAMPLE_RATE = 44100

# Each family has a modal root, a unique overtone set and a filtered air band.
VOICES = {
    "VenomCataclysm": (131, (1, 1.497, 2.019, 2.674), 1270),
    "PlaguebreakerCannon": (98, (1, 1.887, 2.551, 3.183), 1960),
    "SupernovaObliterator": (65.4, (1, 1.506, 2.004, 2.995), 1330),
    "ToxicConstellation": (392, (1, 1.253, 1.505, 2.029), 2390),
    "MeteorStormArray": (174, (1, 1.676, 2.352, 3.126), 1775),
    "Shared": (196, (1, 1.498, 2.006, 2.498), 1770),
}

# Asset stem, voice, seconds, intended cue. Timing here is presentation only.
CUES = {
    "VenomCataclysm": [
        ("petal_launch", "fire", .31, "Normal seed launch"),
        ("seed_release", "release", .15, "Petal release accent"),
        ("seed_flight", "flight", .34, "Seed passing cue"),
        ("venom_seed_impact", "hit", .30, "Venom seed impact"),
        ("cataclysm_seed_burst", "burst", .68, "Cataclysm seed explosion"),
        ("flower_core_charge", "charge", .62, "Flower heart gathers energy"),
        ("spore_sizzle", "spores", .59, "Short shared zone activation cue"),
        ("toxic_collapse", "collapse", .70, "E3 contraction and release"),
        ("venom_ascension", "ascend", .61, "E2 or E3 upgrade"),
        ("venom_materialization", "arrive", .76, "Pure Nebula ascension"),
    ],
    "PlaguebreakerCannon": [
        ("stellar_lance_fire", "fire", .28, "Focused stellar lance discharge"),
        ("lance_release", "release", .13, "Crystal lance release accent"),
        ("plaguebolt_flight", "flight", .24, "Plaguebreaker bolt pass"),
        ("poison_hit", "hit", .23, "Direct contact"),
        ("spore_infusion", "spores", .31, "Poison application"),
        ("stellar_charge", "charge", .48, "Lance draws violet energy"),
        ("corrupted_stellar_burst", "burst", .52, "Corrupted impact"),
        ("venom_detonation", "collapse", .60, "Venom detonation"),
        ("plague_ascension", "ascend", .57, "E2 or E3 upgrade"),
        ("plague_materialization", "arrive", .66, "Hybrid convergence"),
    ],
    "SupernovaObliterator": [
        ("supernova_discharge", "fire", .44, "Heavy flower-lens discharge"),
        ("stellar_core_release", "release", .17, "Core release accent"),
        ("compressed_core_flight", "flight", .39, "Bright stellar projectile pass"),
        ("core_impact", "hit", .36, "Compressed core impact"),
        ("supernova_explosion", "burst", .81, "Large celestial explosion"),
        ("reactor_bloom_charge", "charge", .73, "Reactor bloom"),
        ("secondary_shockwave", "wave", .41, "E2 secondary wave"),
        ("supernova_chain", "special", .57, "E3 chain start"),
        ("supernova_ascension", "ascend", .65, "E2 or E3 upgrade"),
        ("supernova_materialization", "arrive", .80, "Hybrid convergence"),
    ],
    "ToxicConstellation": [
        ("toxic_shard_a", "fire", .102, "First seed emitter"),
        ("toxic_shard_b", "fire", .114, "Alternate seed emitter"),
        ("light_seed_release", "release", .105, "Light seed release accent"),
        ("constellation_seed_flight", "flight", .23, "Special seed pass"),
        ("small_toxic_impact", "hit", .19, "Small seed impact"),
        ("constellation_charge", "charge", .26, "Seed links energize"),
        ("spore_scatter", "spores", .30, "Zone forms"),
        ("toxic_network", "special", .49, "E3 network ignition"),
        ("constellation_ascension", "ascend", .52, "E2 or E3 upgrade"),
        ("constellation_materialization", "arrive", .62, "Hybrid convergence"),
    ],
    "MeteorStormArray": [
        ("meteor_seed_a", "fire", .117, "First emitter salvo"),
        ("meteor_seed_b", "fire", .133, "Alternate emitter salvo"),
        ("meteor_seed_c", "fire", .124, "Third emitter salvo"),
        ("meteor_seed_release", "release", .13, "Meteor seed release accent"),
        ("meteor_flight", "flight", .27, "Warm seed pass"),
        ("meteor_fragment_hit", "hit", .23, "Small meteor impact"),
        ("cluster_split", "split", .24, "Cluster seed divides"),
        ("celestial_bloom_impact", "burst", .53, "Cluster bloom impact"),
        ("meteor_reactor_charge", "charge", .29, "Bloom ammunition forms"),
        ("meteor_rain_activation", "special", .61, "E3 meteor rain"),
        ("meteor_ascension", "ascend", .58, "E2 or E3 upgrade"),
        ("meteor_materialization", "arrive", .73, "Hybrid convergence"),
    ],
    "Shared": [("fusion_complete", "arrive", .72, "Shared final fusion confirmation")],
}


def synthesize(id, name, role, duration):
    frequency, modes, air_frequency = VOICES[id]
    seed = int.from_bytes(hashlib.sha256(f"{id}/{name}".encode()).digest()[:8], "big")
    rng = np.random.default_rng(seed)
    frequency *= rng.uniform(.955, 1.05)
    time = np.arange(round(SAMPLE_RATE*duration)) / SAMPLE_RATE
    output = np.zeros(len(time))

    def note(at, start, end, decay, gain, attack=.005, ratios=modes):
        age = np.maximum(0, time-at)
        bend = decay*.48 + .008
        phase = 2*np.pi*(end*age + (start-end)*bend*(-np.expm1(-age/bend)))
        envelope = (1-np.exp(-age/attack)) * np.exp(-age/decay)
        for index, ratio in enumerate(ratios):
            drift = .008 * np.sin(age*19 + index)
            output[:] += gain * (.37**index) * envelope * np.sin(phase*ratio + drift)

    def air(at, center, decay, gain, flutter=0):
        age = np.maximum(0, time-at)
        bins = np.fft.rfftfreq(len(time), 1/SAMPLE_RATE)
        field = np.fft.rfft(rng.normal(0, 1, len(time)))
        field *= np.exp(-.5*((bins-center)/(center*.36+90))**2)
        signal = np.fft.irfft(field, n=len(time))
        signal /= max(.001, np.std(signal))
        envelope = (1-np.exp(-age/.011)) * np.exp(-age/decay)
        if flutter:
            envelope *= .70 + .30*np.cos(age*2*np.pi*flutter)
        output[:] += gain * signal * envelope

    if role in ("fire", "release"):
        note(.002, frequency*3.2, frequency*.91, duration*.22, .64)
        note(.011, frequency*4.12, frequency*2.79, duration*.24, .32)
        air(.004, air_frequency*1.23, duration*.20, .14, 17)
        if id == "MeteorStormArray":
            note(.024, frequency*6.0, frequency*3.7, .022, .17)
    elif role == "flight":
        note(.006, frequency*6.7, frequency*2.2, duration*.36, .42, .023)
        air(.013, air_frequency*1.54, duration*.32, .17, 24)
    elif role in ("hit", "burst", "wave"):
        note(.002, frequency*2.2, frequency*.62, duration*.25, .63)
        air(.005, air_frequency*.84, duration*.28, .21)
        for index, interval in enumerate((3, 3.747, 4.501, 6.019) if role != "hit" else (3, 4.501)):
            start = .012 + duration*.091*index
            note(start, frequency*interval*1.065, frequency*interval, duration*.23, .26/(1+index*.28))
        if role == "wave":
            note(duration*.16, frequency*1.81, frequency*.54, duration*.26, .27, .013)
    elif role == "charge":
        for index, ratio in enumerate((1.7, 2.44, 3.13, 4.07)):
            start = index * duration*.15
            note(start, frequency*ratio*.72, frequency*ratio*1.12, duration*.51, .20, duration*.10)
        air(.019, air_frequency*.97, duration*.61, .09, 17)
    elif role in ("spores", "split"):
        count = 7 if role == "spores" else 3
        for index in range(count):
            at = duration * (.06 + .58*index/count)
            n = frequency * rng.uniform(3.1, 5.6)
            note(at, n*1.19, n, duration*.16, .23, .009)
            air(at, air_frequency*(1+index*.09), duration*.09, .075, 32)
    elif role == "collapse":
        note(.011, frequency*.64, frequency*2.72, duration*.28, .39, duration*.06)
        air(.04, air_frequency*.77, duration*.24, .13, 23)
        note(duration*.35, frequency*2.31, frequency*.65, duration*.23, .61, .006)
        note(duration*.39, frequency*6.16, frequency*4.62, duration*.19, .32, .009)
        note(duration*.54, frequency*3.75, frequency*2.5, duration*.15, .22)
    else:
        phrase = {
            "ascend": (2, 2.5, 3, 4.01),
            "arrive": (1.5, 2, 3, 4, 5.01),
            "special": (2, 3.18, 2.5, 4.2),
        }[role]
        note(.007, frequency*1.84, frequency*.89, duration*.33, .35, .023)
        for index, ratio in enumerate(phrase):
            note(.022+duration*.104*index, frequency*ratio*1.04, frequency*ratio, duration*.26, .25-index*.027)
        air(.035, air_frequency*1.4, duration*.29, .085, 12)

    dry = output.copy()
    for delay, gain in ((.025,.095), (.053,.068), (.091,.038)):
        samples = round(SAMPLE_RATE * delay)
        if samples < len(output):
            output[samples:] += gain*dry[:-samples]
    output -= output.mean()
    output = np.tanh(output / max(.001, np.max(np.abs(output))) * 1.2)
    rapid = id in ("ToxicConstellation", "MeteorStormArray") and role in ("fire", "release")
    quiet = role in ("flight", "spores", "release")
    peak = .36 if rapid else .46 if quiet else .73 if role in ("burst","collapse") else .58
    output *= peak / max(.001,np.max(np.abs(output)))
    start = min(round(SAMPLE_RATE*.006), len(output)//8)
    stop = min(round(SAMPLE_RATE*.049), len(output)//3)
    output[:start] *= np.sin(np.linspace(0,np.pi/2,start))**2
    output[-stop:] *= np.cos(np.linspace(0,np.pi/2,stop))**2
    return output, rapid, quiet


def build_audio(pack, spec, root):
    folders = {item["id"]: item["folder"] for item in spec["towers"]}
    folders["Shared"] = "shared"
    for id, cues in CUES.items():
        folder = root / folders[id] / "audio"
        folder.mkdir(parents=True, exist_ok=True)
        record = pack.data["shared"] if id == "Shared" else pack.data["towers"][id]
        record["audio"] = []
        for name, role, seconds, purpose in cues:
            path = folder / f"{name}.wav"
            sound, rapid, quiet = synthesize(id, name, role, seconds)
            data = np.round(sound*32767).astype("<i2")
            with wave.open(str(path), "wb") as output:
                output.setparams((1,2,SAMPLE_RATE,len(data),"NONE","PCM"))
                output.writeframes(data.tobytes())
            filename = pack.record(path,id,"audio",tier="All",sfxName=name,purpose=purpose,
                                   durationSeconds=round(len(data)/SAMPLE_RATE,5),
                                   sampleRate=SAMPLE_RATE,channels=1,encoding="PCM signed 16-bit",loop=False,
                                   peakDbFS=round(float(20*np.log10(np.max(np.abs(sound)))),2),
                                   rmsDbFS=round(float(20*np.log10(np.sqrt(np.mean(sound**2)))),2),
                                   recommendedGain=.36 if rapid else .29 if quiet else .58,
                                   maxSimultaneousVoices=1 if rapid or quiet or role in ("arrive","special") else 2,
                                   minimumRepeatSeconds=1.1 if role=="spores" else .12 if rapid else .24,
                                   mixNote="Share one cue across nearby zones" if role=="spores" else
                                   "Alternate with the fire cue" if role=="release" else
                                   "Trigger once per event or salvo")
            record["audio"].append(filename)
        print(f"{id}: {len(cues)} original WAV cues", flush=True)
