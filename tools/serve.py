"""Local-only game/studio server with reproducible PNG capture and no stale asset cache."""
import base64
import json
import re
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = 8767


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path != "/__studio_capture":
            self.send_error(404)
            return
        if self.headers.get("Origin") not in (f"http://localhost:{PORT}", f"http://127.0.0.1:{PORT}"):
            self.send_error(403)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length < 12_000_000:
                raise ValueError("Invalid capture size")
            payload = json.loads(self.rfile.read(length))
            name = payload["name"]
            if not re.fullmatch(r"[a-zA-Z0-9_-]{1,150}\.png", name):
                raise ValueError("Invalid capture name")
            prefix, encoded = payload["image"].split(",", 1)
            if prefix != "data:image/png;base64":
                raise ValueError("PNG required")
            image = base64.b64decode(encoded, validate=True)
            if not image.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError("Invalid PNG")
            folder = ROOT / "docs/art/production-pilot/captures"
            folder.mkdir(parents=True, exist_ok=True)
            target = folder / f"{name[:-4]}-{uuid.uuid4().hex[:8]}.png"
            with target.open("xb") as output:
                output.write(image)
            response = json.dumps({"path": str(target.relative_to(ROOT))}).encode()
            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)
        except (ValueError, KeyError, TypeError):
            self.send_error(400, "Invalid capture")


if __name__ == "__main__":
    print(f"Game: http://localhost:{PORT}/  Studio: http://localhost:{PORT}/studio.html", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
