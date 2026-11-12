"""Rebuild Opti's animations from the original GIFs with RIFE neural interpolation.

Optical flow (previous approach) ghosted wings and limbs between distant poses,
which made the original frames discernible. RIFE synthesises real in-between
poses. Alpha is recovered by difference matting: each in-between is rendered
over white and over black, then alpha = 1 - (white - black).

Usage:
  python scripts/refine-opti.py render 32 33 ...   # writes /tmp/opti-rife/*.webp
  python scripts/refine-opti.py upload             # writes asset pointers
Needs Pillow, NumPy, onnxruntime and the RIFE 4.9 ONNX model (downloaded).
"""
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/assets/opti/continuous"
WORK = Path("/tmp/opti-rife")
MODEL = WORK / "rife49.onnx"
MODEL_URL = ("https://huggingface.co/yuvraj108c/rife-onnx/resolve/main/"
             "rife49_ensemble_True_scale_1_sim.onnx")
FPS = 60


def session():
    import onnxruntime as ort
    if not MODEL.exists():
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = int(os.environ.get("RIFE_THREADS", "4"))
    return ort.InferenceSession(str(MODEL), opts, providers=["CPUExecutionProvider"])


def render(identifier, rife):
    matches = list((ROOT / "src/assets/opti").glob(f"opti-{identifier}-*.gif.asset.json"))
    assert len(matches) == 1, identifier
    source = WORK / f"{identifier}.gif"
    if not source.exists():
        subprocess.run(["lovable-assets", "get", "--overwrite", "--file", str(matches[0]),
                        "-o", str(source)], check=True, stdout=subprocess.DEVNULL)
    image = Image.open(source)
    frames, durations = [], []
    for i in range(image.n_frames):
        image.seek(i)
        frames.append(np.asarray(image.convert("RGBA"), dtype=np.float32) / 255)
        durations.append(image.info["duration"])
    h, w = frames[0].shape[:2]
    H, W = (h + 63) // 64 * 64, (w + 63) // 64 * 64

    def over(frame, bg):
        alpha = frame[:, :, 3:]
        padded = np.full((H, W, 3), bg, np.float32)
        padded[:h, :w] = frame[:, :, :3] * alpha + bg * (1 - alpha)
        return padded.transpose(2, 0, 1)[None].copy()

    def between(a, b, t):
        layers = []
        for bg in (1.0, 0.0):
            out = rife.run(None, {"img0": over(a, bg), "img1": over(b, bg),
                                  "timestep": np.array([t], np.float32)})[0]
            layers.append(out[0].transpose(1, 2, 0)[:h, :w])
        white, black = layers
        alpha = np.clip(1 - (white - black).mean(2, keepdims=True), 0, 1)
        alpha[alpha < 0.02] = 0
        color = np.divide(black, alpha, out=np.zeros_like(black), where=alpha > 1e-3)
        return np.dstack([np.clip(color, 0, 1), alpha])

    result, times = [], []
    for i, a in enumerate(frames):
        b = frames[(i + 1) % len(frames)]  # interpolate the loop closure too
        count = max(1, round(durations[i] * FPS / 1000))
        for j in range(count):
            result.append(a if j == 0 else between(a, b, j / count))
            times.append(round((j + 1) * durations[i] / count) - round(j * durations[i] / count))
    pictures = [Image.fromarray(np.uint8(np.clip(f * 255 + .5, 0, 255))) for f in result]
    target = WORK / f"opti-{identifier}-continu.webp"
    pictures[0].save(target, save_all=True, append_images=pictures[1:], duration=times,
                     loop=image.info.get("loop", 0), quality=90, method=4,
                     minimize_size=False, kmin=3, kmax=5)
    check = Image.open(target)
    assert check.n_frames == len(pictures) and check.size == (w, h)
    assert sum(times) == sum(durations) and max(times) <= 20 and min(times) > 10
    print(json.dumps({"id": identifier, "frames": check.n_frames,
                      "bytes": target.stat().st_size}), flush=True)


def upload():
    for identifier in range(32, 56):
        target = WORK / f"opti-{identifier}-continu.webp"
        with (OUTPUT / f"{target.name}.asset.json").open("w") as handle:
            subprocess.run(["lovable-assets", "create", "--file", str(target),
                            "--filename", target.name], stdout=handle, check=True)


if __name__ == "__main__":
    WORK.mkdir(parents=True, exist_ok=True)
    if sys.argv[1] == "render":
        rife = session()
        for identifier in sys.argv[2:]:
            render(int(identifier), rife)
    else:
        upload()
