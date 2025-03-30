const fs = require('fs');

// Function to read and parse JSON file
const readJSON = (filename) => {
  const rawData = fs.readFileSync(filename);
  return JSON.parse(rawData);
};

// Function to write JSON data back to the file
const writeJSON = (filename, data) => {
  const jsonData = JSON.stringify(data, null, 2); // Pretty-print with 2 spaces indentation
  fs.writeFileSync(filename, jsonData);
};

// Function to generate a new star object
const generateStar = (id, category, title, description, slug, position) => {
  return {
    id,
    category,
    title,
    description,
    slug,
    position,
  };
};

// Function to generate a random position with margin from borders
const generateRandomPosition = (takenPositions, margin = 5, borderMargin = 10) => {
  let x, y;
  let overlap;

  // Continue generating a random position until no overlap is found
  do {
    x = Math.floor(Math.random() * (100 - margin * 2 - borderMargin * 2)) + borderMargin; // Random x-coordinate with border margin
    y = Math.floor(Math.random() * (100 - margin * 2 - borderMargin * 2)) + borderMargin; // Random y-coordinate with border margin

    overlap = takenPositions.some(
      (pos) => Math.abs(pos.x - x) < margin && Math.abs(pos.y - y) < margin
    );
  } while (overlap);

  return { x, y };
};

// Function to add a new star
const addNewStar = async () => {
  const filename = '../static/stars.json';

  // Read the current stars data
  const data = readJSON(filename);

  // Prompt user for new star details
  const category = await askQuestion('Enter the category: ');
  const title = await askQuestion('Enter the title: ');
  const description = await askQuestion('Enter the description: ');
  const slug = await askQuestion('Enter the slug: ');

  // Get the list of taken positions and categories
  const takenPositions = data.map((star) => ({
    category: star.category,
    position: star.position,
  }));

  // Generate a random position for the new star
  const position = generateRandomPosition(takenPositions);

  // Generate new star ID (incrementing based on current number of stars)
  const id = `star-${data.length + 1}`;

  // Create the new star
  const newStar = generateStar(id, category, title, description, slug, position);

  // Add the new star to the data array
  data.push(newStar);

  // Write updated data back to the JSON file
  writeJSON(filename, data);

  console.log('New star added successfully!');
};

// Function to prompt for input (Node.js equivalent of readline)
const askQuestion = (query) => {
  return new Promise((resolve) => {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Run the function to add a new star
addNewStar();

