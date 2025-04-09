# Crime-GPT: AI-Powered Crime Reporting System

Crime-GPT is an AI-powered crime reporting system developed as a final year thesis project. It leverages modern web technologies, including **React.js, Node.js, Express.js, MongoDB**, and **Generative AI technologies** such as **LangChain and Flask**. The system allows users to report crimes through a simple text prompt, and AI generates a structured crime report, including relevant legal articles violated. Users can also attach evidence and digitally sign their reports before submission to law enforcement agencies.

## Features

- **User Authentication**: Secure login and registration with best authentication mechanisms.
- **AI-Powered Crime Report Generation**: Utilizes **Llama 3.3 model** (integrated with **LangChain and Flask**) to generate structured reports from text prompts.
- **Voice Input Support**: Users can dictate crime reports via voice.
- **Evidence Submission**: Users can attach images, videos, or documents as evidence.
- **Notifications**: Real-time updates on report status and law enforcement actions.
- **Feedback System**: Allows users to provide feedback on the platform and services.
- **Admin & User Dashboards**: Separate dashboards for users and administrators.
- **Google Maps Integration**: Users can pinpoint the crime location on Google Maps.
- **Statistical Insights**: Charts and data visualization for crime trends and analytics.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Crime-GPT.git
   cd Crime-GPT
   ```
2. Install dependencies for the backend:
   ```bash
   cd server
   npm install
   ```
3. Install dependencies for the frontend:
   ```bash
   cd ../client
   npm install
   ```
4. Run the backend server:
   ```bash
   cd ../server
   npm start
   ```
5. Run the frontend application:
   ```bash
   cd ../client
   npm start
   ```
6. The application will be available at `http://localhost:5000`

## Usage

1. Register an account and log in.
2. Report a crime by typing or speaking a prompt.
3. The AI will generate a structured crime report with legal references.
4. Attach any evidence (images, videos, documents).
5. Digitally sign the report.
6. Submit it to the law enforcement agency.
7. Track the report status in the dashboard.

## Tech Stack

- **Frontend**: React.js, Redux, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **AI Service**: LangChain, Flask, Llama 3.3
- **Authentication**: JWT, Google OAuth
- **Additional Libraries**: Chart.js, Google Maps API, WebSockets

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

This project is licensed under the **MIT License**. Feel free to modify and use it for your own purposes.

---

### Contact
For any inquiries or issues, please contact **Amjad Ali** at [amjadalijamali41@gmail.com].
