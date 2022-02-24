function numberParser(token) {
  const inputRegExp = RegExp(
    /^-?(0(?=\D+)|(0(?=\.))|[1-9][0-9]*)(\.?\d*([Ee][-+]?\d+)?)?/
  )
  const matches = token.match(inputRegExp)
  if (!matches) {
    return null
  }
  return matches[0] * 1
}

module.exports = {
  numberParser,
}
