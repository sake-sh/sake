<img src="https://github.com/uetchy/sake/blob/master/.github/sake.png?raw=true" width="140" />

# sake.sh

CI / CDN for Homebrew tap.

## How to use (for developers)

### 1. Install sake.sh GitHub Apps in your repository

For sake.sh to watch the release events, [install GitHub Apps](https://github.com/apps/sake-sh) on your personal account or organizations.

### 2. Create a new release on GitHub

As soon as you create a new release, sake.sh will start handling the event, detecting programming language, version, description, and release assets, produces a tailor-made formula for your app which will be available at `https://sake.sh/<user|org>`.

### 3. Everything is ready

You don't need to create a separate `homebrew-<name>` repository anymore. After syncing, sake.sh will automatically create and serve a git repository containing the generated formula files.

## How to use (for users)

```bash
brew tap sake.sh/<user|org> https://sake.sh/<user|org>
brew tap sake.sh/uetchy https://sake.sh/uetchy

brew install gst
```

## Roadmap (Wishlist)

- ✅ Basic functions
- Automated cross-platform build for
  - Node.js app (uses `pkg`)
  - Go app (uses `gox`)
  - Rust app (uses `cargo`)
