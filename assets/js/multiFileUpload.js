export default function initMultiFileUpload() {
  const enableDelete = window.enableDeleteAppointmentFile
  const maxFileSize = window.maxFileSize || 5 * 1024 * 1024 // default 5mb
  const fileLimit = window.fileUploadLimit || 10
  const validMimeTypes = (window.validMimeTypes || 'application/pdf,application/msword').split(',')

  const $container = $('.moj-multi-file-upload')
  if ($container.length === 0) return

  if (!enableDelete) {
    document.body.classList.add('feature-disabled')
  }

  const $list = $container.find('.moj-multi-file-upload__list')
  const $fileInput = $container.find('input[type="file"]')
  const $status = $container.find('.moj-multi-file-upload__status')
  const $continueButton = $('#continueButton')

  function updateContinueButton() {
    const incompleteUploads = $container.find('.moj-multi-file-upload__actions:empty').length
    const enabled = incompleteUploads === 0 && $list.children().length > 0
    $continueButton.prop('disabled', !enabled)
    $continueButton.attr('aria-disabled', String(!enabled))
    $continueButton.toggleClass('govuk-button--disabled', !enabled)
  }

  function getFileRowHtml(fileName, statusText = 'Uploading', color = 'yellow') {
    return `
      <div class="govuk-summary-list__row moj-multi-file-upload__row" data-filename="${fileName}">
        <div class="govuk-summary-list__value moj-multi-file-upload__message">
          <div class="moj-multi-file-upload__message-text">
            <span class="moj-multi-file-upload__filename">${fileName}</span>
            <span class="moj-multi-file-upload__progress visibility-hidden">0%</span>
          </div>
          <strong class="moj-multi-file-upload__message-status">
            <span class="govuk-tag govuk-tag--${color}">${statusText}</span>
          </strong>
        </div>
        <div class="govuk-summary-list__actions moj-multi-file-upload__actions"></div>
      </div>
    `
  }

  function getErrorHtml(message, fileName) {
    return `
      <span class="moj-multi-file-upload__error">
        <span class="moj-multi-file-upload__message-text">
          ${message}
        </span>
        <strong class="moj-multi-file-upload__message-status">
          <span class="govuk-tag govuk-tag--red">Error</span>
        </strong>
      </span>
      <input type="hidden" name="filesAdded_filename" value="${fileName}">
      <input type="hidden" name="filesAdded_message" value="${message}">
      <input type="hidden" name="filesAdded_error" value="true">
    `
  }

  function getSuccessHtml(successMessage, fileName) {
    return `
      <span class="moj-multi-file-upload__success">
        <span class="moj-multi-file-upload__message-text">
          ${successMessage}
        </span>
        <strong class="moj-multi-file-upload__message-status">
          <span class="govuk-tag govuk-tag--green">Uploaded</span>
        </strong>
      </span>
      <input type="hidden" name="filesAdded_filename" value="${fileName}">
      <input type="hidden" name="filesAdded_error" value="false">
    `
  }

  function uploadFile(file) {
    const $row = $(getFileRowHtml(file.name))
    $list.append($row)
    updateContinueButton()

    const formData = new FormData()
    formData.append('documents', file)

    const { pathname } = new URL(window.location.href)
    const parts = pathname.split('/').filter(Boolean)
    formData.append('crn', parts[1])
    formData.append('id', parts[4])

    $.ajax({
      url: '/appointments/file/upload',
      type: 'post',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'CSRF-Token': window.csrfToken,
      },
      success: response => {
        const $message = $row.find('.moj-multi-file-upload__message')
        const $actions = $row.find('.moj-multi-file-upload__actions')

        if (response.error) {
          $message.html(getErrorHtml(response.error.message, file.name))
        } else {
          $message.html(getSuccessHtml(response.success.messageHtml, file.name))

          if (enableDelete) {
            const $deleteButton = $(
              `<button class="govuk-button govuk-button--secondary" data-module="govuk-button" type="button">Delete</button>`,
            )
            $deleteButton.on('click', () => {
              $.post('/appointments/file/delete', { filename: file.name }, () => {
                $row.remove()
                updateContinueButton()
              })
            })
            $actions.append($deleteButton)
          }
        }
        updateContinueButton()
      },
      error: () => {
        const $message = $row.find('.moj-multi-file-upload__message')
        $message.html(getErrorHtml('Upload failed', file.name))
        updateContinueButton()
      },
      xhr: () => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const percentComplete = parseInt((e.loaded / e.total) * 100, 10)
            $row.find('.moj-multi-file-upload__progress').removeClass('visibility-hidden').text(`${percentComplete}%`)
          }
        })
        return xhr
      },
    })
  }

  $fileInput.on('change', function () {
    const files = Array.from(this.files)
    if (files.length === 0) return

    if (files.length > fileLimit) {
      alert(`You can only upload up to ${fileLimit} files at once.`)
      return
    }

    for (const file of files) {
      if (!validMimeTypes.includes(file.type)) {
        const $row = $(getFileRowHtml(file.name, 'Invalid type', 'red'))
        $row.find('.moj-multi-file-upload__message').html(getErrorHtml(`${file.name}: Invalid file type`, file.name))
        $list.append($row)
      } else if (file.size > maxFileSize) {
        const $row = $(getFileRowHtml(file.name, 'Too large', 'red'))
        $row.find('.moj-multi-file-upload__message').html(getErrorHtml(`${file.name}: File too large`, file.name))
        $list.append($row)
      } else {
        uploadFile(file)
      }
    }

    this.value = '' // reset input so same file can be re-selected
  })
}
