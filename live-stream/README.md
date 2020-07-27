# Channelize JavaScript Live Steam UI kit

This JavaScript Sample app is built using our [JavaScript SDK](https://docs.channelize.io/javascript-sdk-introduction-overview), this will help you add a live stream layout to your website which can be customized to build chat exactly how you want, and unbelievably quickly. It enables achieving a beautiful chat app interface for all use-cases like live chat, online consultation & tutoring, team collaboration, messaging, customer support and gaming chat. 


#### See in Action [here](https://demo.channelize.io/livestream).

## Getting Started

Follow the below steps to add the Channelize live stream layout to your website.

##### Step 1: Add Live Stream #####

Add the Channelize live stream div in the body tag of your website.
  
```html
<body>
    <div id="ch_live_stream"></div>
</body>
```

##### Step 2: Import Channelize live stream file #####

Import the `liveStream.Channelize.js` file after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/apps/live-stream/2.1.0/liveStream.Channelize.js"></script>
```

##### Step 3: Import Channelize JS-SDK #####

Import the [`Channelize JS-SDK`](https://docs.channelize.io/javascript-sdk-introduction-overview) after body tag in your website.

```javascript
<script src="https://cdn.channelize.io/sdk/4.3.0/browser.js"></script>
```

##### Step 4: Create live stream object #####

Create Channelize.io object and call the load function which will require your public key as an argument.

```javascript
<script>
    const channelizeLiveStream = new ChannelizeLiveStream('PUBLIC_KEY');
    channelizeLiveStream.load();
</script>
```

## Customizing the live stream

> Pre-requisites: Have Node v8.x+ installed.

1. Update Channelize live stream file URL in your index.html file.
```javascript
<script src="./dist/liveStream.Channelize.js"></script>
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

- Customize the UI of chat live stream layout as per your choice by changing the values of predefined variables in `./live-stream/src/scss/variables.scss file` or by making changes in the code of the elements/content.


###### For Function Customizations : ######

- Add your own functions or make code-level changes.


## File Structure of Channelize Sample App
```
    |-- dist
        |-- liveStream.Channelize.js          - Channelize Live Stream Bundle file
    |-- node_modules
        |-- ...                               - (node packages)
    |-- src
        |-- js
            |-- components  
                |-- conversation.js           - conversation screen class
                |-- login.js                  - login class
                |-- threads.js                - threads screen class
            |-- adapter.js                    - Channelize JS SDK functions
            |-- constants.js                  - const variables
            |-- utility.js                    - utility functions
            |-- liveStream.js                 - live stream main functions
        |-- scss
            |-- main.scss                     - main style class
            |-- variables.scss                - css variables
    |-- index.html                            - sample file
    |-- package.json                          - npm package
    |-- README.md                             - description file
    |-- server.js                             - server file
    |-- webpack.config.js                     - webpack setting
```