function analyzeExpression(program) {
  if (program[0] !== "(") {
    throw "Error: not an expression"
  }
  const paranthesisStack = []
  for (let i of program) {
    if (i === "(") {
      paranthesisStack.push(i)
    } else if (i === ")") {
      if (!paranthesisStack.length) {
        throw "SyntaxError: expressions are not balanced '()'`"
      }
      if (paranthesisStack.slice(-1)[0] === "(") {
        paranthesisStack.pop()
      }
    }
  }
  if (paranthesisStack.length) {
    throw "SyntaxError: expressions are not balanced '()'`"
  }
  return true
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
    // build sub-expression
    const [remTail, subExp] = buildAST(tail, [])
    // append the sub-expression to parent expression
    return buildAST(remTail, remTail.length ? [...exp, subExp] : subExp)
  }
  if (head === ")") {
    // return sub-expression
    return [tail, exp]
  }
  // when token is atom
  return buildAST(tail, [...exp, getAtom(head)])
}

function getAtom(token) {
  const numberParsed = numberParser(token)
  if (numberParsed !== null) return numberParsed
  return token
}

function numberParser(token) {
  const inputRegExp = RegExp(
    /^-?(0(?=$)|0(?=\D+)|(0(?=\.))|[1-9][0-9]*)(\.?\d*([Ee][-+]?\d+)?)?$/
  )
  const matches = token.match(inputRegExp)
  if (!matches) {
    return null
  }
  return matches[0] * 1
}

function parse(program) {
  analyzeExpression(program)
  return buildAST(tokenize(program))
}

module.exports = parse
