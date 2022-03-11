const globalEnv = require("./globalEnv")

function isAbsent(x) {
  return x === null || x === undefined
}

function numberParser(input) {
  const i = input.indexOf(" ")
  let literal = i > 0 ? input.substring(0, input.indexOf(" ")) : input
  let number = parseFloat(literal)
  if (isNaN(number)) return null
  return [number, input.slice(i === -1 ? input.length : i).trim()]
}

function stringParser(input) {
  if (input[0] === "(") return null
  const atom = input.split(" ")[0]
  if (!isNaN(parseFloat(atom))) return null
  return [atom, input.slice(atom.length).trim()]
}

const specialFormParsers = {
  if: ifParser,
  define: defineParser,
  begin: beginParser,
  lambda: lamdaParser,
  "set!": setParser,
  quote: quoteParser,
}
function ifParser(input, env) {
  const [test, afterTest, env_] = expressionParser(input, env)
  const [conseqExp, afterConseq] = getSubExpression(afterTest)
  const [altExp, remaining] = getSubExpression(afterConseq)
  const result = test
    ? expressionParser(conseqExp, env_)
    : expressionParser(altExp, env_)
  return [result, remaining.slice(1).trim(), env]
}
function defineParser(input, env) {
  const [symbol, afterSymbol] = expressionParser(input, env)
  const [exp, remaining] = expressionParser(afterSymbol, env)
  env[symbol] = exp
  const result = typeof env[symbol] === "function" ? symbol : env[symbol]
  return [result, remaining.slice(1).trim(), env]
}
function quoteParser(input, env) {
  const [arg, aftreArgs] = getArguments(input)
  return [arg[0], aftreArgs.slice(1).trim(), env]
}

function beginParser(input, env) {
  input = input.trim()
  const subExpressions = []
  while (true) {
    const [subExp, afterSubExp] = getSubExpression(rest)
    subExpressions.push(subExp)
    rest = afterSubExp.trim()
    if (rest[0] === ")") {
      rest = rest.slice(1).trim()
      break
    }
  }
  return [
    subExpressions.reduce((_, exp) => expressionParser(exp, env), null),
    rest,
    env,
  ]
}
function lamdaParser(input, env) {
  let rest = input.slice(1).trim()

  const params = []
  while (rest[0] !== ")") {
    const stringParsed = stringParser(rest)
    if (stringParsed) {
      params.push(stringParsed[0])
      rest = stringParsed[1].trim()
    }
  }
  rest = rest.slice(1).trim()
  const [body, afterBody] = getSubExpression(rest)

  const procedure = function (...args) {
    const procedureEnv = Object.create(env)
    params.forEach((param, i) => {
      procedureEnv[param] = expressionParser(args[i], env)[0]
    })
    return expressionParser(body, procedureEnv)
  }
  return [procedure, afterBody.slice(1).trim(), env]
}
function setParser(input, env) {
  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  const symbol = stringParsed[0]

  const [prevValue, afterSymbol, env0] = expressionParser(rest, env)
  const [presentValue, remaining, env1] = expressionParser(afterSymbol, env0)
  if (!prevValue) throw `ReferenceError: '${symbol}' is not found`
  env[symbol] = presentValue
  return [prevValue, remaining.slice(1).trim(), env1]
}

function getSubExpression(input) {
  if (input[0] !== "(") {
    const literal = input.substring(0, input.indexOf(" "))
    return [literal, input.slice(literal.length).trim()]
  }
  const paranthesisStack = []
  let i = 0
  for (; i < input.length; i++) {
    if (input[i] === "(") {
      paranthesisStack.push(input[i])
    } else if (input[i] === ")") {
      if (!paranthesisStack.length) {
        throw "SyntaxError: expressions are not balanced '()'`"
      }
      if (paranthesisStack.slice(-1)[0] === "(") {
        paranthesisStack.pop()
      }
    }
    if (!paranthesisStack.length) break
  }
  return [input.substring(0, i + 1), input.slice(i + 1).trim()]
}

function getArguments(input, env = globalEnv) {
  let args = []
  while (input[0] !== ")") {
    const [value, remExp, localEnv] = expressionParser(input, env)
    input = remExp
    env = localEnv
    if (value !== null) args.push(value)
  }
  return [args, input.slice(1).trim()]
}

function expressionParser(input, env = globalEnv) {
  if (Array.isArray(input)) return input
  if (env.isAtom(input)) return [input, "", env]
  input = input.trim()
  //number
  const numberParsed = numberParser(input)
  if (numberParsed) {
    return numberParsed[1].length ? [...numberParsed, env] : numberParsed[0]
  }

  if (input[0] === "(") {
    let res = expressionParser(input.slice(1), env)
    return !res[1].length ? res[0] : res
  }

  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  let [operator, rest] = stringParser(input)

  // special form
  if (operator in specialFormParsers) {
    return specialFormParsers[operator](rest.trim(), env)
  }

  if (!isAbsent(env[operator])) {
    // env function
    if (typeof env[operator] === "function") {
      const [args, aftreArgs] = getArguments(rest, env)
      return [env[operator](...args), aftreArgs, env]
    }
    // value in env, Eg: PI
    return [env[operator], rest, env]
  }
  if (input[0] === ")") {
    throw "Error parsing the expression. Please check ()s"
  }
  // string literal
  return [...stringParsed, env]
}

module.exports = expressionParser
