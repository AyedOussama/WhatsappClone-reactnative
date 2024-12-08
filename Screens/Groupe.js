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
import { auth, database } from "../firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import useUserStore from "../zustand/userStore"; // Zustand store for user data

const Groupe = () => {
  const currentUser = auth.currentUser;
  const groupId = "global_chat"; // Static group ID for the group chat

  // Zustand state
  const users = useUserStore((state) => state.users); // Access user data from Zustand

  // Component state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch messages from the Realtime Database
  useEffect(() => {
    const groupMessagesRef = ref(database, `groupMessages/${groupId}`);
    const unsubscribe = onValue(groupMessagesRef, (snapshot) => {
      const data = snapshot.val();
      const msgs = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
          }))
        : [];
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp)); // Sort by timestamp
    });

    return () => {
      unsubscribe();
    };
  }, [groupId]);

  // Send a new message
  const sendMessage = () => {
    const sender = users[currentUser.uid] || {}; // Get the current user's info

    if (newMessage.trim() === "") return;

    const groupMessagesRef = ref(database, `groupMessages/${groupId}`);
    push(groupMessagesRef, {
      senderId: currentUser.uid,
      senderName: sender.fullName,
      senderPhotoURL: sender.photoUri,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
    });

    setNewMessage(""); // Clear the input field after sending the message
  };

  // Render each message
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.uid;
    const messageTime = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View
        style={[
          styles.messageWrapper,
          isCurrentUser
            ? styles.messageWrapperRight
            : styles.messageWrapperLeft,
        ]}
      >
        {!isCurrentUser && (
          <Image
            source={{
              uri: item.senderPhotoURL,
            }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.currentUser : styles.otherUser,
          ]}
        >
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          {messageTime && <Text style={styles.messageTime}>{messageTime}</Text>}
        </View>
        {isCurrentUser && (
          <Image
            source={{
              uri: item.senderPhotoURL,
            }}
            style={styles.avatar}
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
        renderItem={renderMessage}
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
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  messageWrapperRight: {
    justifyContent: "flex-end",
  },
  messageWrapperLeft: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
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
    padding: 10,
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

export default Groupe;
