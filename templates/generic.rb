class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"

  url "{{arch.darwin.url}}"
  sha256 "{{arch.darwin.sha256}}"

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}
  
  def install
    bin.install "{{basename arch.darwin.url}}" => "{{lower name}}"
  end

  {{#with postinstall}}
  def post_install
    {{#each postinstall}}
    {{this}}
    {{/each}}
  end
  {{/with}}
end