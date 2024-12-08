import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, database } from "../firebase";
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { ref as databaseRef, update } from "firebase/database";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useToast } from "react-native-toast-notifications";

const EditProfileScreen = () => {

  const navigation = useNavigation();
  const  Toast  = useToast();
 
  const route = useRoute();
  const { userData } = route.params;

  const [fullName, setFullName] = useState(userData?.fullName || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Update email if it has changed
        if (email !== currentUser.email) {
          await updateEmail(currentUser, email);
        }

        // Update Realtime Database
        const userRef = databaseRef(database, `users/${currentUser.uid}`);
        await update(userRef, {
          fullName,
          email,
          phoneNumber,
        });

       Toast.show("Profil mis à jour avec succès", { type: "success" });
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);

      if (error.code === "auth/requires-recent-login") {
        promptForReauthentication();
      } else if (error.code === "auth/email-already-in-use") {
        Alert.alert("Erreur", "Cet email est déjà utilisé par un autre compte.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Erreur", "L'adresse email n'est pas valide.");
      } else {
        Alert.alert(
          "Erreur",
          "Une erreur est survenue lors de la mise à jour de votre profil. Veuillez réessayer."
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const promptForReauthentication = () => {
    Alert.alert(
      "Session expirée",
      "Pour continuer, veuillez saisir votre mot de passe.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
           
            reauthenticateUser("userPassword"); 
          },
        },
      ]
    );
  };

  const reauthenticateUser = async (password) => {
    try {
      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Retry updating the profile after re-authentication
      handleUpdateProfile();
    } catch (error) {
      console.error("Erreur lors de la ré-authentification :", error);
      Alert.alert("Erreur", "Le mot de passe saisi est incorrect.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
      <View style={styles.modalBackground}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} 
          >
            
            <View style={styles.header}>
              <Text style={styles.title}>Modifier le profil</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            
            <ScrollView>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre nom complet"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre numéro de téléphone"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </ScrollView>

            
            <TouchableOpacity
              style={[styles.saveButton, isUpdating && styles.disabledButton]}
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end', 
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
    maxHeight: '88%', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A55A2',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  saveButton: {
    backgroundColor: '#4A55A2',
    paddingVertical: 15,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A5A5A5',
  },
});

export default EditProfileScreen;