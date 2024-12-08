import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import PhoneInput from "react-native-phone-input";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "../firebase";
import { useToast } from "react-native-toast-notifications";
import { set, ref } from "firebase/database";

// Composant réutilisable pour les champs de saisie
const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon,
  togglePasswordVisibility,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputFieldWrapper}>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessible={true}
        accessibilityLabel={label}
      />
      {icon && (
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.iconWrapper}
          accessible={true}
          accessibilityLabel={`Toggle ${label} visibility`}
        >
          <Feather
            name={icon === "eye" ? "eye" : "eye-off"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

function RegistrationScreen() {
  const navigation = useNavigation();
  const Toast = useToast();

  // États pour les champs de saisie
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [isCheck, setIsCheck] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phoneRef = useRef(null);

  // Fonctions de validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const validateField = useCallback(
    (field, value) => {
      let errorMsg = "";

      switch (field) {
        case "fullName":
          if (!value.trim()) errorMsg = "Le nom complet est requis.";
          break;
        case "email":
          if (!value.trim()) {
            errorMsg = "L'email est requis.";
          } else if (!validateEmail(value)) {
            errorMsg = "Adresse email invalide.";
          }
          break;
        case "phoneNumber":
          if (!value.trim()) {
            errorMsg = "Le numéro de téléphone est requis.";
          }
          break;
        case "password":
          if (!value) {
            errorMsg = "Le mot de passe est requis.";
          } else if (!validatePassword(value)) {
            errorMsg = "Le mot de passe doit comporter au moins 6 caractères.";
          }
          break;
        case "confirmPassword":
          if (!value) {
            errorMsg = "Veuillez confirmer votre mot de passe.";
          } else if (value !== password) {
            errorMsg = "Les mots de passe ne correspondent pas.";
          }
          break;
        case "isCheck":
          if (!isCheck) {
            errorMsg = "Vous devez accepter les termes et conditions.";
          }
          break;
        default:
          break;
      }

      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: errorMsg,
      }));
    },
    [password, isCheck]
  );

  // Validation du formulaire entier
  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Le nom complet est requis.";
    if (!email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!validateEmail(email)) {
      newErrors.email = "Adresse email invalide.";
    }
    if (!phoneNumber.trim())
      newErrors.phoneNumber = "Le numéro de téléphone est requis.";
    if (!password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (!validatePassword(password)) {
      newErrors.password =
        "Le mot de passe doit comporter au moins 6 caractères.";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (!isCheck) {
      newErrors.isCheck = "Vous devez accepter les termes et conditions.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Toast.show("Veuillez remplir correctement tous les champs.", {
        type: "danger",
      });
      return false;
    }

    return true;
  };

  // Fonction d'inscription
  const signUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      console.log("Utilisateur créé avec succès :", userCredential.user);

      // Enregistrer les informations de l'utilisateur dans la base de données
      await set(ref(database, "users/" + userCredential.user.uid), {
        uid: userCredential.user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        photoURL: null,
        createdAt: new Date().toISOString(),
      });

      Toast.show("Votre compte a été créé avec succès.", {
        type: "success",
      });

      // Réinitialiser le formulaire
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhoneNumber("");
      setIsCheck(false);
      setErrors({});

      // Naviguer vers l'écran de connexion après un court délai
      setTimeout(() => {
        navigation.navigate("LogInScreen");
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      setErrors({ general: error.message });
      Toast.show("Erreur lors de l'inscription : " + error.message, {
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effacer le formulaire lors de la mise au point
  useFocusEffect(
    useCallback(() => {
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhoneNumber("");
      setErrors({});
      setIsCheck(false);
      setIsPasswordVisible(false);
      if (phoneRef.current) {
        // Remove the clear method call
        // Instead, reset the state to clear the input
        setPhoneNumber("");
      }
    }, [])
  );

  // Gérer la saisie du numéro de téléphone
  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
    if (errors.phoneNumber) {
      validateField("phoneNumber", text);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Créez un compte pour commencer.</Text>
          </View>

          {/* Formulaire d'inscription */}
          <View style={styles.form}>
            {/* Nom Complet */}
            <InputField
              label="Nom Complet"
              placeholder="Entrez votre nom complet"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) validateField("fullName", text);
              }}
              onBlur={() => validateField("fullName", fullName)}
              error={errors.fullName}
            />

            {/* Email */}
            <InputField
              label="Email"
              placeholder="Entrez votre email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) validateField("email", text);
              }}
              onBlur={() => validateField("email", email)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            {/* Numéro de Téléphone */}
            <View style={styles.phoneContainer}>
              <Text style={styles.inputLabel}>Numéro de Téléphone</Text>
              <PhoneInput
                ref={phoneRef}
                initialCountry="tn"
                onChangePhoneNumber={handlePhoneNumberChange}
                value={phoneNumber}
                style={[
                  styles.phoneInput,
                  errors.phoneNumber && styles.inputError,
                ]}
                textProps={{
                  placeholder: "Entrez votre numéro de téléphone",
                  autoCapitalize: "none",
                }}
                accessible={true}
                accessibilityLabel="Numéro de téléphone"
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* Mot de Passe */}
            <InputField
              label="Mot de Passe"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) validateField("password", text);
              }}
              onBlur={() => validateField("password", password)}
              secureTextEntry={!isPasswordVisible}
              error={errors.password}
              icon="eye"
              togglePasswordVisibility={() =>
                setIsPasswordVisible(!isPasswordVisible)
              }
            />

            {/* Confirmer le Mot de Passe */}
            <InputField
              label="Confirmer le Mot de Passe"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  validateField("confirmPassword", text);
              }}
              onBlur={() => validateField("confirmPassword", confirmPassword)}
              secureTextEntry={!isPasswordVisible}
              error={errors.confirmPassword}
              icon="eye"
              togglePasswordVisibility={() =>
                setIsPasswordVisible(!isPasswordVisible)
              }
            />

            {/* Termes et Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setIsCheck(!isCheck)}
                style={styles.checkbox}
                accessible={true}
                accessibilityLabel="Accepter les termes et conditions"
              >
                {isCheck ? (
                  <MaterialCommunityIcons
                    name="checkbox-marked-outline"
                    size={24}
                    color="#4A55A2"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={24}
                    color="gray"
                  />
                )}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                J'accepte les Termes et Conditions
              </Text>
            </View>
            {errors.isCheck && (
              <Text style={styles.errorText}>{errors.isCheck}</Text>
            )}

            {/* Bouton d'Inscription */}
            <TouchableOpacity
              onPress={signUp}
              style={styles.registerButton}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="S'inscrire"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            {/* Redirection vers la Connexion */}
            <TouchableOpacity
              onPress={() => navigation.navigate("LogInScreen")}
              style={styles.signInContainer}
              accessible={true}
              accessibilityLabel="Se connecter"
            >
              <Text style={styles.signInText}>
                Vous avez déjà un compte ? Connectez-vous
              </Text>
            </TouchableOpacity>

            {/* Afficher les erreurs générales */}
            {errors.general && (
              <Text style={styles.errorText}>{errors.general}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    color: "#4A55A2",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 10,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A55A2",
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 5,
    color: "#333",
  },
  inputError: {
    borderBottomColor: "#FF3B30",
  },
  inputFieldWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "absolute",
    right: 0,
    height: "100%",
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneContainer: {
    marginBottom: 15,
  },
  phoneInput: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#333",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  checkbox: {
    marginRight: 12,
  },
  termsText: {
    fontSize: 15,
    color: "#666",
    flex: 1,
    flexWrap: "wrap",
  },
  registerButton: {
    backgroundColor: "#4A55A2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  signInContainer: {
    marginTop: 20,
  },
  signInText: {
    textAlign: "center",
    color: "#4A55A2",
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 5,
  },
});

export default RegistrationScreen;
