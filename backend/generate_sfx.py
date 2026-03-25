"""
Generate synthesized sound effects for BibleQuest.
Produces WAV files since Python's built-in wave module suffices.
Run: python3 generate_sfx.py
"""
import wave
import struct
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static", "audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SAMPLE_RATE = 44100

def write_wav(filename, frames, rate=SAMPLE_RATE, channels=1, sampwidth=2):
    """Write raw frames to a .wav file."""
    path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(path, 'w') as f:
        f.setnchannels(channels)
        f.setsampwidth(sampwidth)
        f.setframerate(rate)
        f.writeframes(frames)
    size = os.path.getsize(path)
    print(f"  ✓ {filename}  ({size // 1024} KB)")
    return path

def tone(freq, duration, volume=0.5, rate=SAMPLE_RATE):
    """Generate a pure sine wave."""
    n_samples = int(rate * duration)
    frames = b""
    for i in range(n_samples):
        t = i / rate
        # Fade in/out over 30ms to remove clicks
        fade = min(1.0, min(t, duration - t) / 0.03)
        sample = int(32767 * volume * fade * math.sin(2 * math.pi * freq * t))
        frames += struct.pack('<h', sample)
    return frames

def chord(freqs, duration, volume=0.4, rate=SAMPLE_RATE):
    """Mix several sine waves."""
    n_samples = int(rate * duration)
    frames = b""
    for i in range(n_samples):
        t = i / rate
        fade = min(1.0, min(t, duration - t) / 0.03)
        s = sum(math.sin(2 * math.pi * f * t) for f in freqs)
        s = int(32767 * volume * fade * s / len(freqs))
        frames += struct.pack('<h', s)
    return frames

def sweep(start_freq, end_freq, duration, volume=0.5, rate=SAMPLE_RATE):
    """Linear frequency sweep (chirp)."""
    n_samples = int(rate * duration)
    frames = b""
    for i in range(n_samples):
        t = i / rate
        freq = start_freq + (end_freq - start_freq) * (t / duration)
        fade = min(1.0, min(t, duration - t) / 0.03)
        sample = int(32767 * volume * fade * math.sin(2 * math.pi * freq * t))
        frames += struct.pack('<h', sample)
    return frames

print("\n🎵 Generating Sound Effects…\n")

# ── Bip Succès ✅ — ascending arpegio C-E-G-C ──────────────────────────────
notes_success = [262, 330, 392, 523]  # C4-E4-G4-C5
frames = b""
for n in notes_success:
    frames += tone(n, 0.12, 0.6)
frames += tone(523, 0.25, 0.5)
write_wav("success_bip.wav", frames)

# ── Bip Échec ❌ — descending wobble ─────────────────────────────────────────
frames = sweep(440, 180, 0.35, 0.65) + sweep(180, 80, 0.25, 0.5)
write_wav("fail_buzzer.wav", frames)

# ── Clic 🖱️ — short bright tick ────────────────────────────────────────────
frames = tone(1200, 0.04, 0.7) + tone(900, 0.03, 0.4)
write_wav("click_pop.wav", frames)

# ── Level Up 🏆 — triumphant ascending chord sweep ─────────────────────────
frames = b""
scale = [262, 294, 330, 349, 392, 440, 494, 523]  # C major scale
for n in scale:
    frames += tone(n, 0.07, 0.55)
frames += chord([523, 659, 784], 0.6, 0.5)  # C major chord
write_wav("level_up.wav", frames)

# ── Calm Quest 🏛️  — gentle loopable ambient hum (10 sec) ────────────────────
frames = b""
progression = [
    (262, 330, 392, 0.9),   # C major
    (294, 370, 440, 0.9),   # D minor
    (262, 330, 392, 0.9),
    (247, 311, 370, 1.0),   # B minor
]
for (root, third, fifth, dur) in progression:
    for _ in range(3):
        frames += chord([root/2, root, third, fifth], dur, 0.25)
write_wav("calm_quest.wav", frames)

# ── Epic Battle ⚔️  — intense repeated power chord ───────────────────────────
frames = b""
for _ in range(8):
    frames += chord([110, 165, 220], 0.35, 0.5)  # A power chord
    frames += tone(0, 0.05)                         # tiny gap
    frames += chord([98, 147, 196], 0.25, 0.45)   # G power chord
    frames += tone(0, 0.05)
write_wav("epic_battle.wav", frames)

# ── Mystic Riddle 🔮  — eerie wavering tone ───────────────────────────────────
frames = b""
n_samples = SAMPLE_RATE * 8  # 8 sec
for i in range(n_samples):
    t = i / SAMPLE_RATE
    # Two slightly de-tuned oscillators + low drone
    v = (math.sin(2*math.pi*220*t) +
         0.6 * math.sin(2*math.pi*220.8*t) +
         0.3 * math.sin(2*math.pi*110*t))
    fade = min(1.0, min(t, 8 - t) / 0.5)
    frames += struct.pack('<h', int(16000 * fade * v / 1.9))
write_wav("mystic_riddle.wav", frames)

# ── Happy Village 🎪  — bouncy major pentatonic melody ────────────────────────
melody = [523, 587, 659, 784, 880, 784, 659, 587, 523, 440, 523, 659, 523]
frames = b""
for _ in range(3):
    for n in melody:
        frames += tone(n, 0.18, 0.55)
        frames += tone(0, 0.04)  # staccato gap
write_wav("happy_village.wav", frames)

print("\n✅ All audio files generated in:", OUTPUT_DIR)
print("\nFile list:")
for f in sorted(os.listdir(OUTPUT_DIR)):
    path = os.path.join(OUTPUT_DIR, f)
    print(f"  {f}  ({os.path.getsize(path)//1024} KB)")
