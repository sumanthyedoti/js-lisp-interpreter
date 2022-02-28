const readline = require("readline")
const parse = require("./parse")
const eval = require("./eval")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on("close", function () {
  process.exit(0)
})

repl()

function repl() {
  rl.question("\nlisp> ", function (input) {
    if (input === ":q" || input === ":quit") {
      rl.close()
    }
    console.log(eval(parse(input)))
    repl()
  })
}
