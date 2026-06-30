const LOCALE = 'fr-FR'
const DEFAULT_REFRESH_INTERVAL_MS = 20000
const MIN_INSIDE_LABEL_PERCENTAGE = 12

window.addEventListener('onWidgetLoad', async function (obj) {
  const status = await SE_API.getOverlayStatus()
  const settings = normalizeSettings(obj.detail.fieldData || {})

  loadGoogleFont(settings.fontFamily)
  setCssVariables(settings)

  const projectId = settings.projectNumericalId

  if (!projectId) {
    console.error(`[ulule/stats] Expected a valid project ID, got ${projectId} instead`)
    if (status.isEditorMode) {
      $('.amount').html('<div>Please input a valid project ID</div>')
    }
    return
  }

  console.log('[ulule/stats] Widget loaded for project', projectId)

  let displayedAmount

  fetchStats()
  setInterval(fetchStats, settings.refreshInterval)

  async function fetchStats() {
    try {
      const response = await fetch(`https://data.ulule.com/projects/${projectId}/stats.json?cachebuster=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`[ulule/stats] Response status: ${response.status}`)
      }

      const stats = await response.json()
      const committed = numberOrZero(stats.committed)
      const goal = numberOrZero(stats.goal)
      const nextStageGoal = numberOrZero(stats.next_stage_goal)
      const target = settings.showNextStageGoal && nextStageGoal > committed ? nextStageGoal : goal
      const isFinancial = stats.amount_raised === String(committed)
      const suffix =
        settings.suffix !== null
          ? settings.suffix
          : isFinancial
            ? settings.legacyCurrency
            : settings.legacyPresaleSuffix
      const showSuffixOnCurrentValue =
        settings.showSuffixOnCurrentValue !== null ? settings.showSuffixOnCurrentValue : isFinancial

      if (displayedAmount === undefined) {
        displayedAmount = committed
      }

      renderAmount(displayedAmount, committed, goal, suffix, showSuffixOnCurrentValue)
      renderProgress(committed, target, nextStageGoal, suffix)

      displayedAmount = committed
    } catch (error) {
      console.error('[ulule/stats] Failed to fetch stats', error.message)
    }
  }

  function renderAmount(fromAmount, toAmount, goal, suffix, showSuffixOnCurrentValue) {
    $({ amount: fromAmount }).animate(
      { amount: toAmount },
      {
        duration: 3000,
        easing: 'swing',
        step: function () {
          const currentAmount = formatNumber(Math.round(this.amount))
          const currentSuffix = showSuffixOnCurrentValue && suffix ? ` ${escapeHtml(suffix)}` : ''
          const goalSuffix = suffix ? ` ${escapeHtml(suffix)}` : ''
          const goalElement = goal > 0 ? `<span class="amount__goal"> / ${formatNumber(goal)}${goalSuffix}</span>` : ''

          $('.amount').html(`<div>${currentAmount}${currentSuffix}${goalElement}</div>`)
        },
      },
    )
  }

  function renderProgress(committed, target, nextStageGoal, suffix) {
    if (target <= 0) {
      $('.progress-bar').hide()
      $('.stretch-goal').hide().text('')
      return
    }

    const percentage = Math.floor((committed / target) * 100)
    const cappedPercentage = Math.max(0, Math.min(percentage, 100))

    $('.progress-bar').show()
    const progressBarContent = $('.progress-bar__content')
    progressBarContent.toggleClass(
      'progress-bar__content--label-outside',
      cappedPercentage < MIN_INSIDE_LABEL_PERCENTAGE,
    )
    progressBarContent.animate(
      {
        width: `${cappedPercentage}%`,
      },
      1000,
    )
    $('.progress-bar__label').text(`${percentage}%`)

    if (settings.showNextStageGoal && nextStageGoal > committed) {
      const nextStageSuffix = suffix ? ` ${suffix}` : ''
      $('.stretch-goal')
        .show()
        .text(`Prochain palier : ${formatNumber(nextStageGoal)}${nextStageSuffix}`)
    } else {
      $('.stretch-goal').hide().text('')
    }
  }
})

function normalizeSettings(fieldData) {
  return {
    blockBorderRadius: numberOrDefault(fieldData.blockBorderRadius, 8),
    blockColor: fieldData.blockColor || '#FFFFFF',
    blockOpacity: numberOrDefault(fieldData.blockOpacity, 95),
    fontColor: fieldData.fontColor || '#007199',
    fontFamily: normalizeFontFamily(fieldData.fontFamily) || 'Roboto',
    fontSize: numberOrDefault(fieldData.fontSize, 28),
    fontWeight: fieldData.fontWeight || '700',
    progressBackgroundColor: fieldData.progressBackgroundColor || '#F6F1EB',
    progressBarColor: fieldData.progressBarColor || '#007199',
    progressBarFontColor: fieldData.progressBarFontColor || '#FFFFFF',
    progressBarFontSize: numberOrDefault(fieldData.progressBarFontSize, 14),
    progressBorderColor: fieldData.progressBorderColor || '#F6F1EB',
    progressBorderRadius: numberOrDefault(fieldData.progressBorderRadius, 4),
    projectNumericalId: fieldData.projectNumericalId,
    refreshInterval: Math.max(numberOrDefault(fieldData.refreshInterval, DEFAULT_REFRESH_INTERVAL_MS / 1000), 1) * 1000,
    showNextStageGoal: booleanOrDefault(fieldData.showNextStageGoal, true),
    showSuffixOnCurrentValue:
      fieldData.showSuffixOnCurrentValue !== undefined
        ? booleanOrDefault(fieldData.showSuffixOnCurrentValue, true)
        : null,
    legacyCurrency: stringOrDefault(fieldData.currency, '€'),
    legacyPresaleSuffix: stringOrDefault(fieldData.presaleSuffix, 'préventes'),
    suffix: fieldData.suffix === undefined || fieldData.suffix === null ? null : String(fieldData.suffix),
  }
}

function setCssVariables(settings) {
  const root = document.documentElement
  const rgb = hexToRgb(settings.blockColor)

  root.style.setProperty('--ulule-progress-block-background-color-rgb', rgb.join(' '))
  root.style.setProperty('--ulule-progress-block-border-radius', `${settings.blockBorderRadius}px`)
  root.style.setProperty(
    '--ulule-progress-block-opacity',
    String(Math.max(0, Math.min(settings.blockOpacity, 100)) / 100),
  )
  root.style.setProperty('--ulule-progress-font-color', settings.fontColor)
  root.style.setProperty('--ulule-progress-font-family', quoteCssString(settings.fontFamily))
  root.style.setProperty('--ulule-progress-font-size', `${settings.fontSize}px`)
  root.style.setProperty('--ulule-progress-font-weight', settings.fontWeight)
  root.style.setProperty('--ulule-progress-background-color', settings.progressBackgroundColor)
  root.style.setProperty('--ulule-progress-bar-color', settings.progressBarColor)
  root.style.setProperty('--ulule-progress-bar-font-color', settings.progressBarFontColor)
  root.style.setProperty('--ulule-progress-bar-font-size', `${settings.progressBarFontSize}px`)
  root.style.setProperty('--ulule-progress-border-color', settings.progressBorderColor)
  root.style.setProperty('--ulule-progress-border-radius', `${settings.progressBorderRadius}px`)
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildGoogleFontUrl(fontFamily, weights = null) {
  const family = normalizeFontFamily(fontFamily)
    .split(/\s+/)
    .map((part) => encodeURIComponent(part))
    .join('+')
  const weightSuffix = weights ? `:wght@${weights.join(';')}` : ''

  return `https://fonts.googleapis.com/css2?family=${family}${weightSuffix}&display=swap`
}

function loadGoogleFont(fontFamily) {
  const family = normalizeFontFamily(fontFamily)

  if (!family) {
    return
  }

  const alreadyLoaded = Array.from(document.querySelectorAll('link[data-ulule-google-font]')).some(
    (link) => link.dataset.ululeGoogleFont === family,
  )

  if (alreadyLoaded) {
    return
  }

  const link = document.createElement('link')
  const fallbackUrl = buildGoogleFontUrl(family)

  link.dataset.ululeGoogleFont = family
  link.href = buildGoogleFontUrl(family, ['400', '500', '600', '700', '800'])
  link.rel = 'stylesheet'
  link.onerror = () => {
    if (link.href !== fallbackUrl) {
      link.href = fallbackUrl
    }
  }

  document.head.append(link)
}

function normalizeFontFamily(fontFamily) {
  return String(fontFamily || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

function quoteCssString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function booleanOrDefault(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }

  return Boolean(value)
}

function formatNumber(value) {
  return Number(value).toLocaleString(LOCALE)
}

function hexToRgb(color) {
  const normalizedColor = String(color || '').replace('#', '')
  const safeColor = normalizedColor.length === 3 ? normalizedColor.replace(/(.)/g, '$1$1') : normalizedColor
  const value = Number.parseInt(safeColor, 16)

  if (Number.isNaN(value)) {
    return [255, 255, 255]
  }

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function numberOrDefault(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function numberOrZero(value) {
  return numberOrDefault(value, 0)
}

function stringOrDefault(value, fallback) {
  return value === undefined || value === null ? fallback : String(value)
}
