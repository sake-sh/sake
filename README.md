# sake.sh

Fully-automated CDN for Homebrew formula.

## How to use (for users)

```bash
brew tap sake.sh/<user|org> https://sake.sh/<user|org>
brew tap sake.sh/uetchy https://sake.sh/uetchy # formula on sake.sh are synced with GitHub

brew install gst
```

## How to use (for developers)

### 1. Install sake.sh GitHub Apps in your repository

For sake.sh to watch the release events, install GitHub Apps on your personal account or organizations.

### 2. Create a new release on GitHub

As soon as you create a new release, sake.sh will start handling the event, detecting programming language, version, description, and release assets, produces a tailor-made formula for your app.

### 3. Everything is ready

You don't need to create a separate `homebrew-<name>` repository sorely for the purpose of serving a single ruby file. After syncing, sake.sh will automatically create and serve a git repository containing the generated formula files.
