// import { create } from "zustand";
// import { database } from "../firebase";
// import { ref, onValue } from "firebase/database";

// const useUserStore = create((set) => ({
//   users: {}, // Initial state to store user data
//   fetchUsers: async () => {
//     const usersRef = ref(database, "users"); // Reference to the "users" node in Firebase

//     // on value change, update automatically the global state with the fetched users
//     onValue(usersRef, (snapshot) => {
//       const data = snapshot.val();
//       set({ users: data || {} }); // Update the global state with the fetched users
//     });
//   },
// }));

// export default useUserStore;

// // it is real time update
import { create } from "zustand";
import { database } from "../firebase";
import { ref, onValue, off } from "firebase/database";

const useUserStore = create((set, get) => ({
  users: {}, // Initial state to store user data

  fetchUsers: () => {
    const usersRef = ref(database, "users");

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      // Transformation des données utilisateurs
      const indexedUsers = data
        ? Object.keys(data).reduce((acc, uid) => {
            acc[uid] = data[uid];
            return acc;
          }, {})
        : {};

      set({ users: indexedUsers });
    });

    // Retourne une fonction de nettoyage
    return () => {
      off(usersRef);
    };
  },

  // Méthode pour ajouter ou mettre à jour un utilisateur
  addOrUpdateUser: (userId, userData) => {
    const currentUsers = get().users;
    set({
      users: {
        ...currentUsers,
        [userId]: userData,
      },
    });
  },

  // Méthode pour supprimer un utilisateur
  removeUser: (userId) => {
    const { [userId]: removedUser, ...remainingUsers } = get().users;
    set({ users: remainingUsers });
  },
}));

export default useUserStore;
