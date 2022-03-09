const globalEnv = require("./globalEnv")

const specialForms = Object.freeze([
  "if",
  "define",
  "set!",
  "lambda",
  "begin",
  "quote",
])

function numberParser(input) {
  const inputRegExp = RegExp(
    /^-?(0(?=\D+)|(0(?=\.))|[1-9][0-9]*)(\.?\d*([Ee][-+]?\d+)?)?/
  )
  const matches = input.match(inputRegExp)
  if (!matches) {
    return null
  }
  return [matches[0] * 1, input.slice(matches[0].length).trim()]
}

function stringParser(input) {
  if (input[0] === "(") return null
  const atom = input.split(" ")[0]
  if (parseFloat(atom)) return null
  return [atom, input.slice(atom.length).trim()]
}

// specialForms
function specialFormParser(input, env = globalEnv) {
  const stringParsed = stringParser(input.trim())
  if (!stringParsed) return null
  const specialForm = stringParsed[0]
  let rest = stringParsed[1].trim()
  if (specialForms.indexOf(specialForm) === -1) return null

  if (specialForm === "if") {
    const [test, afterTest, env0] = expressionParser(rest, env)
    const [conseq, afterConseq, env1] = expressionParser(afterTest, env0)
    const [alt, remaining, env2] = expressionParser(afterConseq, env1)
    console.log({ remaining })
    return [test ? conseq : alt, remaining.slice(1).trim(), env2]
  }
  if (specialForm === "define") {
    const [symbol, afterSymbol, env0] = expressionParser(rest, env)
    const [exp, remaining, env1] = expressionParser(afterSymbol, env0)
    env1[symbol] = exp
    const result = typeof env[symbol] === "function" ? symbol : env[symbol]
    return [result, remaining.slice(1).trim(), env1]
  }
  if (specialForm === "quote") {
    return args[0]
  }
  if (specialForm === "begin") {
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
  if (specialForm === "lambda") {
    rest = rest.slice(1).trim()

    const params = []
    while (rest[0] !== ")") {
      const stringParsed = stringParser(rest)
      if (stringParsed) {
        params.push(stringParsed[0])
        rest = stringParsed[1].trim()
      }
    }
    rest = rest.slice(1).trim()
    const [body, _] = getSubExpression(rest)

    const procedure = function (...args) {
      const procedureEnv = Object.create(env)
      params.forEach((param, i) => {
        procedureEnv[param] = expressionParser(args[i], env)[0]
      })
      return expressionParser(body, procedureEnv)
    }
    return [procedure, rest.slice(body.length), env]
  }
  if (specialForm === "set!") {
    const stringParsed = stringParser(rest)
    if (!stringParsed) return null
    const symbol = stringParsed[0]

    const [prevValue, afterSymbol, env0] = expressionParser(rest, env)
    const [presentValue, remaining, env1] = expressionParser(afterSymbol, env0)
    if (!prevValue) throw `ReferenceError: '${symbol}' is not found`
    env[symbol] = presentValue
    return [prevValue, remaining.slice(1).trim(), env1]
  }
}

function getSubExpression(input) {
  if (input[0] !== "(") {
    throw "Error at parsing body of lambda"
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
  const args = []
  while (input[0] !== ")") {
    const [value, remExp, localEnv] = expressionParser(input, env)
    input = remExp
    env = localEnv
    if (value) args.push(value)
  }
  return [args, input.slice(1).trim()]
}

function expressionParser(input, env = globalEnv) {
  if (env.isAtom(input)) return [input, "", env]
  input = input.trim()
  // console.log({ expIn: input })
  //number
  const numberParsed = numberParser(input)
  if (numberParsed) return [...numberParsed, env]

  if (input[0] === "(") {
    let res = expressionParser(input.slice(1), env)
    return !res[1].length ? res[0] : res
  }

  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  let [operator, rest] = stringParser(input)

  // special form
  if (specialForms.indexOf(operator) !== -1) {
    let res = specialFormParser(input, env)
    return res
  }

  if (env[operator]) {
    // env function
    if (typeof env[operator] === "function") {
      const [args, aftreArgs] = getArguments(rest, env)
      rest = aftreArgs
      return [
        env[operator](...args.map((x) => expressionParser(x, env)[0])),
        rest,
      ]
    }
    // value in env, Eg: PI
    return [env[operator], rest, env]
  }

  if (input[0] === ")") {
    return [null, input.trim(), env]
  }

  return [...stringParsed, env]
}

function spaceAroundTokens(input) {
  return input.replaceAll("(", " ( ").replaceAll(")", " ) ").trim()
}
console.log(
  expressionParser(spaceAroundTokens("(begin (define x 2) (set! x 3))"))
)

// let parsers = [numberParser, stringParser, specialFormParser]

function eval(input, env = globalEnv) {
  for (let p of parsers) {
    let parsed = p(input, env)
    if (parsed) return parsed
  }
  return null
}
