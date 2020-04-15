import React, { PureComponent } from 'react';
import { View, Image, TextInput, TouchableOpacity, FlatList, Text, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import uuidv4 from 'uuid/v4';
import { 
  getActiveConversation,
  getMessageList,
  sendMessageToConversation,
  sendMessageToUserId,
  loadMoreMessages as loadMoreMessagesAction
} from '../actions';
import { withConnectContext } from '../context';
import { connect } from 'react-redux';
import { modifyMessageList, updateTimeFormat } from '../utils';

class ConversationWindow extends PureComponent {
    constructor(props) {
    super(props);

    this.state = {
      text: '',
      needActiveConversation: false
    }

    this.limit = 30;
    this.skip = 0;
    this.sendMessage = this.sendMessage.bind(this);
    this.loadMoreMessage = this.loadMoreMessage.bind(this);
  }

  componentDidMount() {
    const { client, userId, conversationId } = this.props;
    this.props.getActiveConversation(client, {userId, conversationId})
  }

  componentDidUpdate(prevProps) {
    const { needActiveConversation } = this.state;
    if (!this.props.activeConversation) {
      return;
    }

    if (!needActiveConversation && !this.props.activeConversation.id) {
      this.setState({needActiveConversation: true});
    }

    if (needActiveConversation && this.props.list.length && !this.props.activeConversation.id && !this.props.conversationLoading) {
      const message = this.props.list[0];
      this.props.getActiveConversation(this.props.client, {conversationId: message.conversationId})
    }

    if (needActiveConversation && this.props.activeConversation.id) {
      this.setState({needActiveConversation: false});
    }

    if (needActiveConversation || this.props.list.length) {
      return
    }

    // Load messages after loading active conversation
    if ((!prevProps.activeConversation && this.props.activeConversation.id) || (prevProps.activeConversation && this.props.activeConversation.id !== prevProps.activeConversation.id)) {
      let messageListQuery = this.props.activeConversation.createMessageListQuery();
      messageListQuery.limit = this.limit;
      messageListQuery.skip = this.skip;
      this.props.getMessageList(messageListQuery)
    }
  }

  _renderMessage(message) {
    const { client } = this.props;
    return (
      <View key={message.id} style={message.isUser ? styles.messageRight : styles.messageLeft}>
        { message.owner.isShow && !message.isUser &&
          <View>
            <Text
              style={styles.messageOwnerName}
            >
              {message.owner.displayName}
            </Text>
          </View>
        }
        <View style={message.isUser ? styles.messageRightBubble : styles.messageLeftBubble}>
          <Text style={message.isUser ? styles.messageRightText : styles.messageLeftText}>{message.body}</Text>
        </View>
        <View>
          <Text
            style={styles.messageCreatedText}
          >
            {message.createdAt}
          </Text>
        </View>
      </View>
    )
  }

  sendMessage() {
    const { activeConversation, client } = this.props;
    const { text } = this.state;
    let body = {
      id: uuidv4(),
      body: text
    }
    this.setState({text: ''})

    if (activeConversation.id) {
      this.props.sendMessageToConversation(activeConversation, body)
    } else {
      const userId = activeConversation.user.id;
      body.userId = userId;
      this.props.sendMessageToUserId(client, userId, body)
    }
  }

  loadMoreMessage() {
    const { activeConversation, list, loadingMoreMessage, allMessageLoaded } = this.props;
    if (loadingMoreMessage || allMessageLoaded || list.length < this.limit) {
      return
    }

    // Set skip
    this.skip = list.length;

    let messageListQuery = activeConversation.createMessageListQuery();
    messageListQuery.limit = this.limit;
    messageListQuery.skip = this.skip;
    this.props.loadMoreMessagesAction(messageListQuery)
  }

  render() {
    let { activeConversation, list, conversationLoading, messageLoading, error, client } = this.props;
    const { text } = this.state;

    if ((!activeConversation || conversationLoading) && !list.length) {
      return (
        <View>
          <Text>Loading...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View>
          <Text>Something Went Wrong</Text>
        </View>
      )
    }

    let headerImage;
    let headetTitle;
    let headerSubtitle;
    if (!activeConversation.isGroup) {
      headerImage = activeConversation.user.profileImageUrl;
      headetTitle = activeConversation.user.displayName;
      headerSubtitle = activeConversation.user.isOnline ? 'Online' : 'Last seen ' + updateTimeFormat(activeConversation.user.lastSeen);
    } else {
      headerImage = activeConversation.profileImageUrl;
      headetTitle = activeConversation.title;
      headerSubtitle = activeConversation.memberCount + ' Members';
    }

    list = modifyMessageList(client, list);
    return (
      <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerImage}>
                <Image source={{uri: headerImage}} 
                  style={{width: 30, height: 30}}
                />
              </View>
              <View style={styles.headerTitle}>
                <Text style={styles.headerTitleText}>{headetTitle}</Text>
                <Text style={styles.headerSubtitleText}>{headerSubtitle}</Text>
              </View>
            </View>
            <View style={styles.messageListContainer}>
              { messageLoading &&
                <View>
                  <Text>Loading...</Text>
                </View>
              }
              { !messageLoading &&
                <FlatList
                showsVerticalScrollIndicator={false}
                data={list}
                onScroll={() => console.log('Scrolling')}
                extraData={true}
                onEndReached={this.loadMoreMessage}
                ListEmptyComponent={<Text>No Messsage Found</Text>}
                inverted
                renderItem={({item: message}) => this._renderMessage(message)}
                keyboardShouldPersistTaps="always"
                keyExtractor={(item) => 
                  item.id ||
                  item.created_at ||
                  (item.date ? item.date.toISOString() : false) ||
                  uuidv4()
                }
              />
            }
            </View>
            <View style={styles.messageComposer}>
               <TextInput
                  multiline={true}
                  style={styles.messageComposerInput}
                  placeholder="Type a message..."
                  value={text}
                  onChangeText={(text) => this.setState({text})} 
                />
                <View style={styles.messageComposerSendButton}>
                 <Icon 
                    onPress={this.sendMessage} 
                    name ="send" 
                    size={20} 
                    color={text ? "#1A6DF5" : "#544867"}
                    disabled={text ? false : true} />
                </View>
            </View>
      </View>
    )
  }
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    backgroundColor: '#FFFFFF',
    flex:1,
    flexDirection: 'column'
  },
  header: {
    padding: 10,
    flexDirection: 'row',
    backgroundColor: '#1A6DF5',
  },
  headerImage: {
    justifyContent: 'center',
    width: '10%',
    marginRight: 10
  },
  headerTitle: {
    width: '40%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  headerTitleText: {
    color: "#FFFFFF",
    textTransform: 'capitalize'
  },
  headerSubtitleText: {
    color: "#FFFFFF",
    textTransform: 'capitalize'
  },
  messageListContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'column',
    flex: 10
  },
  flatList: {
  },
  messageLeft: {
     alignSelf: 'flex-start',
     marginBottom: 20,
  },
  messageLeftBubble: {
     padding: 20,
     backgroundColor: '#F5F5F5'
  },
  messageLeftText: {
    color: "#544867"
  },
  messageCreatedText: {
    color: "#878d99"
  },
  messageOwnerName: {
    color: "#878d99",
    textTransform: 'capitalize'
  },
  messageRight: {
    alignSelf: 'flex-end',
    marginBottom: 20
  },
  messageRightBubble: {
    padding: 20,
    backgroundColor: "#1A6DF5"
  },
  messageRightText: {
    color: "#FFFFFF"
  },
  messageComposer: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    flexDirection: 'row'
  },
  messageComposerInput: {
    width: "90%",
  },
  messageComposerSendButton: {
    justifyContent: 'center'
  }
};

function mapStateToProps({ conversation, message }) {
  const { activeConversation } = conversation;
  const { list, loadingMoreMessage, allMessageLoaded } = message;

  const conversationLoading = conversation.loading;
  const messageLoading = message.loading;

  let error = conversation.error || message.error;
  return { 
    activeConversation,
    list,
    conversationLoading,
    messageLoading,
    error,
    loadingMoreMessage,
    allMessageLoaded
  };
}

ConversationWindow = withConnectContext(ConversationWindow);

export default connect(
  mapStateToProps,
  { 
    getActiveConversation,
    getMessageList,
    sendMessageToConversation,
    sendMessageToUserId,
    loadMoreMessagesAction }
)(ConversationWindow);