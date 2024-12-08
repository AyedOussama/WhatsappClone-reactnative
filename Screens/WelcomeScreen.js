import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { auth, database } from "../firebase";
import { signOut } from "firebase/auth";
import { useToast } from "react-native-toast-notifications";
import { ref, onValue } from "firebase/database";
import { AuthContext } from "../contexte/AuthContext";
import UserItem from "../components/UserItem"; // Composant UserItem

function WelcomeScreen() {
  const Toast = useToast();
  const { setIsAuthenticated } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // Liste filtrée
  const [searchQuery, setSearchQuery] = useState(""); // État pour la recherche
  const [loading, setLoading] = useState(true); // État de chargement

  useEffect(() => {
    const usersRef = ref(database, "users/");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allUsers = Object.entries(data).map(([key, value]) => ({
          uid: key,
          ...value,
        }));

        const filteredUsers = allUsers.filter(
          (user) => user.uid !== auth.currentUser?.uid
        );

        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers); // Initialement, tous les utilisateurs sont affichés
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
      setLoading(false); // Fin du chargement
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        Toast.show("Déconnexion réussie", { type: "success" });
        console.log("Sign out successful");
        setIsAuthenticated(false);
      })
      .catch((error) => {
        console.log("Sign out failed:", error);
        Toast.show("Erreur lors de la déconnexion", { type: "danger" });
      });
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredUsers(users); // Si le champ est vide, on affiche tous les utilisateurs
    } else {
      const filtered = users.filter((user) =>
        user.fullName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const renderItem = ({ item }) => <UserItem user={item} />;

  const keyExtractor = (item) => item.uid;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des utilisateurs :</Text>

     
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un utilisateur..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4A90E2"
          style={styles.loadingIndicator}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
            </View>
          }
        />
      )}

      {/* <TouchableOpacity
        onPress={handleSignOut}
        style={styles.logoutButton}
        accessible={true}
        accessibilityLabel="Se déconnecter"
      >
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    backgroundColor: "#EFEFEF",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333333",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666666",
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#4A55A2",
    borderRadius: 10,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
  },
});

export default WelcomeScreen;
