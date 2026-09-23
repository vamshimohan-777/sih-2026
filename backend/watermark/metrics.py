"""
Forensic Watermark Quality and Robustness Metrics.
Computes PSNR, SSIM, NC (Normalized Correlation), and visual difference heatmaps.
"""
import io
import base64
import numpy as np
from PIL import Image

def compute_psnr(orig: np.ndarray, mod: np.ndarray) -> float:
    """Compute Peak Signal-to-Noise Ratio (PSNR) in dB."""
    mse = np.mean((orig.astype(np.float64) - mod.astype(np.float64)) ** 2)
    if mse == 0:
        return 100.0  # Identical images
    max_pixel = 255.0
    return float(20 * np.log10(max_pixel / np.sqrt(mse)))

def compute_ssim(orig: np.ndarray, mod: np.ndarray) -> float:
    """Compute Structural Similarity Index (SSIM) between two images."""
    if len(orig.shape) == 3:
        # Convert to grayscale for SSIM
        orig_gray = np.dot(orig[...,:3], [0.2989, 0.5870, 0.1140])
        mod_gray = np.dot(mod[...,:3], [0.2989, 0.5870, 0.1140])
    else:
        orig_gray = orig.astype(np.float64)
        mod_gray = mod.astype(np.float64)

    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2

    mu1 = np.mean(orig_gray)
    mu2 = np.mean(mod_gray)
    sigma1_sq = np.var(orig_gray)
    sigma2_sq = np.var(mod_gray)
    sigma12 = np.mean((orig_gray - mu1) * (mod_gray - mu2))

    ssim = ((2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)) / ((mu1**2 + mu2**2 + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(np.clip(ssim, -1.0, 1.0))

def compute_nc(orig_watermark: np.ndarray, extracted_watermark: np.ndarray) -> float:
    """Normalized Cross-Correlation between original and extracted bitstreams."""
    w1 = orig_watermark.astype(np.float64).flatten()
    w2 = extracted_watermark.astype(np.float64).flatten()
    norm1 = np.linalg.norm(w1)
    norm2 = np.linalg.norm(w2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(w1, w2) / (norm1 * norm2))

def generate_diff_heatmap_b64(orig: np.ndarray, mod: np.ndarray, amplification: int = 15) -> str:
    """
    Generate an amplified visual difference heatmap (base64 PNG)
    showing where the forensic watermark is embedded in the image.
    """
    diff = np.abs(orig.astype(np.float32) - mod.astype(np.float32))
    diff_amp = np.clip(diff * amplification, 0, 255).astype(np.uint8)

    # Colorize diff: if grayscale, map to high-contrast cyan/red heatmap
    if len(diff_amp.shape) == 2 or (len(diff_amp.shape) == 3 and diff_amp.shape[2] == 1):
        gray = diff_amp.squeeze()
        # Cyan-to-magenta-to-yellow gradient
        heatmap = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)
        heatmap[:, :, 0] = np.clip(gray * 2, 0, 255)       # Red
        heatmap[:, :, 1] = np.clip(gray * 0.7, 0, 180)     # Green
        heatmap[:, :, 2] = np.clip(gray * 3, 0, 255)       # Blue (Cyan/Purple)
    else:
        heatmap = diff_amp

    img = Image.fromarray(heatmap)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode('utf-8')
