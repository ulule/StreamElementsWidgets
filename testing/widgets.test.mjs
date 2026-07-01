import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const ALERT_SCRIPT_URL = new URL('../src/alert/index.js', import.meta.url)
const PROGRESS_SCRIPT_URL = new URL('../src/progress/index.js', import.meta.url)
const quietConsole = {
  error() {},
  log() {},
  warn() {},
}

function createWindow() {
  const listeners = new Map()

  return {
    addEventListener(type, listener) {
      const typeListeners = listeners.get(type) || []
      typeListeners.push(listener)
      listeners.set(type, typeListeners)
    },
    async dispatch(type, detail) {
      for (const listener of listeners.get(type) || []) {
        await listener({ detail })
      }
    },
  }
}

function createDocument() {
  const cssVariables = new Map()
  const links = []
  const wrapper = {
    children: [],
    append(element) {
      this.children.push(element)
    },
  }

  return {
    cssVariables,
    documentElement: {
      dataset: {},
      style: {
        setProperty(name, value) {
          cssVariables.set(name, value)
        },
      },
    },
    getElementById(id) {
      return id === 'ulule-widget-container' ? wrapper : null
    },
    head: {
      append(link) {
        links.push(link)
      },
    },
    links,
    querySelectorAll(selector) {
      return selector === 'link[data-ulule-google-font]' ? links : []
    },
    createElement(tagName) {
      return {
        children: [],
        dataset: {},
        innerHTML: '',
        style: {},
        append(element) {
          this.children.push(element)
        },
        remove() {
          const index = wrapper.children.indexOf(this)
          if (index !== -1) wrapper.children.splice(index, 1)
        },
        tagName,
      }
    },
    wrapper,
  }
}

async function loadJSON(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'))
}

function markupToText(markup) {
  return markup
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function createAlertHarness(fieldData = {}) {
  const source = await readFile(ALERT_SCRIPT_URL, 'utf8')
  const window = createWindow()
  const document = createDocument()
  const context = vm.createContext({
    Audio: class {
      play() {
        return Promise.resolve()
      }
    },
    console: quietConsole,
    document,
    setTimeout() {},
    window,
  })

  vm.runInContext(source, context, { filename: ALERT_SCRIPT_URL.pathname })
  await window.dispatch('onWidgetLoad', { fieldData })

  return {
    document,
    async send(payload) {
      await window.dispatch('onEventReceived', {
        event: payload.data,
        listener: payload.event,
      })
    },
  }
}

const ALERT_CASES = [
  {
    expected: 'Jane Doe vient de choisir la contrepartie « Le pack découverte » + un don de 5 € !',
    fixture: './alert-events/reward-with-tip.json',
  },
  {
    expected: "Alex Martin vient de choisir les contreparties « Le pack découverte » + « L'édition collector » !",
    fixture: './alert-events/multi-reward.json',
  },
  {
    expected: 'Merci Une personne anonyme pour le don de 18 € !',
    fixture: './alert-events/donation-only-anonymous.json',
  },
  {
    expected: 'Merci Camille Durand pour le nouvel abonnement à Une communauté chouette au niveau « Niveau soutien » !',
    fixture: './alert-events/paid-membership.json',
  },
  {
    expected:
      'Merci Samira Petit pour le don de 5 € à Une communauté chouette ! Abonné·e au niveau « Niveau soutien » depuis 1 an et 3 mois',
    fixture: './alert-events/membership-tip.json',
  },
  {
    expected: 'Merci Louis Morel pour le don mensuel de 8 € depuis 6 mois à Une communauté chouette !',
    fixture: './alert-events/recurring-donation.json',
  },
]

for (const alertCase of ALERT_CASES) {
  test(`Alert renders ${alertCase.fixture}`, async () => {
    const harness = await createAlertHarness()
    await harness.send(await loadJSON(alertCase.fixture))

    assert.equal(harness.document.wrapper.children.length, 1)
    assert.equal(markupToText(harness.document.wrapper.children[0].innerHTML), alertCase.expected)
  })
}

test('Alert keeps free-tier memberships disabled by default', async () => {
  const harness = await createAlertHarness()
  await harness.send(await loadJSON('./alert-events/free-tier-membership.json'))

  assert.equal(harness.document.wrapper.children.length, 0)
})

test('Alert renders free-tier memberships when enabled', async () => {
  const harness = await createAlertHarness({ enableFreeTierAlert: true })
  await harness.send(await loadJSON('./alert-events/free-tier-membership.json'))

  assert.equal(
    markupToText(harness.document.wrapper.children[0].innerHTML),
    'Merci Nora Bernard pour le nouvel abonnement gratuit au niveau « Niveau gratuit » !',
  )
})

test('Alert escapes event-provided HTML', async () => {
  const payload = await loadJSON('./alert-events/reward-with-tip.json')
  payload.data.user.user_name = '<img src=x onerror=alert(1)>'
  const harness = await createAlertHarness()

  await harness.send(payload)

  const markup = harness.document.wrapper.children[0].innerHTML
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(markup, /<img src=x/)
})

function createJQueryMock() {
  const elements = new Map()

  function getElement(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        classes: new Set(),
        display: '',
        html: '',
        text: '',
        width: '',
      })
    }
    return elements.get(selector)
  }

  return {
    elements,
    jquery(target) {
      if (typeof target === 'object') {
        return {
          animate(properties, options) {
            Object.assign(target, properties)
            options.step.call(target)
          },
        }
      }

      const element = getElement(target)
      const api = {
        animate(properties) {
          if (properties.width !== undefined) element.width = properties.width
          return api
        },
        hide() {
          element.display = 'none'
          return api
        },
        html(value) {
          element.html = value
          return api
        },
        show() {
          element.display = 'block'
          return api
        },
        text(value) {
          element.text = value
          return api
        },
        toggleClass(className, force) {
          if (force) element.classes.add(className)
          else element.classes.delete(className)
          return api
        },
      }
      return api
    },
  }
}

async function createProgressHarness(stats, fieldData) {
  const source = await readFile(PROGRESS_SCRIPT_URL, 'utf8')
  const window = createWindow()
  const document = createDocument()
  const jqueryMock = createJQueryMock()
  let refreshInterval
  const context = vm.createContext({
    $: jqueryMock.jquery,
    console: quietConsole,
    document,
    fetch: async () => ({
      json: async () => stats,
      ok: true,
    }),
    SE_API: {
      getOverlayStatus: async () => ({ isEditorMode: true }),
    },
    setInterval(_callback, interval) {
      refreshInterval = interval
    },
    window,
  })

  vm.runInContext(source, context, { filename: PROGRESS_SCRIPT_URL.pathname })
  await window.dispatch('onWidgetLoad', { fieldData })
  await new Promise((resolve) => setImmediate(resolve))

  return {
    document,
    cssVariables: document.cssVariables,
    element(selector) {
      return jqueryMock.elements.get(selector)
    },
    refreshInterval() {
      return refreshInterval
    },
  }
}

test('Progress renders a financial base goal', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/base-goal-financial.json'), {
    projectNumericalId: 1,
    suffix: '€',
  })

  assert.equal(markupToText(harness.element('.amount').html), '3 240 € / 5 000 €')
  assert.equal(harness.element('.progress-bar__content').width, '64%')
  assert.equal(harness.element('.progress-bar__label').text, '64%')
  assert.equal(harness.element('.stretch-goal').display, 'none')
  assert.equal(harness.refreshInterval(), 20_000)
  assert.equal(harness.cssVariables.get('--ulule-progress-border-radius'), '4px')
})

test('Progress targets and displays the next stage', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/next-stage-financial.json'), {
    projectNumericalId: 1,
    suffix: '€',
  })

  assert.equal(harness.element('.progress-bar__content').width, '82%')
  assert.equal(harness.element('.stretch-goal').display, 'block')
  assert.equal(markupToText(harness.element('.stretch-goal').text), 'Prochain palier : 7 500 €')
})

test('Progress can hide the next stage', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/next-stage-financial.json'), {
    projectNumericalId: 1,
    showNextStageGoal: false,
    suffix: '€',
  })

  assert.equal(harness.element('.progress-bar__content').width, '100%')
  assert.equal(harness.element('.progress-bar__label').text, '124%')
  assert.equal(harness.element('.stretch-goal').display, 'none')
})

test('Progress supports a manually configured presale suffix', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/presale-next-stage.json'), {
    projectNumericalId: 1,
    showSuffixOnCurrentValue: false,
    suffix: 'préventes',
  })

  assert.equal(markupToText(harness.element('.amount').html), '50 704 / 50 000 préventes')
  assert.equal(markupToText(harness.element('.stretch-goal').text), 'Prochain palier : 60 000 préventes')
})

test('Progress preserves the legacy presale suffix', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/presale-next-stage.json'), {
    currency: '€',
    presaleSuffix: 'préventes',
    projectNumericalId: 1,
  })

  assert.equal(markupToText(harness.element('.amount').html), '50 704 / 50 000 préventes')
  assert.equal(markupToText(harness.element('.stretch-goal').text), 'Prochain palier : 60 000 préventes')
})

test('Progress allows an explicitly empty suffix', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/base-goal-financial.json'), {
    projectNumericalId: 1,
    suffix: '',
  })

  assert.equal(markupToText(harness.element('.amount').html), '3 240 / 5 000')
})

test('Progress shows an editor error without a project ID', async () => {
  const harness = await createProgressHarness(await loadJSON('./progress-stats/base-goal-financial.json'), {})

  assert.equal(markupToText(harness.element('.amount').html), 'Please input a valid project ID')
})

test('Widgets select a contrasting logo for the block color', async () => {
  const stats = await loadJSON('./progress-stats/base-goal-financial.json')
  const alertOnLight = await createAlertHarness({ blockColor: '#FFFFFF' })
  const alertOnDark = await createAlertHarness({ blockColor: '#121212' })
  const progressOnLight = await createProgressHarness(stats, { blockColor: '#FFFFFF', projectNumericalId: 1 })
  const progressOnDark = await createProgressHarness(stats, { blockColor: '#121212', projectNumericalId: 1 })

  assert.equal(alertOnLight.document.documentElement.dataset.ululeAlertBackground, 'light')
  assert.equal(alertOnDark.document.documentElement.dataset.ululeAlertBackground, 'dark')
  assert.equal(progressOnLight.document.documentElement.dataset.ululeProgressBackground, 'light')
  assert.equal(progressOnDark.document.documentElement.dataset.ululeProgressBackground, 'dark')
})

test('Widget field definitions expose the approved defaults', async () => {
  const alertFields = await loadJSON('../src/alert/fields.json')
  const progressFields = await loadJSON('../src/progress/fields.json')

  assert.equal(alertFields.notificationSoundEnabled.value, false)
  assert.equal(alertFields.enableFreeTierAlert.value, false)
  assert.equal(progressFields.refreshInterval.value, 20)
  assert.equal(progressFields.progressBorderRadius.value, 4)
  assert.equal(progressFields.showNextStageGoal.value, true)
  assert.equal(progressFields.targetPercentage, undefined)
})
