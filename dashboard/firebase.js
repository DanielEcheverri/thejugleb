(function() {
  console.log('Starting Firebase Functions');

  window.writeToAvatar = function(databaseNode, avatarData) {
    const avatarRef = firebase.database().ref(avatarDatabase + databaseNode);
    return avatarRef.set(avatarData)
        .then(() => {
            console.log("Successfully updated " + avatarData + " in " + avatarDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error; // Re-throw the error to be caught by the caller
        });
}
  
window.writeToHachi = function(databaseNode, hachiData) {
    const hachiRef = firebase.database().ref(hachiDatabase + databaseNode);
    return hachiRef.set(hachiData)
        .then(() => {
            console.log("Successfully updated " + hachiData + " in " + hachiDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error; // Re-throw the error to be caught by the caller
        });
}
  
 
})();