### How to install our custom widget

To install our widget, you can use the files in our repository or use the CDN links so that they are always up-to-date. We recommend that you use the code below, which you can copy and paste into your new custom widget; this code contains all the CSS and JS you need.

Warning: CND have 7 days cache, we are checking another way to do this.

## Alert widget

### Steps:

- Create a new custom widget in your StreamElements dashboard.
- Copy and paste the provided code into the new widget.
- Make sure to link your StreamElements ID in your backoffice to receive the events.
  <br /><br />

The code below has everything you need to get the widget up and running:

HTML :

```
<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet">
<link rel="stylesheet" href='https://cdn.jsdelivr.net/gh/ulule/StreamElementsCustom@main/membershipSub/index.css' />

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-2huaZvOR9iDzHqslqwpR87isEmrfxqyWOF7hr7BY6KG0+hVKLoEXMPUJw3ynWuhO" crossorigin="anonymous"></script>
<script src='https://cdn.jsdelivr.net/gh/ulule/StreamElementsCustom@main/membershipSub/index.js' crossorigin="anonymous"></script>

<div id='ulule'></div>
```

### Our event you can use to customize your own widget :

Event name: "sub": <br/>
Data example:

```
{
    userName: 'Lou', // user name
    subName: 'Level 1', //name of your sub
    months: 2 // month since user is sub
    years: 10 // years since user is sub
    tip: '2 euros' // tip amount
}
```

You can use this code for example :

```
window.addEventListener("onWidgetLoad", async (obj) => {
  apiToken = obj.detail.channel.apiToken;

  const socket = io("https://realtime.streamelements.com", {
    transports: ["websocket"],
  });
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("authenticated", onAuthenticated);
  socket.on("unauthorized", console.error);

  socket.on("sub", (data) => {
    const newElement = document.createElement("div");
    console.log(data);
    // Votre code ici
  });

  function onConnect() {
    console.log("Successfully connected to the websocket");
    // socket.emit('authenticate', {method: 'oauth2', token: accessToken});
    //socket.emit('authenticate', {method: 'jwt', token: jwt});
    socket.emit("authenticate", { method: "apikey", token: apiToken });
  }

  function onDisconnect() {
    console.log("Disconnected from websocket");
    // Reconnect
    onConnect();
  }

  function onAuthenticated(data) {
    console.log(`Successfully connected to channel `);
  }
});

```

And don't forget to add this line into your HTML if you create your own widget and use the code above :

```
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-2huaZvOR9iDzHqslqwpR87isEmrfxqyWOF7hr7BY6KG0+hVKLoEXMPUJw3ynWuhO" crossorigin="anonymous"></script>
```

### Test:

If you are a developper and understand this, you can made a `POST` with this data for example :

```
{
    "event": "sub",
    "data": {
        "subName": "Nom",
        "userName": "Mathilde",
        "months": 1,
        "years": 3,
        "tip": "20 euros"
    }
}
```

```
https://api.streamelements.com/kappa/v2/channels/[channel-id-top-replace]/socket
```

don't forget to add your bearer key from streamelements to the header too.

## Progress widget

### Steps:

- Create a new custom widget in your StreamElements dashboard.
- Copy and paste the provided code into the new widget.
- Make sure to link your StreamElements ID in your backoffice to receive the events.
  <br /><br />

The code below has everything you need to get the widget up and running:

HTML :

```
<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet">
<link rel="stylesheet" href='https://cdn.jsdelivr.net/gh/ulule/StreamElementsWidgets@main/src/progress/index.css' />

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-2huaZvOR9iDzHqslqwpR87isEmrfxqyWOF7hr7BY6KG0+hVKLoEXMPUJw3ynWuhO" crossorigin="anonymous"></script>
<script src='https://cdn.jsdelivr.net/gh/ulule/StreamElementsWidgets@main/src/progress/index.js' crossorigin="anonymous"></script>

<div class="amount"></div>
  <div class="progress-bar">
    <span class="progress-bar__content"></span>
  </div>
<div class="stretch-goal"></div>
```
