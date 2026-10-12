import io
import os
import unittest
from fastapi.testclient import TestClient
from PIL import Image
from main import create_app

class WorkerTests(unittest.TestCase):
    def setUp(self):
        os.environ["AI_WORKER_TOKEN"] = "t" * 40
        self.client = TestClient(create_app(lambda image: Image.new("RGBA", image.size, (0, 0, 0, 0))))
        self.headers = {"Authorization": "Bearer " + "t" * 40}

    def test_actual_png_white_composite(self):
        source = io.BytesIO(); Image.new("RGB", (12, 20), "red").save(source, "PNG")
        response = self.client.post("/api/clean-background", headers=self.headers, files={"file": ("dress.png", source.getvalue(), "image/png")})
        self.assertEqual(response.status_code, 200)
        output = Image.open(io.BytesIO(response.content))
        self.assertEqual(output.format, "PNG"); self.assertEqual(output.getpixel((0, 0)), (255, 255, 255))

    def test_auth_validation_and_no_fake_mesh(self):
        self.assertEqual(self.client.post("/api/clean-background", files={"file": ("x.png", b"bad", "image/png")}).status_code, 401)
        self.assertEqual(self.client.post("/api/clean-background", headers=self.headers, files={"file": ("x.png", b"bad", "image/png")}).status_code, 400)
        self.assertEqual(self.client.post("/api/clean-background", headers=self.headers, files={"file": ("x.png", b"x" * (2 * 1024 * 1024 + 1), "image/png")}).status_code, 413)
        response = self.client.post("/api/generate-3d", headers=self.headers)
        self.assertEqual(response.status_code, 501); self.assertNotIn("glb_url", response.json())

if __name__ == "__main__": unittest.main()
