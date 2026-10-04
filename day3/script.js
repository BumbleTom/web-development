let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
function searchNotes(word) {
  return notes.filter(note =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

// 2. longestNote()
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}

// 3. countByCategory()
function countByCategory() {
  let counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

// 4. getSummary()
function getSummary() {
  const counts = countByCategory();

  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// 5. isDuplicate(text)
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();

  return notes.some(
    note => note.text.trim().toLowerCase() === cleanedText
  );
}

// 6. addNote(text, category)
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];

  if (text.trim().length < 1 || text.trim().length > 200) {
    console.log("Invalid note length.");
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Duplicate note.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category.");
    return false;
  }

  const newNote = {
    id: notes.length + 1,
    text: text.trim(),
    category: category
  };

  notes.push(newNote);

  return true;
}

/* ======================
   TESTS
====================== */

// searchNotes()
// Expected: notes containing "day"
console.log(searchNotes("day"));

// Expected: []
console.log(searchNotes("holiday"));

// longestNote()
// Expected: longest note object
console.log(longestNote());

// Expected: longest note object still returned
console.log(longestNote());

// countByCategory()
// Expected: { personal: 2, study: 2, work: 1 }
console.log(countByCategory());

// Expected: object with category counts
console.log(countByCategory());

// getSummary()
// Expected: "5 notes: 2 personal, 1 work, 2 study."
console.log(getSummary());

// Expected: summary string
console.log(getSummary());

// isDuplicate()
// Expected: true
console.log(isDuplicate("Call mum"));

// Expected: false
console.log(isDuplicate("Go shopping"));

// addNote()
// Expected: true
console.log(addNote("Book dentist appointment", "personal"));

// Expected: false (duplicate)
console.log(addNote("Call mum", "personal"));

// Expected: false (invalid category)
console.log(addNote("New task", "sports"));

// Expected: false (empty text)
console.log(addNote("", "work"));

// Check final notes array
console.log(notes);