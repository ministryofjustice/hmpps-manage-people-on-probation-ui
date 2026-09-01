function debounce(fn, delay) {
  let timeoutId
  return function timeout(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

function handleError(error) {
  const resultsContainer = document.getElementById('search-results-container')
  const suggestions = document.getElementById('search-suggestions')
  if (resultsContainer) {
    resultsContainer.innerHTML =
      '<div class="govuk-error-summary"><h2 class="govuk-error-summary__title">Something went wrong</h2><div class="govuk-error-summary__body">The error has been logged. Please try again.</div></div>'
  }
  if (suggestions) {
    suggestions.innerHTML = ''
  }

  throw error
}

function retry(promiseFn, retries, delay) {
  return promiseFn().catch(error => {
    if (retries > 0) {
      return new Promise(resolve => {
        setTimeout(resolve, delay)
      }).then(() => retry(promiseFn, retries - 1, delay))
    }
    throw error || new Error('Maximum retries exceeded')
  })
}

function resetPageNumber() {
  const url = new URL(window.location.href)
  url.search = '' // reset page number
  window.location.href = url
}

function saveFilters(selectedProviders = []) {
  const matchAllTerms = document.querySelector('input[name="matchAllTerms"]:checked')
  const provider = document.querySelector('select[name="providers-filter"]')
  const csrf = document.getElementsByName('_csrf')[0]
  let providers = selectedProviders
  if (provider && provider.value !== 'choose') {
    providers = [provider.value]
  }
  localStorage.setItem('providers', JSON.stringify(providers))
  return fetch(`${window.location.pathname}/filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _csrf: csrf ? csrf.value : '',
      matchAllTerms: matchAllTerms ? matchAllTerms.value : 'true',
      providers,
    }),
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Saving filters failed with status ${response.status}`)
    }
    return response
  })
}

function setupFilterButton() {
  const button = document.getElementById('apply-filters')
  if (!button) {
    return
  }
  button.onclick = event => {
    event.preventDefault()
    saveFilters()
      .then(resetPageNumber)
      .catch(error => handleError(error))
  }
}

function doSearch() {
  const form = document.getElementById('search-form')
  if (!form) {
    return
  }
  retry(
    () =>
      fetch(window.location.href, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
      }),
    3,
    100,
  )
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`)
      }
      const html = await response.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')

      if (document.getElementById('search-error') || doc.getElementById('search-error')) {
        form.submit()
        return
      }
      const currentResults = document.getElementById('search-results-container')
      const newResults = doc.getElementById('search-results-container')
      if (!currentResults || !newResults) {
        throw new Error('Search results container was not found')
      }

      currentResults.innerHTML = newResults.innerHTML
      currentResults.className = newResults.className

      const currentFilters = document.getElementById('search-filters-container')

      const newFilters = doc.getElementById('search-filters-container')
      if (currentFilters && newFilters) {
        currentFilters.innerHTML = newFilters.innerHTML
      }
      const currentSuggestions = document.getElementById('search-suggestions')

      const newSuggestions = doc.getElementById('search-suggestions')

      if (currentSuggestions && newSuggestions) {
        currentSuggestions.innerHTML = newSuggestions.innerHTML
      }

      const currentCsrf = document.getElementsByName('_csrf')[0]
      const newCsrf = doc.getElementsByName('_csrf')[0]
      if (currentCsrf && newCsrf) {
        currentCsrf.value = newCsrf.value
      }

      setupFilterButton()
    })
    .catch(reason => {
      handleError(reason instanceof Error ? reason : new Error(String(reason)))
    })
}

function setupSearch() {
  // Filters are always an option in searchV2
  const filter = document.getElementById('apply-filters')
  if (!filter) return

  let storedProviders = []
  try {
    storedProviders = JSON.parse(localStorage.getItem('providers')) || []
  } catch {
    storedProviders = []
  }
  saveFilters(storedProviders).catch(error => handleError(error))
  setupFilterButton()

  // AsYouTypeSearch is only an option when specific feature flag applied
  const search = document.getElementById('search')
  const form = document.getElementById('search-form')
  if (!form || !search) return

  search.focus() // the autofocus attribute doesn't work in a cross-origin iframe
  search.setSelectionRange(search.value.length, search.value.length) // focus at end of field

  // Enable search on typing
  search.addEventListener('input', debounce(doSearch, 250))
  form.addEventListener('submit', e => {
    e.preventDefault()
    doSearch()
  })
}

export default setupSearch
