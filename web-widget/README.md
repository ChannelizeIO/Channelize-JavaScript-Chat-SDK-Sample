# Channelize JavaScript Widget UI kit
This is a ready to use UI kit of Channelize chat application.
It uses [Channelize JS-SDK](https://docs.channelize.io/javascript-sdk-introduction-overview) internally to provide end to end chat support. It provide highly customization in UI as well as functions.

### Features : ###
- Highly customization
- Easy to implement
- Ready to use
- Multiple use cases

##### You can also check out our demo [here](https://demo.channelize.io).

## Getting Started

##### Step 1: Add widget #####

You must add the channelize widget div in the body tag of your website.
  
```html
<body>
  <div id="ch_widget"></div>
</body>
```

##### Step 2: Import Channelize widget file #####

Import the `widget.Channelize.js` file after body tag.

```javascript
<script src="https://cdn.channelize.io/apps/web-widget/1.0.0/widget.Channelize.js"></script>
```

##### Step 3: Import Channelize JS-SDK #####

Import the [`Channelize JS-SDK`](https://docs.channelize.io/javascript-sdk-introduction-overview) after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/apps/web-widget/1.0.0/channelize-websdk-min.js"></script>
```

##### Step 4: Create widget object #####

Create widget object and call the load function which takes public key as an argument.

```javascript
<script>
  const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
  channelizeWidget.load();
</script>
```

## Customizing the widget
You can also customize the widget according to your website. We also provide some predefine variables for UI customization, along with this you can also change UI of any content in the code.
You can create your JS functions and add those in any event listener or function for advanced customization.

> Require Node v8.x+ installed.

1. Update Channelize widget file URL in index.html file.
```javascript
<script src="./dist/widget.Channelize.js"></script>
```

2. Install required npm packages.
```bash
npm install
```

3. Build your changes.
```bash
npm run build
```
        
4. Start sample app.
```bash
npm start
```

###### UI Customization : ######

1. We have defined some variables to modify colours and position of main UI contents. So you can change those values in ./web-widget/src/scss/variables.scss file.

2. You can also update the UI of any content by changing in their code.

###### Function Customization : ######

1. You can add your functions or can make code level changes in functions.


## Advanced  
### Change the application :
If you want to change your current application, you just need to change the `PUBLIC_KEY` in `index.html` file.

```html
...

  <script>
    const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
    channelizeWidget.load();
  </script>
</html>
```

###  Load with already connected user :
If you want to load the Channelize for already connected user, you can use loadWithConnect() method instead of load() method. loadWithConnect() method takes two arguments user-id and access token. you can get access token in the response of login api call.

```html
...

  <script>
    const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
    channelizeWidget.loadWithConnect('userId', 'accessToken');
  </script>
</html>
```

### Load Recent Conversation Screen :
If you want to open only recent conversation, you can use `loadRecentConversation()` method. It takes two arguments user-id and access token.

```html
...

  <script>
    const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
    channelizeWidget.loadRecentConversation('userId', 'accessToken');
  </script>
</html>
```

### Load Conversation Window :
If you want to load conversation window, then you can use `loadConversationWindow()` method. It takes two arguments otherMemberId and conversationId.

```html
...

  <script>
    const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
    channelizeWidget.loadConversationWindow('otherMemberId', 'conversationId');
  </script>
</html>
```

## File Structure of Channelize Sample App :
```
    |-- dist
        |-- widget.Channelize.js              - Channelize Widget Bundle file
    |-- node_modules
        |-- ...                               - (node packages)
    |-- src
        |-- js
            |-- components  
                |-- conversation-window.js    - conversation screen class
                |-- login.js                  - login class
                |-- recent-conversation.js    - recent conversation class
                |-- search.js                 - search class
            |-- adapter.js                    - channelize JS SDK functions
            |-- constants.js                  - const variables
            |-- utility.js                    - utility functions
            |-- widget.js                     - widget main functions
        |-- scss
            |-- main.scss                     - main style class
        |-- variables.scss                    - css variables
    |-- index.html                            - sample file
    |-- package.json                          - npm package
    |-- README.md                             - description file
    |-- server.js                             - server file
    |-- webpack.config.js                     - webpack setting
```
