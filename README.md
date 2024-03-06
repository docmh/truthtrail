# TruthTrail

![TruthTrail](./lowres.png)

TruthTrail lets you perform endless new true/false-quizzes from a [markdown](https://www.markdownguide.org/basic-syntax/) file you provide. From the markdown file, the program will generate an always new statement and ask you to answer whether it is true or false. The program will then tell you if you were correct or not. 

If you need, you could ask for a detailed explanation of the statement. 

## Features 🚀

### Endless Random True/False-Statements 🎲

The application selects sections from your provided markdown file randomly, weighted by the length of the sections. It also stores the times it has already selected a section, so that it will, over multiple sessions, select all sections equally often. 

After selected a section, the application will use OpenAI's GPT 4 Turbo to generate a new statement from the section's text.

If you add a new section to the markdown file, the application will automatically include it in the selection process and set the times it has already selected it to 0. So in the next session, the new section will be selected with a higher probability than the other sections until the times it and other sections have been selected equal out. 

⚠️ **Attention:** Do add new sections to the markdown file only at the end of the file, as the application will otherwise get confused about which probability to apply to the sections.

### Grading 🎓

The application counts your correct answers and provides you a grade that refreshes with every new statement. The grade is based on the German school grading system, and a pass with a 4.0 begins at 75% correct answers, due to being correct by just guessing has a 50% chance.

You can override the points that were given to you by the program, if you think the application was wrong.

You also can reset the points and start over.

### Markdown file 📄

The markdown file can be formatted as any usual [markdown](https://www.markdownguide.org/basic-syntax/) file, but with one exception according to the sections: Do prevent to use one subsection without a headline at the beginning of a section if this section also contains a subsection with a headline. The application will otherwise oversee the first subsection and not include it in the selection process.

✅ **Do:**
```markdown
# Section 1

## Subsection 1.1

Text for Subsection 1.1

## Subsection 1.2

Text for Subsection 1.2
```

❌ **Don't:**
```markdown
# Section 1

Text for Section 1 <-- ❌ prevent this, because the application will oversee it

## Subsection 1.1

Text for Subsection 1.1

## Subsection 1.2

Text for Subsection 1.2
```

The markdown file in the app is referenced to as `source.md` at the same level as the server file `truthtrail.js`. You can change the file path in the server file if you want to use another file. The file [`source.md`](./source.md), given with the source code, is a sample file with some sections and subsections about the field of Community Psychology.

### Prompting the Professor 🧑‍🏫

In `truthtrail.js`, the prompts to instruct the AI to generate a new statement are defined. Currently, the prompts instruct the AI to behave like a professor of Community Psychology. You can change the prompt to instruct the AI to behave like a professor of another field.

## Installation 🛠️

TruthTrail has a server and a client part. The server part is written in TypeScript and the client part is a simple HTML file with JavaScript. 

### Installation from source 📦

To install the server part, you need to have Node.js installed. Then you can install the server part by setting your working directory to the directory where the `truthtrail.js` file is located and then running the following command in the terminal:

```bash
npm install
```

### Secrets and API key 🔑

TruthTrail uses the OpenAI API to generate new statements. You need to use a `.env` file to provide the API key. The `.env` file should be located in the same directory as the `truthtrail.js` file. The content of the `.env` file should look like this:

```env
OPENAI_API_KEY="<your-api-key>"
```

You can get an API key from OpenAI by signing up for their service.

### Progressive Web App 📱

The client part is a Progressive Web App (PWA). You can install it on your device by opening the client in your web browser and then clicking on the install button in the address bar.

## Usage 🕹️

To start the server part, you need to set your working directory to the directory where the `truthtrail.js` file is located. Then you can start the server by running the following command in the terminal:

```bash
node truthtrail.js
```

The server will then start and listen on port `8080`. 

To start the client part, you need to start the http-server in the same directory. You can do this by running the following command in the terminal:

```bash
http-server
```

The server will then start and listen on port `8081`. You can then open the client by entering `http://localhost:8081` in your web browser.

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright 2024 Prof. Dr. Mike Hammes, Germany, [psymeets.ai](https://psymeets.ai)
