"""Rebuild Opti from original GIFs, never from already-interpolated frames.

Run with Python, Pillow, NumPy and OpenCV installed. Temporary pixels stay
outside the repository; only immutable Lovable asset pointers are written.
"""
import json
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/assets/opti/continuous"
cv2.setNumThreads(1)


def gray(frame):
    rgba = frame.astype(np.float32) / 255
    rgb = rgba[:, :, :3] * rgba[:, :, 3:4] + 1 - rgba[:, :, 3:4]
    return cv2.cvtColor(np.uint8(rgb * 255), cv2.COLOR_RGB2GRAY)


def warp(frame, flow, fraction, x, y):
    # Solve the inverse mapping instead of subtracting a forward flow at the
    # wrong coordinates (which produces periodic jumps around pose boundaries).
    mx, my = x.copy(), y.copy()
    for _ in range(5):
        sampled = cv2.remap(flow, mx, my, cv2.INTER_LINEAR,
                            borderMode=cv2.BORDER_REPLICATE)
        mx, my = x - fraction * sampled[:, :, 0], y - fraction * sampled[:, :, 1]
    rgba = frame.astype(np.float32) / 255
    rgba[:, :, :3] *= rgba[:, :, 3:4]
    return cv2.remap(rgba, mx, my, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_CONSTANT)


def interpolate(a, b, forward, backward, fraction, x, y):
    if fraction == 0:
        return Image.fromarray(a)
    rgba = (warp(a, forward, fraction, x, y) * (1 - fraction)
            + warp(b, backward, 1 - fraction, x, y) * fraction)
    rgba[:, :, :3] = np.divide(rgba[:, :, :3], rgba[:, :, 3:4],
                                out=np.zeros_like(rgba[:, :, :3]),
                                where=rgba[:, :, 3:4] > .001)
    return Image.fromarray(np.uint8(np.clip(rgba * 255, 0, 255)))


def refine(identifier, work):
    matches = list((ROOT / "src/assets/opti").glob(f"opti-{identifier}-*.gif.asset.json"))
    if len(matches) != 1:
        raise ValueError(f"Expected one original GIF for {identifier}")
    source = work / f"{identifier}.gif"
    subprocess.run(["lovable-assets", "get", "--overwrite", "--file",
                    str(matches[0]), "-o", str(source)], check=True,
                   stdout=subprocess.DEVNULL)
    image = Image.open(source)
    frames, durations = [], []
    for i in range(image.n_frames):
        image.seek(i)
        frames.append(np.array(image.convert("RGBA")))
        durations.append(image.info["duration"])
    h, w = frames[0].shape[:2]
    x, y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    result, times = [], []
    for i, a in enumerate(frames):
        # Interpolate the wrap as well: no held last frame followed by a snap.
        b = frames[(i + 1) % len(frames)]
        forward = dis.calc(gray(a), gray(b), None)
        backward = dis.calc(gray(b), gray(a), None)
        count = max(1, round(durations[i] * 60 / 1000))
        for j in range(count):
            result.append(interpolate(a, b, forward, backward, j / count, x, y))
            times.append(round((j + 1) * durations[i] / count)
                         - round(j * durations[i] / count))
    target = work / f"opti-{identifier}-continu.webp"
    result[0].save(target, save_all=True, append_images=result[1:], duration=times,
                   loop=image.info.get("loop", 0), quality=88, method=4,
                   minimize_size=False, kmin=3, kmax=5)
    check = Image.open(target)
    total = 0
    for i in range(check.n_frames):
        check.seek(i)
        check.load()
        total += check.info["duration"]
    assert total == sum(durations), (identifier, total, sum(durations))
    assert check.size == (w, h)
    assert check.n_frames > len(frames)
    assert max(times) <= 20
    with (OUTPUT / f"opti-{identifier}-continu.webp.asset.json").open("w") as handle:
        subprocess.run(["lovable-assets", "create", "--file", str(target),
                        "--filename", target.name], stdout=handle, check=True)
    stats = {"id": identifier, "original_frames": len(frames),
             "frames": check.n_frames, "duration_ms": total,
             "max_frame_ms": max(times), "bytes": target.stat().st_size}
    print(json.dumps(stats), flush=True)
    return stats


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="opti-continuous-") as directory:
        with ThreadPoolExecutor(max_workers=4) as pool:
            stats = list(pool.map(lambda i: refine(i, Path(directory)), range(32, 56)))
        print(f"Verified {len(stats)} animations at approximately 60 fps.")