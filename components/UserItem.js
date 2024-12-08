// components/UserItem.js
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

const UserItem = React.memo(({ user }) => { //memo here is used to prevent unnecessary re-renders
  const navigation = useNavigation();

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available.");
      return;
    }

    let phoneNumberStr = "";

    if (Platform.OS === "android") {
      phoneNumberStr = `tel:${phoneNumber}`;
    } else {
      phoneNumberStr = `telprompt:${phoneNumber}`;
    }

    Linking.canOpenURL(phoneNumberStr)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", "Your device does not support this feature.");
        } else {
          return Linking.openURL(phoneNumberStr);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const handleMessage = (userId, userName) => {
    navigation.navigate("ChatScreen", { userId, userName });
  };

  return (
    <View style={styles.card}>
      <Image
        source={
          user.photoUri
            ? { uri: user.photoUri }
            : require("../assets/profil.png")
        }
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.fullName}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <View style={styles.iconsContainer}>
        <TouchableOpacity
          onPress={() => handleCall(user.phoneNumber)}
          style={styles.iconButton}
          accessible={true}
          accessibilityLabel={`Call ${user.fullName}`}
        >
          <Feather name="phone-call" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleMessage(user.uid, user.fullName)}
          style={styles.iconButton}
          accessible={true}
          accessibilityLabel={`Message ${user.fullName}`}
        >
          <MaterialIcons name="message" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android shadow
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd", // Placeholder color
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  fullName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
    borderRadius: 5,
    transition: "background-color 0.2s",
  },
});

export default UserItem;
