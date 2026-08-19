function debounce(fn, delay) {
  let timeoutId
  return function timeout(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

function handleError(error) {
  document.getElementById('search-results-container').innerHTML =
    '<div class="govuk-error-summary"><h2 class="govuk-error-summary__title">Something went wrong</h2><div class="govuk-error-summary__body">The error has been logged. Please try again.</div></div>'
  document.getElementById('search-suggestions').innerHTML = ''
  throw error
}

function retry(promiseFn, retries, delay) {
  return new Promise((resolve, reject) => {
    promiseFn()
      .then(resolve)
      .catch(error => {
        if (retries > 0)
          setTimeout(
            () =>
              retry(promiseFn, retries - 1, delay)
                .then(resolve)
                .catch(reject),
            delay,
          )
        reject(error || new Error('Maximum retries exceeded'))
      })
  })
}

function resetPageNumber() {
  const url = new URL(window.location.href)
  url.search = '' // reset page number
  window.location.href = url
}

function saveFilters(selectedProviders) {
  const matchAllTerms = document.querySelector('input[name="matchAllTerms"]:checked')
  const provider = document.querySelector('select[name="providers-filter"]')
  let providers = selectedProviders
  if (provider && provider.value !== 'choose') {
    providers = [provider].map(el => el.value)
  }
  localStorage.setItem('providers', JSON.stringify(providers))
  console.log(`${window.location.pathname}/filters`)
  return fetch(`${window.location.pathname}/filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _csrf: document.getElementsByName('_csrf')[0].value,
      matchAllTerms: matchAllTerms ? matchAllTerms.value : 'true',
      providers,
    }),
  })
}

function doSearch() {
  retry(
    () =>
      fetch(window.location.href, {
        method: 'POST',
        body: new URLSearchParams(new FormData(document.getElementById('search-form'))),
      }),
    3,
    100,
  )
    .then(async response => {
      if (response.ok) {
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
        if (document.getElementById('search-error') || doc.getElementById('search-error'))
          document.getElementById('search-form').submit()
        document.getElementById('search-results-container').innerHTML =
          doc.getElementById('search-results-container').innerHTML
        document.getElementById('search-results-container').classList =
          doc.getElementById('search-results-container').classList
        document.getElementById('search-suggestions').innerHTML = doc.getElementById('search-suggestions').innerHTML
        document.getElementsByName('_csrf')[0].value = doc.getElementsByName('_csrf')[0].value
      } else {
        handleError(new Error(`Search request failed with status ${response.status}`))
      }
    })
    .catch(reason => handleError(new Error(reason)))
}

function setupSearch() {
  // Focus on input
  const search = document.getElementById('search')
  const form = document.getElementById('search-form')
  if (!form || !search) return

  // Load filters from local storage
  // saveFilters(JSON.parse(localStorage.getItem('providers')))

  const applyFilters = document.getElementById('apply-filters')
  if (applyFilters) {
    applyFilters.addEventListener('click', e => {
      saveFilters().then(resetPageNumber)
    })
  }
  // document.getElementById('search-results-container').addEventListener('click', e => {
  //   if (e.target.name === 'apply-filters') {
  //     saveFilters().then(resetPageNumber)
  //   }
  // })

  search.focus() // the autofocus attribute doesn't work in a cross-origin iframe
  search.setSelectionRange(search.value.length, search.value.length) // focus at end of field

  // Enable search on typing
  document.getElementById('search').addEventListener('input', debounce(doSearch, 250))
  document.getElementById('search-form').addEventListener('submit', e => {
    doSearch()
    e.preventDefault()
  })
}

export default setupSearch
