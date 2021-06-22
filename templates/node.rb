require "language/node"

class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"
  license "{{license}}"
  head "{{head}}"
  
  # url "https://registry.npmjs.org/{{lower name}}/-/{{lower name}}-{{version}}.tgz"
  # sha256 "{{sha256}}"
  url "{{head}}",
    tag: "{{tag}}"

  depends_on "node"

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}

  def install
    {{#each install}}
    {{this}}
    {{/each}}

    system "npm", "install", *Language::Node.std_npm_install_args(libexec)

    bin.install_symlink Dir["#{libexec}/bin/*"]
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