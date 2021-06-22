# Contribution Guide

## Development Flow

```bash
# edit .env
n 15 # cause: nodegit
yarn install
yarn dev
```

## Development References

- [http-protocol](https://www.git-scm.com/docs/http-protocol)
- [pack-protocol](https://github.com/git/git/blob/master/Documentation/technical/pack-protocol.txt)
- [pkt-line Format](https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt#L51)
- [pkt-line v2](https://git-scm.com/docs/protocol-v2/en#_packet_line_framing)
- [brew/Formula-Cookbook.md at master · Homebrew/brew](https://github.com/Homebrew/brew/blob/master/docs/Formula-Cookbook.md)
- [s3fs - npm](https://www.npmjs.com/package/s3fs?activeTab=readme)
- [all-contributors/app: 🤖 A GitHub App to automate acknowledging contributors to your open source projects](https://github.com/all-contributors/app)

## Note

```
Server listening on :::3000
/uetchy/info/refs?service=git-upload-pack
{
  host: 'localhost:3000',
  'user-agent': 'git/2.32.0',
  accept: '*/*',
  'accept-encoding': 'deflate, gzip',
  'accept-language': 'en-US, *;q=0.9',
  pragma: 'no-cache',
  'git-protocol': 'version=2'
}

# req
/uetchy/git-upload-pack
{
  host: 'localhost:3000',
  'user-agent': 'git/2.32.0',
  'accept-encoding': 'deflate, gzip',
  'content-type': 'application/x-git-upload-pack-request',
  accept: 'application/x-git-upload-pack-result',
  'git-protocol': 'version=2',
  'content-length': '144'
}
[
  'command=ls-refs\n',
  'object-format=sha1\x00peel\n',
  'symrefs\n',
  'ref-prefix HEAD\n',
  'ref-prefix refs/heads/\n',
  'ref-prefix refs/tags/\n',
  '<flush-pkt>'
]

# req
/uetchy/git-upload-pack
{
  host: 'localhost:3000',
  'user-agent': 'git/2.32.0',
  'accept-encoding': 'deflate, gzip',
  'content-type': 'application/x-git-upload-pack-request',
  accept: 'application/x-git-upload-pack-result',
  'git-protocol': 'version=2',
  'content-length': '132'
}
[
  'command=fetch',
  'object-format=sha1\x00thin-pack',
  'ofs-delta',
  'want 0a53e9ddeaddad63ad106860237bbf53411d11a7\n',
  'done\n',
  '<flush-pkt>'
]
```
