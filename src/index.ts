import express from "express";
import http from "http";
import { AddressInfo } from "net";
import { raw } from "body-parser";
import { parsePktLine, pktLineEncode } from "./pkt";

function createApp() {
  const app = express();

  app.use(raw({ type: "application/x-git-upload-pack-request" }));

  app.get("/:user/info/refs", (req, res) => {
    console.log(req.url);
    console.log(req.headers);
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
    console.log(data);
    res.status(200).send(data);
  });

  app.post("/:user/git-upload-pack", (req, res) => {
    console.log("# req");
    console.log(req.url);
    console.log(req.headers);
    const body = parsePktLine(req.body);
    console.log(body);
    console.log("# res");
    const command = body[0].match(/command=([^\n\0]+)/)?.[1];
    switch (command) {
      case "ls-refs": {
        const data = pktLineEncode([
          "0a53e9ddeaddad63ad106860237bbf53411d11a7 refs/heads/master\0multi_ack",
          "<flush-pkt>",
        ]);
        console.log(data);
        res.status(200).send(data);
        break;
      }
      case "fetch": {
        // TODO: return packfile
        const data = pktLineEncode([
          "0a53e9ddeaddad63ad106860237bbf53411d11a7 refs/heads/master\0multi_ack",
          "<flush-pkt>",
        ]);
        console.log(data);
        res.status(200).send(data);
        break;
      }
      default: {
        throw new Error("Unrecognized command: " + body[0]);
      }
    }
  });

  return app;
}

const app = createApp();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  const { address, port } = server.address() as AddressInfo;
  console.log(`Server listening on ${address}:${port}`);
});
