"""
Generates placeholder alarm sound .wav files for NeuroWake.
Run with: python generate_alarm_sounds.py
Output: frontend/public/sounds/alarm-tones/*.wav
"""

import os
import math
import struct
import wave
from pathlib import Path

# Each sound is defined as a short repeating pattern of frequencies (Hz).
# 0 means silence for that beat.
SOUND_PATTERNS = {
    "classic_beep": [440, 0, 440, 0],
    "digital_alarm": [880, 1100, 880, 0],
    "buzzer": [220, 440, 330, 220],
    "birdsong": [880, 660, 880, 0, 1046, 0, 880],
    "ocean_waves": [200, 0, 300, 0, 250, 0],
    "rain_drops": [1200, 0, 1400, 0, 1200, 0],
    "wind_chimes": [523, 659, 783, 987],
    "piano_melody": [440, 494, 523, 587, 659, 698],
    "marimba": [330, 392, 440, 494],
    "xylophone": [660, 740, 880, 740],
    "soft_bells": [660, 880, 1046, 880],
    "morning_siren": [523, 523, 523, 0, 784, 784, 784, 0],
    "drum_beat": [100, 0, 100, 0, 150, 0, 150, 0],
    "upbeat_chime": [660, 880, 1046, 880],
}

SAMPLE_RATE = 22050
DURATION_SECONDS = 4.0
OUTPUT_DIR = Path("public") / "sounds" / "alarm-tones"


def generate_wav(name: str, freqs: list, out_dir: Path) -> Path:
    out_path = out_dir / f"{name}.wav"
    nframes = int(SAMPLE_RATE * DURATION_SECONDS)

    with wave.open(str(out_path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)

        frames = []
        for i in range(nframes):
            t = i / SAMPLE_RATE
            idx = int((t * 2) % len(freqs))
            freq = freqs[idx]

            val = 0.0
            if freq:
                val = math.sin(2 * math.pi * freq * t) * 0.25

            sample = int(max(-32767, min(32767, val * 32767)))
            frames.append(struct.pack("<h", sample))

        f.writeframes(b"".join(frames))

    return out_path


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = []
    for name, freqs in SOUND_PATTERNS.items():
        path = generate_wav(name, freqs, OUTPUT_DIR)
        generated.append(path)
        print(f"Generated: {path}")

    print(f"\nDone. Generated {len(generated)} wav files at {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()