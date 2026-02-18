module.exports = (request, options) => {
  return options.defaultResolver(request, {
    ...options,
    packageFilter: pkg => {
      const pkgCopy = { ...pkg }
      delete pkgCopy.exports
      return pkgCopy
    },
  })
}
