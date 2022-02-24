const { numberParser } = require("./parsers")

function parse(program) {
  return buildAST(tokenize(program))
}

function tokenize(program) {
  return program
    .replaceAll("(", " ( ")
    .replaceAll(")", " ) ")
    .split(" ")
    .filter((it) => it !== "")
}

function buildAST(tokens, exp = []) {
  if (!tokens.length) return exp
  const [head, ...tail] = tokens
  if (head === "(") {
    // build new sub-expression
    const [remTail, subExp] = buildAST(tail, [])
    // append the sub-expression to parent expression
    return buildAST(remTail, exp.length ? [...exp, subExp] : subExp)
  }
  if (head === ")") {
    // return sub-expression
    return [tail, exp]
  }
  //when token is atom
  return buildAST(tail, [...exp, getAtom(head)])
}
function getAtom(token) {
  let numberParsed = numberParser(token)
  if (numberParsed) return numberParsed
  return token
}
// let program = "(begin (define r (* 2 10)) (* pi (* r r)))"
let program = "()"

console.log("=>", JSON.stringify(parse(program)))
