import React, { useContext } from "react";
import LogInScreen from "../Screens/LogInScreen";
import RegistrationScreen from "../Screens/RegistrationScreen";
import WelcomeScreen from "../Screens/WelcomeScreen";
import "react-native-gesture-handler";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Groupe from "../Screens/Groupe";
import ProfileScreen from "../Screens/ProfileScreen";
import EditProfileScreen from "../Screens/EditProfileScreen";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { AuthContext } from "../contexte/AuthContext";
import ChatScreen from "../Screens/ChatScreen";

const Root = createStackNavigator();
const Tab = createMaterialBottomTabNavigator();
const AuthStack = createStackNavigator();

function AuthenticatedTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="WelcomeScreen"
        component={WelcomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Groupe"
        component={Groupe}
        options={{
          tabBarIcon: ({ color }) => (
            <AntDesign name="team" color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" color={color} size={20} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="AuthenticatedTabs"
        component={AuthenticatedTabs}
      />

      <AuthStack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{
          presentation: "transparentModal",
          headerShown: false,
          gestureEnabled: true,
          cardOverlayEnabled: true,
          ...TransitionPresets.ModalSlideFromBottomIOS, // Animation depuis le bas
        }}
      />
      <AuthStack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerShown: false,
          title: "ChatScreen ",
          headerStyle: {
            backgroundColor: "#4A90E2",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </AuthStack.Navigator>
  );
}

function RouteNavigation() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Afficher les écrans pour l'utilisateur authentifié
          <Root.Screen
            name="AuthenticatedStack"
            component={AuthenticatedStack}
          />
        ) : (
          <>
            <Root.Screen name="LogInScreen" component={LogInScreen} />
            <Root.Screen
              name="RegistrationScreen"
              component={RegistrationScreen}
              options={({ navigation }) => ({
                headerTitle: "",
                headerTransparent: true,
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                  >
                    <View style={styles.leftview}>
                      <AntDesign name="leftcircleo" size={24} color="black" />
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 10,
  },
  leftview: {
    padding: 5,
  },
});

export default RouteNavigation;
