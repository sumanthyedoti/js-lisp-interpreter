const readline = require("readline")
const parse = require("./parser")
const eval = require("./eval")

let interpret = (input) => eval(parse(input))

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on("close", function () {
  process.exit(0)
})

repl()

function repl() {
  // const i =
  //   "(define count (lambda (item L) (if (length L) (+ (= item (head L)) (count item (tail L))) 0)))"
  // const j =
  //   "(count (quote the) (quote (the more the merrier the bigger the better)))"
  // interpret(i)
  // interpret(j)

  rl.question("\nlisp> ", function (input) {
    if (input === ":q" || input === ":quit") {
      rl.close()
    }
    try {
      console.log(interpret(input))
    } catch (err) {
      console.log(err)
    } finally {
      repl()
    }
  })
}
