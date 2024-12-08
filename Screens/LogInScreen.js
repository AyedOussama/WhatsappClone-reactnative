import React, { useState, useContext } from "react";
import {
  KeyboardAvoidingView,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { useToast } from "react-native-toast-notifications";
import { AuthContext } from "../contexte/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

function LogInScreen() {
  const navigation = useNavigation();
  const Toast = useToast();
  const { setIsAuthenticated } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const handleError = (message) => {
    setErrors({ form: message });
    Toast.show("Error signing in: " + message, {
      type: "danger",
    });
  };


  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  };
  

  const signIn = async () => {
    const newErrors = {};

    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    else if (!validatePassword(password))
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Toast.show("Validation Error: Please fix the errors in the form.", {
        type: "danger",
      });
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      console.log("Utilisateur connecté:", userCredential.user);

      // Stocker les identifiants pour une reconnexion automatique
      await AsyncStorage.setItem("userEmail", email.trim());
      await AsyncStorage.setItem("userPassword", password.trim());

      setIsAuthenticated(true);

      Toast.show("Welcome back! You have successfully signed in.", {
        type: "success",
      });
    } catch (error) {
      console.error("Error signing in:", error);
      handleError(error.message || "Unexpected error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView>
        <View style={styles.header}>
          <Text style={styles.title}>Authentication</Text>
          <Text style={styles.subtitle}>Sign In to Your Account</Text>
        </View>

        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={[styles.input, errors.email && styles.inputError]}
              placeholderTextColor="gray"
              placeholder="Enter Your Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry
              style={[styles.input, errors.password && styles.inputError]}
              placeholderTextColor="gray"
              placeholder="Password"
              autoCapitalize="none"
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity onPress={signIn} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("RegistrationScreen")}
            style={styles.signUpContainer}
          >
            <Text style={styles.signUpText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    alignItems: "center",
  },
  header: {
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#4A55A2",
    fontSize: 17,
    fontWeight: "600",
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 15,
  },
  formContainer: {
    marginTop: 50,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "gray",
  },
  input: {
    fontSize: 18,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    marginVertical: 10,
    width: 300,
  },
  inputError: {
    borderBottomColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 13,
  },
  inputContainer: {
    marginTop: 10,
  },
  loginButton: {
    width: 200,
    backgroundColor: "#4A55A2",
    padding: 15,
    marginTop: 50,
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: 6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  signUpContainer: {
    marginTop: 15,
  },
  signUpText: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
  },
});

export default LogInScreen;
