"""Stream a toolpath JSON to the robot's `streamIN` over a socket.

This is the bridge's "twin -> robot" command path. The reference `streamIN` RAPID is
the socket CLIENT (`SocketConnect ... 5656`), so THIS PROGRAM IS THE SERVER: it
listens on 5656, waits for the robot (or the mock) to dial in, then streams each
move as one fixed-length message (see stream_protocol.py).

Run:  python3 bridge/stream_toolpath.py [toolpath.json] [host] [port]
      defaults: data/toolpaths/vase.json  127.0.0.1  5656
      For a real robot, bind the PC's LAN IP (or 0.0.0.0) so the controller can reach it.
"""
from __future__ import annotations

import json
import os
import socket
import sys
import time

from stream_protocol import encode_move


def stream(path: str, host: str = "127.0.0.1", port: int = 5656, rate_hz: float = 0.0) -> int:
    with open(path) as f:
        doc = json.load(f)
    if doc.get("units", "mm") != "mm":
        raise SystemExit("expected mm toolpath")

    delay = 1.0 / rate_hz if rate_hz > 0 else 0.0

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port))
    srv.listen(1)
    print(f"[streamer] listening on {host}:{port}; waiting for robot to connect...")

    conn, addr = srv.accept()
    conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)  # one line per segment
    print(f"[streamer] robot connected from {addr}; streaming {path}")

    sent = 0
    with conn:
        for layer in doc["layers"]:
            for mv in layer["moves"]:
                x, y, z, qx, qy, qz, qw = mv["pose"]
                msg = encode_move((x, y, z), (qx, qy, qz, qw), mv["feed"], mv["extrude"])
                conn.sendall(msg)
                sent += 1
                if delay:
                    time.sleep(delay)
    srv.close()
    print(f"[streamer] done. sent {sent} moves across {len(doc['layers'])} layers")
    return sent


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    default_tp = os.path.normpath(os.path.join(here, "..", "data", "toolpaths", "vase.json"))
    tp = sys.argv[1] if len(sys.argv) > 1 else default_tp
    host = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 5656
    # 4th arg = rate (Hz). Pace it for a Virtual Controller test so RAPID reads
    # one line per SocketReceive; 0 = full speed (for the mock).
    rate = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    stream(tp, host, port, rate_hz=rate)
