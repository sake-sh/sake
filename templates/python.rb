require "formula"

# [homebrew-core/jrnl.rb at e7c972b6062af753e564104e58d1fa20c0d1ad7a · Homebrew/homebrew-core](https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/jrnl.rb)

class {{capital name}} < Formula
  version "{{version}}"

  url "{{url}}"
  sha256 "{{sha256}}"

  def install
    bin.install "{{lower name}}"
  end
end
