const globalEnv = {
  "+": (...args) => args.reduce((acc, it) => acc + it, 0),
  "-": (...args) => args.slice(1).reduce((acc, it) => acc - it, args[0]),
  "*": (...args) => args.reduce((acc, it) => acc * it, 1),
  "/": (...args) => args.slice(1).reduce((acc, it) => acc / it, args[0]),
  expt: (...args) => {
    if (args.length !== 2) throw new Error("'expt'should get two arguments")
    return args[0] ** args[1]
  },
  "=": (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] !== args[i]) return false
    }
    return true
  },
  print: (x) => x,
  "<": (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] >= args[i]) return false
    }
    return true
  },
  ">": (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] <= args[i]) return false
    }
    return true
  },
  "<=": (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] > args[i]) return false
    }
    return true
  },
  ">=": (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] < args[i]) return false
    }
    return true
  },
  list: (...args) => args,
  min: (...args) =>
    args.reduce((acc, it) => (it < acc ? it : acc), Number.POSITIVE_INFINITY),
  max: (...args) =>
    args.reduce((acc, it) => (it > acc ? it : acc), Number.NEGATIVE_INFINITY),
  sum: (...args) => args.reduce((acc, it) => acc + it, 0),
  product: (...args) => args.reduce((acc, it) => acc * it, 1),
  abs: (x) => Math.abs(x),
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  not: (x) => !x,
  pi: Math.PI,
  head: (...args) => args[0][0],
  tail: (...args) => args[0].slice(1),
  cons: (head, tail) => [head, ...(Array.isArray(tail) ? tail : [tail])],
  isNumber: (x) => typeof x === "number",
  isSymbol: function (x) {
    return typeof x === "string" && x in this
  },
}

module.exports = globalEnv
