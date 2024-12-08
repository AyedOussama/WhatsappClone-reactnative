import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { auth, database } from "../firebase";
import { ref, onValue, push, serverTimestamp, off } from "firebase/database";
import useUserStore from "../zustand/userStore";



const ChatHeader = ({ user, onlineStatus, isTyping, onGoBack }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.headerUserInfo}>
        <View>
          <Text style={styles.headerUserName}>{user?.fullName}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              onlineStatus === 'Online' ? styles.onlineDot : styles.offlineDot
            ]} />
            <Text style={styles.statusText}>
              {isTyping ? 'Typing...' : onlineStatus}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};















const ChatScreen = () => {
  const route = useRoute();
  const { userId } = route.params; 
  const currentUser = auth.currentUser;

  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  // State Management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch users when component mounts
  useEffect(() => {
    const cleanup = fetchUsers();
    return () => {
      cleanup();
    };
  }, []);

  // Generate a unique conversation ID
  const conversationId =
    currentUser.uid > userId
      ? `${currentUser.uid}_${userId}`
      : `${userId}_${currentUser.uid}`;

  // Fetch messages from Realtime Database
  useEffect(() => {
    const messagesRef = ref(database, `messages/${conversationId}`);

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const msgs = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
          }))
        : [];
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp)); // Sort messages by timestamp
    });

    return () => {
      off(messagesRef); 
    };
  }, [conversationId]);

  // Send a new message
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    if (!currentUser) {
      console.error("User is not authenticated");
      return;
    }

    const sender = users[currentUser.uid];

    const messagesRef = ref(database, `messages/${conversationId}`);
    const messageObject = {
      senderId: currentUser.uid,
      senderName: sender?.fullName || currentUser.displayName || "Utilisateur",
      senderPhotoURL: sender?.photoUri || currentUser.photoURL || null,
      receiverId: userId,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
    };

    try {
      await push(messagesRef, messageObject);
      setNewMessage("");
    } catch (error) {
      console.error("Write to database failed:", error);
    }
  };

  // Render a single message
  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === currentUser.uid;
    const sender = users[item.senderId] || {};

    const messageTime = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const isSameSenderAsPrevious =
      index > 0 && messages[index - 1]?.senderId === item.senderId;

    return (
      <View
        style={[
          styles.messageWrapper,
          isCurrentUser
            ? styles.messageWrapperRight
            : styles.messageWrapperLeft,
        ]}
      >
        {!isCurrentUser && !isSameSenderAsPrevious && (
          <Image
            source={{
              uri: sender.photoUri || "https://example.com/default-avatar.png",
            }}
            style={styles.avatarLeft}
          />
        )}
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.currentUser : styles.otherUser,
          ]}
        >
          {!isCurrentUser && !isSameSenderAsPrevious && (
            <Text style={styles.senderName}>{sender.fullName || "Utilisateur"}</Text>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          {messageTime && <Text style={styles.messageTime}>{messageTime}</Text>}
        </View>

        {isCurrentUser && !isSameSenderAsPrevious && (
          <Image
            source={{
              uri: sender.photoUri || "https://example.com/default-avatar.png",
            }}
            style={styles.avatarRight}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 40,
  },
  chatContainer: {
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  messageWrapperRight: {
    justifyContent: "flex-end",
  },
  messageWrapperLeft: {
    justifyContent: "flex-start",
  },
  avatarLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 15,
    maxWidth: "75%",
  },
  currentUser: {
    alignSelf: "flex-end",
    backgroundColor: "#636393",
    borderBottomRightRadius: 5,
    borderTopRightRadius: 0,
  },
  otherUser: {
    alignSelf: "flex-start",
    backgroundColor: "#c6c6c6",
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 0,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 100,
    padding: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#636393",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;

//   // Render a single message
//   const renderMessage = ({ item }) => {
//     const isCurrentUser = item.senderId === currentUser.uid; // Check if the current user sent the message
//     const sender = users[item.senderId] || {}; // Fetch the sender's details

//     const messageTime = item.timestamp
//       ? new Date(item.timestamp).toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })
//       : "";

//     return (
//       <View
//         style={[
//           styles.messageWrapper,
//           isCurrentUser
//             ? styles.messageWrapperRight
//             : styles.messageWrapperLeft,
//         ]}
//       >
//         {!isCurrentUser && (
//           <Image
//             source={{
//               uri: sender.photoUri || "https://example.com/default-avatar.png",
//             }}
//             style={styles.avatar}
//           />
//         )}
//         <View
//           style={[
//             styles.messageContainer,
//             isCurrentUser ? styles.currentUser : styles.otherUser,
//           ]}
//         >
//           {!isCurrentUser && (
//             <Text style={styles.senderName}>
//               {sender.fullName || "Anonymous"}
//             </Text>
//           )}
//           <Text style={styles.messageText}>{item.text}</Text>
//           {messageTime && <Text style={styles.messageTime}>{messageTime}</Text>}
//         </View>
//         {isCurrentUser && (
//           <Image
//             source={{
//               uri: sender.photoUri || "https://example.com/default-avatar.png",
//             }}
//             style={styles.avatar}
//           />
//         )}
//       </View>
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <FlatList
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.chatContainer}
//       />
//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           value={newMessage}
//           onChangeText={setNewMessage}
//           placeholder="Type a message..."
//         />
//         <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
//           <Text style={styles.sendButtonText}>Send</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };
