const technicalUpdatesBanner = this.document.getElementById('technical-updates-banner')

this.document.getElementById('hide-message').addEventListener('click', function handleHideMessageClick() {
  localStorage.setItem('technicalUpdateReadVersion', technicalUpdatesBanner.dataset.bannerVersion)
  technicalUpdatesBanner.classList.add('moj-hidden')
})

window.addEventListener('load', function handleWindowLoad() {
  const { technicalUpdateReadVersion } = localStorage
  const currentBannerVersion = technicalUpdatesBanner.dataset.bannerVersion

  if (technicalUpdateReadVersion !== currentBannerVersion) {
    technicalUpdatesBanner.classList.remove('moj-hidden')
  }
})
