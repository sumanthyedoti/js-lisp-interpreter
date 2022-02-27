const globalEnv = require("./globalEnv")

function eval(x, env = globalEnv) {
  if (env.isSymbol.call(env, x)) return env[x]
  if (env.isNumber(x)) return x

  let operator = x[0]
  if (typeof env[operator] === "function")
    return env[operator].apply(
      this,
      x.slice(1).map((it) => eval(it, env))
    )
  if (operator === "if") {
    const [_, test, conseq, alt] = x
    return eval(eval(test, env) ? eval(conseq, env) : eval(alt, env), env)
  }
  if (operator === "define") {
    const [_, symbol, exp] = x
    env[symbol] = eval(exp, env)
    return env[symbol]
  }
  if (operator === "begin") {
    return x.slice(1).reduce((_, exp) => eval(exp, env), null)
  }
  throw `Error: '${x}' is not defined`
}

module.exports = eval
