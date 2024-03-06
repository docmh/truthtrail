const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const openai_1 = require('openai');
const app = express();
const port = 8080;

let messages = [];
let statementCorrect = true;

dotenv.config();

var openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function textGeneration(messages) {
    let result = "";
	try {
		const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
            max_tokens: 256,
            n: 1
        });
        result = response.choices[0].message.content;
    } catch (error) {
        console.log(error);
        result = "Das habe ich nicht verstanden, formuliere es bitte anders.";
    } finally {
        console.log(result);
		return result;
	}
};

async function proofQuiz(messages) {
  let result = false;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 4, 
      temperature: 0.0,
      n: 1
    });
    console.log(response.choices[0].message.content);
    result = response.choices[0].message.content.includes("True");
  } catch (error) {
    console.log(error);
    result = false;
  } finally {
    console.log(result);
    return result;
  }
}
app.use(cors());

app.get('/get-quiz', async (req, res) => {
  // Initialize total selections
  let totalSelections = 0;

  // Read existing selection counts from a file if it exists
  let selectionCounts = {};
  if (fs.existsSync('selectionCounts.json')) {
    const rawData = fs.readFileSync('selectionCounts.json', 'utf-8');
    selectionCounts = JSON.parse(rawData);
  }

  fs.readFile('./source.md', 'utf8', async (err, data) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    let selectedSectionContent = data;
    let headers = [];
    let level = 1;

    // Gehe die Ebenen durch, solange die Wortanzahl mehr als 250 beträgt oder weitere Ebenen vorhanden sind
    do {
      let sections = selectedSectionContent.split('\n' + '#'.repeat(level) + ' ');
      if(sections.length <= 1) break; // Wenn keine weiteren Ebenen vorhanden sind, breche ab
      sections.shift();

      sections = sections.map((section) => '#'.repeat(level) + ' ' + section);

      // Wähle eine zufällige Ebene gewichtet nach der Wortanzahl aus
      if(level === 1) {
        sections.forEach((_, i) => {
          if (!(i in selectionCounts)) {
            selectionCounts[i] = 0;
          }
        });
        
        const sectionLengths = sections.map(section => section.split(' ').length);
        const totalLength = sectionLengths.reduce((a, b) => a + b, 0);
        const expectedCounts = sectionLengths.map(length => totalLength * (length / totalLength));
        const adjustedWeights = expectedCounts.map((expected, i) => Math.max(expected - selectionCounts[i], 0));
        const adjustedTotal = adjustedWeights.reduce((a, b) => a + b, 0);
        const weightsToUse = adjustedTotal === 0 ? sectionLengths : adjustedWeights;
        const totalToUse = adjustedTotal === 0 ? totalLength : adjustedTotal;
        
        let randPoint = Math.random() * totalToUse;
        let accumLength = 0;
        
        for (let i = 0; i < weightsToUse.length; i++) {
          accumLength += weightsToUse[i];
          if (accumLength >= randPoint) {
            selectedSectionContent = sections[i];
            selectionCounts[i]++;  // Update selection counts
            totalSelections++;      // Update total selections
            break;
          }
        }

        // Save the updated selection counts to a file
        fs.writeFileSync('selectionCounts.json', JSON.stringify(selectionCounts, null, 2));  
      } else {
        const sumLength = sections.reduce((sum, section) => sum + section.split(' ').length, 0);
        let randomLength = Math.random() * sumLength;
        for(let i = 0; i < sections.length; i++) {
          const sectionLength = sections[i].split(' ').length;
          if(randomLength < sectionLength) {
            selectedSectionContent = sections[i].trim();
            break;
          }

          randomLength -= sectionLength;
        }
      }

      headers.push(selectedSectionContent.split('\n')[0].trim()); // Speichere die Überschrift

      level++;
    } while (selectedSectionContent.split(' ').length > 250 && level <= 6);

    headers.pop();
    const selectedSection = headers.join('\n') + '\n' + selectedSectionContent;

    statementCorrect = Math.floor(Math.random() * 2) === 1;

    messages = [
        {"role": "system", "content": `You are a very strict professor of community psychology and have high expectations of your students. You want to achieve an 80% failure rate.
You are currently preparing true/false statements for a university-level exam in an M.Sc. psychology course.
You use the following reference text as context:
  
  ###### Begin of Reference Text #####
  
  ${selectedSection}
  
  ###### End of Reference Text #####
  
This time you want to formulate a statement that is ${statementCorrect ? "true" : "false"}, but is also very difficult to judge. The statement should refer to a single, randomly selected detail in the reference text. The statement should be just detailed enough to judge that it is ${statementCorrect ? "true" : "false"}, but you should avoid providing too many clues in writign a statement that is too long. Now formulate this statement and only this statement, no further hints or questions or statements.`}
    ];

    quiz = await textGeneration(messages);
    if(quiz.includes("Aussage:")) quiz = quiz.substring(quiz.indexOf(":") + 1).trim();
    if(quiz.startsWith('"') || quiz.startsWith("'")) quiz = quiz.substring(1).trim();
    if(quiz.includes("\n")) quiz = quiz.substring(0, quiz.indexOf("\n")).trim();
    if(quiz.endsWith('"') || quiz.endsWith("'")) quiz = quiz.substring(0, quiz.length - 1).trim();

    messages = [
      {"role": "system", "content": `You are a professor of community psychology.
Your employee is currently preparing true/false statements for an exam.
She uses the following reference text as context:

###### Begin of Reference Text #####

${selectedSection}

###### End of Reference Text #####

She made the following statement:`}
  ];
    messages.push({"role": "user", "content": quiz});
    messages.push({"role": "system", "content": "Please judge whether the statement is true or false based on the reference text. Write \"True\" if it is true and write \"False\" if it is false."});
    statementCorrect = await proofQuiz(messages);

    messages = [
      {"role": "system", "content": `You are a professor of community psychology.
Mike is currently working on the true/false statements on your exam.
These statements are based on the following reference text:

###### Begin of Reference Text #####

${selectedSection}

###### End of Reference Text #####

Mike is currently working on the following statement:`}
  ];
    messages.push({"role": "assistant", "content": quiz});
    messages.push({"role": "system", "content": `Please wait until Mike has assessed the statement. Then give him feedback as to whether his assessment is correct and briefly explain why the statement is true or false.`});

    res.json({
      statementCorrect,
      quiz
    });
  });
});

app.get('/get-feedback', async (req, res) => {
    // Die Antwort des Benutzers und die Frage könnten als Query-Parameter übergeben werden
    const userAnswer = req.query.answer; 

    messages.push({"role": "user", "content": `I think, this statement is ${(userAnswer === "Wahr" ? "true" : "false")}.`});

    let feedback = await textGeneration(messages);
    messages = [];
    res.json({
        feedback
    });
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
