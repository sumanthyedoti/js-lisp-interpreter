const globalEnv = require("./globalEnv")

function eval(x, env = globalEnv) {
  if (Array.isArray(x) && (!x.length || env.isNumber(x[0]))) return x
  if (env.isSymbol.call(env, x)) return env[x]
  if (env.isNumber(x)) return x

  let [operator, ...args] = x
  if (typeof env[operator] === "function") {
    const procedure = eval(operator, env)
    return procedure(...args.map((arg) => eval(arg, env)))
  }
  if (operator === "if") {
    const [test, conseq, alt] = args
    return eval(eval(test, env) ? eval(conseq, env) : eval(alt, env), env)
  }
  if (operator === "define") {
    const [symbol, exp] = args
    env[symbol] = eval(exp, env)
    return env[symbol]
  }
  if (operator === "quote") {
    return args[0]
  }
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
    env[symbol] = eval(exp, env)
    return prevValue
  }
  throw `Error: '${x}' is not defined`
}

module.exports = eval
