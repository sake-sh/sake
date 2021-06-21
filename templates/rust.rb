require "formula"

class {{capital name}} < Formula
  version "{{version}}"

  url "{{url}}"
  sha256 "{{sha256}}"

  def install
    bin.install "{{lower name}}"
  end
end
