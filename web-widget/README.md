# Channelize JavaScript Widget UI kit

This JavaScript Sample app is built using our [JavaScript SDK](https://docs.channelize.io/javascript-sdk-introduction-overview), this will help you add a chat widget / docked layout to your website which can be customized to build chat exactly how you want, and unbelievably quickly. It enables achieving a beautiful chat app interface for all use-cases like live chat, online consultation & tutoring, team collaboration, messaging, customer support and gaming chat. 


#### See in Action [here](https://demo.channelize.io).

## Getting Started

Follow the below steps to add the Channelize chat widget / docked layout to your website.

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
<script src="https://cdn.channelize.io/apps/web-widget/2.0.2/widget.Channelize.js"></script>
```

##### Step 3: Import Channelize JS-SDK #####

Import the [`Channelize JS-SDK`](https://docs.channelize.io/javascript-sdk-introduction-overview) after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/sdk/4.2.0/browser.js"></script>
```

##### Step 4: Create widget object #####

Create Channelize.io object and call the load function which will require your public key as an argument.

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
sudo npm install
```

3. Build your changes.
```bash
sudo npm run build
```
        
4. Start sample app.
```bash
npm start
```

###### For UI Customizations : ######

- Customize the UI of chat widget / docked layout as per your choice by changing the values of predefined variables in `./web-widget/src/scss/variables.scss file` or by making changes in the code of the elements/content.


###### For Function Customizations : ######

- Add your own functions or make code-level changes.


## Advanced

###  Load for logged-in user
Load the Channelize for an already logged-in user, you can use `loadWithUserId()` method instead of load() method. loadWithUserId() method takes two arguments user-id and access token. you can get access token in the response of login api call.

```html
...

    <script>
        const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
        channelizeWidget.loadWithUserId('userId', 'accessToken');
    </script>
</html>
```

### Load Recent Conversations Screen
Load the recent conversations screen using `loadRecentConversation()` method. It takes two arguments user-id and access token.

```html
...

    <script>
        const channelizeWidget = new ChannelizeWidget('PUBLIC_KEY');
        channelizeWidget.loadRecentConversation('userId', 'accessToken');
    </script>
</html>
```

### Load Conversation Window
Load conversation window using `loadConversationWindow()` method. It requires conversation-id as argument.

```js
    loadConversationWindow(conversationId)
```

### Load Conversation Window By User-Id
Load conversation window using `loadConversationWindowByUserId(userId)` method. It requires user-id as argument.

```js
    loadConversationWindowByUserId(userId)
```

## File Structure of Channelize Sample App
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
                |-- members.js                - members class
                |-- recent-conversation.js    - recent conversation class
                |-- search.js                 - search class
                |-- thread.js                 - thread screen class
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