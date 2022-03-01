const globalEnv = require("./globalEnv")

function eval(x, env = globalEnv) {
  if (Array.isArray(x) && (!x.length || env.isNumber(x[0]))) return x
  if (env.isSymbol.call(env, x)) return env[x]
  if (env.isNumber(x)) return x

  let operator = x[0]
  if (typeof env[operator] === "function") {
    return env[operator].apply(
      this,
      x.slice(1).map((it) => eval(it, env))
    )
  }
  if (operator === "if") {
    const [_, test, conseq, alt] = x
    return eval(eval(test, env) ? eval(conseq, env) : eval(alt, env), env)
  }
  if (operator === "define") {
    const [_, symbol, exp] = x
    env[symbol] = eval(exp, env)
    return env[symbol]
  }
  if (operator === "quote") {
    return x[1]
  }
  if (operator === "begin") {
    return x.slice(1).reduce((_, exp) => eval(exp, env), null)
  }
  if (operator === "lambda") {
    const [_, params, body] = x
    return function (...args) {
      const procedureEnv = Object.create(env)
      params.forEach((param, i) => {
        procedureEnv[param] = eval(args[i], env)
      })
      return eval(body, procedureEnv)
    }
  }
  if (operator === "set!") {
    const [_, symbol, exp] = x
    const prevValue = env[symbol]
    env[symbol] = eval(exp, env)
    return prevValue
  }
  throw `Error: '${x}' is not defined`
}

module.exports = eval
