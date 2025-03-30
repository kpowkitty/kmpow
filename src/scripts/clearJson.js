const fs = require('fs');

// Path to your JSON file
const jsonFilePath = '../static/stars.json';

// Function to reset the JSON file
const resetJsonFile = () => {
  try {
    // Set the content to an empty array
    fs.writeFileSync(jsonFilePath, '[\n]');

    console.log('JSON file has been reset successfully!');
  } catch (error) {
    console.error('Error resetting the JSON file:', error);
  }
};

// Run the reset function
resetJsonFile();
