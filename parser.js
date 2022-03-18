const globalEnv = require("./globalEnv")

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
  const testResult = expressionParser(input, env)
  if (!testResult) return null
  const [isTrue, afterTest, env_] = testResult
  const conseqResult = extractNextExpression(afterTest.trim())
  if (!conseqResult) return null
  const [conseqExp, afterConseq] = conseqResult
  const altResult = extractNextExpression(afterConseq.trim())
  if (!altResult) return null
  const [altExp, remaining] = altResult
  const result = isTrue
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
  if (input[0] === "(") {
    const [exp, rest] = extractNextExpression(input)
    return [exp, rest, env]
  }
  const [arg, aftreArgs] = getArguments(input, env)
  return [arg[0], aftreArgs.slice(1).trim(), env]
}

function beginParser(input, env) {
  let rest = input.trim()
  const subExpressions = []

  while (true) {
    const [subExp, afterSubExp] = extractNextExpression(rest)
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
  const [body, afterBody] = extractNextExpression(rest)

  const procedure = function (...args) {
    const procedureEnv = Object.create(env)
    params.forEach((param, i) => {
      procedureEnv[param] = args[i]
    })
    return expressionParser(body, procedureEnv)
  }
  return [procedure, afterBody.slice(1).trim(), env]
}

function setParser(input, env) {
  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  const [symbol, afterSymbol] = stringParsed
  const prevValue = env[symbol]
  if (!prevValue) throw new ReferenceError(`'${symbol}' is not found`)
  const presentValue = expressionParser(afterSymbol)
  if (!presentValue) return null
  const [value, remaining] = presentValue
  env[symbol] = value
  return [prevValue, remaining.slice(1).trim(), env]
}

function extractNextExpression(input) {
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
    // ! may return null
    const argResult = expressionParser(input, env)
    if (!argResult) return null
    const [value, remExp, localEnv] = argResult
    input = remExp
    env = localEnv
    if (value !== null) args.push(value)
  }
  return [args, input.slice(1).trim()]
}

function functionParser(funtionExp, input, env = globalEnv) {
  let args = []
  while (input[0] !== ")") {
    const argResult = expressionParser(input, env)
    if (!argResult) return null
    const [value, remExp] = argResult
    input = remExp.trim()
    if (value !== null) args.push(value)
  }
  return [funtionExp(...args), input.slice(1).trim(), env]
}

function expressionParser(input, env = globalEnv) {
  input = input.trim()
  //number
  const numberParsed = numberParser(input)
  if (numberParsed) {
    return numberParsed[1].length ? [...numberParsed, env] : numberParsed[0]
  }
  if (input[0] === "(") {
    input = input.slice(1).trim()
    let result = null

    if (input[0] === "(") {
      // iif
      const [exp, afterExp] = extractNextExpression(input)
      const iif = expressionParser(exp)
      if (!iff) return null
      result = functionParser(iif, afterExp.trim(), env)
    } else {
      const stringParsed = stringParser(input)
      if (!stringParsed) return null
      let [operator, rest] = stringParser(input)

      // special form
      if (operator in specialFormParsers) {
        result = specialFormParsers[operator](rest.trim(), env)
      } else if (operator in env) {
        // env function
        if (typeof env[operator] === "function") {
          result = functionParser(env[operator], rest.trim(), env)
        }
      }
    }

    return !result[1].length ? result[0] : result
  }

  if (input[0] === ")") {
    throw "Error parsing the expression. Please check ()s"
  }

  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  let [token, rest] = stringParser(input)
  if (token in env) {
    // value in env, Eg: PI
    return !rest.length ? env[token] : [env[token], rest, env]
  }
  // quote
  if (token[0] === "'") {
    if (token.slice(1).length)
      return !rest.length ? token.slice(1) : [token.slice(1), rest, env]
    const nextExp = extractNextExpression(rest.trim())
    if (!nextExp) return null
    const [exp, remaining] = nextExp
    return !remaining.length ? exp : [exp, remaining, env]
  }
  // string literal
  return [token, rest, env]
}

module.exports = expressionParser
