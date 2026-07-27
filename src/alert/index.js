const DEFAULT_LOCALE = 'fr'
const DEFAULT_SOUND_URL = 'https://cdn.jsdelivr.net/gh/ulule/StreamElementsWidgets/src/alert/positive-game-sound-4.ogg'

window.addEventListener('onWidgetLoad', (obj) => {
  const settings = normalizeSettings(obj.detail.fieldData || {})

  loadGoogleFont(settings.fontFamily)
  setCssVariables(settings)

  window.addEventListener('onEventReceived', handleEventReceived)

  function handleEventReceived(obj = {}) {
    const detail = obj.detail || {}

    const listener = obj.detail.listener
    const data = obj.detail.event

    if (data.listener === 'widget-button') {
      if (data.field === 'testNotification') {
        const emulated = new CustomEvent('onEventReceived', {
          detail: {
            listener: 'order',
            event: {
              currency: '€',
              order_total: '35',
              project: {
                lang: 'fr',
                title: {
                  fr: 'Un chouette projet',
                  en: 'A nice project',
                },
              },
              rewards: [
                {
                  price: '30',
                  title: {
                    fr: 'Le pack découverte',
                    en: 'Discovery pack',
                  },
                },
              ],
              tip: '5',
              user: {
                user_name: 'Jane Doe',
              },
            },
          },
        })
        window.dispatchEvent(emulated)
      }
    }

    if (detail.listener !== 'order') {
      return
    }

    handleOrder(detail.event)
  }

  function handleOrder(data = {}) {
    const tip = numberOrZero(data.tip)
    const userName = capitalize(data.user?.user_name || 'une personne anonyme')
    const locale = data.project?.lang || DEFAULT_LOCALE

    if (data.subscription) {
      return handleSubscriptionOrder(data, tip, userName, locale)
    }

    return handleRegularOrder(data, tip, userName, locale)
  }

  function handleRegularOrder(data, tip, userName, locale) {
    const { currency, rewards } = data
    const safeUserName = highlight(userName, 'username')
    const currencyLabel = currency || ''
    const tipLabel = tip > 0 ? ` + un don de ${highlight(`${formatAmount(tip)} ${currencyLabel}`, 'tip')}` : ''
    let message = null

    if (!rewards || rewards.length === 0) {
      const donationAmount = tip > 0 ? tip : numberOrZero(data.order_total)

      if (donationAmount > 0) {
        message = `Merci ${safeUserName} pour le don de ${highlight(`${formatAmount(donationAmount)} ${currencyLabel}`, 'tip')} !`
      }
    } else if (rewards.length === 1) {
      const reward = rewards[0]
      message = `${safeUserName} vient de choisir la contrepartie ${highlight(
        `« ${getI18n(reward.title, locale)} »`,
        'reward',
      )}${tipLabel} !`
    } else {
      const titles = rewards.map((reward) => highlight(`« ${getI18n(reward.title, locale)} »`, 'reward'))
      message = `${safeUserName} vient de choisir les contreparties ${titles.join(' + ')}${tipLabel} !`
    }

    if (message) {
      showCard(message)
    } else {
      console.warn('[ulule-widget] No regular order message could be formed', data)
    }
  }

  function handleSubscriptionOrder(data, tip, userName, locale) {
    const { currency, project, subscription } = data
    const isRecurring = data.is_recurring ?? subscription.is_recurring
    const months = numberOrZero(subscription.months)
    const reward = subscription.reward || {}
    const rewardPrice = numberOrZero(reward.price)
    const total = numberOrZero(subscription.total)
    const years = numberOrZero(subscription.years)
    const subscriptionTitle = reward.title ? getI18n(reward.title, locale) : null
    const projectTitle = project?.title ? getI18n(project.title, locale) : null
    const projectLabel = projectTitle ? `à ${highlight(projectTitle, 'project')}` : ''
    const durationLabel = getDurationLabel(years, months)
    const hasPaidMembership = subscriptionTitle && (rewardPrice > 0 || total > 0)

    let message = null

    if ((isRecurring && total > 0) || (!isRecurring && total > 0 && !subscriptionTitle)) {
      message = buildRecurringDonationMessage(userName, total, currency, durationLabel, projectLabel)
    } else if (hasPaidMembership) {
      message = buildMembershipMessage(userName, subscriptionTitle, durationLabel, years, months, projectLabel)
    } else if (subscriptionTitle && settings.enableFreeTierAlert) {
      message = `Merci ${highlight(userName, 'username')} pour le nouvel abonnement gratuit au niveau ${highlight(
        `« ${subscriptionTitle} »`,
        'reward',
      )} !`
    } else if (settings.enableFreeTierAlert) {
      message = `Merci ${highlight(userName, 'username')} pour le nouvel abonnement gratuit !`
    }

    if (tip > 0 && subscriptionTitle) {
      message = buildMembershipTipMessage(userName, tip, currency, subscriptionTitle, durationLabel, projectLabel)
    }

    if (message) {
      showCard(message)
    } else if (total > 0) {
      console.warn('[ulule-widget] No subscription message could be formed', data)
    }
  }

  function buildMembershipMessage(userName, subscriptionTitle, durationLabel, years, months, projectLabel) {
    const safeUserName = highlight(userName, 'username')
    const safeTitle = highlight(`« ${subscriptionTitle} »`, 'reward')
    const safeProjectLabel = projectLabel ? ` ${projectLabel}` : ''

    if (years === 0 && months === 0) {
      return `Merci ${safeUserName} pour le nouvel abonnement${safeProjectLabel} au niveau ${safeTitle} !`
    }

    return `Merci ${safeUserName} pour les ${escapeHtml(durationLabel)} d'abonnement au niveau ${safeTitle} !`
  }

  function buildMembershipTipMessage(userName, tip, currency, subscriptionTitle, durationLabel, projectLabel) {
    const currencyLabel = currency || ''
    const tipLabel = `Merci ${highlight(userName, 'username')} pour le don de ${highlight(
      `${formatAmount(tip)} ${currencyLabel}`,
      'tip',
    )}${projectLabel ? ` ${projectLabel}` : ''} !`
    const subscriptionLabel = `Abonné·e au niveau ${highlight(`« ${subscriptionTitle} »`, 'reward')}`

    if (!durationLabel) {
      return `${tipLabel} ${subscriptionLabel}`
    }

    return `${tipLabel} ${subscriptionLabel} depuis ${escapeHtml(durationLabel)}`
  }

  function buildRecurringDonationMessage(userName, total, currency, durationLabel, projectLabel) {
    const currencyLabel = currency || ''
    const baseMessage = `Merci ${highlight(userName, 'username')} pour le don mensuel de ${highlight(
      `${formatAmount(total)} ${currencyLabel}`,
      'tip',
    )}`

    if (!durationLabel) {
      return `${baseMessage}${projectLabel ? ` ${projectLabel}` : ''} !`
    }

    return `${baseMessage} depuis ${escapeHtml(durationLabel)}${projectLabel ? ` ${projectLabel}` : ''} !`
  }

  function showCard(message) {
    const cardElement = document.createElement('div')
    cardElement.innerHTML = `
      <div class="card slideDown">
        ${logo()}
        <p>${message}</p>
      </div>`

    showElement(cardElement)
    playNotificationSound()
  }

  function showElement(element) {
    const wrapper = document.getElementById('ulule-widget-container')
    wrapper?.append(element)

    setTimeout(() => {
      element.remove()
    }, settings.notificationScreenTime * 1000)
  }

  function logo() {
    return '<div class="logo"></div>'
  }

  function playNotificationSound() {
    if (!settings.notificationSoundEnabled) {
      return
    }

    const source = normalizeSoundSource(settings.notificationSound) || DEFAULT_SOUND_URL
    const audio = new Audio(source)
    audio.play().catch((error) => {
      console.warn('[ulule-widget] Failed to play notification sound', error)
    })
  }
})

function normalizeSettings(fieldData) {
  return {
    blockBorderRadius: numberOrDefault(fieldData.blockBorderRadius, 8),
    blockColor: fieldData.blockColor || '#FFFFFF',
    blockOpacity: numberOrDefault(fieldData.blockOpacity, 95),
    enableFreeTierAlert: booleanOrDefault(fieldData.enableFreeTierAlert, false),
    fontColor: fieldData.textColor || '#232221',
    fontFamily: normalizeFontFamily(fieldData.fontFamily) || 'Roboto',
    fontSize: numberOrDefault(fieldData.fontSize, 16),
    fontWeight: fieldData.fontWeight || '400',
    highlightColor: fieldData.highlightColor || '#007199',
    highlightFontSize: numberOrDefault(fieldData.highlightFontSize, 16),
    highlightFontWeight: fieldData.highlightFontWeight || '700',
    notificationSound: fieldData.notificationSound,
    notificationSoundEnabled: booleanOrDefault(fieldData.notificationSoundEnabled, false),
    notificationScreenTime: numberOrDefault(fieldData.notificationScreenTime, 3),
  }
}

function setCssVariables(settings) {
  const root = document.documentElement
  const rgb = hexToRgb(settings.blockColor)

  root.dataset.ululeAlertBackground = hasDarkBackground(rgb) ? 'dark' : 'light'
  root.style.setProperty('--ulule-alert-block-background-color-rgb', rgb.join(' '))
  root.style.setProperty('--ulule-alert-block-border-radius', `${settings.blockBorderRadius}px`)
  root.style.setProperty('--ulule-alert-block-opacity', String(Math.max(0, Math.min(settings.blockOpacity, 100)) / 100))
  root.style.setProperty('--ulule-alert-font-color', settings.fontColor)
  root.style.setProperty('--ulule-alert-font-family', quoteCssString(settings.fontFamily))
  root.style.setProperty('--ulule-alert-font-size', `${settings.fontSize}px`)
  root.style.setProperty('--ulule-alert-font-weight', settings.fontWeight)
  root.style.setProperty('--ulule-alert-highlight-color', settings.highlightColor)
  root.style.setProperty('--ulule-alert-highlight-font-size', `${settings.highlightFontSize}px`)
  root.style.setProperty('--ulule-alert-highlight-font-weight', settings.highlightFontWeight)
}

function capitalize(value) {
  const normalizedValue = String(value || '')
  return normalizedValue ? normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1) : ''
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatAmount(value) {
  return String(value).replace('.', ',')
}

function getDurationLabel(years, months) {
  const yearsLabel = getYearsLabel(years)

  if (yearsLabel && months > 0) {
    return `${yearsLabel} et ${months} mois`
  }

  if (yearsLabel) {
    return yearsLabel
  }

  if (months > 0) {
    return `${months} mois`
  }

  return null
}

function getI18n(resource, locale) {
  if (!resource) {
    return ''
  }

  if (typeof resource === 'string') {
    return resource
  }

  if (resource[locale]) {
    return resource[locale]
  }

  if (resource.en) {
    return resource.en
  }

  return Object.values(resource)[0] || ''
}

function getYearsLabel(years) {
  if (years === 1) {
    return '1 an'
  }

  if (years > 0) {
    return `${years} ans`
  }

  return null
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

function hasDarkBackground(rgb) {
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  return luminance < 0.179
}

function highlight(value, type) {
  return `<span class="highlight highlight--${type}">${escapeHtml(value)}</span>`
}

function normalizeSoundSource(source) {
  if (Array.isArray(source)) {
    return source[0]
  }

  if (source && typeof source === 'object') {
    return source.url || source.soundUrl || source.src
  }

  return source
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
