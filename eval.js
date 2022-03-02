const globalEnv = require("./globalEnv")

function eval(x, env = globalEnv) {
  if (env.isSymbol.call(env, x)) return env[x]
  if (env.isNumber(x)) return x

  if (!Array.isArray(x)) return x

  let [operator, ...args] = x
  if (operator === "if") {
    const [test, conseq, alt] = args
    return eval(eval(test, env) ? eval(conseq, env) : eval(alt, env), env)
  }
  if (operator === "define") {
    const [symbol, exp] = args
    env[symbol] = eval(exp, env)
    return typeof env[symbol] === "function" ? symbol : env[symbol]
  }
  debugger
  if (operator === "quote") {
    return args[0]
  }
  debugger
  if (operator === "begin") {
    return args.reduce((_, exp) => eval(exp, env), null)
  }
  if (operator === "lambda") {
    const [params, body] = args
    return function (...args) {
      const procedureEnv = Object.create(env)
      params.forEach((param, i) => {
        procedureEnv[param] = eval(args[i], env)
      })
      return eval(body, procedureEnv)
    }
  }
  if (operator === "set!") {
    const [symbol, exp] = args
    const prevValue = env[symbol]
    if (!prevValue) throw `ReferenceError: '${symbol}' is not found`
    env[symbol] = eval(exp, env)
    return prevValue
  }
  if (typeof env[operator] === "function") {
    const procedure = eval(operator, env)
    return procedure(...args.map((arg) => eval(arg, env)))
  }
  if (Array.isArray(x)) return x
  throw `ReferenceError: '${x}' is not defined`
}

module.exports = eval
