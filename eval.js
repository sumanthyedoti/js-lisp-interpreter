const globalEnv = require("./globalEnv")

const isObject = (x) => typeof x === "object" && !Array.isArray(x) && x !== null

function eval(x, env = globalEnv) {
  if (env.isSymbol.call(env, x)) return env[x]
  if (env.isNumber(x)) return x

  let operator = x[0]
  if (typeof env[operator] === "function") {
    return env[operator].apply(
      this,
      x.slice(1).map((it) => eval(it, env))
    )
  }
  // user defined procedure
  if (env[operator] && isObject(env[operator])) {
    const params = env[operator].__params
    const procedureEnv = Object.create(env)
    params.forEach((param, i) => {
      procedureEnv[param] = eval(x[i + 1], env)
    })
    return eval(env[operator].__body, procedureEnv)
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
    return {
      __params: params,
      __body: body,
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
