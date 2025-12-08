const setupTechnicalUpdates = () => {
  const technicalUpdatesBanner = document.getElementById('technical-updates-banner')
  const hideMessageButton = document.getElementById('hide-message')

  if (!technicalUpdatesBanner || !hideMessageButton) {
    return
  }

  function handleHideMessageClick() {
    localStorage.setItem('technicalUpdateReadVersion', technicalUpdatesBanner.dataset.bannerVersion)
    technicalUpdatesBanner.classList.add('moj-hidden')
  }

  function handleWindowLoad() {
    const technicalUpdateReadVersion = localStorage.getItem('technicalUpdateReadVersion')
    const currentBannerVersion = technicalUpdatesBanner.dataset.bannerVersion

    if (technicalUpdateReadVersion !== currentBannerVersion) {
      technicalUpdatesBanner.classList.remove('moj-hidden')
    }
  }

  hideMessageButton.addEventListener('click', handleHideMessageClick)

  document.addEventListener('DOMContentLoaded', handleWindowLoad)
}

export default setupTechnicalUpdates
