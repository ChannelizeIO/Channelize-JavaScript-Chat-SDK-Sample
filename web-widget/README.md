# Channelize JavaScript Widget UI kit

This contains the customization capabilities you can achieve by using our JavaScript Sample App created using our [JavaScript SDK](https://docs.channelize.io/javascript-sdk-introduction-overview). This Sample App allows you to add a customized chat widget / docked layout on your website.

### Features : ###
- Highly customization
- Easy to implement
- Ready to use
- Multiple use cases

#### You can also check out our demo [here](https://demo.channelize.io).

## Getting Started

Follow the below steps to add Channelize widget / docked layout on your website.

##### Step 1: Add widget #####

Add the Channelize widget div in the body tag of your website.
  
```html
<body>
  <div id="ch_widget"></div>
</body>
```

##### Step 2: Import Channelize widget file #####

Import the `widget.Channelize.js` file after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/apps/web-widget/1.0.0/widget.Channelize.js"></script>
```

##### Step 3: Import Channelize JS-SDK #####

Import the [`Channelize JS-SDK`](https://docs.channelize.io/javascript-sdk-introduction-overview) after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/apps/web-widget/1.0.0/channelize-websdk-min.js"></script>
```

##### Step 4: Create widget object #####

Create widget object and call the load function which will require your public key as an argument.

```javascript
<script>
  const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
  channelizeWidget.load();
</script>
```

## Customizing the widget

> Pre-requisites: Have Node v8.x+ installed.

1. Update Channelize widget file URL in your index.html file.
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

###### For UI Customizations : ######

- Customize the UI of widget / docked layout as per your choice by changing the values of predefined variables in `./web-widget/src/scss/variables.scss file` or by making changes in the code of the elements/content.


###### For Function Customizations : ######

- Add your functions or make code-level changes.


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
            |-- adapter.js                    - Channelize JS SDK functions
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
