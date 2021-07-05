<img src="https://github.com/uetchy/sake/blob/master/.github/sake.png?raw=true" width="140" />

# sake.sh

[![Actions Status: test](https://github.com/sake-sh/sake/workflows/test/badge.svg)](https://github.com/sake-sh/sake/actions?query=test)

sake.sh is a CI + CDN for Homebrew Taps.

## How to use (for developers)

### 1. Install sake.sh GitHub Apps

For sake.sh to watch the release events, [install GitHub Apps](https://github.com/apps/sake-sh) on your personal account or organizations.

### 2. Create a new release

As soon as you create a new release, sake.sh will start handling the event, detecting programming language, version, description, and release assets, produces a tailor-made formula for your app which will be available at `https://sake.sh/<user|org>`.

### 3. Your tap is ready to serve

You don't have to maintain a separate `homebrew-<name>` repository anymore. Every time you publish a release, sake.sh will automatically create a Homebrew formula and keep it updated. Users will get a new version of your app through Homebrew Tap served by sake.sh.

## How to use (for users)

```bash
brew tap sake.sh/<user|org> https://sake.sh/<user|org>
brew install <package>
```

For instance, you can install [gst](https://github.com/uetchy/gst) from [sake.sh/uetchy](https://sake.sh/uetchy/gst) tap.

```bash
brew tap sake.sh/uetchy https://sake.sh/uetchy
brew install gst
```

## Supported types

### Go

sake.sh produces a formula that clones git repo and runs `go build`.

### Node.js (JavaScript / TypeScript)

sake.sh produces a formula that clones git repo and runs `npm install` and `npm build` (if needed).

### Rust

> Soon

### Generic

Anything that sake.sh failed to detect the language would fall into `generic` type (i.e., just-provide-binary type).

sake.sh will look out for arch-specific binaries in the release assets. If there is a binary for macOS, then sake.sh generates a formula for that binary.

## Roadmap (Wishlist)

- ✅ Basic functionality
- ✅ Badge
- ✅ Formula listing
- ✅ Formula config for advanced usage (.e.g `sake.yml`)
- Manually invoke formula generation
- Versioned formula (e.g. `gst@2`)
- Edge formula (e.g. `gst@edge`)
- M1 support for generic type
