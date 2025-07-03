window.addEventListener('onWidgetLoad', async (obj) => {
  const apiToken = obj.detail.channel.apiToken

  const socket = io('https://realtime.streamelements.com', {
    transports: ['websocket'],
  })
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('authenticated', onAuthenticated)
  socket.on('unauthorized', console.error)

  function showElement(newElement) {
    const wrapper = document.getElementById('ulule-widget-container')
    wrapper?.append(newElement)

    setTimeout(() => {
      newElement.remove()
    }, '5000')
  }

  function logo() {
    const logo = document.createElement('div')
    logo.innerHTML = `<div class="logo"></div>`
    return logo.outerHTML
  }

  socket.on('contribution', (data) => {
    const cardElement = document.createElement('div')
    const userName = Boolean(data.userName) ? data.userName : 'Une personne anonyme'
    const tip = Number(data.tip)

    if (!tip) {
      // Cas de contribution sans don libre
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>${userName} vient de choisir la contrepartie « ${data.rewardName} » !</p>
        </div>`
    } else {
      // Cas de contribution avec don libre
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>${userName} vient de choisir « ${data.rewardName} » + un don de ${tip} € !</p>
        </div>`
    }

    showElement(cardElement)
  })

  socket.on('sub', (data) => {
    const cardElement = document.createElement('div')

    //Si il y a un tip
    if (data.tip) {
      // Cas d'utilisateur·ice déja abonné·e
      if (data.subName) {
        if (data.years !== 0 && data.years !== 'null' && data.years !== '0' && data.years !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Abonné ${data.userName} Niveau ${data.subName} depuis ${data.years} an(s) et ${data.months} mois, merci pour le don de ${data.tip} !</p>
          </div>`
        } else if (data.months !== 0 && data.months !== 'null' && data.months !== '0' && data.months !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Abonné ${data.userName} Niveau ${data.subName} depuis ${data.months} mois, merci pour le don de ${data.tip} !</p>
          </div>`
        } else {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Abonné ${data.userName} Niveau ${data.subName}, merci pour le don de ${data.tip} !</p>
          </div>`
        }
      } else {
        // Si c'est juste un don
        cardElement.innerHTML = `
            <div class="card slideDown">
              <div class="logo"></div>
              <p>Don de ${data.tip}: merci ${data.userName} !</p>
            </div>`
      }
    } else {
      // Cas d'utilisateur·ice déja abonné·e, sans don
      if (data.months) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci à ${data.userName} abonné Ulule Niveau ${data.subName} depuis ${data.months} mois !</p>
          </div>`
      }

      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Nouvel abonnement Ulule <span>${data.subName}</span> : merci <span>${data.userName}</span> !</p>
        </div>`
    }

    showElement(cardElement)
  })

  function onConnect() {
    console.log('[ulule-widget] Successfully connected to the websocket')
    socket.emit('authenticate', { method: 'apikey', token: apiToken })
  }

  function onDisconnect() {
    console.log('[ulule-widget] Lost connection to the websocket')
    console.log('[ulule-widget] Reconnecting…')
    onConnect()
  }

  function onAuthenticated(data) {
    console.log(`[ulule-widget] Successfully connected to channel ${data.channelId}`)
  }
})
