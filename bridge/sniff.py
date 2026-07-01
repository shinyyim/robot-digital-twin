"""Wire-protocol sniffer + classifier — figure out which streaming protocol the
sender actually uses, from REAL bytes instead of guessing.

We have two conflicting references:
  A) RobArch-style reference : bracketed RAPID literals, QUATERNION (4 ori values),
                            ~port 5656.   (older)
  B) fixed-frame reference   : fixed 88-byte frame, position-encoded, EULER
                            (3 ori values RX RY RZ), port 1025.   (GitHub, current?)

This tool captures the actual bytes a sender puts on the wire and tells you which
one it is. The discriminators are robust: frame length, presence of '[',
and how many numbers sit in the orientation region (4=quat -> A, 3=euler -> B).

USAGE
  Capture (be the server the sender/robot connects to):
      python3 bridge/sniff.py listen --port 5656 --save /tmp/cap.bin
      python3 bridge/sniff.py listen --port 1025 --save /tmp/cap.bin
    Then point the reference Grasshopper/vvvv sender (or robot) at THIS machine's IP
    and that port, send a few moves, Ctrl-C. Every chunk is logged hex+ascii and
    classified live.

  Capture (dial a sender/robot that is itself a server):
      python3 bridge/sniff.py connect --host 192.168.125.1 --port 1025

  Re-classify a saved capture or a pasted sample:
      python3 bridge/sniff.py decode --file /tmp/cap.bin
      python3 bridge/sniff.py decode --text '00370.27,-0040.54,...'
"""
from __future__ import annotations

import argparse
import re
import socket
import sys


def classify(raw: bytes) -> str:
    """Best-guess which protocol a single captured message is. Returns a report."""
    n = len(raw)
    try:
        txt = raw.decode("ascii", errors="replace")
    except Exception:
        txt = repr(raw)

    nums = re.findall(r"[-+]?\s*\d+\.?\d*", txt)
    has_bracket = "[" in txt
    # crude orientation-arity probe: after the first 3 numbers (x,y,z) how many
    # numbers form the next group before flags? quaternion=4, euler=3.
    lines = [f"  length      : {n} bytes"]
    lines.append(f"  ascii       : {txt!r}")
    lines.append(f"  numbers     : {len(nums)} found")
    lines.append(f"  has '['     : {has_bracket}")

    verdict = []
    if n == 88:
        verdict.append("len==88 -> matches variant B")
    if has_bracket:
        verdict.append("brackets -> matches variant A")
    # ori arity: total numeric tokens. A pos(3)+quat(4)+speed+flags ~= 8-9 nums.
    # B pos(3)+euler(3)+speed+flags ~= 7-8 nums; but the strongest tell is whether
    # an orientation group has 4 vs 3 values — inspect the second bracket if present.
    if has_bracket:
        groups = re.findall(r"\[([^\]]*)\]", txt)
        if len(groups) >= 2:
            ori_vals = [g for g in groups[1].split(",") if g.strip() != ""]
            lines.append(f"  ori group   : {len(ori_vals)} values -> "
                         + ("QUATERNION (A)" if len(ori_vals) == 4 else
                            "EULER (B)" if len(ori_vals) == 3 else "??"))
            if len(ori_vals) == 4:
                verdict.append("4 ori values -> QUATERNION (A)")
            elif len(ori_vals) == 3:
                verdict.append("3 ori values -> EULER (B)")

    if not verdict:
        verdict.append("unknown — capture more / paste a full message")
    lines.append("  VERDICT     : " + " | ".join(verdict))
    return "\n".join(lines)


def listen(port: int, host: str, save: str | None) -> None:
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port))
    srv.listen(1)
    print(f"[sniff] listening on {host}:{port} — point the real sender/robot here")
    conn, addr = srv.accept()
    print(f"[sniff] connected by {addr}")
    _drain(conn, save)
    srv.close()


def connect(host: str, port: int, save: str | None) -> None:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    print(f"[sniff] connected to {host}:{port}")
    _drain(s, save)


def _drain(sock: socket.socket, save: str | None) -> None:
    f = open(save, "wb") if save else None
    total = 0
    try:
        with sock:
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                total += len(chunk)
                if f:
                    f.write(chunk)
                    f.flush()
                print(f"\n[sniff] +{len(chunk)} bytes (total {total})")
                print("  hex : " + chunk.hex(" "))
                print(classify(chunk))
    except KeyboardInterrupt:
        print("\n[sniff] stopped by user")
    finally:
        if f:
            f.close()
            print(f"[sniff] raw capture saved to {save}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("listen", help="be the server; sender/robot connects in")
    p.add_argument("--port", type=int, default=5656)
    p.add_argument("--host", default="0.0.0.0")
    p.add_argument("--save", default=None)

    c = sub.add_parser("connect", help="dial a robot/sender that is the server")
    c.add_argument("--host", required=True)
    c.add_argument("--port", type=int, required=True)
    c.add_argument("--save", default=None)

    d = sub.add_parser("decode", help="classify a saved capture or pasted text")
    d.add_argument("--file", default=None)
    d.add_argument("--text", default=None)

    a = ap.parse_args()
    if a.cmd == "listen":
        listen(a.port, a.host, a.save)
    elif a.cmd == "connect":
        connect(a.host, a.port, a.save)
    elif a.cmd == "decode":
        if a.file:
            raw = open(a.file, "rb").read()
        elif a.text:
            raw = a.text.encode("ascii", errors="replace")
        else:
            sys.exit("decode needs --file or --text")
        print(classify(raw))


if __name__ == "__main__":
    main()
