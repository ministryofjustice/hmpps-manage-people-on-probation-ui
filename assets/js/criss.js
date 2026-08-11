const criss = () => {
  const radioFreeform = document.getElementById('format-freeform')
  const radioStructured = document.getElementById('format-structured')
  const freeformContainer = document.getElementById('freeform-container')
  const structuredContainer = document.getElementById('structured-container')
  const statusAnnouncer = document.getElementById('format-status')
  const crissCharCountMsg = document.getElementById('criss-character-count-info')
  const form = document.getElementById('note-form')

  if (
    !radioFreeform ||
    !radioStructured ||
    !freeformContainer ||
    !structuredContainer ||
    !statusAnnouncer ||
    !crissCharCountMsg ||
    !form
  ) {
    return
  }

  const mainTextarea = freeformContainer.querySelector('textarea')
  if (!mainTextarea) {
    return
  }

  const MAX_LIMIT = Number.parseInt(mainTextarea.getAttribute('maxlength') || '', 10) || 12000
  const crissInputs = [
    { id: 'criss-check-in', label: '1. Check in' },
    { id: 'criss-review', label: '2. Review' },
    { id: 'criss-intervention', label: '3. Intervention' },
    { id: 'criss-summarise', label: '4. Summarise' },
    { id: 'criss-set-tasks', label: '5. Set tasks' },
  ]

  // Helper function to build freeform text from CRISS inputs
  function buildCombinedText() {
    const combinedText = []
    crissInputs.forEach(input => {
      const val = document.getElementById(input.id).value.trim()
      if (val) {
        combinedText.push(`${input.label}:\n${val}`)
      }
    })
    return combinedText.join('\n\n')
  }

  // Update total character counter for CRISS fields
  function updateCrissCharacterCount() {
    const totalCombinedLength = buildCombinedText().length
    const remaining = MAX_LIMIT - totalCombinedLength

    if (remaining < 0) {
      const overBy = Math.abs(remaining)
      crissCharCountMsg.textContent = `You have ${overBy.toLocaleString()} character${overBy === 1 ? '' : 's'} too many`
      crissCharCountMsg.classList.add('govuk-character-count__message--error')
    } else {
      crissCharCountMsg.textContent = `You have ${remaining.toLocaleString()} character${remaining === 1 ? '' : 's'} remaining`
      crissCharCountMsg.classList.remove('govuk-character-count__message--error')
    }
  }

  // Helper function to parse Freeform text back into CRISS sections
  function parseFreeformToCriss(text) {
    const sectionValues = {}
    crissInputs.forEach(input => {
      sectionValues[input.id] = ''
    })

    const hasHeaders = crissInputs.some(input => text.startsWith(`${input.label}:`))

    if (hasHeaders) {
      for (let i = 0; i < crissInputs.length; i += 1) {
        const currentHeader = `${crissInputs[i].label}:`
        const currentIndex = text.indexOf(currentHeader)

        if (currentIndex !== -1) {
          let nextIndex = -1
          for (let j = i + 1; j < crissInputs.length; j += 1) {
            const nxt = text.indexOf(`${crissInputs[j].label}:`, currentIndex + currentHeader.length)
            if (nxt !== -1) {
              nextIndex = nxt
              break
            }
          }

          let sectionContent = ''
          if (nextIndex !== -1) {
            sectionContent = text.substring(currentIndex + currentHeader.length, nextIndex)
          } else {
            sectionContent = text.substring(currentIndex + currentHeader.length)
          }

          sectionValues[crissInputs[i].id] = sectionContent.trim()
        }
      }
    } else {
      sectionValues['criss-check-in'] = text
    }

    return { sectionValues, hasHeaders }
  }

  function toggleFormat() {
    if (radioStructured.checked) {
      // Switching Freeform -> CRISS
      const existingText = mainTextarea.value.trim()

      if (existingText) {
        const { sectionValues, hasHeaders } = parseFreeformToCriss(existingText)

        crissInputs.forEach(input => {
          document.getElementById(input.id).value = sectionValues[input.id]
        })

        if (hasHeaders) {
          statusAnnouncer.textContent =
            'Switched to CRISS format. Note sections have been restored to their respective fields.'
        } else {
          statusAnnouncer.textContent = 'Switched to CRISS format. Your note text was placed in section 1, Check in.'
        }
      } else {
        crissInputs.forEach(input => {
          document.getElementById(input.id).value = ''
        })
        statusAnnouncer.textContent = 'Switched to CRISS format with 5 sections.'
      }

      updateCrissCharacterCount()
      freeformContainer.classList.add('govuk-!-display-none')
      structuredContainer.classList.remove('govuk-!-display-none')
    } else {
      // Switching CRISS -> Freeform
      const combined = buildCombinedText()

      if (combined) {
        mainTextarea.value = combined
        statusAnnouncer.textContent =
          'Switched to freeform note. All sections have been combined with headings into the main text area.'
      } else {
        mainTextarea.value = ''
        statusAnnouncer.textContent = 'Switched to freeform note.'
      }

      // Dispatch input event so standard GOV.UK character counter macro updates its count
      mainTextarea.dispatchEvent(new Event('input', { bubbles: true }))
      mainTextarea.dispatchEvent(new Event('keyup', { bubbles: true }))

      structuredContainer.classList.add('govuk-!-display-none')
      freeformContainer.classList.remove('govuk-!-display-none')
    }
  }

  // Event Listeners
  radioFreeform.addEventListener('change', toggleFormat)
  radioStructured.addEventListener('change', toggleFormat)

  // Recalculate character count on typing in any CRISS input
  crissInputs.forEach(input => {
    const el = document.getElementById(input.id)
    if (el) {
      el.addEventListener('input', updateCrissCharacterCount)
    }
  })

  // Ensure combined text is saved to mainTextarea on submit if in CRISS mode
  document.getElementById('note-form').addEventListener('submit', function submit() {
    if (radioStructured.checked) {
      mainTextarea.value = buildCombinedText()
    }
  })
}

export default criss
