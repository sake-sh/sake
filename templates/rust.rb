

class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"
  license "{{license}}"
  head "{{head}}"

  url "{{arch.darwin.url}}"
  sha256 "{{arch.darwin.sha256}}"

  depends_on "rust" => :build

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}

  def install
    {{#each install}}
    {{this}}
    {{/each}}

    system "cargo", "install", *std_cargo_args
  end

  {{#with test}}
  test do
    {{#each test}}
    {{this}}
    {{/each}}
  end
  {{/with}}

  {{#with postinstall}}
  def post_install
    {{#each postinstall}}
    {{this}}
    {{/each}}
  end
  {{/with}}
end