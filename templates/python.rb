class {{capital name}} < Formula
  include Language::Python::Shebang
  
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"
  license "{{license}}"
  head "{{head}}"

  url "{{arch.darwin.url}}"
  sha256 "{{arch.darwin.sha256}}"

  depends_on "python@3.9"

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}

  def install
    {{#each install}}
    {{this}}
    {{/each}}

    rewrite_shebang detected_python_shebang, "{{name}}"
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