"""Mock `streamIN` RAPID client — stands in for the real controller.

Mirrors the reference `streamIN` module: it is the socket CLIENT that dials the
streaming PC (`SocketConnect ... 5656`), then reads one FIXED-LENGTH message per
receive (`\\ReadNoOfBytes:=streamLen`), parses it with the column layout, and
"executes" each as a MoveL (here: counts + logs). Lets us validate the bridge
end-to-end with no real robot. Point it at the real controller IP later — or
rather, point the robot at the bridge's IP.

Start the bridge (server) first, then run this:
    python3 bridge/stream_toolpath.py        # server, waits for connection
    python3 bridge/mock_streamin.py [host] [port]   # client, dials in
    (defaults 127.0.0.1:5656)
"""
from __future__ import annotations

import socket
import sys

from stream_protocol import decode_move


def run(host: str = "127.0.0.1", port: int = 5656) -> None:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    print(f"[streamIN-mock] connected to {host}:{port}")

    count = 0
    first: str | None = None
    last_move = None
    io_changes = 0
    prev_io = None
    buf = b""
    with s:
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            buf += chunk
            # Newline framing: one move per line (15 comma-separated fields).
            while b"\n" in buf:
                raw, buf = buf.split(b"\n", 1)
                line = raw.decode("ascii")
                if not line.strip():
                    continue
                m = decode_move(line)  # what the robot's CSV parser does
                count += 1
                if first is None:
                    first = line
                last_move = m
                if prev_io is not None and m.d01 != prev_io:
                    io_changes += 1
                prev_io = m.d01
                # (real server would: target := [pos, orient, conf, extax]; MoveL ...)

    print(f"[streamIN-mock] stream closed. executed {count} MoveL")
    if first:
        print(f"[streamIN-mock] first msg : {first!r}")
    if last_move:
        print(f"[streamIN-mock] last move : pos={last_move.pos_mm} "
              f"quat_xyzw={last_move.quat_xyzw} v={last_move.velocity} "
              f"D01={last_move.d01} D02={last_move.d02} config={last_move.config}")
    print(f"[streamIN-mock] extruder on/off transitions: {io_changes}")


if __name__ == "__main__":
    h = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    p = int(sys.argv[2]) if len(sys.argv) > 2 else 5656
    run(h, p)
