const globalEnv = require("./globalEnv")

const speaialForms = Object.freeze([
  "if",
  "define",
  "set!",
  "lambda",
  "begin",
  "quote",
])

function numberParser(input) {
  const inputRegExp = RegExp(
    /^-?(0(?=$)|0(?=\D+)|(0(?=\.))|[1-9][0-9]*)(\.?\d*([Ee][-+]?\d+)?)?$/
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
  // if (atom.match(/^[a-zA-Z_!][a-zA-Z_!0-9]*$/))
  return [atom, input.slice(atom.length).trim()]
  // return null
}

function expressionParser(input, env = globalEnv) {
  if (env.isNumber(input)) return [input, "", env]
  input = input.trim()
  // console.log({ input })
  //number
  const numberParsed = numberParser(input)
  if (numberParsed) return [...numberParsed, env]

  if (input[0] === "(") {
    return expressionParser(input.slice(1), env)
  }

  const stringParsed = stringParser(input)
  if (!stringParsed) return null
  let [operator, rest] = stringParser(input)
  if (speaialForms.indexOf(operator) >= 0) return -1

  if (env[operator]) {
    // env function
    if (typeof env[operator] === "function") {
      const args = []
      while (rest[0] !== ")") {
        const [value, remExp, localEnv] = expressionParser(rest)
        rest = remExp
        env = localEnv
        if (value) args.push(value)
      }
      rest = rest.slice(1)
      return [
        env[operator](...args.map((x) => expressionParser(x, env)[0])),
        rest,
      ]
    }
    // value in env, Eg: PI
    return [env[operator], rest, env]
  }

  if (input[0] === ")") {
    return [null, input, env]
  }

  return [...stringParsed, env]
}
console.log(expressionParser("( * 3 pi )"))

// let parsers = [numberParser, stringParser, specialFormParser]

function eval(input, env = globalEnv) {
  for (let p of parsers) {
    let parsed = p(input, env)
    if (parsed) return parsed
  }
  return null
}

// console.log(interpret("(max 3 4)"))
