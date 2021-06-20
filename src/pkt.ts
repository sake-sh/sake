/**
 * pkg-line Format (v2)
 */

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
