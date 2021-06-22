class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"

  url "{{binaries.darwin_amd64.url}}"
  sha256 "{{binaries.darwin_amd64.sha256}}"

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}
  
  def install
    bin.install "{{basename binaries.darwin_amd64.url}}" => "{{lower name}}"
  end

  {{#with postinstall}}
  def post_install
    {{#each postinstall}}
    {{this}}
    {{/each}}
  end
  {{/with}}
end