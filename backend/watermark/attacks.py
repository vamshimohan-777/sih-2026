"""
Realistic Leak & Tamper Attack Simulator.
Simulates real-world attacks including:
- Smartphone screen recapture (moiré pattern, glare, tilt, screen grid)
- JPEG recompression (aggressive lossy compression)
- Gaussian noise and salt-and-pepper noise
- Cropping and aspect ratio distortion
- Blur and downsampling
"""
import io
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

class AttackSimulator:
    @staticmethod
    def jpeg_compression(image_np: np.ndarray, quality: int = 50) -> np.ndarray:
        """Simulate lossy JPEG recompression."""
        pil_img = Image.fromarray(image_np)
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=int(np.clip(quality, 5, 95)))
        buf.seek(0)
        attacked = np.array(Image.open(buf).convert("RGB"))
        return attacked

    @staticmethod
    def smartphone_recapture(image_np: np.ndarray,
                             moire_strength: float = 0.35,
                             glare_intensity: float = 0.25,
                             tilt_angle: float = 1.8) -> np.ndarray:
        """
        Simulates photographing a computer monitor with a smartphone camera:
        1. LCD pixel grid / Moiré pattern interference
        2. Screen reflection glare
        3. Subtle perspective distortion / camera angle tilt
        4. Vignetting / lens illumination falloff
        """
        h, w = image_np.shape[:2]
        img = image_np.astype(np.float32)

        # 1. Perspective tilt (slight angle)
        src_pts = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
        offset_x = int(w * 0.02 * (tilt_angle / 2.0))
        offset_y = int(h * 0.02 * (tilt_angle / 2.0))
        dst_pts = np.float32([
            [offset_x, offset_y],
            [w - offset_x, 0],
            [0, h - offset_y],
            [w - offset_x * 0.5, h]
        ])
        matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
        warped = cv2.warpPerspective(img, matrix, (w, h), borderMode=cv2.BORDER_REFLECT)

        # 2. LCD Moiré Grid Pattern (high-frequency wave pattern)
        x = np.linspace(0, 100 * np.pi, w)
        y = np.linspace(0, 100 * np.pi, h)
        xx, yy = np.meshgrid(x, y)
        moire_grid = (np.sin(xx * 1.5 + yy * 0.8) * np.cos(xx * 0.7 - yy * 1.2)) * (moire_strength * 22.0)
        
        # Apply moire to all channels
        if len(warped.shape) == 3:
            for c in range(warped.shape[2]):
                warped[:, :, c] += moire_grid
        else:
            warped += moire_grid

        # 3. Ambient Glare / Flash spot (radial spotlight)
        center_x, center_y = int(w * 0.65), int(h * 0.35)
        y_grid, x_grid = np.ogrid[:h, :w]
        dist_from_glare = np.sqrt((x_grid - center_x)**2 + (y_grid - center_y)**2)
        radius = max(w, h) * 0.4
        glare_mask = np.clip(1.0 - (dist_from_glare / radius), 0, 1) ** 2
        glare_effect = glare_mask * (glare_intensity * 120.0)

        if len(warped.shape) == 3:
            for c in range(warped.shape[2]):
                warped[:, :, c] += glare_effect
        else:
            warped += glare_effect

        # 4. Vignette (edge falloff)
        center_screen_x, center_screen_y = w / 2.0, h / 2.0
        vignette_dist = np.sqrt((x_grid - center_screen_x)**2 + (y_grid - center_screen_y)**2)
        max_dist = np.sqrt(center_screen_x**2 + center_screen_y**2)
        vignette = 1.0 - 0.25 * (vignette_dist / max_dist) ** 2
        
        if len(warped.shape) == 3:
            for c in range(warped.shape[2]):
                warped[:, :, c] *= vignette
        else:
            warped *= vignette

        result = np.clip(warped, 0, 255).astype(np.uint8)
        return result

    @staticmethod
    def gaussian_noise(image_np: np.ndarray, std_dev: float = 15.0) -> np.ndarray:
        """Add zero-mean Gaussian noise."""
        noise = np.random.normal(0, std_dev, image_np.shape)
        noisy = np.clip(image_np.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        return noisy

    @staticmethod
    def crop_and_resize(image_np: np.ndarray, crop_percent: float = 15.0) -> np.ndarray:
        """Simulate cropping borders and re-scaling back to full resolution."""
        h, w = image_np.shape[:2]
        crop_y = int(h * (crop_percent / 200.0))
        crop_x = int(w * (crop_percent / 200.0))
        cropped = image_np[crop_y:h-crop_y, crop_x:w-crop_x]
        resized = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_LANCZOS4)
        return resized

    @staticmethod
    def gaussian_blur(image_np: np.ndarray, kernel_size: int = 5) -> np.ndarray:
        """Apply optical defocus / blur."""
        k = kernel_size if kernel_size % 2 == 1 else kernel_size + 1
        return cv2.GaussianBlur(image_np, (k, k), 0)

default_attacks = AttackSimulator()

if __name__ == "__main__":
    print("Testing Attack Simulator...")
    test_img = np.ones((400, 400, 3), dtype=np.uint8) * 200
    cv2.putText(test_img, "TOP SECRET CLASSIFIED", (40, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    
    jpeg_att = default_attacks.jpeg_compression(test_img, 30)
    recapture_att = default_attacks.smartphone_recapture(test_img)
    noise_att = default_attacks.gaussian_noise(test_img, 20.0)
    crop_att = default_attacks.crop_and_resize(test_img, 15.0)
    
    print(f"JPEG: {jpeg_att.shape}, Recapture: {recapture_att.shape}, Noise: {noise_att.shape}, Crop: {crop_att.shape}")
    print("All attack simulations completed successfully!")
