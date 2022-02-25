const env = require("./env")

function eval(x) {
  if (env.isSymbol(x)) return env[x]
  if (env.isNumber(x)) return x
  if (env[x[0]])
    return env[x[0]].apply(
      this,
      x.slice(1).map((it) => eval(it))
    )
  if (x[0] === "if") {
    const [_, test, conseq, alt] = x
    return eval(eval(test) ? conseq : alt)
  }
  if (x[0] === "define") {
    const [_, symbol, exp] = x
    env[symbol] = eval(exp)
    return env[symbol]
  }
  if (x[0] === "begin") {
    return x.slice(1).reduce((_, exp) => eval(exp), null)
  }
  throw `Error: '${x}' is not defined`
}

module.exports = eval
