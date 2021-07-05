require "language/node"

# https://github.com/Homebrew/brew/blob/3476ca7b8ff889ef61e65783d35d1b2073bd4012/docs/Node-for-Formula-Authors.md

class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"
  {{#with license}}
  license "{{license}}"
  {{/with}}
  head "{{head}}"
  
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

    {{#with lang.js.needsBuild}}
    system "npm", "install", *Language::Node.local_npm_install_args

    ENV["NODE_ENV"] = "production"
    system "npm", "run", "build"
    ENV.delete("NODE_ENV")
    {{/with}}

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