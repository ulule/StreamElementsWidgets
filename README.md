### How to install our custom widget

To install our widget, you can use the files in our repository or use the CDN links so that they are always up-to-date. We recommend that you use the code below, which you can copy and paste into your new custom widget; this code contains all the CSS and JS you need.

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

### Our event you can use to to custom your own widget :

"newUserSub" : New ulule sub <br/>
Data example:

```
{
    userName: 'Lou', // user name
    subName: 'Level 1', //name of your sub
}

```

"tip": Tip<br/>
Data example:

```
{
    tip: 10, // amount of the tip
    userName: 'Lou', // user name
}

```

"subYears": Reccurent sub<br/>
Data example:

```
{
    userName: 'Lou', // user name
    subName: 'Level 1', //name of your sub
    mounths: 2 // month since user is sub
    years: 10 // years since user is sub
}

```

"birth": Birth event<br/>
Data example:

```
{
    userName: 'Lou', // user name
    subName: 'Level 1', //name of your sub
    mounths: 2 // month since user is sub
}
```
