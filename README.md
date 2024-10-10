# Tag it!

A desktop application built with Electron, Sequelize, SQLite3, and UUID.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Install Node.js (version 14 or higher) from [https://nodejs.org/](https://nodejs.org/)
- **Git**: Install Git from [https://git-scm.com/](https://git-scm.com/)

## Installation

Follow these steps to set up the EJS application locally:

1. **Clone the Repository**

   Open your terminal or command prompt and run:

   ```bash
   git clone https://github.com/merlin0x/tagit.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd tagit
   ```

3. **Install Dependencies**

   Install the required Node.js packages using npm:

   ```bash
   npm install
   ```

## Running the Application

After installing the dependencies, you can start the application with the following command:

```bash
npm start
```

This will launch the application.

## Usage

The Tag it! provides the following keyboard shortcuts for enhanced productivity:

- Tag Clipboard Content

  Press `Ctrl + Shift + {` to tag the current content of your clipboard. This feature allows you to categorize or mark specific snippets of text for later use.
  
  Press `#` to input field focus and `Enter` to tag.
  
  Press `A`-`L` to quick tag.
  
- View Saved Content

  Press `Ctrl + Shift + }` to open the viewer for your saved content. This interface lets you browse, search, and manage the content you've previously tagged.
  
  Use `#` to search by tag, another by content.
