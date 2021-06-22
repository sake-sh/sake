class {{capital name}} < Formula
  desc "{{description}}"
  version "{{version}}"
  homepage "{{homepage}}"
  license "{{license}}"
  head "{{head}}"

  url "{{head}}",
    tag: "{{tag}}"

  depends_on "go" => :build

  {{#each dependencies}}
  depends_on "{{name}}"
  {{/each}}

  def install
    {{#each install}}
    {{this}}
    {{/each}}

    ldflags = %W[
      -s -w
      -X main.version={{version}}
      -X main.commit=#{Utils.git_head}
      -X main.builtBy=homebrew
    ].join(" ")

    system "go", "build", *std_go_args(ldflags: ldflags)
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