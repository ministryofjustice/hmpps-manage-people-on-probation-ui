;(() => {
  // assets/js/header.js
  document.addEventListener('DOMContentLoaded', initHeader, false)
  const tabOpenClass = 'probation-common-header__toggle-open'
  function initHeader() {
    const userToggle = document.querySelector('.probation-common-header__user-menu-toggle')
    const userMenu = document.querySelector('#probation-common-header-user-menu')
    const servicesToggle = document.querySelector('.probation-common-header__services-menu-toggle')
    const servicesMenu = document.querySelector('#probation-common-header-services-menu')
    hideFallbackLinks()
    if (userToggle) userToggle.removeAttribute('hidden')
    if (servicesToggle) servicesToggle.removeAttribute('hidden')
    closeTabs([
      [userToggle, userMenu],
      [servicesToggle, servicesMenu],
    ])
    if (userToggle)
      userToggle.addEventListener('click', function handleUserMenuToggle(_event) {
        closeTabs([[servicesToggle, servicesMenu]])
        toggleMenu(userToggle, userMenu)
      })
    if (servicesToggle)
      servicesToggle.addEventListener('click', function handleServiceMenuToggle(_event) {
        closeTabs([[userToggle, userMenu]])
        toggleMenu(servicesToggle, servicesMenu)
      })
  }
  function closeTabs(tabTuples) {
    tabTuples.forEach(([toggle, menu]) => {
      if (menu && toggle) {
        menu.setAttribute('hidden', 'hidden')
        toggle.classList.remove(tabOpenClass)
        toggle.parentElement.classList.remove('item-open')
        toggle.setAttribute('aria-expanded', 'false')
        if (toggle.dataset.textForShow) toggle.setAttribute('aria-label', toggle.dataset.textForShow)
      }
    })
  }
  function toggleMenu(toggle, menu) {
    const isOpen = !menu.getAttribute('hidden')
    if (isOpen) {
      closeTabs([[toggle, menu]])
    } else if (menu && toggle) {
      menu.removeAttribute('hidden')
      toggle.classList.add(tabOpenClass)
      toggle.parentElement.classList.add('item-open')
      toggle.setAttribute('aria-expanded', 'true')
      if (toggle.dataset.textForHide) toggle.setAttribute('aria-label', toggle.dataset.textForHide)
    }
  }
  function hideFallbackLinks() {
    const userLink = document.querySelector('.probation-common-header__user-menu-link')
    const servicesLink = document.querySelector('.probation-common-header__services-menu-link')
    if (userLink) userLink.setAttribute('hidden', 'hidden')
    if (servicesLink) servicesLink.setAttribute('hidden', 'hidden')
  }
})()
// # sourceMappingURL=header.js.map
