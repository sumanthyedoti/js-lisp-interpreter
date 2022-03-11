const { log } = require("console")
const readline = require("readline")
const parse = require("./parser")

function spaceAroundTokens(input) {
  return input.replaceAll("(", " ( ").replaceAll(")", " ) ").trim()
}
let interpret = (input) => parse(spaceAroundTokens(input))

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
      const res = interpret(input)
      if (
        Array.isArray(res) &&
        res[1] &&
        res[1].length &&
        typeof res[2] === "object"
      ) {
        throw "Error parsing the expressing"
      }
      console.log(res)
    } catch (err) {
      console.log(err.messsage || err)
    } finally {
      repl()
    }
  })
}
