import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, database } from "../firebase";
import { signOut, deleteUser } from "firebase/auth";
import { ref as databaseRef, get, update, remove } from "firebase/database";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase"; // Assurez-vous que ce fichier existe et est correctement configuré
import * as Crypto from "expo-crypto"; // Importer expo-crypto pour générer des identifiants uniques

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const user = auth.currentUser;

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchUserData = async () => {
        try {
          const userRef = databaseRef(database, "users/" + user.uid);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (isActive) {
              setUserData(data);
            }
          } else {
            console.log("Aucune donnée disponible");
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des données utilisateur :",
            error
          );
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      if (user) {
        fetchUserData();
      } else {
        navigation.navigate("LogInScreen");
      }

      return () => {
        isActive = false;
      };
    }, [user])
  );

  // Fonction pour générer un identifiant unique avec expo-crypto
  const generateUniqueId = async () => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return randomBytes
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  // Fonction pour choisir une image
  const pickImage = async () => {
    // Demander la permission d'accéder à la galerie
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin de votre permission pour accéder à votre galerie."
      );
      return;
    }

    // Lancer le sélecteur d'image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Carré
      quality: 0.7,
    });

    if (!result.canceled) {
      // Téléverser l'image sur Supabase
      await uploadImage(result.assets[0].uri);
    }
  };

  // Fonction pour téléverser l'image sur Supabase
  const uploadImage = async (uri) => {
    try {
      setUploading(true);

      // Générer un nom de fichier unique
      const fileExt = uri.split(".").pop();
      const fileName = `${user.uid}_${await generateUniqueId()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      // Téléverser l'image sur Supabase Storage
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: `image/${fileExt}`,
        name: fileName,
      });

      const { error } = await supabase.storage
        .from("users")
        .upload(filePath, formData, {
          cacheControl: "3600",
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData, error: urlError } = supabase.storage
        .from("users")
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError;
      }

      const publicUrl = urlData.publicURL;

      // Mettre à jour l'URI de la photo dans Firebase Realtime Database
      const userRef = databaseRef(database, `users/${user.uid}`);
      await update(userRef, {
        photoUri: publicUrl,
      });

      // Mettre à jour l'état local pour refléter la nouvelle image
      setUserData((prevData) => ({
        ...prevData,
        photoUri: publicUrl,
      }));

      Alert.alert("Succès", "Votre photo de profil a été mise à jour.");
    } catch (error) {
      console.error("Erreur lors du téléversement de l'image :", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors du téléversement de l'image. Veuillez réessayer."
      );
    } finally {
      setUploading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          onPress: () => console.log("Déconnexion annulée"),
          style: "cancel",
        },
        {
          text: "Déconnexion",
          onPress: () => handleLogout(),
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate("LogInScreen");
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion :", error);
      });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.",
      [
        {
          text: "Annuler",
          onPress: () => console.log("Suppression annulée"),
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;

              if (currentUser) {
                await reauthenticateUser(currentUser);

                // Supprimer l'image de profil de Supabase Storage si elle existe
                const { error: storageError } = await supabase.storage
                  .from("users")
                  .remove([`${currentUser.uid}/*`]);

                if (storageError) {
                  console.warn(
                    "Erreur lors de la suppression des fichiers Supabase",
                    storageError
                  );
                }

                const userRef = databaseRef(
                  database,
                  "users/" + currentUser.uid
                );
                await remove(userRef);

                await deleteUser(currentUser);

                await signOut(auth);

                Alert.alert(
                  "Compte supprimé",
                  "Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.navigate("LogInScreen"),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error("Erreur lors de la suppression du compte :", error);

              // Gestion des erreurs spécifiques
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Connexion récente requise",
                  "Veuillez vous reconnecter avant de supprimer votre compte."
                );
              } else {
                Alert.alert(
                  "Erreur",
                  "Un problème est survenu lors de la suppression de votre compte. Veuillez réessayer."
                );
              }
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A55A2" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Aucune donnée utilisateur disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={pickImage}>
          {uploading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color="#4A55A2" />
            </View>
          ) : (
            <Image
              source={
                userData.photoUri
                  ? { uri: userData.photoUri }
                  : require("../assets/profil.png")
              }
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {userData.fullName || "Utilisateur"}
        </Text>
      </View>

      <View style={styles.personalInfo}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoText}>
            {userData.fullName || "Non disponible"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoText}>
            {userData.email || "Non disponible"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Numéro de téléphone</Text>
          <Text style={styles.infoText}>
            {userData.phoneNumber || "Non disponible"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("EditProfileScreen", { userData })}
      >
        <MaterialIcons name="edit" size={24} color="#4A55A2" />
        <Text style={styles.menuText}>Modifier le profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
        <MaterialIcons name="delete" size={24} color="#4A55A2" />
        <Text style={styles.menuText}>Supprimer le compte</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 30,
    position: "relative",
  },
  profileImageContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEE",
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  personalInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A55A2",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  infoText: {
    fontSize: 16,
    color: "#555555",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  menuText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 20,
  },
  logoutButton: {
    backgroundColor: "#4A55A2",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
