console.log("Loaded");

// 13. Function to stop making comments for a character
function stopComments(character) {
    if (characterData[character]) {
        clearInterval(characterData[character].intervalId);
        delete characterData[character];
    }
    console.log("Stopping comments");
}