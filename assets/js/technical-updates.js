const setupTechnicalUpdates = () => {
  const technicalUpdatesBanner = document.getElementById('technical-updates-banner')
  const hideMessageButton = document.getElementById('hide-message')

  if (!technicalUpdatesBanner || !hideMessageButton) {
    return
  }

  // Two storage keys are essential to track both permanent dismissal and the 7-day countdown.
  const DISMISSED_VERSION_KEY = 'technicalUpdateDismissedVersion'
  const FIRST_VIEW_TIME_KEY = 'technicalUpdateFirstViewTime'

  const currentBannerVersion = technicalUpdatesBanner.dataset.bannerVersion
  const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000

  /**
   * Retrieves the version the user last explicitly dismissed/auto-expired.
   */
  function getDismissedVersion() {
    return localStorage.getItem(DISMISSED_VERSION_KEY)
  }

  /**
   * Stores the current version as permanently read and hides the banner.
   * This action satisfies all three dismissal conditions.
   */
  function setBannerAsDismissed() {
    // 1. Permanently record this version as dismissed (Satisfies the "only shown again when new update" rule)
    localStorage.setItem(DISMISSED_VERSION_KEY, currentBannerVersion)

    // 2. Hide the banner visually
    technicalUpdatesBanner.classList.add('moj-hidden')

    // 3. Clear the timer, as it's now permanently dismissed
    localStorage.removeItem(FIRST_VIEW_TIME_KEY)

    // 4. Accessibility: Announce the change to screen readers using the status element
    // The element is statically defined in prob_fe_header.njk
    const statusElement = document.getElementById('whatsNewBannerStatus')

    if (statusElement) {
      statusElement.textContent = 'Technical updates banner dismissed.'
    }
  }

  /**
   * Records the time the user first saw the current version.
   */
  function recordFirstViewTime() {
    const firstView = localStorage.getItem(FIRST_VIEW_TIME_KEY)

    // Only set the timestamp if it doesn't exist yet for this version.
    if (!firstView) {
      localStorage.setItem(FIRST_VIEW_TIME_KEY, Date.now().toString())
    }
  }

  /**
   * Determines if the banner should be visible based on version and time.
   */
  function shouldShowBanner() {
    const dismissedVersion = getDismissedVersion()
    const firstViewTime = localStorage.getItem(FIRST_VIEW_TIME_KEY)

    // Rule 1: Banner would re-appear whenever there is new version published
    if (dismissedVersion === currentBannerVersion) {
      // This version was already permanently dismissed/auto-expired. HIDE IT.
      return false
    }

    // At this point, we know it's a new (or undismissed) version. We now check the timer.

    // Rule 2: If no action within 7 days, hide it and mark as read.
    if (firstViewTime) {
      const timeSinceFirstView = Date.now() - parseInt(firstViewTime, 10)

      if (timeSinceFirstView >= SEVEN_DAYS_IN_MS) {
        // Auto-dismissal triggered! (Satisfies "automatically disappear after seven days")
        setBannerAsDismissed() // This hides it and sets the permanent read state
        return false // HIDE IT.
      }
    }

    // Rule 3: It's a new version, and the 7-day timer is still running. SHOW IT.
    return true
  }

  // --- Event Handlers and Initial Load ---

  function handleHideMessageClick(e) {
    e.preventDefault()
    // 1. Dismissal condition: User has clicked hide banner
    setBannerAsDismissed()
  }

  function handleWindowLoad() {
    // ------------------------------------------------------------
    // Check if the user is on the What's New Page.
    // ------------------------------------------------------------
    if (window.location.pathname.endsWith('/whats-new')) {
      // 2. Dismissal condition: User has visited whats new page
      setBannerAsDismissed()
      return
    }

    // Default logic: Show/Hide based on checks
    if (shouldShowBanner()) {
      // Banner is visible: Start/continue the 7-day countdown.
      recordFirstViewTime()
      technicalUpdatesBanner.classList.remove('moj-hidden')
    } else {
      // Banner is hidden (either due to dismissal or 7-day expiry)
      technicalUpdatesBanner.classList.add('moj-hidden')
    }
  }

  hideMessageButton.addEventListener('click', handleHideMessageClick)

  document.addEventListener('DOMContentLoaded', handleWindowLoad)
}

export default setupTechnicalUpdates
