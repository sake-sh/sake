/**
 * pkg-line Format (v2)
 */

import { raw } from "body-parser";
import express from "express";
import { log } from "./util";

function app() {
  const app = express();

  app.use(raw({ type: "application/x-git-upload-pack-request" }));
  app.get("/:user/info/refs", (req, res) => {
    log(req.url);
    log(req.headers);
    /**
     * The Content-Type of the returned info/refs entity SHOULD be text/plain; charset=utf-8, but MAY be any content type. Clients MUST NOT attempt to validate the returned Content-Type. Dumb servers MUST NOT return a return type starting with application/x-git-.
     */
    res.setHeader(
      "content-type",
      "application/x-git-upload-pack-advertisement"
    );
    res.setHeader("cache-control", "no-cache");

    /**
     * If HEAD is a valid ref, HEAD MUST appear as the first advertised
        ref.  If HEAD is not a valid ref, HEAD MUST NOT appear in the
        advertisement list at all, but other refs may still appear.

        The stream MUST include capability declarations behind a NUL on the
        first ref. The peeled value of a ref (that is "ref^{}") MUST be
        immediately after the ref itself, if presented. A conforming server
        MUST peel the ref if it's an annotated tag.
     */
    const data = pktLineEncode([
      "# service=git-upload-pack",
      "<flush-pkt>",
      "version 2",
      "ls-refs",
      "fetch=filter",
      "server-option",
      "object-format=sha1",
      "<flush-pkt>",
    ]);
    log(data);
    res.status(200).send(data);
  });

  app.post("/:user/git-upload-pack", (req, res) => {
    log("# req");
    log(req.url);
    log(req.headers);
    const body = parsePktLine(req.body);
    log(body);
    log("# res");
    const command = body[0].match(/command=([^\n\0]+)/)?.[1];
    switch (command) {
      case "ls-refs": {
        const data = pktLineEncode([
          "0a53e9ddeaddad63ad106860237bbf53411d11a7 refs/heads/master\0multi_ack",
          "<flush-pkt>",
        ]);
        log(data);
        res.status(200).send(data);
        break;
      }
      case "fetch": {
        // TODO: return packfile
        const data = pktLineEncode([
          "0a53e9ddeaddad63ad106860237bbf53411d11a7 refs/heads/master\0multi_ack",
          "<flush-pkt>",
        ]);
        log(data);
        res.status(200).send(data);
        break;
      }
      default: {
        throw new Error("Unrecognized command: " + body[0]);
      }
    }
  });
}

/**
 * encode data to pkg-line
 * use <flush-pkt> for flush-pkt, <delim-pkt> for delim-pkt
 */
export function pktLineEncode(data: string[]) {
  return data
    .map((entry) => {
      if (entry === "<flush-pkt>") {
        return "0000";
      }
      if (entry === "<delim-pkt>") {
        return "0001";
      }
      const pktLen = (4 + entry.length + 1).toString(16).padStart(4, "0");
      const pktLine = pktLen + entry;
      return pktLine + "\n";
    })
    .join("");
}

export function parsePktLine(data: Buffer) {
  // NOTE: read 4-bytes, 0 -> flush, else -> read (pkt-len - 4), repeat until end of data
  let cur = 0;
  let lastLen = 0;
  const parsed = [];
  while (true) {
    const len = parseInt(String(data.slice(cur, cur + 4)), 16);

    if (Number.isNaN(len)) break;

    if (len > 1) {
      const payload = String(data.slice(cur + 4, cur + len));

      if (lastLen === 1) {
        parsed[parsed.length - 1] += payload;
      } else {
        parsed.push(payload);
      }

      cur += len;
    }

    if (len === 1) {
      // delim-pkt
      parsed[parsed.length - 1] += "\0";
      cur += 4;
    }

    if (len === 0) {
      // flush-pkt
      parsed.push("<flush-pkt>");
      cur += 4;
    }

    lastLen = len;
  }

  return parsed;
}
