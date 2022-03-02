const readline = require("readline")
const parse = require("./parser")
const eval = require("./eval")

let interpreter = (input) => eval(parse(input))

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
    try {
      console.log(interpreter(input))
    } catch (err) {
      console.log(err)
    } finally {
      repl()
    }
  })
}
