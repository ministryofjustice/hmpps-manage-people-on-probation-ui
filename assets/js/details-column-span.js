export default class DetailsColumnSpan {
  constructor($element) {
    this.$table = $element.closest('table')
    this.$details = $element
    this.$contents = $element.querySelector('.govuk-details__text')

    this.addEventsListeners()
    this.adjustOffset()

    this.$details.setAttribute('data-details-column-span-init', '')
  }

  adjustOffset() {
    if (window.getComputedStyle(this.$table).position !== 'relative') {
      // screen size is tablet or smaller, no need for offset
      this.$details.style.paddingBottom = ''
    } else if (this.$details.open) {
      this.$details.style.paddingBottom = `${this.$contents.clientHeight}px`
    } else {
      this.$details.style.paddingBottom = 0
    }
  }

  addEventsListeners() {
    window.addEventListener('resize', this.adjustOffset.bind(this))
    this.$details.addEventListener('toggle', this.adjustOffset.bind(this))
  }
}
