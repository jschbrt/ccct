# Computational Creativity and Computational Thinking Test (CCCT)

## Abstract

The Computational Creativity and Computational Thinking Test (CCCT) is a gamified digital assessment tool for measuring computational thinking (CT) and computational creativity (CC) in primary school children (grades 1-4). Participants solve maze-based challenges using block-based programming, evaluating algorithmic reasoning, divergent thinking (fluency, flexibility, originality), convergent thinking, and creative insight. It addresses the need for tools assessing the CT-creativity relationship through interactive, playful tasks.

More details at https://osf.io/zebfw/.

## System Description

The CCCT is a web-based application using Blockly for visual programming. Users see a maze on the left (with animated bees or astronauts) and a programming workspace on the right, where they drag blocks to build code sequences. Interactions like submissions and timestamps are captured for scoring, with automated checks for basic tasks and manual review for creativity.

## Repository Structure

Adapted from Blockly Games, the repo includes:
- `Makefile`: Build script.
- `build/`: Scripts for compression and localization.
- `json/`: Localization files. *Note: Localization is primarily adapted for German, with some text hardcoded in the app.*
- `server/html/`: Web app files (HTML, JS, assets).
- `server/third-party/`: Libraries like Blockly and SoundJS.
- `third-party/`: Build tools.

## Setup

### Prerequisites
- unzip, wget, java, python3

### Building
1. Clone repo: `git clone https://github.com/jschbrt/ccct.git && cd ccct`
2. `make deps` (downloads libraries)
3. `make maze` (builds app)

### Running Locally
Serve `server/html/` with a web server, e.g., `cd server/html && python3 -m http.server 8000`, then open `http://localhost:8000/maze.html`.

## Data Handling and Fromatting

Data collected: Code submissions (Blockly JSON), timestamps, actions, demographics. Stored client-side, submitted to backend.

Readability: Blockly JSON is converted to text prior to saving (e.g., "move forward; turn left"). Custom process for scoring (see OSF: https://osf.io/zebfw/).

## Technical Information for Reuse

The CCCT is a web-based application built with HTML, CSS, and JavaScript, making it easy to deploy and integrate. It's compatible with modern browsers and devices, including laptops and tablets, with touch-friendly interfaces for younger users. To reuse it on online platforms like Learning Management Systems (LMS), you can host the static files on any web server or embed it via iframe in systems such as Moodle or Canvas.

For full functionality, especially saving user data, you'll need to set up a backend. In our implementation, we used xAPI (Experience API) to store assessment data in a database, capturing detailed interactions like code submissions and timestamps. To adapt the tool, modify source files in `server/html/`, then rebuild with `make maze`.